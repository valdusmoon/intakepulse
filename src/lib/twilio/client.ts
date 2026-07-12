import twilio from "twilio";
import { serverEnv } from "@/lib/env";

let _client: twilio.Twilio | null = null;

function getClient(): twilio.Twilio {
  if (!_client) {
    if (!serverEnv.TWILIO_ACCOUNT_SID || !serverEnv.TWILIO_AUTH_TOKEN) {
      throw new Error("Twilio credentials not configured (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN)");
    }
    _client = twilio(serverEnv.TWILIO_ACCOUNT_SID, serverEnv.TWILIO_AUTH_TOKEN);
  }
  return _client;
}

/**
 * Redirect a live, in-progress call to new TwiML by URL.
 * Used for warm transfer — e.g. dialing an urgent-transfer number mid-call.
 */
export async function redirectCall(callSid: string, twimlUrl: string): Promise<void> {
  const client = getClient();
  await client.calls(callSid).update({ url: twimlUrl, method: "POST" });
}

/**
 * Redirect a live, in-progress call directly to inline TwiML (no hosted URL needed).
 * Used by the transfer_call tool to warm-transfer to a business's urgent line.
 */
export async function updateCallWithTwiml(callSid: string, twiml: string): Promise<void> {
  const client = getClient();
  await client.calls(callSid).update({ twiml });
}

/**
 * End a live call immediately.
 */
export async function hangupCall(callSid: string): Promise<void> {
  const client = getClient();
  await client.calls(callSid).update({ status: "completed" });
}

export interface AvailableNumber {
  phoneNumber: string; // E.164, e.g. +15125550123
  friendlyName: string; // Twilio's formatted label, e.g. (512) 555-0123
  locality: string | null;
  region: string | null;
}

/**
 * Search Twilio for available local US voice numbers in an area code.
 * Voice-capable only. Returns up to `limit` numbers (default 5).
 */
export async function searchAvailableNumbers(areaCode: string, limit = 5): Promise<AvailableNumber[]> {
  const client = getClient();
  const results = await client.availablePhoneNumbers("US").local.list({
    areaCode: Number(areaCode),
    voiceEnabled: true,
    limit,
  });
  return results.map((n) => ({
    phoneNumber: n.phoneNumber,
    friendlyName: n.friendlyName,
    locality: n.locality ?? null,
    region: n.region ?? null,
  }));
}

/**
 * Buy a specific number and point its Voice webhook at our handler. Returns the
 * purchased number's E.164 and Twilio SID (PN…). The caller stores both on the
 * business so provisioning is idempotent and the number is releasable on cancel.
 */
export async function purchaseNumber(params: {
  phoneNumber: string;
  voiceUrl: string;
  statusCallbackUrl?: string;
}): Promise<{ phoneNumber: string; sid: string }> {
  const client = getClient();
  const bought = await client.incomingPhoneNumbers.create({
    phoneNumber: params.phoneNumber,
    voiceUrl: params.voiceUrl,
    voiceMethod: "POST",
    ...(params.statusCallbackUrl
      ? { statusCallback: params.statusCallbackUrl, statusCallbackMethod: "POST" as const }
      : {}),
  });
  return { phoneNumber: bought.phoneNumber, sid: bought.sid };
}

/**
 * Release a provisioned number back to Twilio (stops the ~$1/mo rental). Used on
 * cancel (Phase 5) and to clean up test purchases.
 */
export async function releaseNumber(sid: string): Promise<void> {
  const client = getClient();
  await client.incomingPhoneNumbers(sid).remove();
}

/**
 * Escape a string for safe inclusion in TwiML XML.
 */
export function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
