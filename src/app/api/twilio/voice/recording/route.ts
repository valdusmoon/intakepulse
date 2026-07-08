import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { verifyTwilioWebhook } from "@/lib/twilio/webhook";
import { getCallByTwilioSid, updateCall } from "@/lib/db/queries/calls";
import { recordProcessedEvent } from "@/lib/db/queries/providerWebhookEvents";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const maxDuration = 10;

/**
 * POST /api/twilio/voice/recording
 *
 * recordingStatusCallback for the business-line Dial leg. Idempotent — Twilio can
 * redeliver the same event, so we ledger by RecordingSid before writing.
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const requestUrl = `${env.APP_URL}${url.pathname}`;

  const { params, valid } = await verifyTwilioWebhook(req, requestUrl);
  if (!valid) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  const callSid = params.CallSid;
  const recordingSid = params.RecordingSid;
  const recordingUrl = params.RecordingUrl;

  if (!recordingSid) {
    return NextResponse.json({ ok: true });
  }

  const isNew = await recordProcessedEvent({
    provider: "twilio",
    providerEventId: recordingSid,
    eventType: "recording.completed",
    payload: params,
  });

  if (!isNew) {
    logger.debug("Duplicate recording callback ignored", { recordingSid });
    return NextResponse.json({ ok: true });
  }

  const call = await getCallByTwilioSid(callSid);
  if (!call) {
    logger.warn("recording callback: no call record found", { callSid });
    return NextResponse.json({ ok: true });
  }

  await updateCall(call.id, { recordingUrl });
  logger.info("Recording stored", { callSid, callId: call.id });

  return NextResponse.json({ ok: true });
}
