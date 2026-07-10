import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getBusinessByClerkId } from "@/lib/db/queries/businesses";
import { buildFlowContext, createSession, initializeOpenAIForTest, loadBusinessCallData } from "@/lib/voice/call-manager";
import { OpenAIHandlerService } from "@/lib/voice/openai-handler.service";
import * as engine from "@/lib/voice/state-machine/engine";
import type { FlowContext } from "@/lib/voice/state-machine/types";
import type { SessionState } from "@/lib/voice/types/session";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Admin test-call harness — drives the real engine.ts state machine over
 * text instead of a Twilio Media Stream, so the conversation flow, scoring,
 * and function calls (captureLead, checkServiceArea, ...) can be exercised
 * without an actual phone call. See src/lib/voice/realtime-client.ts's
 * configureTextSession and call-manager.ts's initializeOpenAIForTest.
 *
 * Fully stateless server-side, on purpose: an earlier version kept a live
 * session (FlowContext + an open Realtime WebSocket) in a module-level Map
 * across requests, and it broke constantly — Vercel gives no guarantee that
 * two sequential requests from the same client land on the same instance
 * (confirmed directly: a session died between two requests ~7s apart with
 * no deploy in between). No amount of within-one-request timing fixes can
 * patch over state that just isn't there on the next request. The actual
 * fix is to not rely on anything surviving between requests: each request
 * opens its own Realtime connection, processes exactly one turn (the
 * initial start, or one caller message) all the way to completion — however
 * long that takes, including the confirmation -> captureLead -> goodbye
 * chain — then closes the connection and hands back the plain-data session
 * state for the client to hold and pass back on the next request.
 */
const openaiHandler = new OpenAIHandlerService();

// openai-handler.service's audio-specific handlers (response.output_audio.delta,
// input_audio_buffer.speech_started) reference a WebSocket but can never
// actually fire on a text-only session — nothing here is ever called.
const noopWs = { send: () => {}, close: () => {} } as any;

const TEST_CALLER_PHONE = "+15550000000";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await getBusinessByClerkId(userId);
  if (!business) return NextResponse.json({ error: "No business found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const { sessionState: incomingState, message } = body as { sessionState?: SessionState; message?: string };

  if (incomingState && !message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const businessCallData = await loadBusinessCallData(business.id, TEST_CALLER_PHONE);
  if (!businessCallData) {
    return NextResponse.json({ error: "Failed to load business data" }, { status: 500 });
  }

  const session = restoreOrCreateSession(incomingState, business.id, business.businessName, business.urgentTransferNumber);

  const ctx = await buildFlowContext(businessCallData, session, () => {
    // No real WebSocket for a test session to close.
  });
  if (!ctx) {
    return NextResponse.json({ error: "No vertical configuration for this business" }, { status: 500 });
  }

  let client;
  try {
    client = await initializeOpenAIForTest();
  } catch (error) {
    logger.error("Failed to start test-call OpenAI session", { error: String(error) });
    return NextResponse.json({ error: "Failed to connect to OpenAI" }, { status: 500 });
  }
  openaiHandler.setupEventHandlers(client, noopWs, ctx);

  const beforeSnapshot = ctx.session.conversationContext.transcript.length;
  if (!incomingState) {
    engine.startCall(ctx, client);
  } else {
    await engine.handleTranscript(ctx, client, message!);
  }

  try {
    await waitUntilFullySettled(ctx);
  } finally {
    client.close();
  }

  const ended = ctx.session.state === "end";
  // handleTranscript's very first action is pushing the caller's own message
  // into the transcript — skip it in what we return, since the client already
  // has its own copy from what it just sent (it isn't waiting to be told).
  const linesFrom = incomingState ? beforeSnapshot + 1 : beforeSnapshot;

  return NextResponse.json({
    sessionState: ended ? null : serializeSession(ctx.session),
    lines: ctx.session.conversationContext.transcript.slice(linesFrom).map((t) => ({ role: t.role, message: t.message })),
    state: ctx.session.state,
    answers: ctx.session.conversationContext.answers,
    leadId: ctx.session.leadId ?? null,
    ended,
  });
}

function restoreOrCreateSession(
  incomingState: SessionState | undefined,
  businessId: string,
  businessName: string,
  urgentTransferNumber: string | null
): SessionState {
  if (incomingState) {
    return { ...incomingState, callStartTime: new Date(incomingState.callStartTime) };
  }
  const sessionId = crypto.randomUUID();
  const session = createSession({
    callSid: `test-${sessionId}`,
    callId: `test-${sessionId}`,
    businessId,
    businessName,
    urgentTransferNumber,
    callerPhone: TEST_CALLER_PHONE,
  });
  session.isTestCall = true;
  return session;
}

/** Strips live, non-serializable references (open promises, timers, callbacks)
 *  before handing the session back to the client — everything else is plain
 *  data and round-trips fine. These are always already resolved/undefined by
 *  the time this runs, since waitUntilFullySettled only returns once the
 *  entire chain for this turn — including any captureLead work — is done. */
function serializeSession(session: SessionState): SessionState {
  const { onResponseDone, pendingContinuation, leadCapturePromise, silenceTimeout, ...rest } = session;
  return rest as SessionState;
}

/**
 * Waits for the whole chain triggered by this turn to actually finish —
 * chained turns (confirmation -> captureLead -> goodbye) fire asynchronously
 * via onResponseDone/pendingContinuation, not a single promise handleTranscript
 * itself resolves. There's a real gap to account for: notifyResponseDone
 * clears responseActive/onResponseDone the instant a response finishes,
 * *before* firing that chain's next step (e.g. finishCall, which awaits
 * captureLeadOnce — a slow DB+AI call — before speaking the goodbye line and
 * setting a new onResponseDone). Checking those flags alone can catch that
 * exact window and report "done" while the chain is still mid-flight;
 * awaiting session.pendingContinuation (set by notifyResponseDone whenever
 * the fired callback returns a promise) closes that gap before re-checking.
 */
async function waitUntilFullySettled(ctx: FlowContext, maxWaitMs = 45000): Promise<void> {
  const start = Date.now();
  await sleep(100); // give a just-started response a moment to flip responseActive true

  while (Date.now() - start < maxWaitMs) {
    if (ctx.session.pendingContinuation) {
      const current = ctx.session.pendingContinuation;
      await current.catch(() => {});
      if (ctx.session.pendingContinuation === current) {
        ctx.session.pendingContinuation = undefined;
      }
      continue; // the continuation may have started a new response or another chain
    }
    if (!ctx.session.responseActive && !ctx.session.onResponseDone) break;
    await sleep(150);
  }

  if (ctx.session.leadCapturePromise) {
    await ctx.session.leadCapturePromise.catch(() => {});
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
