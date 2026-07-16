import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  throw new Error("RESEND_API_KEY is not set in environment variables");
}

export const resend = new Resend(resendApiKey);

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
