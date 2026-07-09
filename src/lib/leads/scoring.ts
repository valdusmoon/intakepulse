import type { ScoringRule, VerticalQuestion } from "@/lib/db/schema/verticalConfigs";
import { filterAnswersToVisible, type Answers } from "@/lib/verticals/filterAnswers";

export interface ScoringResult {
  urgencyScore: number;       // 1-10
  qualityScore: number;       // 1-100
  estimatedValueLow: number;  // cents
  estimatedValueHigh: number; // cents
}

const URGENCY_CAP = 15;
const QUALITY_CAP = 65;

function clamp(min: number, max: number, n: number) {
  return Math.max(min, Math.min(max, n));
}

function answerMatches(answer: string | string[] | undefined, ruleValue: string): boolean {
  if (!answer) return false;
  return Array.isArray(answer) ? answer.includes(ruleValue) : answer === ruleValue;
}

export function scoreLeadFromAnswers(
  rawAnswers: Answers,
  rules: ScoringRule[],
  questions: VerticalQuestion[],
  baseValueLow: number
): ScoringResult {
  // Only score answers the user actually saw — orphaned conditional answers are excluded
  const answers = filterAnswersToVisible(questions, rawAnswers);

  let urgencyTotal = 0;
  let qualityTotal = 0;
  let valueTotal = 0;

  for (const rule of rules) {
    if (!answerMatches(answers[rule.answerKey], rule.answerValue)) continue;
    urgencyTotal += rule.urgencyBonus ?? 0;
    qualityTotal += rule.qualityBonus ?? 0;
    valueTotal += rule.valueBonus ?? 0;
  }

  const urgencyScore = clamp(1, 10, Math.round(1 + (urgencyTotal / URGENCY_CAP) * 9));
  const qualityScore = clamp(1, 100, Math.round(1 + (qualityTotal / QUALITY_CAP) * 99));
  const estimatedValueLow = baseValueLow + valueTotal;
  const estimatedValueHigh = Math.round(estimatedValueLow * 2);

  return { urgencyScore, qualityScore, estimatedValueLow, estimatedValueHigh };
}
