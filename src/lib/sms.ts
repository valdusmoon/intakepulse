import twilio from "twilio";

// Master kill switch — set SMS_FEATURE_ENABLED=true in env when ready
const SMS_ENABLED = process.env.SMS_FEATURE_ENABLED === "true";

function formatPhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

function getClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) throw new Error("Twilio credentials not configured");
  return twilio(sid, token);
}

/**
 * Send an SMS from the CraftCapture notifications number to a painter's phone.
 * Silently no-ops if SMS_FEATURE_ENABLED is not "true".
 */
export async function sendSms(to: string, body: string): Promise<void> {
  if (!SMS_ENABLED) {
    console.log(`[SMS disabled] Would send to ${to}: ${body}`);
    return;
  }

  const phone = formatPhone(to);
  if (!phone) {
    console.warn(`[SMS] Invalid phone number: ${to}`);
    return;
  }

  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!from) {
    console.warn("[SMS] TWILIO_PHONE_NUMBER not set");
    return;
  }

  try {
    const client = getClient();
    await client.messages.create({ body, from, to: phone });
  } catch (err) {
    // Log but never throw — SMS failure should never break the main flow
    console.error("[SMS] Failed to send:", err);
  }
}

// ─── Message templates ────────────────────────────────────────────────────────

export function smsNewLead(name: string, phone: string): string {
  return `New lead: ${name} (${phone}). Log in to CraftCapture to follow up.`;
}

export function smsScheduleConfirmed(name: string, date: string): string {
  return `Job scheduled: ${name} on ${date}.`;
}

export function smsQuoteResponded(name: string, action: "accepted" | "declined"): string {
  return `Quote ${action}: ${name} has ${action} their quote. Log in to CraftCapture.`;
}

export function smsContractSigned(name: string): string {
  return `Contract signed: ${name} just signed their contract. Log in to CraftCapture.`;
}
