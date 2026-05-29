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
};
