import crypto from "crypto";

import { NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { buildFlowContext, createSession, initializeOpenAIForTest } from "@/lib/voice/call-manager";
import { buildLeadPacket } from "@/lib/voice/lead-packet";
import { OpenAIHandlerService } from "@/lib/voice/openai-handler.service";
import * as engine from "@/lib/voice/state-machine/engine";
import type { FlowContext } from "@/lib/voice/state-machine/types";
import type { BusinessCallData, SessionState } from "@/lib/voice/types/session";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * RETIRED / GATED: this route is intentionally NOT in the middleware
 * public-route list (see src/middleware.ts), so it 404s for anonymous callers.
 * It was the public landing "drive it yourself" sandbox — an unauthenticated,
 * cost-bearing LLM endpoint with only a best-effort in-memory rate limit. It's
 * kept intact for easy revival; before reopening it, add a real bot gate
 * (Vercel BotID / Cloudflare Turnstile) and a global daily spend cap backed by
 * a shared store. See the commented sandbox block in src/app/page.tsx.
 *
 * Public marketing demo. Runs the EXACT same intake engine as a real phone call
 * (open description, multi-field extraction, adaptive follow-ups, scoring) so a
 * visitor experiences the real product, but fully sandboxed:
 *  - no auth, no real business, no phone number
 *  - creates NO lead and sends NO notification (session.isDemo)
 *  - a hard per-session turn cap and a best-effort per-IP rate limit
 *  - ends by returning an ephemeral lead packet computed from the answers
 *
 * Same stateless-per-request shape as the admin test-call route: each request
 * opens its own Realtime connection, processes one turn to completion, and hands
 * back the plain session state for the client to round-trip.
 */
const openaiHandler = new OpenAIHandlerService();
const noopWs = { send: () => {}, close: () => {} } as any;

const DEMO_CALLER = "+15550000000";
const MAX_CALLER_TURNS = 10; // hard stop so a session can't run forever

// A believable restoration business so the greeting and pricing read naturally.
// Nothing here is persisted; it only shapes the in-memory FlowContext. The id is
// a valid-but-nonexistent UUID so the pricing-rules lookup (a uuid column) parses
// and simply returns nothing.
const DEMO_BUSINESS_ID = "00000000-0000-0000-0000-000000000000";
const DEMO_BUSINESS: BusinessCallData = {
  id: DEMO_BUSINESS_ID,
  businessName: "Rapid Restore",
  ownerEmail: "",
  ownerName: "",
  vertical: "restoration",
  serviceArea: null,
  timezone: "America/New_York",
  forwardingNumber: null,
  urgentTransferNumber: null,
  greetingMessage: null,
  aiInstructions: null,
  recordingEnabled: false,
  recordingDisclosure: null,
  callerNumber: DEMO_CALLER,
  notificationPreferences: { newLead: false, qualifiedLead: false, smsNewLead: false, weeklyReport: false },
  voiceName: "alloy",
  customServiceOptions: [],
};

// Best-effort per-IP limiter. Serverless instances do not share this map, so it
// is a soft guard, not a hard quota; the per-session turn cap is the real bound.
const ipHits = new Map<string, number[]>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 40;
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (ipHits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  hits.push(now);
  ipHits.set(ip, hits);
  return hits.length > RATE_MAX;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "Too many demo requests. Give it a minute and try again." }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const { sessionState: incomingState, message, dtmf } = body as { sessionState?: SessionState; message?: string; dtmf?: string };

  if (incomingState && !message && !dtmf) {
    return NextResponse.json({ error: "message or dtmf is required" }, { status: 400 });
  }
  if (dtmf && !/^[0-9*#]+$/.test(dtmf)) {
    return NextResponse.json({ error: "dtmf must be keypad digits only" }, { status: 400 });
  }

  const session = restoreOrCreateSession(incomingState);

  // Hard cap: count caller turns already recorded; refuse to continue past it.
  const callerTurns = session.conversationContext.transcript.filter((t) => t.role === "user").length;
  if (callerTurns >= MAX_CALLER_TURNS && session.state !== "end") {
    return NextResponse.json({ error: "This is a short demo. Refresh to start a new one." }, { status: 400 });
  }

  const ctx = await buildFlowContext(DEMO_BUSINESS, session, () => {});
  if (!ctx) {
    return NextResponse.json({ error: "Demo is temporarily unavailable." }, { status: 500 });
  }

  let client;
  try {
    client = await initializeOpenAIForTest();
  } catch (error) {
    logger.error("Failed to start demo OpenAI session", { error: String(error) });
    return NextResponse.json({ error: "Demo is temporarily unavailable." }, { status: 500 });
  }
  openaiHandler.setupEventHandlers(client, noopWs, ctx);

  const beforeSnapshot = ctx.session.conversationContext.transcript.length;
  if (!incomingState) {
    engine.startCall(ctx, client);
  } else if (dtmf) {
    for (const digit of dtmf) {
      await engine.handleDtmf(ctx, client, noopWs, digit);
      await waitUntilFullySettled(ctx);
    }
  } else {
    await engine.handleTranscript(ctx, client, message!);
  }

  try {
    await waitUntilFullySettled(ctx);
  } finally {
    client.close();
  }

  const ended = ctx.session.state === "end";
  const linesFrom = incomingState && message ? beforeSnapshot + 1 : beforeSnapshot;

  return NextResponse.json({
    sessionState: ended ? null : serializeSession(ctx.session),
    lines: ctx.session.conversationContext.transcript.slice(linesFrom).map((t) => ({ role: t.role, message: t.message })),
    state: ctx.session.state,
    ended,
    packet: ended ? buildLeadPacket(ctx) : null,
  });
}

function restoreOrCreateSession(incomingState: SessionState | undefined): SessionState {
  if (incomingState) {
    return { ...incomingState, callStartTime: new Date(incomingState.callStartTime) };
  }
  const id = crypto.randomUUID();
  const session = createSession({
    callSid: `demo-${id}`,
    callId: `demo-${id}`,
    businessId: DEMO_BUSINESS.id,
    businessName: DEMO_BUSINESS.businessName,
    urgentTransferNumber: null,
    callerPhone: DEMO_CALLER,
  });
  session.isDemo = true;
  return session;
}

function serializeSession(session: SessionState): SessionState {
  const { onResponseDone, pendingContinuation, leadCapturePromise, silenceTimeout, ...rest } = session;
  return rest as SessionState;
}

async function waitUntilFullySettled(ctx: FlowContext, maxWaitMs = 45000): Promise<void> {
  const start = Date.now();
  await sleep(100);
  while (Date.now() - start < maxWaitMs) {
    if (ctx.session.pendingContinuation) {
      const current = ctx.session.pendingContinuation;
      await current.catch(() => {});
      if (ctx.session.pendingContinuation === current) ctx.session.pendingContinuation = undefined;
      continue;
    }
    if (!ctx.session.responseActive && !ctx.session.onResponseDone) break;
    await sleep(150);
  }
  if (ctx.session.leadCapturePromise) await ctx.session.leadCapturePromise.catch(() => {});
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
