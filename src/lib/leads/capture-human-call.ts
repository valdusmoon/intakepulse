import type { Call } from "@/lib/db/schema/calls";
import type { VerticalQuestion, ScoringRule } from "@/lib/db/schema/verticalConfigs";
import { createLead } from "@/lib/db/queries/leads";
import { updateCall } from "@/lib/db/queries/calls";
import { scoreLeadFromAnswers } from "@/lib/leads/scoring";
import { assessLead } from "@/lib/leads/assess";
import { deriveIntakeStatusFromAnswers } from "@/lib/leads/intake-status";
import { logger } from "@/lib/logger";
import type { TranscriptIntake } from "./extract-from-transcript";

export interface HumanCallLeadResult {
  leadId: string | null;
}

/**
 * Captures a team-answered call under the same three-outcome contract as the AI
 * voice path (see docs/intake-capture-contract.md): a scored JOB lead, an unscored
 * MESSAGE lead (with messageKind), or nothing at all (junk / no opportunity — the
 * call record with transcript + summary is the audit trail). Both lead paths run
 * the SAME storage shape and, for jobs, the SAME scoring/assessment core as voice
 * (scoreLeadFromAnswers + assessLead, including ScoringContext so the emergency
 * and critical-signal floors work on team calls too).
 *
 * Rules that deliberately differ from the AI path:
 *   - No operator alert for jobs OR messages: the team was on the call.
 *   - 'abandoned' intakeStatus never applies (nobody hung up mid-intake; the team
 *     simply didn't ask) — partial extraction is honestly 'started'.
 *
 * Precedence mirrors the voice engine: job signal always wins (structured answers
 * OR a job classification), and a failed classification fails OPEN to a job when
 * the legacy opportunity booleans fired — a misfiled job beats a lost one.
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
  transcriptText: string;
}): Promise<HumanCallLeadResult> {
  const { call, verticalConfig, intake, transcriptText } = params;
  const { extraction, signal, contactKind, messageKind, messageForTeam, serviceRequested } = intake;

  if (call.leadId) {
    return { leadId: call.leadId };
  }

  const hasAnswers = Object.keys(extraction.answers).length > 0;

  // Legacy fail-open: if classification is unusable ("none" is also the model-failure
  // fallback) but the old boolean signals fired, still capture as a job.
  const legacySignal =
    signal.jobIntent ||
    signal.urgency ||
    signal.callbackRequested ||
    signal.quoteRequested ||
    signal.contactCaptured;

  // Job signal always wins (same rule as the voice engine).
  const isJob = hasAnswers || contactKind === "job" || (contactKind === "none" && legacySignal);

  if (isJob) {
    // ZIP fold-in — same key the voice and web paths write.
    const answers = extraction.zipCode
      ? { ...extraction.answers, zip_code: extraction.zipCode }
      : extraction.answers;

    const lead = await createLead({
      businessId: call.businessId,
      callerPhone: call.callerPhone,
      callerName: intake.callerName,
      source: "voice_human",
      callStatus: "answered",
      leadType: "job",
      intakeStatus: deriveIntakeStatusFromAnswers(verticalConfig.questions, answers, serviceRequested),
      intakeAnswers: answers,
      serviceRequested,
      smsConsent: false,
    });

    // Link the lead to the call, but do NOT touch `outcome` — the human answered
    // (outcome stays "business_answered", set by the Dial status webhook).
    await updateCall(call.id, { leadId: lead.id });

    const scores = scoreLeadFromAnswers(
      answers,
      verticalConfig.scoringRules,
      verticalConfig.questions,
      verticalConfig.baseValueLow,
      { serviceRequested, signalText: transcriptText }
    );
    await assessLead(lead.id, answers, scores, verticalConfig.aiPromptTemplate);

    // No email/push — the operator was on the call (founder decision).
    logger.info("Human-answered call captured as job lead", { callId: call.id, leadId: lead.id, source: "voice_human" });
    return { leadId: lead.id };
  }

  if (contactKind === "message") {
    const lead = await createLead({
      businessId: call.businessId,
      callerPhone: call.callerPhone,
      callerName: intake.callerName,
      source: "voice_human",
      callStatus: "answered",
      leadType: "message",
      messageKind: messageKind ?? "general",
      intakeStatus: "not_started",
      // The team's actionable copy of the ask — summary is PII-scrubbed by design,
      // so it's only the fallback when the model gave no message_for_team.
      notes: messageForTeam ?? intake.summary,
      serviceRequested,
      smsConsent: false,
    });

    await updateCall(call.id, { leadId: lead.id });

    // NO scoring, NO assessment (leadStatus stays 'new', scores stay null), and
    // NO notification — the operator was on the call.
    logger.info("Human-answered call captured as message", { callId: call.id, leadId: lead.id, messageKind: messageKind ?? "general" });
    return { leadId: lead.id };
  }

  // junk / none — call stored (transcript + summary), no lead row.
  logger.info("Human-answered call not captured as lead", { callId: call.id, contactKind });
  return { leadId: null };
}
