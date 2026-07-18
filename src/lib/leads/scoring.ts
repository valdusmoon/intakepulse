import type { ScoringRule, VerticalQuestion } from "@/lib/db/schema/verticalConfigs";
import { filterAnswersToVisible, type Answers } from "@/lib/verticals/filterAnswers";

export interface ScoringResult {
  urgencyScore: number;       // 1-10
  qualityScore: number;       // 1-100
  valueScore: number;         // 0-100 — job size on the normalized value band
  estimatedValueLow: number;  // cents
  estimatedValueHigh: number; // cents
  priorityScore: number;      // 0-100 — composite "who to call first" ranking
  trace: ScoreTrace;          // deterministic explanation of how the score was reached
}

// Persisted alongside the lead so any score is fully explainable after the fact
// ("why is this Hot?") without re-deriving it. Bump `version` whenever the weights,
// floors, or normalization change so old leads stay interpretable against the model
// that actually scored them.
export const SCORE_VERSION = "priority_v1";

export interface ScoreTrace {
  version: string;
  matchedRules: { answerKey: string; answerValue: string; urgencyBonus: number; qualityBonus: number; valueBonus: number }[];
  floorsApplied: string[]; // e.g. ["emergency_floor", "critical_signal_floor"]
  urgency100: number;
  quality100: number;
  valueScore: number;
}

/** Optional signals that can only be known outside the structured answers — used
 *  for the priority floors. Both fields are best-effort; omit when unavailable. */
export interface ScoringContext {
  // The caller's own service words when they didn't map to a configured option
  // (off-list). Its PRESENCE means the service is clear (just off-menu) — so an
  // off-list emergency still floors to Hot; only a truly unidentified service
  // (no structured match AND no words) blocks the emergency floor.
  serviceRequested?: string | null;
  // Extra caller free-text (reason for call, notes) scanned for life-safety
  // keywords in addition to any free-text intake answers.
  signalText?: string | null;
}

export type LeadTier = "Hot" | "Warm" | "Cool";

// The ONE place tier thresholds live. tier is derived from priorityScore (the
// composite), never from quality or urgency alone — everything that shows a
// Hot/Warm/Cool badge routes through priorityTier so the thresholds can't drift.
export const PRIORITY_TIERS = { hot: 65, warm: 40 } as const;

// Priority floors (applied after the blend). "Hot" means "call this now", so
// urgency owns the ceiling: a stated emergency floors to Hot regardless of ticket
// size (speed-to-lead beats dollar value on emergencies), and an explicit
// critical/immediate-response signal floors higher still. Warm/Cool thresholds are
// NOT lowered to catch high-value-but-flexible leads — those stay Cool and are
// surfaced with a "High value" badge instead (see isHighValueLead).
export const EMERGENCY_PRIORITY_FLOOR = 70;
export const CRITICAL_SIGNAL_PRIORITY_FLOOR = 80;
export const HIGH_VALUE_THRESHOLD = 80; // valueScore at/above which a lead is flagged high-value

// Curated, high-signal "critical / immediate-response" phrases — not strictly all
// life-safety (active flooding, sewer backup) but all "get someone out now". A
// non-negated hit floors priority to CRITICAL_SIGNAL_PRIORITY_FLOOR. Deliberately
// conservative (bare "smoke"/"no heat" excluded as too ambiguous; revisit w/ owner).
const CRITICAL_SIGNAL_RE =
  /\b(gas (?:leak|smell)|smell(?:ing)? (?:of )?gas|carbon monoxide|sparking|electrical fire|burning (?:smell|wire|plastic)|active(?:ly)? flooding|sewage (?:backup|backing up)|sewer backup)\b/gi;

// Basic negation guard so "no active flooding" / "I don't smell gas" don't trigger.
const NEGATION_RE = /\b(no|not|n['’]?t|never|without|don['’]?t|isn['’]?t|aren['’]?t|wasn['’]?t)\b/i;

/** True when the text contains a critical signal that is NOT negated just before it. */
function hasCriticalSignal(text: string): boolean {
  for (const m of text.matchAll(CRITICAL_SIGNAL_RE)) {
    const preceding = text.slice(Math.max(0, m.index - 25), m.index);
    if (!NEGATION_RE.test(preceding)) return true;
  }
  return false;
}

export function priorityTier(priorityScore: number): LeadTier {
  return priorityScore >= PRIORITY_TIERS.hot ? "Hot" : priorityScore >= PRIORITY_TIERS.warm ? "Warm" : "Cool";
}

/** A lead worth surfacing on value alone (independent of tier) — drives the
 *  "High value" badge so a big flexible job reads "Cool · High value", not Warm. */
export function isHighValueLead(estimatedValueLowCents: number | null | undefined): boolean {
  return estimatedValueLowCents != null && valueBand(estimatedValueLowCents) >= HIGH_VALUE_THRESHOLD;
}

const URGENCY_CAP = 15;
const QUALITY_CAP = 65;

// priorityScore is the ONE composite the owner ranks/tiers on ("who do I call
// first"). It blends the three independent signals — never replaces them. Urgency
// leads (the owner mostly acts on time-sensitivity); value is a strong second;
// quality (qualification/completeness) is the smallest weight, mostly guarding
// against junk. All three are put on a common 0-100 scale before weighting.
const PRIORITY_WEIGHTS = { urgency: 0.5, value: 0.3, quality: 0.2 } as const;

// Value is normalized to 0-100 on a LOG band against a global dollar reference,
// not a per-vertical linear min/max: one vertical (electrical rewiring) has a
// 6.6x outlier and another ("other") is flat, both of which break linear scaling.
// Log compresses the outlier and still differentiates big vs small jobs within a
// trade. These refs are the seam for future per-vertical / per-client value ranges.
const VALUE_REF_LOW = 150;    // dollars → value100 = 0
const VALUE_REF_HIGH = 10000; // dollars → value100 = 100

function clamp(min: number, max: number, n: number) {
  return Math.max(min, Math.min(max, n));
}

/** Map an estimated dollar value (cents in) to 0-100 on a log curve. */
function valueBand(estimatedValueLowCents: number): number {
  const dollars = estimatedValueLowCents / 100;
  if (dollars <= VALUE_REF_LOW) return 0;
  const t = (Math.log(dollars) - Math.log(VALUE_REF_LOW)) / (Math.log(VALUE_REF_HIGH) - Math.log(VALUE_REF_LOW));
  return clamp(0, 100, Math.round(t * 100));
}

function answerMatches(answer: string | string[] | undefined, ruleValue: string): boolean {
  if (!answer) return false;
  return Array.isArray(answer) ? answer.includes(ruleValue) : answer === ruleValue;
}

export function scoreLeadFromAnswers(
  rawAnswers: Answers,
  rules: ScoringRule[],
  questions: VerticalQuestion[],
  baseValueLow: number,
  ctx: ScoringContext = {}
): ScoringResult {
  // Score only answers that were asked, shown, or volunteered — i.e. every answer
  // whose question is currently visible. voiceExtractOnly fields (coverage, recency,
  // rooms, cause) have no conditional, so a caller who volunteers them in their own
  // words is scored. What's dropped is orphaned conditional answers and stale/hidden
  // keys (e.g. a water_category answer left over after the service changed to fire).
  const answers = filterAnswersToVisible(questions, rawAnswers);

  let urgencyTotal = 0;
  let qualityTotal = 0;
  let valueTotal = 0;
  const matchedRules: ScoreTrace["matchedRules"] = [];

  for (const rule of rules) {
    if (!answerMatches(answers[rule.answerKey], rule.answerValue)) continue;
    urgencyTotal += rule.urgencyBonus ?? 0;
    qualityTotal += rule.qualityBonus ?? 0;
    valueTotal += rule.valueBonus ?? 0;
    matchedRules.push({
      answerKey: rule.answerKey,
      answerValue: rule.answerValue,
      urgencyBonus: rule.urgencyBonus ?? 0,
      qualityBonus: rule.qualityBonus ?? 0,
      valueBonus: rule.valueBonus ?? 0,
    });
  }

  const urgencyScore = clamp(1, 10, Math.round(1 + (urgencyTotal / URGENCY_CAP) * 9));
  const qualityScore = clamp(1, 100, Math.round(1 + (qualityTotal / QUALITY_CAP) * 99));
  const estimatedValueLow = baseValueLow + valueTotal;
  const estimatedValueHigh = Math.round(estimatedValueLow * 2);

  // Composite ranking — the three signals on a TRUE 0-100 scale (no urgency/quality
  // floor leaking in), then weighted. A no-signal lead contributes 0 from that axis.
  const urgency100 = Math.round(((urgencyScore - 1) / 9) * 100);
  const quality100 = Math.round(((qualityScore - 1) / 99) * 100);
  const valueScore = valueBand(estimatedValueLow);
  let priorityScore = clamp(
    0,
    100,
    Math.round(
      PRIORITY_WEIGHTS.urgency * urgency100 +
        PRIORITY_WEIGHTS.value * valueScore +
        PRIORITY_WEIGHTS.quality * quality100
    )
  );

  // ── Priority floors ──────────────────────────────────────────────────────
  const floorsApplied: string[] = [];

  // Emergency → Hot, as long as the service is identified (matched a configured
  // option OR the caller gave off-list words). A truly unidentified service does
  // NOT float to Hot on the word "emergency" alone.
  const primaryKey = questions[0]?.key;
  const hasStructuredService = primaryKey ? !!answers[primaryKey] : false;
  const serviceUnclear = !hasStructuredService && !ctx.serviceRequested;
  if (answers.urgency === "emergency" && !serviceUnclear) {
    priorityScore = Math.max(priorityScore, EMERGENCY_PRIORITY_FLOOR);
    floorsApplied.push("emergency_floor");
  }

  // Explicit critical / immediate-response language floors higher still, independent
  // of urgency — scans free-text intake answers plus any caller words passed in.
  const freeText = [
    ...Object.values(answers).flat().filter((v): v is string => typeof v === "string"),
    ctx.serviceRequested ?? "",
    ctx.signalText ?? "",
  ].join(" ");
  if (hasCriticalSignal(freeText)) {
    priorityScore = Math.max(priorityScore, CRITICAL_SIGNAL_PRIORITY_FLOOR);
    floorsApplied.push("critical_signal_floor");
  }

  const trace: ScoreTrace = { version: SCORE_VERSION, matchedRules, floorsApplied, urgency100, quality100, valueScore };

  return { urgencyScore, qualityScore, valueScore, estimatedValueLow, estimatedValueHigh, priorityScore, trace };
}
