import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  throw new Error("RESEND_API_KEY is not set in environment variables");
}

export const resend = new Resend(resendApiKey);

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

/**
 * Where replies to our mail land. FROM_EMAIL sends from the send.callverted.com
 * subdomain, and that subdomain's only MX points at Resend's bounce handler —
 * no mailbox, nobody reading it. Without an explicit reply-to, a customer who
 * hits reply on a lead alert is talking to a black hole. Route them to the real
 * inbox instead (hello@callverted.com is delivered by Cloudflare Email Routing
 * on the ROOT domain, which is deliberately kept separate from the sending
 * subdomain so Resend's SPF can't collide with the routing SPF).
 */
export const REPLY_TO_EMAIL = process.env.RESEND_REPLY_TO || "hello@callverted.com";
