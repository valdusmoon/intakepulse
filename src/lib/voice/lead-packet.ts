import { scoreLeadFromAnswers, priorityTier, HIGH_VALUE_THRESHOLD } from "@/lib/leads/scoring";
import { generateAssessmentReasoning } from "@/lib/leads/assess";
import { formatIntakeAnswers } from "@/lib/verticals/labels";
import type { FlowContext } from "./state-machine/types";

/**
 * The ephemeral lead packet a business would receive, computed on the fly from a
 * call's collected answers. Used by the public demo and the in-app test tool,
 * neither of which persists anything. With `withReasoning`, it also runs the AI
 * assessment (reasoning only, never persisted) so the preview mirrors the real
 * lead-detail page exactly.
 */
export interface LeadPacket {
  tier: "Hot" | "Warm" | "Cool";
  priorityScore: number; // 0-100 — composite that the tier is derived from
  isHighValue: boolean; // value on its own is high — surfaced as a badge
  leadScore: number; // quality, 1-100
  urgencyScore: number; // 1-10
  estimatedValue: string;
  recommendedAction: string;
  callerName: string | null;
  service: string | null;
  offList: boolean;
  source: string;
  answers: { key: string; label: string; value: string }[];
  urgencyReasoning: string | null;
  qualityReasoning: string | null;
  recommendedActions: string[];
  details: { label: string; value: string }[];
}

const ROOMS: Record<string, string> = {
  one: "1 room",
  two_three: "2 to 3 rooms",
  four_plus: "4 or more rooms",
};

const URGENCY_WORD: Record<string, string> = {
  emergency: "Emergency",
  soon: "Soon",
  flexible: "Flexible",
};

export async function buildLeadPacket(ctx: FlowContext, opts: { withReasoning?: boolean } = {}): Promise<LeadPacket> {
  const { verticalConfig } = ctx;
  const cc = ctx.session.conversationContext;
  const answers = cc.answers;

  const primaryQuestion = verticalConfig.questions[0];
  const matchedService = primaryQuestion?.options?.find((o) => o.value === answers[primaryQuestion.key])?.label ?? null;
  // Off-list service (no matched option) → show the caller's own words instead.
  const service = matchedService ?? cc.serviceRequested ?? null;
  const offList = !matchedService && !!cc.serviceRequested;
  const urgencyQuestion = verticalConfig.questions.find((q) => q.key === "urgency");
  const urgency = urgencyQuestion?.options?.find((o) => o.value === answers.urgency)?.label ?? null;

  // Deliberately no pricingRules here: the packet is an ephemeral preview (public
  // demo + test tool) and stays DB-free, so it shows benchmark estimates. Real
  // leads are scored in finalize-voice-call with the business's configured prices.
  const scores = scoreLeadFromAnswers(answers, verticalConfig.scoringRules, verticalConfig.questions, verticalConfig.baseValueLow, {
    serviceRequested: cc.serviceRequested ?? null,
    signalText: cc.reasonForCall ?? null,
    callerName: cc.callerName ?? null,
  });

  // Optionally run the AI reasoning (not persisted) so the preview matches a real
  // lead. Gated so the public marketing demo stays a single cheap call.
  let urgencyReasoning: string | null = null;
  let qualityReasoning: string | null = null;
  let recommendedActions: string[] = [];
  if (opts.withReasoning) {
    const { reasoning } = await generateAssessmentReasoning(answers, scores, verticalConfig.aiPromptTemplate);
    urgencyReasoning = reasoning.urgencyReasoning;
    qualityReasoning = reasoning.qualityReasoning;
    recommendedActions = reasoning.recommendedActions;
  }

  const tier = priorityTier(scores.priorityScore);
  const recommendedAction =
    recommendedActions[0] ??
    (answers.urgency === "emergency"
      ? "Call back within 10 minutes"
      : answers.urgency === "soon"
        ? "Call back within the hour"
        : "Call back today");

  // Extra call-metadata not part of the scored Q&A (the full Q&A is in `answers`).
  const details: { label: string; value: string }[] = [];
  if (service) details.push({ label: "Service", value: service });
  if (urgency) details.push({ label: "Urgency", value: URGENCY_WORD[answers.urgency] ?? urgency });
  if (cc.zipCode) details.push({ label: "ZIP", value: cc.zipCode });
  if (answers.cause) details.push({ label: "Cause", value: answers.cause });
  if (answers.rooms_affected) details.push({ label: "Rooms affected", value: ROOMS[answers.rooms_affected] ?? answers.rooms_affected });
  if (cc.callbackPreference) details.push({ label: "Callback", value: cc.callbackPreference });
  if (cc.reasonForCall) details.push({ label: "Reason", value: cc.reasonForCall });

  return {
    tier,
    priorityScore: scores.priorityScore,
    isHighValue: scores.valueScore >= HIGH_VALUE_THRESHOLD,
    leadScore: scores.qualityScore,
    urgencyScore: scores.urgencyScore,
    estimatedValue: `${usd(scores.estimatedValueLow)} to ${usd(scores.estimatedValueHigh)}`,
    recommendedAction,
    callerName: cc.callerName ?? null,
    service,
    offList,
    source: ctx.session.isTestCall ? "voice_test" : "voice_overflow",
    answers: formatIntakeAnswers(verticalConfig.questions, answers),
    urgencyReasoning,
    qualityReasoning,
    recommendedActions,
    details,
  };
}

function usd(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString("en-US")}`;
}
