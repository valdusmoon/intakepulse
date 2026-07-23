import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { verifyTwilioWebhook } from "@/lib/twilio/webhook";
import { getCallByTwilioSid } from "@/lib/db/queries/calls";
import { inngest } from "@/lib/inngest/client";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const maxDuration = 10;

/**
 * POST /api/twilio/stream/status
 *
 * statusCallback for the <Stream> verb — the SAFETY NET for post-call
 * finalization. The voice WebSocket hands off finalization itself while the
 * call is live, but a caller who hangs up mid-call leaves only the WS-close
 * path, and the platform freezes outbound HTTP there (observed in prod: DB
 * writes landed, the Inngest event never went out, lead left unscored).
 *
 * This is an ordinary inbound HTTP request from Twilio with a normal function
 * lifetime, so it always completes. finalizeVoiceCall is idempotent — an
 * already-scored lead and an existing summary are both skipped — so firing here
 * on top of the live hand-off is harmless.
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const requestUrl = `${env.APP_URL}${url.pathname}`;

  const { params, valid } = await verifyTwilioWebhook(req, requestUrl);
  if (!valid) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  const callSid = params.CallSid;
  const streamEvent = params.StreamEvent; // stream-started | stream-stopped | stream-error

  // Only the end of the stream matters here.
  if (streamEvent !== "stream-stopped" && streamEvent !== "stream-error") {
    return NextResponse.json({ ok: true });
  }

  const call = await getCallByTwilioSid(callSid);
  if (!call) {
    logger.warn("stream/status: no call record found", { callSid, streamEvent });
    return NextResponse.json({ ok: true });
  }

  try {
    await inngest.send({
      name: "call/voice.ended",
      data: { callId: call.id, businessId: call.businessId },
    });
    logger.info("stream/status: finalization enqueued", { callSid, callId: call.id, streamEvent });
  } catch (error) {
    logger.error("stream/status: failed to enqueue finalization", {
      callSid,
      callId: call.id,
      error: String(error),
    });
  }

  return NextResponse.json({ ok: true });
}
