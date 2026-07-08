import twilio from "twilio";
import { serverEnv } from "@/lib/env";

/**
 * Verify that a webhook request actually came from Twilio.
 *
 * Twilio signs the exact public URL it called plus the sorted POST params.
 * Behind a proxy (Vercel), `request.url` can differ from the URL Twilio actually
 * requested — build the URL from APP_URL + pathname rather than trusting request.url
 * if the two ever diverge in production.
 */
export function validateTwilioSignature(
  url: string,
  signature: string | null,
  params: Record<string, string>
): boolean {
  const authToken = serverEnv.TWILIO_AUTH_TOKEN;

  if (!authToken) {
    console.error("[twilio] Missing TWILIO_AUTH_TOKEN — cannot validate signature");
    return false;
  }

  if (!signature) {
    console.error("[twilio] Missing X-Twilio-Signature header");
    return false;
  }

  const isValid = twilio.validateRequest(authToken, signature, url, params);

  if (!isValid) {
    console.error("[twilio] Invalid signature — possible spoofed request", { url });
  }

  return isValid;
}

/**
 * Whether webhook signature validation should run.
 * Skippable only via explicit dev-only env flag (e.g. for local ngrok testing).
 */
export function shouldValidateWebhook(): boolean {
  return !serverEnv.SKIP_TWILIO_VALIDATION;
}

/**
 * Parse a Twilio webhook POST body (application/x-www-form-urlencoded) into a
 * flat string map, and validate its signature in one step.
 *
 * `requestUrl` should be the exact public URL Twilio invoked (APP_URL + pathname),
 * not request.url, since Vercel's proxy can rewrite the latter.
 */
export async function verifyTwilioWebhook(
  req: Request,
  requestUrl: string
): Promise<{ params: Record<string, string>; valid: boolean }> {
  const formData = await req.formData();
  const params: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    params[key] = String(value);
  }

  if (!shouldValidateWebhook()) {
    return { params, valid: true };
  }

  const signature = req.headers.get("x-twilio-signature");
  const valid = validateTwilioSignature(requestUrl, signature, params);
  return { params, valid };
}
