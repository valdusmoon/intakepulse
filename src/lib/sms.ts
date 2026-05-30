import { sendSmsMessage } from "./telnyx/client";

// Kill switch — set SMS_FEATURE_ENABLED=true once Telnyx is fully configured
const SMS_ENABLED = process.env.SMS_FEATURE_ENABLED === "true";

export function formatPhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

/**
 * Send an SMS from a business's Telnyx number to a prospect.
 * `from` is the business's provisioned Telnyx number (E.164 format).
 * No-ops with a log if SMS_FEATURE_ENABLED is not "true".
 */
export async function sendSms(from: string, to: string, body: string): Promise<string | null> {
  if (!SMS_ENABLED) {
    console.log(`[SMS disabled] from=${from} to=${to}: ${body}`);
    return null;
  }

  const toFormatted = formatPhone(to);
  if (!toFormatted) {
    console.warn(`[SMS] Invalid recipient phone: ${to}`);
    return null;
  }

  const messageId = await sendSmsMessage(from, toFormatted, body);
  return messageId;
}

// ─── Message templates ────────────────────────────────────────────────────────

export function smsMissedCallRecovery(businessName: string, intakeUrl: string): string {
  return `Hi! Sorry we missed your call at ${businessName}. Answer a few quick questions so we can help faster: ${intakeUrl}`;
}

export function smsFollowup(businessName: string, intakeUrl: string): string {
  return `Following up from ${businessName} — we still want to help. Takes 2 min: ${intakeUrl}`;
}
