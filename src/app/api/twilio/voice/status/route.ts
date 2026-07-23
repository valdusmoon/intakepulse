import { NextResponse } from "next/server";
import { env, serverEnv } from "@/lib/env";
import { verifyTwilioWebhook } from "@/lib/twilio/webhook";
import { generateErrorTwiml, generateStreamTwiml } from "@/lib/twilio/twiml";
import { createStreamToken } from "@/lib/twilio/stream-token";
import { getCallByTwilioSid, updateCall } from "@/lib/db/queries/calls";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const maxDuration = 20;

const OVERFLOW_STATUSES = new Set(["no-answer", "busy", "failed"]);

/**
 * POST /api/twilio/voice/status
 *
 * <Dial action> callback — fires once the business-line leg finishes. Decides whether
 * the business answered (call already over, nothing more to do) or the AI overflow
 * receptionist should take over (no-answer/busy/failed), or the caller abandoned the
 * call before anyone answered (canceled — also nothing more to do).
 */
export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const requestUrl = `${env.APP_URL}${url.pathname}`;

    const { params, valid } = await verifyTwilioWebhook(req, requestUrl);
    if (!valid) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const callSid = params.CallSid;
    const dialCallStatus = params.DialCallStatus;

    logger.info("Twilio dial status", { callSid, dialCallStatus });

    const call = await getCallByTwilioSid(callSid);
    if (!call) {
      logger.warn("voice/status: no call record found", { callSid });
      return empty();
    }

    if (dialCallStatus === "completed") {
      await updateCall(call.id, {
        status: "answered",
        outcome: "business_answered",
        answeredAt: new Date(),
        businessAnsweredAt: new Date(),
        endedAt: new Date(),
      });
      return empty();
    }

    if (!OVERFLOW_STATUSES.has(dialCallStatus)) {
      // 'canceled' (caller hung up while ringing) or an unrecognized status — nothing to overflow to
      await updateCall(call.id, {
        status: "missed",
        outcome: "abandoned",
        missedAt: new Date(),
        endedAt: new Date(),
      });
      return empty();
    }

    // no-answer / busy / failed — hand off to the AI overflow receptionist
    await updateCall(call.id, {
      overflowStartedAt: new Date(),
      aiHandled: true,
    });

    if (!serverEnv.VOICE_STREAM_WSS_URL) {
      logger.error("VOICE_STREAM_WSS_URL not configured — cannot overflow to AI", { callSid });
      return xml(generateErrorTwiml("We're sorry, this service is temporarily unavailable."));
    }

    const token = createStreamToken(callSid);
    return xml(generateStreamTwiml({
      wssUrl: serverEnv.VOICE_STREAM_WSS_URL,
      callSid,
      token,
      statusCallbackUrl: `${env.APP_URL}/api/twilio/stream/status`,
    }));
  } catch (error) {
    logger.error("Error handling Twilio dial status webhook", { error: String(error) });
    return xml(generateErrorTwiml("We're sorry, an unexpected error occurred."));
  }
}

function xml(body: string): NextResponse {
  return new NextResponse(body, { status: 200, headers: { "Content-Type": "text/xml" } });
}

function empty(): NextResponse {
  return xml(`<?xml version="1.0" encoding="UTF-8"?><Response/>`);
}
