import crypto from "crypto";
import { serverEnv } from "@/lib/env";

const TOKEN_TTL_SECONDS = 120; // stream connects within seconds of TwiML being returned

/**
 * Sign a short-lived token authorizing the Media Stream WebSocket upgrade for a
 * specific call. The wss:// upgrade request has no Twilio request signature, so
 * this token is the only thing preventing an arbitrary client from opening the
 * stream and impersonating a call.
 */
export function createStreamToken(callSid: string): string {
  const secret = serverEnv.VOICE_STREAM_TOKEN_SECRET;
  if (!secret) {
    throw new Error("VOICE_STREAM_TOKEN_SECRET is not configured");
  }

  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const payload = `${callSid}.${exp}`;
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("base64url");

  return `${payload}.${signature}`;
}

/**
 * Verify a stream token and return the callSid it authorizes, or null if invalid/expired.
 */
export function verifyStreamToken(token: string): { callSid: string } | null {
  const secret = serverEnv.VOICE_STREAM_TOKEN_SECRET;
  if (!secret) {
    console.error("[voice] VOICE_STREAM_TOKEN_SECRET is not configured — rejecting stream token");
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [callSid, expStr, signature] = parts;
  const payload = `${callSid}.${expStr}`;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("base64url");

  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Math.floor(Date.now() / 1000) > exp) {
    return null;
  }

  return { callSid };
}
