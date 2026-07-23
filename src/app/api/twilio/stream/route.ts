import { experimental_upgradeWebSocket, type WebSocket, type WebSocketData } from "@vercel/functions";
import { verifyStreamToken } from "@/lib/twilio/stream-token";
import { getCallByTwilioSid } from "@/lib/db/queries/calls";
import { inngest } from "@/lib/inngest/client";
import { buildFlowContext, createSession, endCall, initializeOpenAI, loadBusinessCallData } from "@/lib/voice/call-manager";
import { captureLeadOnce, deriveIntakeStatus } from "@/lib/voice/functions/actions";
import { OpenAIHandlerService } from "@/lib/voice/openai-handler.service";
import type { RealtimeClient } from "@/lib/voice/realtime-client";
import type { FlowContext } from "@/lib/voice/state-machine/types";
import * as engine from "@/lib/voice/state-machine/engine";
import { TIMEOUTS } from "@/lib/voice/config/constants";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
// Vercel Hobby hard-caps this at 300s regardless of this value; Pro/Enterprise
// can raise it. The state machine's short, bounded flow should end calls well
// before this fires in practice.
export const maxDuration = 300;

const openaiHandler = new OpenAIHandlerService();

/**
 * GET /api/twilio/stream
 *
 * Twilio Media Stream WebSocket endpoint — the AI overflow receptionist's audio
 * bridge to OpenAI Realtime. Reached only via the <Connect><Stream> TwiML returned
 * by /api/twilio/voice or /api/twilio/voice/status.
 *
 * The auth token can't be verified pre-upgrade via a URL query param — Twilio's
 * Media Streams client doesn't support query strings on the <Stream> url (error
 * 31920). It's delivered as a <Parameter> instead, which only arrives in the
 * "start" event after the WS connection is already open — so verification happens
 * there instead, in handleStreamStart.
 */
export async function GET(_req: Request) {
  return experimental_upgradeWebSocket((ws) => {
    handleConnection(ws);
  });
}

function handleConnection(ws: WebSocket): void {
  let initialized = false;

  ws.on("message", async (message: WebSocketData) => {
    try {
      const data = JSON.parse(message.toString());

      if (!initialized && data.event === "start") {
        initialized = await handleStreamStart(data, ws);
        return;
      }

      if (!initialized) return;

      const openaiClient = (ws as any).openaiClient as RealtimeClient | undefined;
      const ctx = (ws as any).ctx as FlowContext | undefined;
      if (!openaiClient || !ctx) return;

      if (data.event === "media") {
        ctx.session.latestMediaTimestamp = data.media.timestamp;
        openaiClient.sendAudio(data.media.payload); // μ-law passthrough, no conversion needed
      } else if (data.event === "dtmf") {
        await engine.handleDtmf(ctx, openaiClient, ws, data.dtmf.digit);
      } else if (data.event === "stop") {
        await cleanupConnection(ws);
      }
    } catch (error) {
      logger.error("Error processing stream message", { error: String(error) });
    }
  });

  ws.on("error", (error) => {
    logger.error("Stream WebSocket error", { error: String(error) });
  });

  ws.on("close", async () => {
    await cleanupConnection(ws);
  });
}

async function handleStreamStart(data: any, ws: WebSocket): Promise<boolean> {
  const callSid: string | undefined = data.start?.customParameters?.callSid;
  const token: string | undefined = data.start?.customParameters?.token;

  if (!callSid || !token) {
    logger.error("Stream start missing callSid or token", { callSid, hasToken: !!token });
    ws.close(1008, "Missing callSid or token");
    return false;
  }

  const verified = verifyStreamToken(token);
  if (!verified || verified.callSid !== callSid) {
    logger.error("Stream start token invalid or callSid mismatch", { callSid });
    ws.close(1008, "Invalid token or callSid mismatch");
    return false;
  }

  try {
    const call = await getCallByTwilioSid(callSid);
    if (!call) {
      logger.error("No call record for callSid", { callSid });
      ws.close(1008, "Call not found");
      return false;
    }

    const business = await loadBusinessCallData(call.businessId, call.callerPhone);
    if (!business) {
      logger.error("No business found for call", { callSid, businessId: call.businessId });
      ws.close(1008, "Business not found");
      return false;
    }

    const session = createSession({
      callSid,
      callId: call.id,
      businessId: business.id,
      businessName: business.businessName,
      callerPhone: call.callerPhone,
    });
    session.streamSid = data.start.streamSid;

    const ctx = await buildFlowContext(business, session, () => {
      // The state machine signals completion; we own the actual WS lifecycle.
      setTimeout(() => ws.close(1000, "Conversation complete"), TIMEOUTS.GOODBYE_DELAY);
    });
    if (!ctx) {
      ws.close(1011, "No vertical configuration for this business");
      return false;
    }

    // Voice is a fixed product default (OPENAI_CONFIG.VOICE) — no longer
    // per-business, so we ignore the stored voiceName.
    const openaiClient = await initializeOpenAI();
    // Caller must speak within 30s of the greeting FINISHING (bot-spam prevention).
    // Armed on the first response.done, not at connection-open — arming it immediately
    // ate into the caller's real response window by however long the (business-configurable)
    // greeting took to actually speak, which could be 20s+ on its own.
    openaiHandler.setupEventHandlers(openaiClient, ws, ctx, () => {
      session.silenceTimeout = setTimeout(() => {
        logger.info("No caller speech within 30s of greeting — ending call", { correlationId: session.correlationId });
        ws.close(1000, "No speech detected");
      }, TIMEOUTS.INITIAL_SILENCE);
    });

    (ws as any).openaiClient = openaiClient;
    (ws as any).ctx = ctx;

    // Soft cap — at 3 min, gracefully switch to closing rather than let a rambling
    // or stuck call run to the hard cap. Routes into the engine's normal close path
    // (gated on responseActive so it queues behind an in-flight turn).
    (ws as any).gracefulTimer = setTimeout(() => {
      logger.info("Graceful-close soft cap reached — wrapping up", {
        correlationId: session.correlationId,
      });
      void engine.requestGracefulClose(ctx, openaiClient);
    }, TIMEOUTS.GRACEFUL_CLOSE_DURATION);

    // Hard safety cap — see constants.ts for why this sits under Vercel's 300s ceiling
    (ws as any).safetyTimer = setTimeout(() => {
      logger.warn("Call duration limit reached — forcing disconnect", {
        correlationId: session.correlationId,
      });
      ws.close(1000, "Maximum call duration reached");
    }, TIMEOUTS.MAX_CALL_DURATION);

    engine.startCall(ctx, openaiClient);

    return true;
  } catch (error) {
    logger.error("Failed to initialize call", { callSid, error: String(error) });
    ws.close(1011, "Initialization failed");
    return false;
  }
}

async function cleanupConnection(ws: WebSocket): Promise<void> {
  if ((ws as any).cleanupDone) return;
  (ws as any).cleanupDone = true;

  const ctx = (ws as any).ctx as FlowContext | undefined;
  const openaiClient = (ws as any).openaiClient as RealtimeClient | undefined;
  const safetyTimer = (ws as any).safetyTimer as NodeJS.Timeout | undefined;
  const gracefulTimer = (ws as any).gracefulTimer as NodeJS.Timeout | undefined;

  if (safetyTimer) clearTimeout(safetyTimer);
  if (gracefulTimer) clearTimeout(gracefulTimer);
  if (ctx?.session.silenceTimeout) clearTimeout(ctx.session.silenceTimeout);
  if (openaiClient) openaiClient.close();

  // Everything below runs inside the platform's post-close grace window, so it
  // is strictly FAST DB writes + one event send — the heavy tail (scoring,
  // assessment, notifications, summary) happens in the durable
  // finalize-voice-call Inngest job. A GPT round-trip in this window has been
  // observed getting frozen mid-write in prod (lead created but never scored,
  // call stuck "ringing", no transcript).

  // Caller hung up before reaching the confirmation state (which normally runs
  // captureLead itself) — save whatever we already collected instead of losing
  // it: a call with any real intake progress, or a message-path call that gave a
  // name or a reason. Calls with zero engagement (dead air) and screened junk
  // create nothing, as before.
  if (ctx && !ctx.session.leadId && !ctx.session.screened && !ctx.session.isTestCall) {
    const cc = ctx.session.conversationContext;
    const messageWithContent =
      ctx.session.leadType === "message" && !!(cc.reasonForCall || cc.callerName);
    if (deriveIntakeStatus(ctx) !== "not_started" || messageWithContent) {
      try {
        await captureLeadOnce(ctx); // fast: lead insert + call link only
      } catch (error) {
        logger.error("Failed to capture partial lead on early disconnect", {
          correlationId: ctx.session.correlationId,
          error: String(error),
        });
      }
    }
  }

  if (ctx) {
    await endCall(ctx.session); // fast: one updateCall with finals + transcript

    // Hand the heavy tail to Inngest. Everything the finalizer needs is now in
    // the DB (lead row, call transcript) — no in-memory state crosses over.
    if (!ctx.session.isTestCall) {
      try {
        await inngest.send({
          name: "call/voice.ended",
          data: { callId: ctx.session.callId, businessId: ctx.session.businessId },
        });
      } catch (error) {
        logger.error("Failed to enqueue voice-call finalization", {
          correlationId: ctx.session.correlationId,
          error: String(error),
        });
      }
    }
  }
}
