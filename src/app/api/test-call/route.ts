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
 */
interface TestSession {
  ctx: FlowContext;
  client: RealtimeClient;
  clerkUserId: string;
}

const sessions = new Map<string, TestSession>();
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
  const { sessionId: incomingSessionId, message } = body as { sessionId?: string; message?: string };

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

  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const { ctx, client } = entry;
  const before = ctx.session.conversationContext.transcript.length;
  await engine.handleTranscript(ctx, client, message);
  const lines = await waitForSettled(ctx, before);

  const ended = ctx.session.state === "end";
  if (ended) {
    client.close();
    sessions.delete(incomingSessionId!);
  }

  return NextResponse.json({
    sessionId: incomingSessionId,
    lines,
    state: ctx.session.state,
    answers: ctx.session.conversationContext.answers,
    leadId: ctx.session.leadId ?? null,
    ended,
  });
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

  sessions.set(sessionId, { ctx, client, clerkUserId });

  const before = ctx.session.conversationContext.transcript.length;
  engine.startCall(ctx, client);
  const lines = await waitForSettled(ctx, before);

  return NextResponse.json({
    sessionId,
    lines,
    state: ctx.session.state,
    answers: ctx.session.conversationContext.answers,
    leadId: ctx.session.leadId ?? null,
    ended: false,
  });
}

/**
 * Polls until the conversation settles after a turn. speak() pushes into
 * the transcript synchronously the instant the engine decides to say
 * something, but chained turns (confirmation -> captureLead -> goodbye)
 * fire asynchronously with no single promise to await, so this waits on
 * session.responseActive/onResponseDone rather than the transcript array —
 * classification-only turns (extract_zip/classify_answer/detect_intent)
 * never push into the transcript the way speak() does, so transcript length
 * alone can't tell whether a response.create is still in flight.
 */
async function waitForSettled(
  ctx: FlowContext,
  before: number,
  maxWaitMs = 25000
): Promise<{ role: string; message: string }[]> {
  const start = Date.now();
  await sleep(100); // give a just-started response a moment to flip responseActive true

  while (Date.now() - start < maxWaitMs) {
    if (!ctx.session.responseActive && !ctx.session.onResponseDone) break;
    await sleep(150);
  }

  if (ctx.session.leadCapturePromise) {
    await ctx.session.leadCapturePromise.catch(() => {});
  }

  return ctx.session.conversationContext.transcript.slice(before).map((t) => ({ role: t.role, message: t.message }));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
