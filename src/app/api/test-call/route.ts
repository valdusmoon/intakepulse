import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getBusinessByClerkId } from "@/lib/db/queries/businesses";
import { buildFlowContext, createSession, initializeOpenAIForTest, loadBusinessCallData } from "@/lib/voice/call-manager";
import { OpenAIHandlerService } from "@/lib/voice/openai-handler.service";
import * as engine from "@/lib/voice/state-machine/engine";
import type { FlowContext } from "@/lib/voice/state-machine/types";
import type { RealtimeClient } from "@/lib/voice/realtime-client";
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
 * Sessions live in this module's memory only — fine for an internal dev
 * tool, but note a Vercel Fluid Compute instance recycle mid-session will
 * lose it (the UI should just let the tester start a fresh test call).
 *
 * Each HTTP round-trip waits only a short, bounded time (waitForSettled's
 * maxWaitMs) rather than the whole confirmation -> captureLead -> goodbye
 * chain, which can run ~5-6s+ (a DB write plus two AI calls — scoring
 * reasoning and the goodbye turn) — long enough to risk tripping some
 * intermediate timeout in front of the function, independent of this
 * route's own maxDuration. If a turn isn't settled within budget, the
 * response comes back with pending: true and no sessionId-losing side
 * effect; the client just polls again (no new message) until it isn't.
 */
interface TestSession {
  ctx: FlowContext;
  client: RealtimeClient;
  clerkUserId: string;
  // How many transcript entries have already been sent to the client —
  // lets a follow-up poll (no new message) pick up only what's new.
  syncedThrough: number;
}

const sessions = new Map<string, TestSession>();
const openaiHandler = new OpenAIHandlerService();

// openai-handler.service's audio-specific handlers (response.output_audio.delta,
// input_audio_buffer.speech_started) reference a WebSocket but can never
// actually fire on a text-only session — nothing here is ever called.
const noopWs = { send: () => {}, close: () => {} } as any;

const TEST_CALLER_PHONE = "+15550000000";
const POLL_BUDGET_MS = 8000;

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await getBusinessByClerkId(userId);
  if (!business) return NextResponse.json({ error: "No business found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const { sessionId: incomingSessionId, message, poll } = body as { sessionId?: string; message?: string; poll?: boolean };

  const entry = incomingSessionId ? sessions.get(incomingSessionId) : undefined;
  if (incomingSessionId && !entry) {
    return NextResponse.json({ error: "Test session expired — start a new one" }, { status: 410 });
  }
  if (entry && entry.clerkUserId !== userId) {
    return NextResponse.json({ error: "Not your test session" }, { status: 403 });
  }

  if (!entry) {
    return startNewSession(business.id, business.businessName, business.urgentTransferNumber, userId);
  }

  if (!poll) {
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }
    await engine.handleTranscript(entry.ctx, entry.client, message);
  }

  return respondWithProgress(incomingSessionId!, entry);
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { sessionId } = body as { sessionId?: string };
  const entry = sessionId ? sessions.get(sessionId) : undefined;
  if (entry && entry.clerkUserId === userId) {
    entry.client.close();
    sessions.delete(sessionId!);
  }
  return NextResponse.json({ ok: true });
}

async function startNewSession(
  businessId: string,
  businessName: string,
  urgentTransferNumber: string | null,
  clerkUserId: string
): Promise<NextResponse> {
  const businessCallData = await loadBusinessCallData(businessId, TEST_CALLER_PHONE);
  if (!businessCallData) {
    return NextResponse.json({ error: "Failed to load business data" }, { status: 500 });
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

  const ctx = await buildFlowContext(businessCallData, session, () => {
    // No real WebSocket for a test session to close.
  });
  if (!ctx) {
    return NextResponse.json({ error: "No vertical configuration for this business" }, { status: 500 });
  }

  let client: RealtimeClient;
  try {
    client = await initializeOpenAIForTest();
  } catch (error) {
    logger.error("Failed to start test-call OpenAI session", { error: String(error) });
    return NextResponse.json({ error: "Failed to connect to OpenAI" }, { status: 500 });
  }
  openaiHandler.setupEventHandlers(client, noopWs, ctx);

  const entry: TestSession = { ctx, client, clerkUserId, syncedThrough: 0 };
  sessions.set(sessionId, entry);

  engine.startCall(ctx, client);
  return respondWithProgress(sessionId, entry);
}

async function respondWithProgress(sessionId: string, entry: TestSession): Promise<NextResponse> {
  const { ctx, client } = entry;
  const { lines, pending } = await waitForSettled(ctx, entry.syncedThrough);
  entry.syncedThrough = ctx.session.conversationContext.transcript.length;

  const ended = !pending && ctx.session.state === "end";
  if (ended) {
    client.close();
    sessions.delete(sessionId);
  }

  return NextResponse.json({
    sessionId,
    lines,
    state: ctx.session.state,
    answers: ctx.session.conversationContext.answers,
    leadId: ctx.session.leadId ?? null,
    ended,
    pending,
  });
}

/**
 * Waits, up to a short bounded budget, for the conversation to settle.
 * Chained turns (confirmation -> captureLead -> goodbye) fire asynchronously
 * via onResponseDone/pendingContinuation, not a single promise the caller of
 * handleTranscript gets to await — and there's a real gap to account for:
 * notifyResponseDone clears responseActive/onResponseDone the instant a
 * response finishes, *before* firing that chain's next step (e.g. finishCall,
 * which awaits captureLeadOnce — a slow DB+AI call — before speaking the
 * goodbye line and setting a new onResponseDone). Polling responseActive
 * alone can catch that exact window and report "settled" while the chain is
 * still mid-flight; awaiting session.pendingContinuation (set by
 * notifyResponseDone whenever the fired callback returns a promise) closes
 * that gap before re-checking. If the budget runs out first, returns
 * whatever's accumulated so far with pending: true — the caller re-polls.
 */
async function waitForSettled(
  ctx: FlowContext,
  before: number,
  maxWaitMs = POLL_BUDGET_MS
): Promise<{ lines: { role: string; message: string }[]; pending: boolean }> {
  const start = Date.now();
  await sleep(100); // give a just-started response a moment to flip responseActive true
  let pending = false;

  while (true) {
    const remaining = maxWaitMs - (Date.now() - start);
    if (remaining <= 0) {
      pending = true;
      break;
    }

    if (ctx.session.pendingContinuation) {
      // Don't clear this until it actually resolves — if we time out waiting
      // on it, the next poll needs to find it still here and keep waiting on
      // the SAME promise (awaiting an in-flight promise from multiple places
      // is safe), rather than falling through to a responseActive/onResponseDone
      // check that's meaningless while this is still running in the background.
      const current = ctx.session.pendingContinuation;
      const outcome = await Promise.race([
        current.then(() => "resolved" as const).catch(() => "resolved" as const),
        sleep(remaining).then(() => "timeout" as const),
      ]);
      if (outcome === "timeout") {
        pending = true;
        break;
      }
      if (ctx.session.pendingContinuation === current) {
        ctx.session.pendingContinuation = undefined;
      }
      continue; // the continuation may have started a new response or another chain
    }

    if (!ctx.session.responseActive && !ctx.session.onResponseDone) break;
    await sleep(Math.min(150, remaining));
  }

  if (!pending && ctx.session.leadCapturePromise) {
    await ctx.session.leadCapturePromise.catch(() => {});
  }

  return {
    lines: ctx.session.conversationContext.transcript.slice(before).map((t) => ({ role: t.role, message: t.message })),
    pending,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
