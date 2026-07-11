import { getSuppressedSet, isEmailSuppressed } from "@/lib/db/queries/emailSuppressions";
import { unsubscribeHeaders, withMarketingFooter } from "@/lib/email/unsubscribe";
import { resend, FROM_EMAIL } from "@/lib/resend";

const EMAIL_ENABLED = process.env.EMAIL_ENABLED === "true";

interface SendParams {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{ filename: string; content: Buffer }>;
}

interface BatchSendParams {
  to: string;
  subject: string;
  html: string;
}

// Resend batch API limit
const BATCH_SIZE = 100;

export const emailClient = {
  async send(params: SendParams) {
    if (!EMAIL_ENABLED) {
      console.log(`📧 [EMAIL DISABLED] Would send to ${params.to}`);
      console.log(`   Subject: ${params.subject}`);
      return { id: `test_${Date.now()}` };
    }

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: params.html,
      attachments: params.attachments,
    });

    if (result.error) {
      throw new Error(`Email send failed: ${result.error.message}`);
    }

    return result.data;
  },

  // Sends up to 100 emails per Resend batch call — safe for cron jobs with many recipients
  async batchSend(emails: BatchSendParams[]) {
    if (!EMAIL_ENABLED) {
      for (const e of emails) {
        console.log(`📧 [EMAIL DISABLED] Would send to ${e.to}: ${e.subject}`);
      }
      return;
    }

    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
      const chunk = emails.slice(i, i + BATCH_SIZE);
      await resend.batch.send(
        chunk.map((e) => ({ from: FROM_EMAIL, to: e.to, subject: e.subject, html: e.html }))
      );
    }
  },

  // COMMERCIAL email path (ROI capture + drip, win-back, monthly recap). CAN-SPAM
  // requires an unsubscribe mechanism + physical address on these, and that we
  // honor opt-outs — so this path (unlike send/batchSend for transactional mail)
  // consults the suppression list, injects the footer, and adds List-Unsubscribe
  // headers. Never route transactional mail (receipts, lead packets, dunning)
  // through here; those must always deliver.
  async sendMarketing(params: SendParams) {
    if (await isEmailSuppressed(params.to)) {
      console.log(`📧 [SUPPRESSED] Skipping marketing send to unsubscribed ${params.to}`);
      return { id: `suppressed_${params.to}`, suppressed: true };
    }

    const html = withMarketingFooter(params.html, params.to);

    if (!EMAIL_ENABLED) {
      console.log(`📧 [EMAIL DISABLED] Would send MARKETING to ${params.to}`);
      console.log(`   Subject: ${params.subject}`);
      return { id: `test_${Date.now()}` };
    }

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html,
      attachments: params.attachments,
      headers: unsubscribeHeaders(params.to),
    });

    if (result.error) {
      throw new Error(`Marketing email send failed: ${result.error.message}`);
    }

    return result.data;
  },

  // Batch variant of sendMarketing: drops suppressed recipients, footers + headers
  // each message. Use for cron-driven commercial sends (win-back, monthly recap).
  async batchSendMarketing(emails: BatchSendParams[]) {
    const suppressed = await getSuppressedSet(emails.map((e) => e.to));
    const deliverable = emails.filter((e) => !suppressed.has(e.to.trim().toLowerCase()));
    const skipped = emails.length - deliverable.length;
    if (skipped > 0) {
      console.log(`📧 [SUPPRESSED] Skipping ${skipped} unsubscribed recipient(s) in marketing batch`);
    }

    if (!EMAIL_ENABLED) {
      for (const e of deliverable) {
        console.log(`📧 [EMAIL DISABLED] Would send MARKETING to ${e.to}: ${e.subject}`);
      }
      return;
    }

    for (let i = 0; i < deliverable.length; i += BATCH_SIZE) {
      const chunk = deliverable.slice(i, i + BATCH_SIZE);
      await resend.batch.send(
        chunk.map((e) => ({
          from: FROM_EMAIL,
          to: e.to,
          subject: e.subject,
          html: withMarketingFooter(e.html, e.to),
          headers: unsubscribeHeaders(e.to),
        }))
      );
    }
  },
};
