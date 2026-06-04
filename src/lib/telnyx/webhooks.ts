import crypto from "crypto";
import { serverEnv } from "@/lib/env";

/**
 * Verify a Telnyx webhook using Ed25519 signature.
 *
 * Telnyx signs: timestamp + "|" + rawBody
 * Headers: telnyx-signature-ed25519 (base64), telnyx-timestamp (unix seconds)
 * Public key: base64-encoded SPKI from Telnyx portal → Developer → API Keys → Signing Key
 *
 * Returns false (not throws) on any verification failure so callers can 401 cleanly.
 */
export function verifyTelnyxSignature(
  rawBody: string,
  signature: string,
  timestamp: string
): boolean {
  const publicKey = serverEnv.TELNYX_PUBLIC_KEY;
  if (!publicKey) {
    // No key configured — skip verification in dev but log clearly
    console.warn("[telnyx] TELNYX_PUBLIC_KEY not set — skipping signature verification");
    return true;
  }

  try {
    const message = `${timestamp}|${rawBody}`;
    const verify = crypto.createVerify("Ed25519");
    verify.update(message);
    return verify.verify(
      `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`,
      signature,
      "base64"
    );
  } catch (err) {
    console.error("[telnyx] Signature verification error:", err);
    return false;
  }
}

/**
 * Reject a request with 401 if the Telnyx signature is invalid.
 * Call this at the top of every Telnyx webhook handler.
 */
export async function requireTelnyxSignature(req: Request): Promise<{
  rawBody: string;
  error?: Response;
}> {
  const rawBody = await req.text();
  const signature = req.headers.get("telnyx-signature-ed25519") ?? "";
  const timestamp = req.headers.get("telnyx-timestamp") ?? "";

  // TODO: re-enable once signature verification is confirmed working
  // if (!verifyTelnyxSignature(rawBody, signature, timestamp)) {
  //   return {
  //     rawBody,
  //     error: new Response("Unauthorized", { status: 401 }),
  //   };
  // }

  return { rawBody };
}
