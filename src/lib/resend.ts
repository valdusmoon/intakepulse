import { Resend } from "resend";

let _resend: Resend | null = null;

/**
 * Lazily construct the Resend client. The API key is read and validated on first
 * send, NEVER at module load. A top-level throw here crashes `next build`'s
 * page-data collection for every route that transitively imports this file
 * whenever RESEND_API_KEY isn't in that environment's scope (e.g. preview
 * deploys, or a prod env rotation) — a missing email key should fail an email
 * send, not the whole build. Mirrors the lazy getClient() in lib/twilio/client.
 */
export function getResend(): Resend {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not set in environment variables");
    }
    _resend = new Resend(apiKey);
  }
  return _resend;
}

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

/**
 * Where replies to our mail land. FROM_EMAIL is an unmonitored sender, so
 * without an explicit reply-to a customer hitting reply on a lead alert would
 * be writing to nobody. Point them at an inbox a human actually reads; that
 * inbox is delivered by Cloudflare Email Routing, which is receive-only and
 * entirely separate from Resend's sending path.
 *
 * Note we send from the ROOT domain (callverted.com), not a subdomain. Resend
 * never asks for a root SPF record — it puts SPF/MX on its own MAIL FROM
 * subdomain (send.callverted.com) and DKIM at resend._domainkey — so the root's
 * Cloudflare Email Routing SPF is untouched and inbound mail keeps working. The
 * tradeoff accepted here is reputation: automated mail shares callverted.com's
 * sending reputation with human mail rather than isolating it on a subdomain.
 */
export const REPLY_TO_EMAIL = process.env.RESEND_REPLY_TO || "hello@callverted.com";
