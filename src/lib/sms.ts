// SMS provider will be replaced with Telnyx in Session 3.
// Kill switch pattern preserved — set SMS_FEATURE_ENABLED=true when Telnyx is wired up.

const SMS_ENABLED = process.env.SMS_FEATURE_ENABLED === "true";

function formatPhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

/**
 * Send an SMS from the IntakePulse business number to a prospect or owner.
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

  // Telnyx implementation added in Session 3
  console.warn("[SMS] Telnyx provider not yet configured");
}

// ─── Message templates ────────────────────────────────────────────────────────

export function smsMissedCallRecovery(businessName: string, intakeUrl: string): string {
  return `Hi! Sorry we missed your call at ${businessName}. Can you answer a few quick questions so we can help faster? ${intakeUrl}`;
}

export function smsFollowup(businessName: string, intakeUrl: string): string {
  return `Following up from ${businessName} — we still want to help. Takes 2 minutes: ${intakeUrl}`;
}
