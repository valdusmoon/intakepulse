import { scoreLeadFromAnswers } from "@/lib/leads/scoring";
import type { FlowContext } from "./state-machine/types";

/**
 * The ephemeral lead packet a business would receive, computed on the fly from a
 * call's collected answers. Used by the public demo and the in-app test tool,
 * neither of which persists anything: a test/demo call is never stored, so this
 * is the preview of what a real call would have produced.
 */
export interface LeadPacket {
  tier: "Hot" | "Warm" | "Cool";
  leadScore: number;
  estimatedValue: string;
  recommendedAction: string;
  callerName: string | null;
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

export function buildLeadPacket(ctx: FlowContext): LeadPacket {
  const { verticalConfig } = ctx;
  const cc = ctx.session.conversationContext;
  const answers = cc.answers;

  const primaryQuestion = verticalConfig.questions[0];
  const matchedService = primaryQuestion?.options?.find((o) => o.value === answers[primaryQuestion.key])?.label ?? null;
  // Off-list service (no matched option) → show the caller's own words instead.
  const service = matchedService ?? cc.serviceRequested ?? null;
  const urgencyQuestion = verticalConfig.questions.find((q) => q.key === "urgency");
  const urgency = urgencyQuestion?.options?.find((o) => o.value === answers.urgency)?.label ?? null;

  const scores = scoreLeadFromAnswers(answers, verticalConfig.scoringRules, verticalConfig.questions, verticalConfig.baseValueLow);

  const tier = scores.qualityScore >= 60 ? "Hot" : scores.qualityScore >= 35 ? "Warm" : "Cool";
  const recommendedAction =
    answers.urgency === "emergency"
      ? "Call back within 10 minutes"
      : answers.urgency === "soon"
        ? "Call back within the hour"
        : "Call back today";

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
    leadScore: scores.qualityScore,
    estimatedValue: `${usd(scores.estimatedValueLow)} to ${usd(scores.estimatedValueHigh)}`,
    recommendedAction,
    callerName: cc.callerName ?? null,
    details,
  };
}

function usd(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString("en-US")}`;
}
