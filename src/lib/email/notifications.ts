import { emailClient } from "./email-client";

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
        Powered by CraftCapture &nbsp;·&nbsp; ${businessName}
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
  if (!NOTIFY_EMAIL) return;

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
      subject: `New signup: ${businessName}`,
      html,
    });
  } catch {
    // fire-and-forget — never block onboarding
  }
}

// ─── Painter: welcome email ───────────────────────────────────────────────────

interface WelcomeEmailParams {
  ownerName: string;
  ownerEmail: string;
  businessName: string;
  quoteUrl: string;
}

export async function sendWelcomeEmail({ ownerName, ownerEmail, businessName, quoteUrl }: WelcomeEmailParams) {
  const firstName = ownerName.split(" ")[0];
  const dashboardUrl = `${APP_URL}/dashboard`;
  const helpUrl = `${APP_URL}/dashboard/help`;

  const html = emailWrapper(`
    <tr><td style="padding:24px 24px 0 24px;">
      <h1 style="margin:0 0 4px 0;font-size:22px;font-weight:700;color:#111827;">Welcome to CraftCapture, ${firstName}!</h1>
      <p style="margin:0 0 12px 0;font-size:14px;color:#6b7280;">You're set up. Here's how to start capturing leads.</p>
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:12px 14px;">
        <p style="margin:0;font-size:13px;color:#c2410c;font-weight:600;">One last step before you go live</p>
        <p style="margin:4px 0 0 0;font-size:13px;color:#9a3412;line-height:1.5;">Start your 14-day free trial to activate your quote link — no charge until the 14 days are up. Your link won't accept homeowners until you do.</p>
      </div>
    </td></tr>

    <tr><td style="padding:20px 24px 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">

        <tr><td style="padding:0 0 20px 0;">
          <p style="margin:0 0 10px 0;font-size:13px;font-weight:700;color:#111827;">Your 3 next steps:</p>
          ${[
            ["1. Share your quote link", `Send it to homeowners, add it to your Google Business Profile, and link it from your website or Instagram bio.`],
            ["2. Print your QR code", `Download it from your dashboard and put it on job site signs, truck decals, or leave-behinds. Homeowners scan it on the spot.`],
            ["3. Wait for leads to roll in", `Every time someone fills out your form you'll get an email notification instantly — no manual checking required.`],
          ].map(([title, desc]) => `
            <div style="display:flex;gap:10px;margin-bottom:12px;">
              <div style="flex:1;">
                <p style="margin:0 0 2px 0;font-size:13px;font-weight:600;color:#111827;">${title}</p>
                <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5;">${desc}</p>
              </div>
            </div>`).join("")}
        </td></tr>

        <tr><td style="padding:0 0 20px 0;background:#f9fafb;border-radius:10px;padding:14px;">
          <p style="margin:0 0 6px 0;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Your quote link</p>
          <p style="margin:0 0 10px 0;font-size:13px;font-family:monospace;color:#111827;word-break:break-all;">${quoteUrl}</p>
          <a href="${quoteUrl}" style="font-size:12px;color:#f97316;text-decoration:none;font-weight:600;">Open your form →</a>
        </td></tr>

        <tr><td style="padding:16px 0 0 0;">
          <a href="${dashboardUrl}/billing" style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;margin-right:10px;">
            Start free trial →
          </a>
          <a href="${helpUrl}" style="display:inline-block;color:#6b7280;text-decoration:none;font-size:13px;font-weight:500;padding:12px 0;">
            Read the help guide
          </a>
        </td></tr>

      </table>
    </td></tr>

    <tr><td style="padding:20px 24px 24px 24px;border-top:1px solid #f3f4f6;margin-top:20px;">
      <p style="margin:0;font-size:13px;color:#9ca3af;">
        Questions? Reply to this email or reach us at <a href="mailto:support@craftcapture.com" style="color:#f97316;text-decoration:none;">support@craftcapture.com</a>
      </p>
    </td></tr>
  `);

  return emailClient.send({
    to: ownerEmail,
    subject: `Welcome to CraftCapture — one step left to go live`,
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
      <p style="margin:0;font-size:12px;color:#d1d5db;">Hi ${firstName} — this lead came in via your CraftCapture quote form.</p>
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
