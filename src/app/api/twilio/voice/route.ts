import { NextResponse } from "next/server";
import { env, serverEnv } from "@/lib/env";
import { verifyTwilioWebhook } from "@/lib/twilio/webhook";
import { generateDialTwiml, generateErrorTwiml, generateStreamTwiml } from "@/lib/twilio/twiml";
import { createStreamToken } from "@/lib/twilio/stream-token";
import { getBusinessByTwilioNumber } from "@/lib/db/queries/businesses";
import { createCall, updateCall } from "@/lib/db/queries/calls";
import { normalizePhone } from "@/lib/utils/phone-validation";
import { hasPaymentOnFile } from "@/lib/subscription";
import { CALL_RING_TIMEOUT_SECONDS } from "@/lib/voice/config/constants";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const maxDuration = 20;

/**
 * POST /api/twilio/voice
 *
 * Twilio's Voice webhook for an inbound call. Rings the business's real line first
 * (overflowMode='ring_then_ai', the default); the AI overflow receptionist only takes
 * over if the business doesn't answer (see /api/twilio/voice/status). If the business
 * hasn't configured a forwarding number, or overflowMode='ai_immediate', the AI answers
 * immediately.
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
    const callerNumber = params.From;
    const calledNumber = params.To;

    logger.info("Twilio inbound call", { callSid, calledNumber });

    if (serverEnv.EMERGENCY_DISABLE_CALLS) {
      logger.error("EMERGENCY_DISABLE_CALLS is set — rejecting call", { callSid });
      return xml(generateErrorTwiml(
        "We're sorry, this service is temporarily unavailable. Please try again later."
      ));
    }

    const normalizedTo = normalizePhone(calledNumber) ?? calledNumber;
    const business = await getBusinessByTwilioNumber(normalizedTo);

    if (!business) {
      logger.warn("No business found for called number", { calledNumber: normalizedTo });
      return xml(generateErrorTwiml(
        "We're sorry, this phone number is not configured. Please contact support."
      ));
    }

    // Operator-only kill switch, set directly in the DB. There is no self-serve
    // pause: it promised "no charge while paused" that nothing implemented.
    if (business.isPaused) {
      logger.warn("Business is paused, rejecting call", { businessId: business.id });
      return xml(generateErrorTwiml(
        "We're sorry, this service is temporarily unavailable. Please contact the business directly."
      ));
    }

    // Payment-on-file gate: the live line only answers for an active sub or a
    // trial that hasn't expired. This checks trialEndsAt (not just status), so
    // a lapsed trial can no longer route real, cost-bearing calls.
    if (!hasPaymentOnFile(business)) {
      logger.warn("Business has no payment on file — rejecting call", {
        businessId: business.id,
        subscriptionStatus: business.subscriptionStatus,
      });
      return xml(generateErrorTwiml(
        "We're sorry, this service is currently unavailable. Please contact the business directly."
      ));
    }

    const normalizedFrom = normalizePhone(callerNumber) ?? callerNumber;

    const call = await createCall({
      businessId: business.id,
      twilioCallSid: callSid,
      callerPhone: normalizedFrom,
      calledNumber: normalizedTo,
      status: "ringing",
      outcome: "in_progress",
      rawPayload: params,
    });

    // AI answers immediately if configured that way, or if there's nowhere to ring first
    const shouldRingBusinessFirst = business.overflowMode !== "ai_immediate" && !!business.forwardingNumber;

    if (!shouldRingBusinessFirst) {
      // Mark the AI as handling this call up front. aiHandled is the single "the AI took
      // this call" signal across both entry paths (here for ai_immediate / no-forwarding,
      // and the Dial-status overflow branch); the "Caller completion" metric divides by it,
      // so it must be set here too or immediate-AI businesses show a permanently blank rate.
      await updateCall(call.id, { aiHandled: true, overflowStartedAt: new Date() });
      return await handOffToAi(callSid, business.id);
    }

    const statusUrl = `${env.APP_URL}/api/twilio/voice/status`;
    const recordingStatusCallbackUrl = `${env.APP_URL}/api/twilio/voice/recording`;
    // Record the human-answered leg only when recording is enabled AND a disclosure
    // is set — the disclosure is then spoken before the team is dialed. Never record
    // without a spoken notice.
    const recordHumanLeg = business.recordingEnabled && !!business.recordingDisclosure;
    return xml(generateDialTwiml({
      forwardingNumber: business.forwardingNumber!,
      timeoutSeconds: CALL_RING_TIMEOUT_SECONDS,
      actionUrl: statusUrl,
      disclosure: recordHumanLeg ? business.recordingDisclosure : null,
      recordHumanLeg,
      recordingStatusCallbackUrl,
    }));
  } catch (error) {
    logger.error("Error handling Twilio voice webhook", { error: String(error) });
    return xml(generateErrorTwiml("We're sorry, an unexpected error occurred. Please try again later."));
  }
}

async function handOffToAi(callSid: string, businessId: string): Promise<NextResponse> {
  if (!serverEnv.VOICE_STREAM_WSS_URL) {
    logger.error("VOICE_STREAM_WSS_URL not configured — cannot hand off to AI", { callSid, businessId });
    return xml(generateErrorTwiml("We're sorry, this service is temporarily unavailable."));
  }

  const token = createStreamToken(callSid);
  return xml(generateStreamTwiml({
    wssUrl: serverEnv.VOICE_STREAM_WSS_URL,
    callSid,
    token,
    statusCallbackUrl: `${env.APP_URL}/api/twilio/stream/status`,
    // Teardown guard: when the stream WS closes, Twilio runs a 1s <Pause> then
    // <Hangup/> instead of dropping the call at the instant of socket close —
    // gives the goodbye's audio tail time to clear carrier-side buffers.
    actionUrl: `${env.APP_URL}/api/twilio/voice/after-stream`,
  }));
}

function xml(body: string): NextResponse {
  return new NextResponse(body, { status: 200, headers: { "Content-Type": "text/xml" } });
}
