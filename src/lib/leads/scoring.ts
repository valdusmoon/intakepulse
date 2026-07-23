import type { ScoringRule, VerticalQuestion } from "@/lib/db/schema/verticalConfigs";
import { filterAnswersToVisible, type Answers } from "@/lib/verticals/filterAnswers";
import {
  resolveValueEstimate,
  type PricingRuleLike,
  type ValueRange,
  type ValueSource,
} from "./value-estimate";

export interface ScoringResult {
  urgencyScore: number;       // 1-10
  qualityScore: number;       // 1-100 — completeness/qualification of what was captured
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
export const SCORE_VERSION = "priority_v2";

export interface ScoreTrace {
  version: string;
  matchedRules: { answerKey: string; answerValue: string; urgencyBonus: number; qualityBonus: number; valueBonus: number }[];
  floorsApplied: string[]; // e.g. ["emergency_floor", "critical_signal_floor"]
  urgency100: number;
  quality100: number;
  valueScore: number;
  // v2 additions
  naturalPriority?: number;   // the pre-floor blend (floors band-map from this)
  qualitySignals?: string[];  // which completeness signals earned points
  valueSource?: ValueSource;  // owner_quoted | configured_price | calibrated_benchmark | benchmark
  valueCalibration?: number;  // benchmark scale factor, when calibrated
}

/** Optional signals that can only be known outside the structured answers. */
export interface ScoringContext {
  // The caller's own service words when they didn't map to a configured option
  // (off-list). Its PRESENCE means the service is clear (just off-menu) — so an
  // off-list emergency still floors to Hot; only a truly unidentified service
  // (no structured match AND no words) blocks the emergency floor.
  serviceRequested?: string | null;
  // Extra caller free-text (reason for call, notes) scanned for life-safety
  // keywords in addition to any free-text intake answers.
  signalText?: string | null;
  // Identity signals for the quality score — a lead with a name/email attached
  // is more workable than an anonymous number.
  callerName?: string | null;
  callerEmail?: string | null;
  // The business's configured prices (pricing_rules). When present, they are the
  // value-estimate source of truth: a priced service uses ITS range, and unpriced
  // services get the benchmark scaled by the business's calibration factor.
  pricingRules?: PricingRuleLike[] | null;
  // A price the team quoted on a recorded call — beats every other value source.
  ownerQuotedCents?: ValueRange | null;
  // AI relative estimate for an off-list/unbenchmarked job, anchored on the
  // business's own price list (estimate-unlisted-value.ts). Deterministic
  // sources always beat it.
  aiEstimatedCents?: ValueRange | null;
}

export type LeadTier = "Hot" | "Warm" | "Cool";

// The ONE place tier thresholds live. tier is derived from priorityScore (the
// composite), never from quality or urgency alone — everything that shows a
// Hot/Warm/Cool badge routes through priorityTier so the thresholds can't drift.
export const PRIORITY_TIERS = { hot: 65, warm: 40 } as const;

// Priority floors, applied as BAND MAPS (not flat clamps): a floored lead's score
// becomes `floor + (100 - floor) × natural/100`, so every emergency lands in the
// 70-100 band but the band is still ORDERED by the same urgency/value/quality
// blend — five plumbing emergencies rank against each other instead of all tying
// at exactly 70. "Hot" means "call this now", so urgency owns the ceiling: a
// stated emergency floors to Hot regardless of ticket size, and an explicit
// critical/immediate-response signal bands higher still. Warm/Cool thresholds are
// NOT lowered to catch high-value-but-flexible leads — those stay Cool and are
// surfaced with a "High value" badge instead (see isHighValueLead).
export const EMERGENCY_PRIORITY_FLOOR = 70;
export const CRITICAL_SIGNAL_PRIORITY_FLOOR = 80;
export const HIGH_VALUE_THRESHOLD = 80; // valueScore at/above which a lead is flagged high-value

// Curated, high-signal "critical / immediate-response" phrases — not strictly all
// life-safety (active flooding, sewer backup) but all "get someone out now". A
// non-negated hit bands priority from CRITICAL_SIGNAL_PRIORITY_FLOOR. Deliberately
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

// Quality = how COMPLETE / QUALIFIED the captured lead is — what we actually
// know, never how urgent or how big the job is (urgency and value are their own
// axes; folding them in made "quality" lie). Points are structural (computed
// from what was captured), not rule-driven, and deliberately sum to 100 for a
// fully-captured web lead. A perfect VOICE capture (service + urgency + ZIP —
// everything voice asks) lands at 65: the same lead scores the same no matter
// which channel it came through, and extras (coverage, recency, identity) are
// upside, not a penalty for the channel that doesn't ask them.
const QUALITY_POINTS = {
  serviceMatched: 35, // structured menu match
  serviceOffList: 28, // caller's own words captured — clear, but scope is fuzzier
  urgencyAnswered: 15,
  zip: 15,
  coverage: { covered: 20, out_of_pocket: 12, not_sure: 5 } as Record<string, number>,
  recency: { today: 5, this_week: 3, longer: 2 } as Record<string, number>,
  identity: 10, // caller name or email attached
} as const;

// priorityScore is the ONE composite the owner ranks/tiers on ("who do I call
// first"). It blends the three independent signals — never replaces them. Urgency
// leads (the owner mostly acts on time-sensitivity); value is a strong second;
// quality (qualification/completeness) is the smallest weight, mostly guarding
// against junk. All three are put on a common 0-100 scale before weighting.
const PRIORITY_WEIGHTS = { urgency: 0.5, value: 0.3, quality: 0.2 } as const;

// Value is normalized to 0-100 on a LOG band against a global dollar reference,
// not a per-vertical linear min/max: one vertical (electrical rewiring) has a
// large outlier and another ("other") is flat, both of which break linear scaling.
// Log compresses the outlier and still differentiates big vs small jobs within a
// trade.
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
  // whose question is currently visible. voiceExtractOnly fields (coverage,
  // recency) have no conditional, so a caller who volunteers them in their own
  // words is scored. What's dropped is orphaned conditional answers and stale/
  // hidden keys (e.g. a water_category answer left over after the service changed).
  const answers = filterAnswersToVisible(questions, rawAnswers);

  // ── Urgency: rule-driven (the only axis rules still score) ────────────────
  let urgencyTotal = 0;
  let legacyValueBonus = 0;
  const matchedRules: ScoreTrace["matchedRules"] = [];

  for (const rule of rules) {
    if (!answerMatches(answers[rule.answerKey], rule.answerValue)) continue;
    urgencyTotal += rule.urgencyBonus ?? 0;
    legacyValueBonus += rule.valueBonus ?? 0;
    matchedRules.push({
      answerKey: rule.answerKey,
      answerValue: rule.answerValue,
      urgencyBonus: rule.urgencyBonus ?? 0,
      qualityBonus: 0, // v2: quality is structural, rule qualityBonus is retired
      valueBonus: rule.valueBonus ?? 0,
    });
  }

  const urgencyScore = clamp(1, 10, Math.round(1 + (urgencyTotal / URGENCY_CAP) * 9));

  // ── Quality: structural completeness of the capture ───────────────────────
  const primaryKey = questions[0]?.key;
  const hasStructuredService = primaryKey ? !!answers[primaryKey] : false;
  const hasOffListService = !hasStructuredService && !!ctx.serviceRequested?.trim();

  const qualitySignals: string[] = [];
  let qualityTotal = 0;
  if (hasStructuredService) {
    qualityTotal += QUALITY_POINTS.serviceMatched;
    qualitySignals.push("service_matched");
  } else if (hasOffListService) {
    qualityTotal += QUALITY_POINTS.serviceOffList;
    qualitySignals.push("service_off_list");
  }
  if (typeof answers.urgency === "string" && answers.urgency) {
    qualityTotal += QUALITY_POINTS.urgencyAnswered;
    qualitySignals.push("urgency");
  }
  // ZIP rides alongside the Q&A under the shared zip_code key (it isn't a
  // vertical question, so read it from the RAW answers — the visibility filter
  // would drop it).
  if (typeof rawAnswers.zip_code === "string" && rawAnswers.zip_code.trim()) {
    qualityTotal += QUALITY_POINTS.zip;
    qualitySignals.push("zip");
  }
  const coveragePts = typeof answers.has_coverage === "string" ? QUALITY_POINTS.coverage[answers.has_coverage] ?? 0 : 0;
  if (coveragePts) {
    qualityTotal += coveragePts;
    qualitySignals.push(`coverage_${answers.has_coverage}`);
  }
  const recencyPts = typeof answers.time_since_issue === "string" ? QUALITY_POINTS.recency[answers.time_since_issue] ?? 0 : 0;
  if (recencyPts) {
    qualityTotal += recencyPts;
    qualitySignals.push(`recency_${answers.time_since_issue}`);
  }
  if (ctx.callerName?.trim() || ctx.callerEmail?.trim()) {
    qualityTotal += QUALITY_POINTS.identity;
    qualitySignals.push("identity");
  }
  const qualityScore = clamp(1, 100, Math.round(qualityTotal));

  // ── Value: services table → calibrated benchmark → benchmark (value-estimate.ts)
  const category =
    primaryKey && typeof answers[primaryKey] === "string" ? (answers[primaryKey] as string) : null;
  const benchmarksByCategory = new Map<string, ValueRange>();
  if (primaryKey) {
    for (const rule of rules) {
      if (rule.answerKey === primaryKey && rule.valueLowCents != null && rule.valueLowCents > 0) {
        benchmarksByCategory.set(rule.answerValue, {
          lowCents: rule.valueLowCents,
          highCents: rule.valueHighCents ?? rule.valueLowCents * 2,
        });
      }
    }
  }
  const estimate = resolveValueEstimate({
    ownerQuoted: ctx.ownerQuotedCents,
    category,
    benchmark: category ? benchmarksByCategory.get(category) ?? null : null,
    benchmarksByCategory,
    baseLowCents: baseValueLow,
    legacyValueBonusCents: legacyValueBonus,
    pricing: ctx.pricingRules,
    aiEstimate: ctx.aiEstimatedCents,
  });
  const estimatedValueLow = estimate.lowCents;
  const estimatedValueHigh = estimate.highCents;

  // ── Composite ranking — the three signals on a TRUE 0-100 scale, then weighted.
  const urgency100 = Math.round(((urgencyScore - 1) / 9) * 100);
  const quality100 = qualityScore;
  const valueScore = valueBand(estimatedValueLow);
  const naturalPriority = clamp(
    0,
    100,
    Math.round(
      PRIORITY_WEIGHTS.urgency * urgency100 +
        PRIORITY_WEIGHTS.value * valueScore +
        PRIORITY_WEIGHTS.quality * quality100
    )
  );
  let priorityScore = naturalPriority;

  // ── Priority floors (band maps — see the constants' comment) ──────────────
  const floorsApplied: string[] = [];
  const bandFrom = (floor: number) => floor + Math.round(((100 - floor) * naturalPriority) / 100);

  // Emergency → the Hot band, as long as the service is identified (matched a
  // configured option OR the caller gave off-list words). A truly unidentified
  // service does NOT float to Hot on the word "emergency" alone.
  const serviceUnclear = !hasStructuredService && !ctx.serviceRequested;
  if (answers.urgency === "emergency" && !serviceUnclear) {
    priorityScore = Math.max(priorityScore, bandFrom(EMERGENCY_PRIORITY_FLOOR));
    floorsApplied.push("emergency_floor");
  }

  // Explicit critical / immediate-response language bands higher still, independent
  // of urgency — scans free-text intake answers plus any caller words passed in.
  const freeText = [
    ...Object.values(answers).flat().filter((v): v is string => typeof v === "string"),
    ctx.serviceRequested ?? "",
    ctx.signalText ?? "",
  ].join(" ");
  if (hasCriticalSignal(freeText)) {
    priorityScore = Math.max(priorityScore, bandFrom(CRITICAL_SIGNAL_PRIORITY_FLOOR));
    floorsApplied.push("critical_signal_floor");
  }
  priorityScore = clamp(0, 100, priorityScore);

  const trace: ScoreTrace = {
    version: SCORE_VERSION,
    matchedRules,
    floorsApplied,
    urgency100,
    quality100,
    valueScore,
    naturalPriority,
    qualitySignals,
    valueSource: estimate.source,
    ...(estimate.calibration != null ? { valueCalibration: estimate.calibration } : {}),
  };

  return { urgencyScore, qualityScore, valueScore, estimatedValueLow, estimatedValueHigh, priorityScore, trace };
}
