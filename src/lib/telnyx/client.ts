import { serverEnv } from "@/lib/env";

const BASE = "https://api.telnyx.com/v2";

function headers() {
  return {
    Authorization: `Bearer ${serverEnv.TELNYX_API_KEY}`,
    "Content-Type": "application/json",
  };
}

/**
 * Forward an active incoming call to another phone number.
 * Called immediately on call.initiated so the caller hears ringing.
 * If the forwarding number doesn't answer, Telnyx fires call.hangup.
 */
export async function transferCall(callControlId: string, to: string): Promise<void> {
  const res = await fetch(`${BASE}/calls/${callControlId}/actions/transfer`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ to }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Telnyx transfer failed (${res.status}): ${text}`);
  }
}

/**
 * Send an outbound SMS via Telnyx messaging.
 * Returns the Telnyx message ID for tracking delivery status.
 */
export async function sendSmsMessage(
  from: string,
  to: string,
  text: string
): Promise<string> {
  const res = await fetch(`${BASE}/messages`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ from, to, text }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Telnyx SMS failed (${res.status}): ${errText}`);
  }

  const json = await res.json();
  return json.data?.id ?? "";
}
