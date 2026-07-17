import type { Call } from "@/lib/db/schema/calls";
import type { VerticalQuestion, ScoringRule } from "@/lib/db/schema/verticalConfigs";
import { createLead } from "@/lib/db/queries/leads";
import { updateCall } from "@/lib/db/queries/calls";
import { scoreLeadFromAnswers } from "@/lib/leads/scoring";
import { assessLead } from "@/lib/leads/assess";
import { logger } from "@/lib/logger";
import type { TranscriptIntake } from "./extract-from-transcript";

export interface HumanCallLeadResult {
  leadId: string | null;
}

/**
 * Creates a lead from a team-answered call — the human counterpart to
 * captureLead (the AI-voice path). Deliberately mirrors it so BOTH paths run the
 * SAME scoring/assessment core (scoreLeadFromAnswers + assessLead); the only
 * difference is where the answers came from (a Whisper transcript vs the realtime
 * state machine).
 *
 * Two rules that differ from the AI path:
 *   - Signal gate: the call record is always stored, but a LEAD is only created
 *     when there's a real opportunity (structured answers OR any signal flag).
 *   - No operator alert: the team was on the call, so no email/push is sent.
 *
 * Idempotent: a retry (Inngest re-run / webhook redelivery) with a call that
 * already has a lead is a no-op.
 */
export async function captureHumanCallLead(params: {
  call: Call;
  verticalConfig: {
    questions: VerticalQuestion[];
    scoringRules: ScoringRule[];
    baseValueLow: number;
    aiPromptTemplate: string;
  };
  intake: TranscriptIntake;
}): Promise<HumanCallLeadResult> {
  const { call, verticalConfig, intake } = params;
  const { extraction, signal } = intake;

  if (call.leadId) {
    return { leadId: call.leadId };
  }

  const hasAnswers = Object.keys(extraction.answers).length > 0;
  const hasSignal =
    hasAnswers ||
    signal.jobIntent ||
    signal.urgency ||
    signal.callbackRequested ||
    signal.quoteRequested ||
    signal.contactCaptured;

  if (!hasSignal) {
    logger.info("Human-answered call has no lead signal — call stored, no lead", { callId: call.id });
    return { leadId: null };
  }

  const lead = await createLead({
    businessId: call.businessId,
    callerPhone: call.callerPhone,
    callerName: intake.callerName,
    source: "voice_human",
    callStatus: "answered",
    intakeStatus: hasAnswers ? "completed" : "started",
    intakeAnswers: extraction.answers,
    smsConsent: false,
  });

  // Link the lead to the call, but do NOT touch `outcome` — the human answered
  // (outcome stays "business_answered", set by the Dial status webhook).
  await updateCall(call.id, { leadId: lead.id });

  const scores = scoreLeadFromAnswers(
    extraction.answers,
    verticalConfig.scoringRules,
    verticalConfig.questions,
    verticalConfig.baseValueLow
  );
  await assessLead(lead.id, extraction.answers, scores, verticalConfig.aiPromptTemplate);

  // No email/push — the operator was on the call (founder decision).
  logger.info("Human-answered call captured as lead", { callId: call.id, leadId: lead.id, source: "voice_human" });
  return { leadId: lead.id };
}
