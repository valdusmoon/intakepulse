import { emailClient } from "./email-client";
import { logger } from "@/lib/logger";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

const SERVICE_LABELS: Record<string, string> = {
  interior: "Interior",
  exterior: "Exterior",
  both: "Interior + Exterior",
  other: "Other",
};

const TIMELINE_LABELS: Record<string, string> = {
  asap: "ASAP",
  within_2_weeks: "Within 2 weeks",
  within_month: "Within a month",
  flexible: "Flexible",
};

// ─── Shared HTML wrapper ──────────────────────────────────────────────────────

function emailWrapper(content: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
        ${content}
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function emailFooter(businessName: string) {
  return `
    <tr><td style="padding:16px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;">
        Powered by Callverted &nbsp;·&nbsp; ${businessName}
      </p>
    </td></tr>`;
}

// ─── Internal: new signup notification ───────────────────────────────────────

const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL;

interface SignupNotificationParams {
  businessName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
}

export async function sendSignupNotification({ businessName, ownerName, ownerEmail, ownerPhone }: SignupNotificationParams) {
  // Operator signup alert — treated as important, so make silence observable:
  // log (don't just return) when it can't be delivered, so a missing NOTIFY_EMAIL
  // or a send failure leaves a trace instead of vanishing.
  if (!NOTIFY_EMAIL) {
    logger.warn("Signup alert skipped: NOTIFY_EMAIL not set", { businessName });
    return;
  }

  const now = new Date().toLocaleString("en-US", { timeZone: "America/New_York", dateStyle: "medium", timeStyle: "short" });

  const html = emailWrapper(`
    <tr><td style="padding:24px 24px 0 24px;">
      <p style="margin:0 0 4px 0;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">New signup</p>
      <h1 style="margin:0;font-size:22px;font-weight:700;color:#111827;">${businessName}</h1>
    </td></tr>
    <tr><td style="padding:20px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        ${[
          ["Owner", ownerName],
          ["Email", ownerEmail],
          ["Phone", ownerPhone],
          ["Time", now],
        ].map(([label, value], i) => `
          <tr style="background:${i % 2 === 0 ? "#f9fafb" : "#ffffff"}">
            <td style="padding:10px 14px;font-size:12px;font-weight:600;color:#6b7280;white-space:nowrap;">${label}</td>
            <td style="padding:10px 14px;font-size:13px;color:#111827;">${value}</td>
          </tr>`).join("")}
      </table>
    </td></tr>
  `);

  try {
    await emailClient.send({
      to: NOTIFY_EMAIL,
      subject: `Callverted — New signup: ${businessName}`,
      html,
    });
  } catch (error) {
    // fire-and-forget — never block onboarding, but log so a failed signup
    // alert is visible rather than silently lost.
    logger.error("Signup alert failed to send", { businessName, error: String(error) });
  }
}

// ─── Internal: demo / "have us reach out" request from the landing page ───────

interface DemoRequestNotificationParams {
  name: string;
  email: string;
  phone?: string | null;
}

export async function sendDemoRequestNotification({ name, email, phone }: DemoRequestNotificationParams) {
  // Inbound demo request from the marketing site — the landing promises "a real
  // person gets back to you, usually same day", so this alert is what makes that
  // true. Make silence observable rather than dropping a warm prospect.
  if (!NOTIFY_EMAIL) {
    logger.warn("Demo request alert skipped: NOTIFY_EMAIL not set", { email });
    return;
  }

  const now = new Date().toLocaleString("en-US", { timeZone: "America/New_York", dateStyle: "medium", timeStyle: "short" });

  const html = emailWrapper(`
    <tr><td style="padding:24px 24px 0 24px;">
      <p style="margin:0 0 4px 0;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Demo request</p>
      <h1 style="margin:0;font-size:22px;font-weight:700;color:#111827;">${name}</h1>
    </td></tr>
    <tr><td style="padding:20px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        ${[
          ["Name", name],
          ["Email", email],
          ["Phone", phone || "—"],
          ["Time", now],
        ].map(([label, value], i) => `
          <tr style="background:${i % 2 === 0 ? "#f9fafb" : "#ffffff"}">
            <td style="padding:10px 14px;font-size:12px;font-weight:600;color:#6b7280;white-space:nowrap;">${label}</td>
            <td style="padding:10px 14px;font-size:13px;color:#111827;">${value}</td>
          </tr>`).join("")}
      </table>
      <p style="margin:16px 0 0 0;font-size:13px;color:#6b7280;">Reach out same day — they left their details from the landing page.</p>
    </td></tr>
  `);

  try {
    await emailClient.send({
      to: NOTIFY_EMAIL,
      subject: `Callverted — Demo request: ${name}`,
      html,
    });
  } catch (error) {
    logger.error("Demo request alert failed to send", { email, error: String(error) });
  }
}

// ─── Callverted: welcome email ───────────────────────────────────────────────

interface WelcomeEmailParams {
  ownerName: string;
  ownerEmail: string;
  businessName: string;
  dashboardUrl: string;
}

export async function sendWelcomeEmail({ ownerName, ownerEmail, businessName, dashboardUrl }: WelcomeEmailParams) {
  const firstName = ownerName.split(" ")[0];
  const billingUrl = `${dashboardUrl}/billing`;

  const html = emailWrapper(`
    <tr><td style="height:4px;background:linear-gradient(90deg,#2454d8,#5b8cff);font-size:0;line-height:0;">&nbsp;</td></tr>

    <tr><td style="padding:24px 24px 0 24px;">
      <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;color:#2454d8;text-transform:uppercase;letter-spacing:0.08em;">Welcome</p>
      <h1 style="margin:0 0 4px 0;font-size:24px;font-weight:700;color:#111827;">Hi ${firstName}, you're set up.</h1>
      <p style="margin:0;font-size:14px;color:#6b7280;">${businessName} is now on Callverted.</p>
    </td></tr>

    <tr><td style="padding:20px 24px 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:0 0 16px 0;">
          <p style="margin:0;font-size:13px;font-weight:700;color:#111827;">Your next 3 steps:</p>
        </td></tr>
        ${[
          ["1. Get your number", `Email setup@callverted.com and we'll provision your dedicated Callverted number within 1 business day.`],
          ["2. Publish your number", `List your Callverted number on Google, your website, and socials so new callers reach it. It rings your own line first and only steps in when you cannot pick up.`],
          ["3. Start your free trial", `Subscribe to activate missed-call recovery. No charge for 14 days.`],
        ].map(([title, desc]) => `
          <tr><td style="padding:0 0 14px 0;">
            <p style="margin:0 0 2px 0;font-size:13px;font-weight:600;color:#111827;">${title}</p>
            <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5;">${desc}</p>
          </td></tr>`).join("")}

        <tr><td style="padding:8px 0 0 0;">
          <a href="${billingUrl}" style="display:inline-block;background:#2454d8;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 28px;border-radius:8px;margin-right:12px;">
            Start free trial →
          </a>
          <a href="${dashboardUrl}" style="display:inline-block;color:#6b7280;text-decoration:none;font-size:13px;font-weight:500;padding:13px 0;">
            Go to dashboard
          </a>
        </td></tr>
      </table>
    </td></tr>

    <tr><td style="padding:20px 24px 24px 24px;border-top:1px solid #f3f4f6;">
      <p style="margin:0;font-size:13px;color:#9ca3af;">
        Questions? Reply to this email or reach us at <a href="mailto:support@callverted.com" style="color:#2454d8;text-decoration:none;">support@callverted.com</a>
      </p>
    </td></tr>
  `);

  return emailClient.send({
    to: ownerEmail,
    subject: `Welcome to Callverted, ${firstName}. Here's how to go live`,
    html,
  });
}

// ─── Painter: new contact notification (partial save) ────────────────────────

interface NewContactParams {
  painterEmail: string;
  businessName: string;
  lead: {
    id: string;
    homeownerName: string;
  };
}

export async function sendNewContactNotification({ painterEmail, businessName, lead }: NewContactParams) {
  const dashboardUrl = `${APP_URL}/dashboard/leads/${lead.id}`;

  const html = emailWrapper(`
    <tr><td style="padding:24px 24px 20px 24px;">
      <p style="margin:0 0 8px 0;font-size:15px;color:#374151;">
        <strong>${lead.homeownerName}</strong> started a quote request on your lead form.
      </p>
      <p style="margin:0 0 20px 0;font-size:14px;color:#6b7280;">
        They haven't finished yet — check the dashboard for their contact details.
      </p>
      <a href="${dashboardUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">
        View in dashboard →
      </a>
    </td></tr>
    ${emailFooter(businessName)}
  `);

  return emailClient.send({
    to: painterEmail,
    subject: `New contact: ${lead.homeownerName}`,
    html,
  });
}

// ─── Painter: new lead notification ──────────────────────────────────────────

interface NewLeadParams {
  painterEmail: string;
  painterName: string;
  businessName: string;
  lead: {
    id: string;
    homeownerName: string;
    homeownerPhone: string;
    homeownerEmail: string | null;
    address: string | null;
    serviceType: string | null;
    description: string | null;
    preferredTimeline: string | null;
    estimateLow: number | null;
    estimateHigh: number | null;
    estimateConfidence: string | null;
    estimateAssumptions: string[];
  };
}

export async function sendNewLeadNotification({ painterEmail, painterName, businessName, lead }: NewLeadParams) {
  const dashboardUrl = `${APP_URL}/dashboard/leads/${lead.id}`;
  const serviceLabel = lead.serviceType ? (SERVICE_LABELS[lead.serviceType] ?? lead.serviceType) : null;
  const timelineLabel = lead.preferredTimeline ? (TIMELINE_LABELS[lead.preferredTimeline] ?? lead.preferredTimeline) : null;
  const firstName = painterName.split(" ")[0];

  const estimateHtml = lead.estimateLow && lead.estimateHigh
    ? `<tr><td style="padding:0 0 16px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;">
          <tr><td style="padding:14px 18px;">
            <p style="margin:0 0 2px 0;font-size:11px;font-weight:700;color:#ea580c;text-transform:uppercase;letter-spacing:0.06em;">AI Estimate</p>
            <p style="margin:0;font-size:26px;font-weight:700;color:#c2410c;letter-spacing:-0.5px;">${fmt(lead.estimateLow)} – ${fmt(lead.estimateHigh)}</p>
            <p style="margin:4px 0 0 0;font-size:11px;color:#9a3412;">Ballpark only — confirm on-site</p>
          </td></tr>
        </table>
      </td></tr>`
    : "";

  const detailRows = [
    serviceLabel ? `<strong>${serviceLabel}</strong>` : null,
    timelineLabel ? timelineLabel : null,
    lead.address ? lead.address : null,
    lead.homeownerEmail ? `<a href="mailto:${lead.homeownerEmail}" style="color:#6b7280;text-decoration:none;">${lead.homeownerEmail}</a>` : null,
  ].filter(Boolean);

  const html = emailWrapper(`
    <tr><td style="height:4px;background:linear-gradient(90deg,#f97316,#fb923c);font-size:0;line-height:0;">&nbsp;</td></tr>

    <tr><td style="padding:24px 24px 0 24px;">
      <p style="margin:0 0 6px 0;font-size:11px;font-weight:700;color:#f97316;text-transform:uppercase;letter-spacing:0.08em;">New Lead</p>
      <h1 style="margin:0 0 2px 0;font-size:24px;font-weight:700;color:#111827;letter-spacing:-0.3px;">${lead.homeownerName}</h1>
      ${serviceLabel ? `<p style="margin:0;font-size:13px;color:#9ca3af;">${serviceLabel}${timelineLabel ? ` · ${timelineLabel}` : ""}</p>` : ""}
    </td></tr>

    <tr><td style="padding:16px 24px 0 24px;">
      <a href="tel:${lead.homeownerPhone}" style="display:inline-block;text-decoration:none;">
        <p style="margin:0;font-size:28px;font-weight:700;color:#f97316;letter-spacing:-0.5px;line-height:1;">${lead.homeownerPhone}</p>
        <p style="margin:3px 0 0 0;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.06em;">Tap to call</p>
      </a>
    </td></tr>

    ${detailRows.length > 0 ? `
    <tr><td style="padding:10px 24px 0 24px;">
      <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.7;">${detailRows.join(" &nbsp;·&nbsp; ")}</p>
    </td></tr>` : ""}

    <tr><td style="padding:20px 24px 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">

        ${estimateHtml}

        ${lead.description ? `<tr><td style="padding:0 0 16px 0;">
          <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;">Description</p>
          <p style="margin:0;font-size:13px;color:#374151;line-height:1.6;">${lead.description}</p>
        </td></tr>` : ""}

        <tr><td style="padding-top:4px;">
          <a href="${dashboardUrl}" style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 28px;border-radius:8px;">
            View Lead →
          </a>
        </td></tr>

      </table>
    </td></tr>

    <tr><td style="padding:20px 24px 4px 24px;">
      <p style="margin:0;font-size:12px;color:#d1d5db;">Hi ${firstName} — this lead came in via your Callverted quote form.</p>
    </td></tr>

    ${emailFooter(businessName)}
  `);

  return emailClient.send({
    to: painterEmail,
    subject: `New lead: ${lead.homeownerName}${serviceLabel ? ` — ${serviceLabel}` : ""}`,
    html,
  });
}

// ─── Homeowner: request project details ──────────────────────────────────────

interface RequestDetailsParams {
  homeownerEmail: string;
  homeownerName: string;
  businessName: string;
  formUrl: string;
}

export async function sendRequestDetailsEmail({
  homeownerEmail,
  homeownerName,
  businessName,
  formUrl,
}: RequestDetailsParams) {
  const firstName = homeownerName.split(" ")[0];

  const html = emailWrapper(`
    <tr><td style="padding:24px 24px 0 24px;">
      <h1 style="margin:0 0 4px 0;font-size:20px;font-weight:700;color:#111827;">Hi ${firstName},</h1>
      <p style="margin:0;font-size:14px;color:#6b7280;">A quick request from ${businessName}.</p>
    </td></tr>

    <tr><td style="padding:20px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:0 0 20px 0;">
          <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">
            To give you an accurate estimate, we need a few more details about your project — it only takes a minute.
          </p>
        </td></tr>

        <tr><td>
          <a href="${formUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">
            Fill out project details →
          </a>
        </td></tr>
      </table>
    </td></tr>
    ${emailFooter(businessName)}
  `);

  return emailClient.send({
    to: homeownerEmail,
    subject: `${businessName} needs a few more details`,
    html,
  });
}

// ─── Homeowner: quote email ───────────────────────────────────────────────────

interface QuoteEmailParams {
  homeownerEmail: string;
  homeownerName: string;
  businessName: string;
  quoteNumber: string;
  totalCents: number;
  validUntil: string; // YYYY-MM-DD
  publicUrl: string; // /q/[token]
  pdfBuffer: Buffer;
}

function fmtDollars(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(dateStr: string) {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export async function sendQuoteEmail({
  homeownerEmail,
  homeownerName,
  businessName,
  quoteNumber,
  totalCents,
  validUntil,
  publicUrl,
  pdfBuffer,
}: QuoteEmailParams) {
  const firstName = homeownerName.split(" ")[0];

  const html = emailWrapper(`
    <tr><td style="padding:24px 24px 0 24px;">
      <p style="margin:0 0 4px 0;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Your Quote — ${quoteNumber}</p>
      <h1 style="margin:0 0 4px 0;font-size:22px;font-weight:700;color:#111827;">Hi ${firstName},</h1>
      <p style="margin:0;font-size:14px;color:#6b7280;">Here's your quote from ${businessName}.</p>
    </td></tr>

    <tr><td style="padding:20px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:10px;padding:16px;">
        <tr><td>
          <p style="margin:0 0 4px 0;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Total</p>
          <p style="margin:0;font-size:28px;font-weight:700;color:#111827;">${fmtDollars(totalCents)}</p>
          <p style="margin:4px 0 0 0;font-size:12px;color:#9ca3af;">Valid until ${fmtDate(validUntil)}</p>
        </td></tr>
      </table>
    </td></tr>

    <tr><td style="padding:0 24px 20px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:0 0 12px 0;">
          <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">
            Your quote is attached as a PDF. You can also view it online and accept or decline directly.
          </p>
        </td></tr>
        <tr><td>
          <a href="${publicUrl}" style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">
            View &amp; Accept Quote →
          </a>
        </td></tr>
      </table>
    </td></tr>
    ${emailFooter(businessName)}
  `);

  return emailClient.send({
    to: homeownerEmail,
    subject: `Your quote from ${businessName} — ${quoteNumber}`,
    html,
    attachments: [{ filename: `${quoteNumber}.pdf`, content: pdfBuffer }],
  });
}

// ─── Painter: quote responded notification ────────────────────────────────────

interface QuoteRespondedParams {
  painterEmail: string;
  businessName: string;
  homeownerName: string;
  homeownerPhone: string;
  homeownerEmail: string | null;
  quoteNumber: string;
  action: "accepted" | "declined";
  reason?: string | null;
  leadId: string;
}

export async function sendQuoteRespondedNotification({
  painterEmail,
  businessName,
  homeownerName,
  homeownerPhone,
  homeownerEmail,
  quoteNumber,
  action,
  reason,
  leadId,
}: QuoteRespondedParams) {
  const accepted = action === "accepted";
  const dashboardUrl = `${APP_URL}/dashboard/leads/${leadId}`;

  const accentColor = accepted ? "#16a34a" : "#dc2626";
  const accentLight = accepted ? "#f0fdf4" : "#fef2f2";
  const accentBorder = accepted ? "#bbf7d0" : "#fecaca";

  const html = emailWrapper(`
    <tr><td style="height:4px;background:${accentColor};font-size:0;line-height:0;">&nbsp;</td></tr>

    <tr><td style="padding:24px 24px 0 24px;">
      <p style="margin:0 0 6px 0;font-size:11px;font-weight:700;color:${accentColor};text-transform:uppercase;letter-spacing:0.08em;">
        Quote ${accepted ? "Accepted ✓" : "Declined"}
      </p>
      <h1 style="margin:0 0 2px 0;font-size:24px;font-weight:700;color:#111827;letter-spacing:-0.3px;">${homeownerName}</h1>
      <p style="margin:0;font-size:13px;color:#9ca3af;">${quoteNumber}</p>
    </td></tr>

    <tr><td style="padding:16px 24px 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:${accentLight};border:1px solid ${accentBorder};border-radius:10px;">
        <tr><td style="padding:14px 18px;">
          <p style="margin:0;font-size:14px;color:#111827;line-height:1.6;">
            ${accepted
              ? `<strong>${homeownerName}</strong> accepted your quote. Send the contract and collect the deposit to lock in the job.`
              : `<strong>${homeownerName}</strong> declined your quote.${reason ? `<br><span style="font-size:13px;color:#6b7280;">They said: "<em>${reason}</em>"</span>` : " Consider following up to address any concerns."}`
            }
          </p>
        </td></tr>
      </table>
    </td></tr>

    <tr><td style="padding:16px 24px 0 24px;">
      <a href="tel:${homeownerPhone}" style="display:inline-block;text-decoration:none;">
        <p style="margin:0;font-size:24px;font-weight:700;color:#f97316;letter-spacing:-0.5px;line-height:1;">${homeownerPhone}</p>
        <p style="margin:3px 0 0 0;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.06em;">Tap to call</p>
      </a>
      ${homeownerEmail ? `<p style="margin:8px 0 0 0;font-size:13px;color:#6b7280;">${homeownerEmail}</p>` : ""}
    </td></tr>

    <tr><td style="padding:20px 24px 24px 24px;">
      <a href="${dashboardUrl}" style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 28px;border-radius:8px;">
        View Lead →
      </a>
    </td></tr>

    ${emailFooter(businessName)}
  `);

  return emailClient.send({
    to: painterEmail,
    subject: `Quote ${accepted ? "accepted ✓" : "declined"}: ${homeownerName}`,
    html,
  });
}

// ─── Homeowner: confirmation email ───────────────────────────────────────────

interface HomeownerConfirmationParams {
  homeownerEmail: string;
  homeownerName: string;
  businessName: string;
  businessPhone: string | null;
  estimate?: {
    low: number;
    high: number;
    assumptions: string[];
  } | null;
}

export async function sendHomeownerConfirmation({
  homeownerEmail,
  homeownerName,
  businessName,
  businessPhone,
  estimate,
}: HomeownerConfirmationParams) {
  const firstName = homeownerName.split(" ")[0];

  const estimateHtml = estimate
    ? `<tr><td style="padding:0 0 20px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;padding:16px;">
          <tr><td>
            <p style="margin:0 0 4px 0;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Your estimate</p>
            <p style="margin:0;font-size:22px;font-weight:700;color:#111827;">${fmt(estimate.low)} – ${fmt(estimate.high)}</p>
            <p style="margin:4px 0 6px 0;font-size:12px;color:#9ca3af;">Preliminary ballpark only. Final price is determined after an in-person assessment.</p>
            ${estimate.assumptions.map(a => `<p style="margin:2px 0 0 0;font-size:12px;color:#9ca3af;">• ${a}</p>`).join("")}
          </td></tr>
        </table>
      </td></tr>`
    : "";

  const html = emailWrapper(`
    <tr><td style="padding:24px 24px 0 24px;">
      <h1 style="margin:0 0 4px 0;font-size:20px;font-weight:700;color:#111827;">Thanks, ${firstName}!</h1>
      <p style="margin:0;font-size:14px;color:#6b7280;">Your quote request has been received.</p>
    </td></tr>

    <tr><td style="padding:20px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${estimateHtml}

        <tr><td style="padding:0 0 20px 0;">
          <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">
            <strong>${businessName}</strong> will be in touch within 24 hours to discuss your project and schedule a free on-site quote.
          </p>
        </td></tr>

        ${businessPhone ? `<tr><td style="padding:0 0 8px 0;">
          <p style="margin:0 0 4px 0;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Questions? Call us</p>
          <a href="tel:${businessPhone}" style="font-size:16px;font-weight:600;color:#111827;text-decoration:none;">${businessPhone}</a>
        </td></tr>` : ""}
      </table>
    </td></tr>
    ${emailFooter(businessName)}
  `);

  return emailClient.send({
    to: homeownerEmail,
    subject: `Your quote request — ${businessName}`,
    html,
  });
}

// ─── Homeowner: contract signing request ──────────────────────────────────────

interface ContractEmailParams {
  homeownerEmail: string;
  homeownerName: string;
  businessName: string;
  publicUrl: string; // /contract/[token]
}

export async function sendContractEmail({
  homeownerEmail,
  homeownerName,
  businessName,
  publicUrl,
}: ContractEmailParams) {
  const firstName = homeownerName.split(" ")[0];

  const html = emailWrapper(`
    <tr><td style="padding:24px 24px 0 24px;">
      <p style="margin:0 0 4px 0;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Contract Ready to Sign</p>
      <h1 style="margin:0 0 4px 0;font-size:22px;font-weight:700;color:#111827;">Hi ${firstName},</h1>
      <p style="margin:0;font-size:14px;color:#6b7280;">Your contract from ${businessName} is ready for your signature.</p>
    </td></tr>

    <tr><td style="padding:20px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:0 0 12px 0;">
          <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">
            Please review the contract and sign electronically to confirm your project. Once signed, you'll receive a copy by email.
          </p>
        </td></tr>
        <tr><td>
          <a href="${publicUrl}" style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">
            Review &amp; Sign Contract →
          </a>
        </td></tr>
      </table>
    </td></tr>
    ${emailFooter(businessName)}
  `);

  return emailClient.send({
    to: homeownerEmail,
    subject: `Contract ready to sign — ${businessName}`,
    html,
  });
}

// ─── Homeowner: contract signed confirmation ──────────────────────────────────

interface ContractSignedHomeownerParams {
  homeownerEmail: string;
  homeownerName: string;
  businessName: string;
  businessPhone: string | null;
  signedPdfBuffer: Buffer;
}

export async function sendContractSignedHomeownerConfirmation({
  homeownerEmail,
  homeownerName,
  businessName,
  businessPhone,
  signedPdfBuffer,
}: ContractSignedHomeownerParams) {
  const firstName = homeownerName.split(" ")[0];

  const html = emailWrapper(`
    <tr><td style="padding:24px 24px 0 24px;">
      <p style="margin:0 0 4px 0;font-size:12px;font-weight:600;color:#16a34a;text-transform:uppercase;letter-spacing:0.05em;">Contract Signed</p>
      <h1 style="margin:0 0 4px 0;font-size:22px;font-weight:700;color:#111827;">You're all set, ${firstName}!</h1>
      <p style="margin:0;font-size:14px;color:#6b7280;">Your signed contract with ${businessName} is attached for your records.</p>
    </td></tr>

    <tr><td style="padding:20px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:0 0 16px 0;">
          <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">
            ${businessName} will be in touch shortly to confirm your deposit and schedule the job.
          </p>
        </td></tr>
        ${businessPhone ? `
        <tr><td style="padding:0 0 8px 0;">
          <p style="margin:0 0 4px 0;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Questions? Call us</p>
          <a href="tel:${businessPhone}" style="font-size:16px;font-weight:600;color:#111827;text-decoration:none;">${businessPhone}</a>
        </td></tr>` : ""}
      </table>
    </td></tr>
    ${emailFooter(businessName)}
  `);

  return emailClient.send({
    to: homeownerEmail,
    subject: `Your signed contract — ${businessName}`,
    html,
    attachments: [{ filename: `contract-signed.pdf`, content: signedPdfBuffer }],
  });
}

// ─── Painter: contract signed notification ────────────────────────────────────

interface ContractSignedParams {
  painterEmail: string;
  businessName: string;
  homeownerName: string;
  homeownerPhone: string;
  homeownerEmail: string | null;
  leadId: string;
  signedPdfBuffer: Buffer;
}

export async function sendContractSignedNotification({
  painterEmail,
  businessName,
  homeownerName,
  homeownerPhone,
  homeownerEmail,
  leadId,
  signedPdfBuffer,
}: ContractSignedParams) {
  const dashboardUrl = `${APP_URL}/dashboard/leads/${leadId}`;

  const html = emailWrapper(`
    <tr><td style="padding:24px 24px 0 24px;">
      <p style="margin:0 0 4px 0;font-size:12px;font-weight:600;color:#16a34a;text-transform:uppercase;letter-spacing:0.05em;">Contract Signed</p>
      <h1 style="margin:0 0 4px 0;font-size:22px;font-weight:700;color:#111827;">${homeownerName}</h1>
    </td></tr>

    <tr><td style="padding:20px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:0 0 16px 0;">
          <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">
            <strong>${homeownerName}</strong> has signed the contract. The signed copy is attached. Follow up to collect the deposit and schedule the job.
          </p>
        </td></tr>

        <tr><td style="padding:0 0 16px 0;">
          <p style="margin:0 0 4px 0;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Contact</p>
          <a href="tel:${homeownerPhone}" style="display:block;font-size:15px;font-weight:600;color:#111827;text-decoration:none;">${homeownerPhone}</a>
          ${homeownerEmail ? `<a href="mailto:${homeownerEmail}" style="display:block;font-size:13px;color:#6b7280;text-decoration:none;margin-top:2px;">${homeownerEmail}</a>` : ""}
        </td></tr>

        <tr><td>
          <a href="${dashboardUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">
            View lead in dashboard →
          </a>
        </td></tr>
      </table>
    </td></tr>
    ${emailFooter(businessName)}
  `);

  return emailClient.send({
    to: painterEmail,
    subject: `Contract signed: ${homeownerName}`,
    html,
    attachments: [{ filename: `contract-${homeownerName.replace(/\s+/g, "-").toLowerCase()}.pdf`, content: signedPdfBuffer }],
  });
}

// ─── Quote nudge (48h — painter + homeowner) ──────────────────────────────────

interface QuoteNudgeParams {
  painterEmail: string;
  painterName: string;
  businessName: string;
  homeownerName: string;
  homeownerEmail?: string;
  quoteNumber: string;
  publicToken: string;
}

export function buildQuoteNudgeEmails({
  painterEmail,
  businessName,
  homeownerName,
  homeownerEmail,
  quoteNumber,
  publicToken,
}: Omit<QuoteNudgeParams, "painterEmail"> & { painterEmail: string | null }): Array<{ to: string; subject: string; html: string }> {
  const quoteUrl = `${APP_URL}/q/${publicToken}`;

  const painterHtml = emailWrapper(`
    <tr><td style="padding:24px 24px 0 24px;">
      <p style="margin:0 0 4px 0;font-size:12px;font-weight:600;color:#f97316;text-transform:uppercase;letter-spacing:0.05em;">Follow-Up Reminder</p>
      <h1 style="margin:0 0 4px 0;font-size:22px;font-weight:700;color:#111827;">${homeownerName} hasn&apos;t viewed your quote yet</h1>
    </td></tr>
    <tr><td style="padding:20px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:0 0 16px 0;">
          <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">
            It&apos;s been 48 hours since you sent <strong>${quoteNumber}</strong> to ${homeownerName}. They haven&apos;t opened it yet — now is a good time to follow up with a quick call or text.
          </p>
        </td></tr>
        <tr><td>
          <a href="${quoteUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">
            View quote →
          </a>
        </td></tr>
      </table>
    </td></tr>
    ${emailFooter(businessName)}
  `);

  const emails: Array<{ to: string; subject: string; html: string }> = [];
  if (painterEmail) {
    emails.push({ to: painterEmail, subject: `Follow-up: ${homeownerName} hasn't viewed your quote yet`, html: painterHtml });
  }

  if (homeownerEmail) {
    const homeownerHtml = emailWrapper(`
      <tr><td style="padding:24px 24px 0 24px;">
        <h1 style="margin:0 0 4px 0;font-size:22px;font-weight:700;color:#111827;">Your quote is waiting</h1>
        <p style="margin:4px 0 0 0;font-size:14px;color:#6b7280;">From ${businessName}</p>
      </td></tr>
      <tr><td style="padding:20px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:0 0 16px 0;">
            <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">
              Just a friendly reminder — ${businessName} sent you a quote that&apos;s ready to review. Click below to view the details and accept or decline.
            </p>
          </td></tr>
          <tr><td>
            <a href="${quoteUrl}" style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">
              Review your quote →
            </a>
          </td></tr>
        </table>
      </td></tr>
      ${emailFooter(businessName)}
    `);
    emails.push({ to: homeownerEmail, subject: `Reminder: your quote from ${businessName} is ready`, html: homeownerHtml });
  }

  return emails;
}

/** @deprecated Use buildQuoteNudgeEmails + emailClient.batchSend for cron jobs */
export async function sendQuoteNudge(params: QuoteNudgeParams) {
  const emails = buildQuoteNudgeEmails(params);
  await Promise.allSettled(emails.map((e) => emailClient.send(e)));
}

// ─── Contract nudge (72h — painter + homeowner) ───────────────────────────────

interface ContractNudgeParams {
  painterEmail: string;
  painterName: string;
  businessName: string;
  homeownerName: string;
  homeownerEmail?: string;
  publicToken: string;
}

export function buildContractNudgeEmails({
  painterEmail,
  businessName,
  homeownerName,
  homeownerEmail,
  publicToken,
}: Omit<ContractNudgeParams, "painterEmail"> & { painterEmail: string | null }): Array<{ to: string; subject: string; html: string }> {
  const contractUrl = `${APP_URL}/contract/${publicToken}`;

  const painterHtml = emailWrapper(`
    <tr><td style="padding:24px 24px 0 24px;">
      <p style="margin:0 0 4px 0;font-size:12px;font-weight:600;color:#f97316;text-transform:uppercase;letter-spacing:0.05em;">Follow-Up Reminder</p>
      <h1 style="margin:0 0 4px 0;font-size:22px;font-weight:700;color:#111827;">${homeownerName} hasn&apos;t signed the contract yet</h1>
    </td></tr>
    <tr><td style="padding:20px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:0 0 16px 0;">
          <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">
            It&apos;s been 72 hours since you sent the contract to ${homeownerName}. It hasn&apos;t been signed yet — consider following up directly to keep the job moving.
          </p>
        </td></tr>
        <tr><td>
          <a href="${contractUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">
            View contract →
          </a>
        </td></tr>
      </table>
    </td></tr>
    ${emailFooter(businessName)}
  `);

  const emails: Array<{ to: string; subject: string; html: string }> = [];
  if (painterEmail) {
    emails.push({ to: painterEmail, subject: `Follow-up: ${homeownerName} hasn't signed the contract yet`, html: painterHtml });
  }

  if (homeownerEmail) {
    const homeownerHtml = emailWrapper(`
      <tr><td style="padding:24px 24px 0 24px;">
        <h1 style="margin:0 0 4px 0;font-size:22px;font-weight:700;color:#111827;">Your contract is ready to sign</h1>
        <p style="margin:4px 0 0 0;font-size:14px;color:#6b7280;">From ${businessName}</p>
      </td></tr>
      <tr><td style="padding:20px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:0 0 16px 0;">
            <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">
              Just a friendly reminder — ${businessName} sent you a service agreement that&apos;s ready for your signature. Click below to review and sign.
            </p>
          </td></tr>
          <tr><td>
            <a href="${contractUrl}" style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">
              Review &amp; sign →
            </a>
          </td></tr>
        </table>
      </td></tr>
      ${emailFooter(businessName)}
    `);
    emails.push({ to: homeownerEmail, subject: `Reminder: your contract from ${businessName} is ready to sign`, html: homeownerHtml });
  }

  return emails;
}

/** @deprecated Use buildContractNudgeEmails + emailClient.batchSend for cron jobs */
export async function sendContractNudge(params: ContractNudgeParams) {
  const emails = buildContractNudgeEmails(params);
  await Promise.allSettled(emails.map((e) => emailClient.send(e)));
}

// ─── Schedule confirmation ────────────────────────────────────────────────────

interface ScheduleConfirmationParams {
  homeownerName: string;
  homeownerEmail: string;
  businessName: string;
  businessPhone: string | null;
  scheduledAt: Date;
  scheduledEndAt: Date | null;
  address: string | null;
  // staffName: string | null; // Reserved for SMS feature
}

export async function sendScheduleConfirmation(params: ScheduleConfirmationParams) {
  const {
    homeownerName, homeownerEmail, businessName, businessPhone,
    scheduledAt, scheduledEndAt, address,
    // staffName,
  } = params;

  const dateStr = scheduledAt.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
  const timeStr = scheduledAt.toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit",
  });

  const isSameDay = scheduledEndAt
    ? scheduledAt.toDateString() === scheduledEndAt.toDateString()
    : true;
  const endDateStr = scheduledEndAt && !isSameDay
    ? scheduledEndAt.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
    : null;
  const endTimeStr = scheduledEndAt
    ? scheduledEndAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : null;

  const html = emailWrapper(`
    <tr><td style="padding:24px 24px 0 24px;">
      <p style="margin:0 0 4px 0;font-size:12px;font-weight:600;color:#f97316;text-transform:uppercase;letter-spacing:0.05em;">Job Confirmed</p>
      <h1 style="margin:0 0 4px 0;font-size:22px;font-weight:700;color:#111827;">You&apos;re all set, ${homeownerName}!</h1>
      <p style="margin:4px 0 0 0;font-size:14px;color:#6b7280;">From ${businessName}</p>
    </td></tr>
    <tr><td style="padding:20px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:10px;padding:16px;">
        ${endDateStr ? `
        <tr><td style="padding:0 0 10px 0;">
          <p style="margin:0;font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;">Start</p>
          <p style="margin:4px 0 0 0;font-size:15px;font-weight:600;color:#111827;">${dateStr} at ${timeStr}</p>
        </td></tr>
        <tr><td style="padding:0 0 10px 0;">
          <p style="margin:0;font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;">End</p>
          <p style="margin:4px 0 0 0;font-size:15px;font-weight:600;color:#111827;">${endDateStr} at ${endTimeStr}</p>
        </td></tr>` : `
        <tr><td style="padding:0 0 10px 0;">
          <p style="margin:0;font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;">Date</p>
          <p style="margin:4px 0 0 0;font-size:15px;font-weight:600;color:#111827;">${dateStr}</p>
        </td></tr>
        <tr><td style="padding:0 0 10px 0;">
          <p style="margin:0;font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;">Time</p>
          <p style="margin:4px 0 0 0;font-size:15px;font-weight:600;color:#111827;">${timeStr}${endTimeStr ? ` – ${endTimeStr}` : ""}</p>
        </td></tr>`}
        ${address ? `
        <tr><td>
          <p style="margin:0;font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;">Location</p>
          <p style="margin:4px 0 0 0;font-size:15px;font-weight:600;color:#111827;">${address}</p>
        </td></tr>` : ""}
      </table>
    </td></tr>
    <tr><td style="padding:0 24px 24px 24px;">
      <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">
        We look forward to working with you.${businessPhone ? ` If you have any questions or need to reschedule, give us a call at <strong>${businessPhone}</strong>.` : ""}
      </p>
    </td></tr>
    ${emailFooter(businessName)}
  `);

  await emailClient.send({
    to: homeownerEmail,
    subject: `Your job with ${businessName} is confirmed — ${dateStr}${endDateStr ? ` – ${endDateStr}` : ""}`,
    html,
  });

  // Staff notification — reserved for SMS/notifications feature
  // if (staffName && staffEmail) {
  //   await emailClient.send({ to: staffEmail, subject: `Job scheduled: ${homeownerName} on ${dateStr}`, html: staffHtml });
  // }
}

// ─── Review request ───────────────────────────────────────────────────────────

export async function sendReviewRequestEmail({
  homeownerName,
  homeownerEmail,
  businessName,
  reviewUrl,
}: {
  homeownerName: string;
  homeownerEmail: string;
  businessName: string;
  reviewUrl: string;
}) {
  const firstName = homeownerName.split(" ")[0];

  const html = emailWrapper(`
    <tr><td style="padding:32px 24px 24px 24px;">
      <h1 style="margin:0 0 8px 0;font-size:22px;font-weight:700;color:#111827;">How did we do, ${firstName}?</h1>
      <p style="margin:0;font-size:15px;color:#6b7280;">It was a pleasure working with you.</p>
    </td></tr>
    <tr><td style="padding:0 24px 24px 24px;">
      <p style="margin:0;font-size:15px;color:#374151;line-height:1.7;">
        We hope you're happy with the work. If you have a spare moment, leaving us a quick Google review would mean a lot — it helps other homeowners find us and helps our small business grow.
      </p>
    </td></tr>
    <tr><td style="padding:0 24px 32px 24px;">
      <a href="${reviewUrl}" style="display:inline-block;background:#f97316;color:#ffffff;font-size:15px;font-weight:600;padding:14px 28px;border-radius:8px;text-decoration:none;">
        Leave a Review
      </a>
    </td></tr>
    ${emailFooter(businessName)}
  `);

  await emailClient.send({
    to: homeownerEmail,
    subject: `How did we do? — ${businessName}`,
    html,
  });
}

// ─── Lead Packet Email ────────────────────────────────────────────────────────
// The most important email in the product — arrives on owner's phone after a
// prospect completes intake. Shows scores, AI reasoning, and one-tap call link.

function urgencyLabel(score: number): string {
  if (score >= 8) return "Critical";
  if (score >= 6) return "High";
  if (score >= 4) return "Medium";
  return "Low";
}

function urgencyColor(score: number): string {
  if (score >= 8) return "#dc2626"; // red
  if (score >= 6) return "#ea580c"; // orange
  if (score >= 4) return "#ca8a04"; // yellow
  return "#16a34a";                 // green
}

function fmtCents(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function fmtAnswers(
  answers: Record<string, string | string[]>,
  questions: Array<{ key: string; label: string; options?: { value: string; label: string }[] }>
): string {
  const qMap = new Map(questions.map((q) => [q.key, q]));
  return Object.entries(answers)
    .map(([key, value]) => {
      const q = qMap.get(key);
      const rowLabel = q?.label ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const optMap = new Map(q?.options?.map((o) => [o.value, o.label]) ?? []);
      const val = Array.isArray(value)
        ? value.map((v) => optMap.get(v) ?? v).join(", ")
        : (optMap.get(value) ?? value);
      return `<tr>
        <td style="padding:6px 0;font-size:13px;color:#6b7280;width:45%;vertical-align:top;">${rowLabel}</td>
        <td style="padding:6px 0;font-size:13px;color:#111827;font-weight:500;">${val}</td>
      </tr>`;
    })
    .join("");
}

interface LeadPacketParams {
  ownerEmail: string;
  ownerName: string;
  businessName: string;
  leadId: string;
  callerName: string | null;
  callerPhone: string;
  urgencyScore: number;
  qualityScore: number;
  estimatedValueLow: number;
  estimatedValueHigh: number;
  urgencyReasoning: string;
  qualityReasoning: string;
  recommendedActions: string[];
  intakeAnswers: Record<string, string | string[]>;
  questions: Array<{ key: string; label: string; options?: { value: string; label: string }[] }>;
}

export async function sendLeadPacketEmail(params: LeadPacketParams) {
  const {
    ownerEmail, ownerName, businessName, leadId,
    callerName, callerPhone, urgencyScore, qualityScore,
    estimatedValueLow, estimatedValueHigh,
    urgencyReasoning, qualityReasoning, recommendedActions, intakeAnswers, questions,
  } = params;

  const label = urgencyLabel(urgencyScore);
  const color = urgencyColor(urgencyScore);
  const leadUrl = `${APP_URL}/dashboard/leads/${leadId}`;
  const displayName = callerName ?? "Unknown caller";

  const html = emailWrapper(`
    <!-- Header -->
    <tr><td style="padding:20px 24px 16px;background:${color};">
      <p style="margin:0;font-size:11px;font-weight:600;color:rgba(255,255,255,0.8);text-transform:uppercase;letter-spacing:0.05em;">New Qualified Lead</p>
      <p style="margin:4px 0 0;font-size:22px;font-weight:700;color:#ffffff;">${label} Priority &nbsp;·&nbsp; ${urgencyScore}/10 Urgency</p>
    </td></tr>

    <!-- Caller -->
    <tr><td style="padding:20px 24px 0;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Caller</p>
      <p style="margin:0;font-size:18px;font-weight:700;color:#111827;">${displayName}</p>
      <a href="tel:${callerPhone}" style="display:inline-block;margin-top:6px;font-size:15px;color:${color};font-weight:600;text-decoration:none;">📞 ${callerPhone}</a>
    </td></tr>

    <!-- Value estimate -->
    <tr><td style="padding:16px 24px 0;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Estimated Job Value</p>
      <p style="margin:0;font-size:20px;font-weight:700;color:#111827;">${fmtCents(estimatedValueLow)} – ${fmtCents(estimatedValueHigh)}</p>
      <p style="margin:2px 0 0;font-size:12px;color:#9ca3af;">Quality score: ${qualityScore}/100</p>
    </td></tr>

    <!-- AI reasoning -->
    <tr><td style="padding:16px 24px 0;">
      <div style="background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;padding:14px 16px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">AI Assessment</p>
        <p style="margin:0 0 6px;font-size:13px;color:#111827;line-height:1.5;"><strong>Urgency:</strong> ${urgencyReasoning}</p>
        <p style="margin:0;font-size:13px;color:#111827;line-height:1.5;"><strong>Quality:</strong> ${qualityReasoning}</p>
      </div>
    </td></tr>

    <!-- Recommended actions -->
    <tr><td style="padding:16px 24px 0;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Recommended Actions</p>
      <ul style="margin:0;padding-left:18px;">
        ${recommendedActions.map((a) => `<li style="font-size:13px;color:#111827;margin-bottom:4px;line-height:1.5;">${a}</li>`).join("")}
      </ul>
    </td></tr>

    <!-- Intake answers -->
    <tr><td style="padding:16px 24px 0;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Intake Answers</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${fmtAnswers(intakeAnswers, questions)}
      </table>
    </td></tr>

    <!-- CTAs -->
    <tr><td style="padding:20px 24px;">
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding-right:8px;">
            <a href="${leadUrl}" style="display:inline-block;background:${color};color:#ffffff;font-size:13px;font-weight:600;padding:10px 20px;border-radius:8px;text-decoration:none;">View Full Lead</a>
          </td>
          <td>
            <a href="tel:${callerPhone}" style="display:inline-block;background:#f3f4f6;color:#111827;font-size:13px;font-weight:600;padding:10px 20px;border-radius:8px;text-decoration:none;">Call Now</a>
          </td>
        </tr>
      </table>
    </td></tr>

    ${emailFooter(businessName)}
  `);

  await emailClient.send({
    to: ownerEmail,
    subject: `[${label}] New Lead — ${displayName} · ${fmtCents(estimatedValueLow)}–${fmtCents(estimatedValueHigh)}`,
    html,
  });
}

// ─── Non-job message notification ────────────────────────────────────────────

const MESSAGE_KIND_LABELS: Record<string, string> = {
  existing_customer: "Existing customer",
  billing: "Billing",
  callback: "Callback request",
  question: "Question",
  general: "Message",
};

interface MessageNotificationParams {
  ownerEmail: string;
  ownerName: string;
  businessName: string;
  leadId: string;
  callerName: string | null;
  callerPhone: string;
  messageKind: string | null;
  notes: string | null;
}

/**
 * Low-key alert for a captured non-job MESSAGE. Deliberately plain vs the lead
 * packet: a neutral slate header (not the urgent priority color), no scores, no
 * value estimate, no "recommended actions" — it's a message to return, not an
 * opportunity to chase.
 */
export async function sendMessageNotificationEmail(params: MessageNotificationParams) {
  const { ownerEmail, businessName, leadId, callerName, callerPhone, messageKind, notes } = params;
  const leadUrl = `${APP_URL}/dashboard/leads/${leadId}`;
  const displayName = callerName ?? "Unknown caller";
  const kindLabel = (messageKind && MESSAGE_KIND_LABELS[messageKind]) || "Message";
  const messageBody = notes?.trim() || "No message details were captured — call back to follow up.";

  const html = emailWrapper(`
    <!-- Header: neutral slate, NOT the urgent lead color -->
    <tr><td style="padding:20px 24px 16px;background:#334155;">
      <p style="margin:0;font-size:11px;font-weight:600;color:rgba(255,255,255,0.8);text-transform:uppercase;letter-spacing:0.05em;">New Message</p>
      <p style="margin:4px 0 0;font-size:22px;font-weight:700;color:#ffffff;">${kindLabel}</p>
    </td></tr>

    <!-- Caller -->
    <tr><td style="padding:20px 24px 0;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Caller</p>
      <p style="margin:0;font-size:18px;font-weight:700;color:#111827;">${displayName}</p>
      <a href="tel:${callerPhone}" style="display:inline-block;margin-top:6px;font-size:15px;color:#334155;font-weight:600;text-decoration:none;">📞 ${callerPhone}</a>
    </td></tr>

    <!-- Message -->
    <tr><td style="padding:16px 24px 0;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Message</p>
      <div style="background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;padding:14px 16px;">
        <p style="margin:0;font-size:14px;color:#111827;line-height:1.5;">${messageBody}</p>
      </div>
    </td></tr>

    <!-- CTAs -->
    <tr><td style="padding:20px 24px;">
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding-right:8px;">
            <a href="${leadUrl}" style="display:inline-block;background:#334155;color:#ffffff;font-size:13px;font-weight:600;padding:10px 20px;border-radius:8px;text-decoration:none;">View Message</a>
          </td>
          <td>
            <a href="tel:${callerPhone}" style="display:inline-block;background:#f3f4f6;color:#111827;font-size:13px;font-weight:600;padding:10px 20px;border-radius:8px;text-decoration:none;">Call Back</a>
          </td>
        </tr>
      </table>
    </td></tr>

    ${emailFooter(businessName)}
  `);

  await emailClient.send({
    to: ownerEmail,
    subject: `[Message] ${kindLabel} — ${displayName}`,
    html,
  });
}

// ─── Follow-up email to prospect ─────────────────────────────────────────────

export async function sendFollowupEmail({
  toEmail,
  businessName,
  intakeUrl,
}: {
  toEmail: string;
  businessName: string;
  intakeUrl: string;
}) {
  const html = emailWrapper(`
    <tr><td style="padding:28px 24px 20px;">
      <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
        Hi — we wanted to follow up from <strong>${businessName}</strong>.
      </p>
      <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
        If you still need help, it only takes about 90 seconds to tell us what's going on
        and we'll get back to you right away.
      </p>
      <a href="${intakeUrl}"
        style="display:inline-block;background:#f97316;color:#fff;font-size:14px;font-weight:700;
        padding:12px 24px;border-radius:8px;text-decoration:none;">
        Tell us what happened →
      </a>
    </td></tr>
    ${emailFooter(businessName)}
  `);

  await emailClient.send({
    to: toEmail,
    subject: `Still here to help — ${businessName}`,
    html,
  });
}

// ─── Weekly report ────────────────────────────────────────────────────────────

interface WeeklyReportParams {
  ownerEmail: string;
  ownerName: string;
  businessName: string;
  businessId: string;
  weekOf: string; // e.g. "May 26 – Jun 1"
  stats: {
    total: number;
    missedCalls: number;
    converted: number;
    estimatedRevenue: number;
    intakeCompletionRate: number | null;
  };
}

export async function sendWeeklyReportEmail(params: WeeklyReportParams) {
  const { ownerEmail, businessName, businessId, weekOf, stats } = params;
  const dashboardUrl = `${APP_URL}/dashboard`;
  const leadsUrl = `${APP_URL}/dashboard/leads`;

  const completionRate = stats.intakeCompletionRate !== null
    ? `${stats.intakeCompletionRate}%`
    : "—";

  const html = emailWrapper(`
    <tr><td style="padding:20px 24px 16px;background:#f97316;">
      <p style="margin:0;font-size:11px;font-weight:600;color:rgba(255,255,255,0.8);text-transform:uppercase;letter-spacing:0.05em;">Weekly Summary</p>
      <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#ffffff;">${businessName}</p>
      <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.85);">${weekOf}</p>
    </td></tr>

    <tr><td style="padding:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:50%;padding-bottom:16px;">
            <p style="margin:0;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">New Leads</p>
            <p style="margin:4px 0 0;font-size:28px;font-weight:700;color:#111827;">${stats.total}</p>
          </td>
          <td style="width:50%;padding-bottom:16px;">
            <p style="margin:0;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Missed Calls</p>
            <p style="margin:4px 0 0;font-size:28px;font-weight:700;color:#111827;">${stats.missedCalls}</p>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:16px;">
            <p style="margin:0;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Converted</p>
            <p style="margin:4px 0 0;font-size:28px;font-weight:700;color:#16a34a;">${stats.converted}</p>
          </td>
          <td style="padding-bottom:16px;">
            <p style="margin:0;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Intake Rate</p>
            <p style="margin:4px 0 0;font-size:28px;font-weight:700;color:#111827;">${completionRate}</p>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding-top:4px;padding-bottom:20px;border-top:1px solid #f3f4f6;">
            <p style="margin:12px 0 4px;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Estimated Pipeline Value</p>
            <p style="margin:0;font-size:32px;font-weight:700;color:#f97316;">${fmt(stats.estimatedRevenue / 100)}</p>
          </td>
        </tr>
      </table>

      <a href="${leadsUrl}" style="display:inline-block;background:#f97316;color:#ffffff;font-size:13px;font-weight:600;padding:10px 20px;border-radius:8px;text-decoration:none;">View All Leads →</a>
    </td></tr>

    ${emailFooter(businessName)}
  `);

  await emailClient.send({
    to: ownerEmail,
    subject: `Weekly recap — ${stats.total} leads, ${stats.converted} converted · ${businessName}`,
    html,
  });
}

// Voice overflow leads reuse sendLeadPacketEmail above — same scoring pipeline
// (scoreLeadFromAnswers + assessLead) as the web intake form, same email.

// ─── Top-of-funnel: missed-call breakdown (ROI capture) ──────────────────────
// Sent to an anonymous visitor who asked us to email their ROI-calculator
// result. Echoes their own numbers back so the email carries real value, then
// points them at the free trial. Also used for the softer lead-magnet capture,
// where the ROI numbers may be absent.

interface MissedCallBreakdownParams {
  toEmail: string;
  missedCalls?: number;
  jobValue?: number;
  closeRate?: number;
  atRisk?: number;
}

export async function sendMissedCallBreakdownEmail({
  toEmail,
  missedCalls,
  jobValue,
  closeRate,
  atRisk,
}: MissedCallBreakdownParams) {
  const signupUrl = `${APP_URL}/sign-up`;
  const hasNumbers =
    typeof missedCalls === "number" &&
    typeof jobValue === "number" &&
    typeof closeRate === "number" &&
    typeof atRisk === "number";

  // Signs with a real name when FOUNDER_NAME is set, so the note reads as a
  // person, not a brand. Drop in a headshot later (base64 img in the signoff row).
  const signoff = process.env.FOUNDER_NAME
    ? `Talk soon,<br><strong style="color:#111827;">${process.env.FOUNDER_NAME}</strong>, founder of Callverted`
    : `Talk soon,<br><strong style="color:#111827;">the Callverted team</strong>`;

  // Email-safe "your math" visual: three inputs, then the result. Plain tables +
  // inline styles so it renders everywhere (no SVG — Gmail strips it).
  const cell = (value: string, label: string) =>
    `<td width="32%" align="center" style="padding:12px 6px;background:#f2f6ff;border:1px solid #dbe4ff;border-radius:10px;">
       <div style="font-size:20px;font-weight:800;color:#111827;">${value}</div>
       <div style="font-size:11px;color:#6b7280;margin-top:3px;">${label}</div>
     </td>`;

  const mathVisual = hasNumbers
    ? `
    <tr><td style="padding:0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        ${cell(String(missedCalls), missedCalls === 1 ? "missed call / mo" : "missed calls / mo")}
        <td width="2%"></td>
        ${cell(fmt(jobValue!), "average job")}
        <td width="2%"></td>
        ${cell(`${closeRate}%`, "would have booked")}
      </tr></table>
    </td></tr>

    <tr><td align="center" style="padding:12px 24px 4px;"><div style="font-size:12px;color:#6b7280;">which works out to</div></td></tr>

    <tr><td style="padding:0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#2454d8;border-radius:12px;">
        <tr><td align="center" style="padding:20px;">
          <div style="font-size:34px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">${fmt(atRisk!)}</div>
          <div style="font-size:12px;color:#c7d6ff;margin-top:3px;">likely slipping away every month</div>
        </td></tr>
      </table>
    </td></tr>`
    : "";

  const html = emailWrapper(`
    <tr><td style="height:4px;background:linear-gradient(90deg,#2454d8,#5b8cff);font-size:0;line-height:0;">&nbsp;</td></tr>

    <tr><td style="padding:22px 24px 0 24px;">
      <span style="font-size:16px;font-weight:800;color:#2454d8;letter-spacing:-0.2px;">Callverted</span>
    </td></tr>

    <tr><td style="padding:16px 24px 0 24px;">
      <p style="margin:0;font-size:15px;color:#111827;line-height:1.6;">Hey 👋</p>
      <p style="margin:10px 0 0;font-size:15px;color:#111827;line-height:1.6;">You just ran your missed-call numbers on our site. Here is what they came out to:</p>
    </td></tr>

    <tr><td style="height:16px;font-size:0;line-height:0;">&nbsp;</td></tr>

    ${mathVisual}

    <tr><td style="padding:18px 24px 0;">
      <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;">${hasNumbers ? "That is a rough estimate, not a promise." : "Here is the pattern worth knowing."} But the shape of it is real: when a homeowner has a flooding basement or no heat, they do not leave a voicemail. They call the next number on the list.</p>
      <p style="margin:12px 0 0;font-size:14px;color:#374151;line-height:1.7;">That is the whole reason we built Callverted. It answers the calls your team cannot get to, qualifies the job, and texts you a ready-to-call lead while the caller is still deciding. You keep the work instead of losing it to whoever picked up.</p>
    </td></tr>

    <tr><td style="padding:22px 24px 0;">
      <a href="${signupUrl}" style="display:inline-block;background:#2454d8;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 28px;border-radius:8px;">Start my 14-day trial</a>
      <p style="margin:12px 0 0 0;font-size:12px;color:#9ca3af;">No charge for 14 days. Cancel anytime.</p>
    </td></tr>

    <tr><td style="padding:22px 24px 4px;">
      <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;">${signoff}</p>
      <p style="margin:10px 0 0;font-size:13px;color:#6b7280;line-height:1.6;">Just reply to this email if you have questions. A real person reads every one.</p>
    </td></tr>

    <tr><td style="padding:20px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;">Callverted · callverted.com</p>
    </td></tr>
  `);

  return emailClient.sendMarketing({
    to: toEmail,
    subject: hasNumbers
      ? `Your missed calls: ${fmt(atRisk!)} at risk every month`
      : "Your missed-call breakdown from Callverted",
    html,
    // They just clicked "email me this report" — deliver it even if they'd
    // previously unsubscribed. Their unsubscribe still stands for the drip; this
    // is the one-off content they actively requested.
    skipSuppression: true,
  });
}

// ─── Lifecycle: shared value snapshot block ──────────────────────────────────
// A small "here's what Callverted captured for you" stat strip reused by the
// trial-ending, win-back, and monthly recap emails so the value lead is
// consistent across the lifecycle series.

interface LifecycleStats {
  total: number;
  converted: number;
  estimatedRevenue: number; // cents
}

function valueSnapshot(stats: LifecycleStats): string {
  return `
    <tr><td style="padding:4px 24px 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;">
        <tr>
          <td style="padding:14px 18px;width:50%;">
            <p style="margin:0;font-size:11px;font-weight:700;color:#ea580c;text-transform:uppercase;letter-spacing:0.06em;">Leads captured</p>
            <p style="margin:4px 0 0;font-size:26px;font-weight:700;color:#c2410c;">${stats.total}</p>
          </td>
          <td style="padding:14px 18px;width:50%;">
            <p style="margin:0;font-size:11px;font-weight:700;color:#ea580c;text-transform:uppercase;letter-spacing:0.06em;">Pipeline value</p>
            <p style="margin:4px 0 0;font-size:26px;font-weight:700;color:#c2410c;">${fmt(stats.estimatedRevenue / 100)}</p>
          </td>
        </tr>
      </table>
    </td></tr>`;
}

// ─── Trial-ending reminder (day 10 / day 13 / expiry) ────────────────────────
// Idempotency owned by the caller via businesses.trialReminderStage.

export type TrialReminderStage = "trial_day10" | "trial_day13" | "trial_expiry";

interface TrialReminderParams {
  ownerEmail: string;
  ownerName: string;
  businessName: string;
  stage: TrialReminderStage;
  billingUrl: string;
  stats: LifecycleStats;
}

export async function sendTrialReminderEmail({
  ownerEmail,
  ownerName,
  businessName,
  stage,
  billingUrl,
  stats,
}: TrialReminderParams) {
  const firstName = ownerName.split(" ")[0];

  const copy = {
    trial_day10: {
      eyebrow: "Trial update",
      heading: `${firstName}, here's what Callverted captured for you`,
      lede: `You still have a few days left on your free trial. Keep your line live so no missed call slips through.`,
      subject: `Your Callverted trial: here's what we captured`,
    },
    trial_day13: {
      eyebrow: "Trial ending soon",
      heading: `${firstName}, your trial ends tomorrow`,
      lede: `Add your card to keep answering every missed call. You will not be charged until your trial ends, and you can cancel anytime.`,
      subject: `Your Callverted trial ends tomorrow`,
    },
    trial_expiry: {
      eyebrow: "Trial ends today",
      heading: `${firstName}, your trial ends today`,
      lede: `This is the last day of your free trial. Add your card now so your line stays live and you keep every lead below.`,
      subject: `Last day: keep your Callverted line live`,
    },
  }[stage];

  const html = emailWrapper(`
    <tr><td style="height:4px;background:linear-gradient(90deg,#2454d8,#5b8cff);font-size:0;line-height:0;">&nbsp;</td></tr>

    <tr><td style="padding:24px 24px 0 24px;">
      <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;color:#2454d8;text-transform:uppercase;letter-spacing:0.08em;">${copy.eyebrow}</p>
      <h1 style="margin:0 0 6px 0;font-size:22px;font-weight:700;color:#111827;">${copy.heading}</h1>
      <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">${copy.lede}</p>
    </td></tr>

    <tr><td style="height:16px;font-size:0;line-height:0;">&nbsp;</td></tr>
    ${valueSnapshot(stats)}

    <tr><td style="padding:20px 24px 24px 24px;">
      <a href="${billingUrl}" style="display:inline-block;background:#2454d8;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 28px;border-radius:8px;">
        Keep my line live →
      </a>
    </td></tr>
    ${emailFooter(businessName)}
  `);

  await emailClient.send({ to: ownerEmail, subject: copy.subject, html });
}

// ─── Activation nudge (day 1 / day 3 / day 7) ────────────────────────────────
// Idempotency owned by the caller via businesses.activationNudgeStage.

export type ActivationNudgeStage = "activation_day1" | "activation_day3" | "activation_day7";

interface ActivationNudgeParams {
  ownerEmail: string;
  ownerName: string;
  businessName: string;
  stage: ActivationNudgeStage;
  dashboardUrl: string;
}

export async function sendActivationNudgeEmail({
  ownerEmail,
  ownerName,
  businessName,
  stage,
  dashboardUrl,
}: ActivationNudgeParams) {
  const firstName = ownerName.split(" ")[0];
  const testCallUrl = `${dashboardUrl}/test-call`;
  const captureUrl = `${dashboardUrl}/capture`;

  const copy = {
    activation_day1: {
      eyebrow: "Get started",
      heading: `${firstName}, make your first test call`,
      lede: `Hear Callverted answer a call exactly like it will for your customers. It takes about a minute and shows you the lead packet you'll get for every missed call.`,
      ctaLabel: "Make a test call →",
      ctaUrl: testCallUrl,
    },
    activation_day3: {
      eyebrow: "One step to go live",
      heading: `${firstName}, let's get your line live`,
      lede: `Publish your Callverted number on Google and your website, install the widget, or share your intake link. That is the one step between you and never missing a call again.`,
      ctaLabel: "Go live →",
      ctaUrl: captureUrl,
    },
    activation_day7: {
      eyebrow: "Still here to help",
      heading: `${firstName}, your line isn't live yet`,
      lede: `Every missed call is a job that could have gone to a competitor. Finish setup in a couple of minutes and Callverted will start catching them for you.`,
      ctaLabel: "Finish setup →",
      ctaUrl: captureUrl,
    },
  }[stage];

  const html = emailWrapper(`
    <tr><td style="height:4px;background:linear-gradient(90deg,#2454d8,#5b8cff);font-size:0;line-height:0;">&nbsp;</td></tr>

    <tr><td style="padding:24px 24px 0 24px;">
      <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;color:#2454d8;text-transform:uppercase;letter-spacing:0.08em;">${copy.eyebrow}</p>
      <h1 style="margin:0 0 6px 0;font-size:22px;font-weight:700;color:#111827;">${copy.heading}</h1>
      <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">${copy.lede}</p>
    </td></tr>

    <tr><td style="padding:20px 24px 24px 24px;">
      <a href="${copy.ctaUrl}" style="display:inline-block;background:#2454d8;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 28px;border-radius:8px;margin-right:12px;">
        ${copy.ctaLabel}
      </a>
      <a href="${dashboardUrl}" style="display:inline-block;color:#6b7280;text-decoration:none;font-size:13px;font-weight:500;padding:13px 0;">
        Go to dashboard
      </a>
    </td></tr>
    ${emailFooter(businessName)}
  `);

  await emailClient.send({
    to: ownerEmail,
    subject: copy.heading,
    html,
  });
}

// ─── Win-back (post cancel / trial expiry) ───────────────────────────────────
// Idempotency owned by the caller via businesses.winbackSentAt (fires once).

interface WinbackParams {
  ownerEmail: string;
  ownerName: string;
  businessName: string;
  reactivateUrl: string;
  stats: LifecycleStats;
}

export async function sendWinbackEmail({
  ownerEmail,
  ownerName,
  businessName,
  reactivateUrl,
  stats,
}: WinbackParams) {
  const firstName = ownerName.split(" ")[0];
  const hadValue = stats.total > 0;

  const html = emailWrapper(`
    <tr><td style="height:4px;background:linear-gradient(90deg,#2454d8,#5b8cff);font-size:0;line-height:0;">&nbsp;</td></tr>

    <tr><td style="padding:24px 24px 0 24px;">
      <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;color:#2454d8;text-transform:uppercase;letter-spacing:0.08em;">We'd love you back</p>
      <h1 style="margin:0 0 6px 0;font-size:22px;font-weight:700;color:#111827;">${firstName}, your line is off</h1>
      <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">
        ${hadValue
          ? `While Callverted was on, here's what it caught for you. Turn your line back on and pick up right where you left off.`
          : `Turn your line back on and Callverted will answer every call you miss, then send you the lead. Reactivating takes less than a minute.`}
      </p>
    </td></tr>

    ${hadValue ? `<tr><td style="height:16px;font-size:0;line-height:0;">&nbsp;</td></tr>${valueSnapshot(stats)}` : ""}

    <tr><td style="padding:20px 24px 24px 24px;">
      <a href="${reactivateUrl}" style="display:inline-block;background:#2454d8;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 28px;border-radius:8px;">
        Reactivate my line →
      </a>
    </td></tr>
    ${emailFooter(businessName)}
  `);

  await emailClient.sendMarketing({
    to: ownerEmail,
    subject: `${firstName}, reactivate Callverted anytime`,
    html,
  });
}

// ─── Monthly ROI recap ───────────────────────────────────────────────────────
// Idempotency owned by the caller via businesses.monthlyRecapSentFor.

interface MonthlyRoiRecapParams {
  ownerEmail: string;
  ownerName: string;
  businessName: string;
  monthLabel: string; // e.g. "June 2026"
  dashboardUrl: string;
  stats: {
    total: number;
    missedCalls: number;
    converted: number;
    estimatedRevenue: number; // cents
  };
}

export async function sendMonthlyRoiRecapEmail({
  ownerEmail,
  ownerName,
  businessName,
  monthLabel,
  dashboardUrl,
  stats,
}: MonthlyRoiRecapParams) {
  const firstName = ownerName.split(" ")[0];
  const leadsUrl = `${dashboardUrl}/leads`;

  const html = emailWrapper(`
    <tr><td style="padding:20px 24px 16px;background:#2454d8;">
      <p style="margin:0;font-size:11px;font-weight:600;color:rgba(255,255,255,0.8);text-transform:uppercase;letter-spacing:0.05em;">Monthly recap</p>
      <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#ffffff;">${businessName}</p>
      <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.85);">${monthLabel}</p>
    </td></tr>

    <tr><td style="padding:24px 24px 8px 24px;">
      <p style="margin:0;font-size:15px;color:#374151;line-height:1.6;">
        Hi ${firstName}, here's what Callverted recovered for you last month.
      </p>
    </td></tr>

    <tr><td style="padding:8px 24px 4px;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Recovered pipeline value</p>
      <p style="margin:0;font-size:34px;font-weight:700;color:#2454d8;">${fmt(stats.estimatedRevenue / 100)}</p>
    </td></tr>

    <tr><td style="padding:16px 24px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:33%;">
            <p style="margin:0;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Leads</p>
            <p style="margin:4px 0 0;font-size:24px;font-weight:700;color:#111827;">${stats.total}</p>
          </td>
          <td style="width:33%;">
            <p style="margin:0;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Missed calls</p>
            <p style="margin:4px 0 0;font-size:24px;font-weight:700;color:#111827;">${stats.missedCalls}</p>
          </td>
          <td style="width:33%;">
            <p style="margin:0;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Converted</p>
            <p style="margin:4px 0 0;font-size:24px;font-weight:700;color:#16a34a;">${stats.converted}</p>
          </td>
        </tr>
      </table>
    </td></tr>

    <tr><td style="padding:20px 24px 24px;">
      <a href="${leadsUrl}" style="display:inline-block;background:#2454d8;color:#ffffff;font-size:13px;font-weight:600;padding:10px 20px;border-radius:8px;text-decoration:none;">View all leads →</a>
    </td></tr>
    ${emailFooter(businessName)}
  `);

  await emailClient.sendMarketing({
    to: ownerEmail,
    subject: `Your ${monthLabel} recap: ${fmt(stats.estimatedRevenue / 100)} recovered · ${businessName}`,
    html,
  });
}

// ─── Dunning (payment failed) ────────────────────────────────────────────────
// Fires only when real Stripe is live (payment is mocked today, so
// invoice.payment_failed never arrives). Template built now, wired in the
// webhook as fire-and-forget.

interface DunningParams {
  ownerEmail: string;
  ownerName: string;
  businessName: string;
  billingUrl: string;
}

export async function sendDunningEmail({
  ownerEmail,
  ownerName,
  businessName,
  billingUrl,
}: DunningParams) {
  const firstName = ownerName.split(" ")[0];

  const html = emailWrapper(`
    <tr><td style="height:4px;background:#dc2626;font-size:0;line-height:0;">&nbsp;</td></tr>

    <tr><td style="padding:24px 24px 0 24px;">
      <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:0.08em;">Payment failed</p>
      <h1 style="margin:0 0 6px 0;font-size:22px;font-weight:700;color:#111827;">${firstName}, we couldn't process your payment</h1>
      <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">
        Your last Callverted payment didn't go through. Update your card to keep your line live so you don't miss any calls. We'll try again automatically once your card is updated.
      </p>
    </td></tr>

    <tr><td style="padding:20px 24px 24px 24px;">
      <a href="${billingUrl}" style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 28px;border-radius:8px;">
        Update payment method →
      </a>
    </td></tr>
    ${emailFooter(businessName)}
  `);

  await emailClient.send({
    to: ownerEmail,
    subject: `Action needed: update your Callverted payment method`,
    html,
  });
}

// ─── Receipt (payment succeeded) ─────────────────────────────────────────────
// Fires only when real Stripe is live (payment is mocked today). Template built
// now, wired in the webhook as fire-and-forget.

interface ReceiptParams {
  ownerEmail: string;
  ownerName: string;
  businessName: string;
  amountCents: number;
  periodEnd: Date | null; // next billing date
  billingUrl: string;
}

export async function sendReceiptEmail({
  ownerEmail,
  ownerName,
  businessName,
  amountCents,
  periodEnd,
  billingUrl,
}: ReceiptParams) {
  const firstName = ownerName.split(" ")[0];
  const nextBilling = periodEnd
    ? periodEnd.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

  const html = emailWrapper(`
    <tr><td style="padding:24px 24px 0 24px;">
      <p style="margin:0 0 4px 0;font-size:12px;font-weight:600;color:#16a34a;text-transform:uppercase;letter-spacing:0.05em;">Payment received</p>
      <h1 style="margin:0 0 4px 0;font-size:22px;font-weight:700;color:#111827;">Thanks, ${firstName}.</h1>
      <p style="margin:0;font-size:14px;color:#6b7280;">Your Callverted payment went through.</p>
    </td></tr>

    <tr><td style="padding:20px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:10px;">
        <tr><td style="padding:16px 18px;">
          <p style="margin:0 0 4px 0;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Amount</p>
          <p style="margin:0;font-size:26px;font-weight:700;color:#111827;">${fmtDollars(amountCents)}</p>
          ${nextBilling ? `<p style="margin:8px 0 0 0;font-size:12px;color:#9ca3af;">Next billing date: ${nextBilling}</p>` : ""}
        </td></tr>
      </table>
    </td></tr>

    <tr><td style="padding:0 24px 24px 24px;">
      <a href="${billingUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">
        View billing →
      </a>
    </td></tr>
    ${emailFooter(businessName)}
  `);

  await emailClient.send({
    to: ownerEmail,
    subject: `Your Callverted receipt: ${fmtDollars(amountCents)}`,
    html,
  });
}
