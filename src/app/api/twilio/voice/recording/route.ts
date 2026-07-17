import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { verifyTwilioWebhook } from "@/lib/twilio/webhook";
import { getCallByTwilioSid } from "@/lib/db/queries/calls";
import { recordProcessedEvent } from "@/lib/db/queries/providerWebhookEvents";
import { inngest } from "@/lib/inngest/client";
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

  if (!recordingUrl) {
    logger.warn("recording callback: no RecordingUrl", { callSid, recordingSid });
    return NextResponse.json({ ok: true });
  }

  const call = await getCallByTwilioSid(callSid);
  if (!call) {
    logger.warn("recording callback: no call record found", { callSid });
    return NextResponse.json({ ok: true });
  }

  // Kick off the async post-call pipeline (download → Whisper → extract → lead →
  // delete audio). Return the 200 fast; Twilio only needs the acknowledgement.
  //
  // Runner A (ACTIVE) — durable, retryable Inngest job.
  await inngest.send({
    name: "call/human-recording.completed",
    data: { callId: call.id, businessId: call.businessId, recordingSid, recordingUrl },
  });

  // Runner B (COMMENTED OUT) — inline via Next `after()`. Simpler (no Inngest),
  // but NO retries: a transient Whisper/OpenAI failure silently drops this call's
  // transcript + lead. To swap, comment out the inngest.send above and uncomment
  // the import + call below (imports go at the top of the file):
  //   import { after } from "next/server";
  //   import { processHumanCall } from "@/lib/leads/process-human-call";
  //   after(() => processHumanCall({ callId: call.id, businessId: call.businessId, recordingSid, recordingUrl }));

  logger.info("recording: enqueued human-call processing", { callSid, callId: call.id, recordingSid });
  return NextResponse.json({ ok: true });
}
