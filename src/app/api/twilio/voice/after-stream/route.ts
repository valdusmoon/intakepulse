import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { verifyTwilioWebhook } from "@/lib/twilio/webhook";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const maxDuration = 10;

/**
 * POST /api/twilio/voice/after-stream
 *
 * The <Connect action> continuation for the AI media stream. Twilio requests
 * this the moment our stream WebSocket closes, and the TwiML returned here is
 * what actually ends the call.
 *
 * This exists to fix the clipped goodbye: without an action, the TwiML document
 * ended at WS close and Twilio hung up at that exact instant — but Twilio's
 * mark echo only proves TWILIO finished emitting the audio into the call, not
 * that the tail cleared the carrier/mobile buffers between Twilio and the
 * caller's ear. The 1-second <Pause> hands that tail a Twilio-owned grace
 * window (normal end-of-call silence) before <Hangup/>. If the caller already
 * hung up, this TwiML has nothing to run against and is harmless.
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const requestUrl = `${env.APP_URL}${url.pathname}`;

  const { params, valid } = await verifyTwilioWebhook(req, requestUrl);
  if (!valid) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  // Part of the goodbye diagnostics: this line proves Twilio ran the teardown
  // guard for the call (pair it with the stream route's "goodbye diagnostics").
  logger.info("after-stream: serving teardown pause + hangup", {
    callSid: params.CallSid,
  });

  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Pause length="1"/>
  <Hangup/>
</Response>`,
    { status: 200, headers: { "Content-Type": "text/xml" } },
  );
}
