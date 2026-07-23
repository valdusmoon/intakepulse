/**
 * Orchestrates a single call's lifecycle: session creation, business/vertical/pricing
 * data loading, OpenAI Realtime session setup, summary generation, and call finalization.
 */

import { serverEnv } from "@/lib/env";
import { getBusinessById } from "@/lib/db/queries/businesses";
import { getPricingRulesByBusiness } from "@/lib/db/queries/pricingRules";
import { getVerticalConfig } from "@/lib/db/queries/verticalConfigs";
import { updateCall } from "@/lib/db/queries/calls";
import { logger } from "@/lib/logger";
import { withCustomServiceOptions } from "@/lib/verticals/customOptions";
import { RealtimeClient } from "./realtime-client";
import { generateCorrelationId } from "./correlation";
import { OPENAI_CONFIG } from "./config/constants";
import type { BusinessCallData, CallOutcome, SessionState } from "./types/session";
import type { FlowContext } from "./state-machine/types";

const BASE_INSTRUCTIONS =
  "You are a narrow phone-intake voice interface for a home-service business. " +
  "You only ever do exactly one of two things on each turn: (1) say a specific line " +
  "you're given, exactly and naturally, or (2) classify the caller's last answer using " +
  "the one tool you're given, and nothing else. You never decide what happens next in " +
  "the call, never improvise pricing or promises, and never continue past what you were asked to do.";

export function createSession(opts: {
  callSid: string;
  callId: string;
  businessId: string;
  businessName: string;
  callerPhone: string;
}): SessionState {
  return {
    streamSid: undefined,
    lastAssistantItem: undefined,
    responseStartTimestamp: undefined,
    latestMediaTimestamp: 0,
    callerPhone: opts.callerPhone,
    silenceTimeout: undefined,
    conversationContext: {
      transcript: [],
      actionsTaken: [],
      answers: {},
    },
    correlationId: generateCorrelationId(),
    callSid: opts.callSid,
    callId: opts.callId,
    businessId: opts.businessId,
    businessName: opts.businessName,
    callStartTime: new Date(),
    state: "greeting",
    qualificationIndex: 0,
    attempts: {},
    dtmfBuffer: "",
  };
}

export async function loadBusinessCallData(
  businessId: string,
  callerNumber: string
): Promise<BusinessCallData | null> {
  const business = await getBusinessById(businessId);
  if (!business) return null;

  return {
    id: business.id,
    businessName: business.businessName,
    ownerEmail: business.ownerEmail,
    ownerName: business.ownerName,
    vertical: business.vertical,
    serviceArea: business.serviceArea,
    timezone: business.timezone,
    forwardingNumber: business.forwardingNumber,
    overflowMode: business.overflowMode,
    greetingMessage: business.greetingMessage,
    aiInstructions: business.aiInstructions,
    recordingEnabled: business.recordingEnabled,
    recordingDisclosure: business.recordingDisclosure,
    callerNumber,
    notificationPreferences: business.notificationPreferences,
    voiceName: business.voiceName,
    customServiceOptions: business.customServiceOptions,
  };
}

/**
 * Loads the vertical config + active pricing rules and bundles everything the
 * state machine needs for this call. Fetched once at stream start.
 */
export async function buildFlowContext(
  business: BusinessCallData,
  session: SessionState,
  onComplete: () => void
): Promise<FlowContext | null> {
  const [verticalConfig, pricingRules] = await Promise.all([
    getVerticalConfig(business.vertical),
    getPricingRulesByBusiness(business.id),
  ]);

  if (!verticalConfig) {
    logger.error("No verticalConfig found for business vertical", {
      businessId: business.id,
      vertical: business.vertical,
    });
    return null;
  }

  return {
    session,
    business,
    verticalConfig: {
      ...verticalConfig,
      questions: withCustomServiceOptions(verticalConfig.questions, business.customServiceOptions),
    },
    pricingRules: pricingRules.filter((r) => r.isActive),
    onComplete,
  };
}

/**
 * Connects and configures the Realtime session. Deliberately generic — no
 * vertical/business-specific content here. Every turn's actual instructions
 * and tools are set per-response by the state machine (see state-machine/engine.ts).
 */
export async function initializeOpenAI(voiceName: string = OPENAI_CONFIG.VOICE): Promise<RealtimeClient> {
  const client = new RealtimeClient({
    apiKey: serverEnv.OPENAI_API_KEY,
    model: serverEnv.OPENAI_REALTIME_MODEL,
    voice: voiceName,
    instructions: BASE_INSTRUCTIONS,
    temperature: OPENAI_CONFIG.TEMPERATURE,
  });

  await client.connect();

  await client.configureSession({
    instructions: BASE_INSTRUCTIONS,
    voice: voiceName,
    turnDetection: {
      type: "server_vad",
      threshold: OPENAI_CONFIG.VAD_THRESHOLD,
      prefix_padding_ms: OPENAI_CONFIG.PREFIX_PADDING_MS,
      silence_duration_ms: OPENAI_CONFIG.SILENCE_DURATION_MS,
      // VAD detects speech start/stop but never acts on it itself — the engine
      // explicitly decides when to interrupt (caller speech via handleBargeIn,
      // or DTMF) and when to respond (per state transition). interrupt_response
      // stays false because OpenAI's auto-interrupt can't clear Twilio's
      // buffered audio and would fire even in terminal states.
      create_response: false,
      interrupt_response: false,
    },
  });

  return client;
}

/**
 * Text-only variant for the admin test-call harness (src/app/api/test-call) —
 * same model/instructions, no audio config at all, so it drives the exact
 * same engine.ts state machine without any TTS/transcription cost.
 */
export async function initializeOpenAIForTest(): Promise<RealtimeClient> {
  const client = new RealtimeClient({
    apiKey: serverEnv.OPENAI_API_KEY,
    model: serverEnv.OPENAI_REALTIME_MODEL,
    instructions: BASE_INSTRUCTIONS,
    temperature: OPENAI_CONFIG.TEMPERATURE,
  });

  await client.connect();
  await client.configureTextSession(BASE_INSTRUCTIONS);

  return client;
}

/**
 * Finalize a call once the voice session ends. Safe to call more than once
 * (e.g. from both the 'stop' event and the WebSocket 'close' handler) —
 * updateCall is a plain overwrite, not additive.
 *
 * DELIBERATELY one fast DB write and nothing else: this runs right after the
 * caller's connection has closed, inside whatever grace period the platform
 * gives a closed WebSocket's cleanup work. Anything slower (the GPT summary
 * round-trip used to live here) gets frozen mid-write — observed in prod as a
 * call stuck at "ringing" with no transcript. The summary now runs in the
 * durable finalize-voice-call Inngest job, triggered after this persists.
 */
export async function endCall(session: SessionState): Promise<void> {
  const durationSeconds = Math.floor((Date.now() - session.callStartTime.getTime()) / 1000);
  // A lead takes priority. A confident-junk call (screened) created no lead by
  // design — it's not an abandoned opportunity, so it gets its own outcome rather
  // than "abandoned". Everything else with no lead is a genuine drop-off.
  const outcome: CallOutcome = session.leadId
    ? "ai_captured"
    : session.screened
      ? "screened"
      : "abandoned";

  try {
    await updateCall(session.callId, {
      status: "answered",
      outcome,
      // Why it was screened (wrong_number / solicitation) — null for every other
      // outcome; set by enterScreenedHangup.
      screenedReason: outcome === "screened" ? session.screenedReason ?? null : null,
      endedAt: new Date(),
      durationSeconds,
      transcript: session.conversationContext.transcript,
    });
  } catch (error) {
    logger.error("Failed to finalize call", { correlationId: session.correlationId, error: String(error) });
  }
}
