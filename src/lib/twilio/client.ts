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
