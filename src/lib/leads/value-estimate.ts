/**
 * Resolves the backend dollar estimate for a job (docs/callverted-standard.md §Scoring).
 *
 * Source order — most specific truth wins:
 *   1. owner_quoted        — the team quoted a price on a recorded call; store THAT,
 *                            never our own guess.
 *   2. configured_price    — the business priced this service in Settings
 *                            (pricing_rules). The services table is always the
 *                            pricing source of truth when it speaks.
 *   3. calibrated_benchmark— service not priced, but the business priced OTHER
 *                            services: scale the industry benchmark by how this
 *                            business's configured prices compare to the benchmarks
 *                            (median ratio, clamped). "They charge 1.5× benchmark
 *                            for fire, so assume 1.5× for the unlisted service too."
 *   4. benchmark           — no configured prices at all: the vertical's benchmark
 *                            range as-is (or the v1 legacy base+bonus fallback).
 *   5. ai_relative         — OFF-LIST job (no benchmark exists at all): the model is
 *                            given the business's service list with prices as anchors
 *                            and judges the described job's worth relative to them
 *                            ("a full repipe is bigger work than a water heater") —
 *                            see estimate-unlisted-value.ts. Clamped, traced, and
 *                            beaten by every deterministic source above.
 *   6. base range          — the vertical's floor when even that is unavailable.
 *
 * These numbers are BACKEND-ONLY (alerts, ranking, reports). Nothing here is ever
 * spoken to a caller — the voice/web quote step reads approvedCustomerMessage
 * verbatim or says nothing (see quote.ts).
 */

import type { PricingType } from "@/lib/db/schema/pricingRules";

export type ValueSource = "owner_quoted" | "configured_price" | "calibrated_benchmark" | "benchmark" | "ai_relative";

export interface ValueRange {
  lowCents: number;
  highCents: number;
}

export interface ValueEstimate extends ValueRange {
  source: ValueSource;
  /** The benchmark scale factor applied (calibrated_benchmark only). */
  calibration?: number;
}

/** The slice of a pricing_rules row the estimator needs (schema-agnostic so
 *  tests don't have to build full DB rows). */
export interface PricingRuleLike {
  serviceCategory: string;
  pricingType: PricingType;
  minimumAmount: number | null;
  maximumAmount: number | null;
  fixedAmount: number | null;
  startingAmount: number | null;
  isActive: boolean;
}

// A business's rates plausibly range from a quarter of benchmark to 4× — beyond
// that the configured prices likely describe different work than the benchmark
// does, so stop extrapolating from them.
const CALIBRATION_MIN = 0.25;
const CALIBRATION_MAX = 4;

/** The numeric range a configured pricing rule states, or null when it states
 *  none (inspection_required, or a malformed row). */
export function configuredRange(rule: PricingRuleLike): ValueRange | null {
  if (!rule.isActive) return null;
  switch (rule.pricingType) {
    case "preliminary_range":
      return rule.minimumAmount != null && rule.maximumAmount != null && rule.minimumAmount > 0
        ? { lowCents: rule.minimumAmount, highCents: Math.max(rule.maximumAmount, rule.minimumAmount) }
        : null;
    case "fixed":
      return rule.fixedAmount != null && rule.fixedAmount > 0
        ? { lowCents: rule.fixedAmount, highCents: rule.fixedAmount }
        : null;
    case "starting":
      // "Starting at X" gives a floor; assume up to 2× for the estimate band.
      return rule.startingAmount != null && rule.startingAmount > 0
        ? { lowCents: rule.startingAmount, highCents: rule.startingAmount * 2 }
        : null;
    case "inspection_required":
      return null;
  }
}

/** Median ratio of configured price to benchmark across every service the
 *  business priced that also has a benchmark. 1 when nothing is comparable. */
export function calibrationFactor(
  pricing: PricingRuleLike[] | null | undefined,
  benchmarksByCategory: Map<string, ValueRange>
): number {
  if (!pricing?.length) return 1;
  const ratios: number[] = [];
  for (const rule of pricing) {
    const configured = configuredRange(rule);
    const benchmark = benchmarksByCategory.get(rule.serviceCategory);
    if (configured && benchmark && benchmark.lowCents > 0) {
      ratios.push(configured.lowCents / benchmark.lowCents);
    }
  }
  if (!ratios.length) return 1;
  ratios.sort((a, b) => a - b);
  const mid = Math.floor(ratios.length / 2);
  const median = ratios.length % 2 ? ratios[mid] : (ratios[mid - 1] + ratios[mid]) / 2;
  return Math.max(CALIBRATION_MIN, Math.min(CALIBRATION_MAX, median));
}

export function resolveValueEstimate(params: {
  /** Price the team quoted on a recorded call, if any — beats everything. */
  ownerQuoted?: ValueRange | null;
  /** The matched service category (primary answer), if any. */
  category: string | null;
  /** This service's benchmark range from the vertical's scoring rules, if defined. */
  benchmark: ValueRange | null;
  /** Every service benchmark for the vertical — the calibration comparison set. */
  benchmarksByCategory: Map<string, ValueRange>;
  /** Vertical fallback when the service has no benchmark (off-list / custom). */
  baseLowCents: number;
  /** priority_v1 legacy: summed valueBonus of matched rules (0 when none). */
  legacyValueBonusCents: number;
  /** The business's configured prices (pricing_rules rows). */
  pricing?: PricingRuleLike[] | null;
  /** AI relative estimate for an off-list/unbenchmarked job (already clamped by
   *  estimate-unlisted-value.ts). Used only when no deterministic source exists. */
  aiEstimate?: ValueRange | null;
}): ValueEstimate {
  const { ownerQuoted, category, benchmark, benchmarksByCategory, baseLowCents, legacyValueBonusCents, pricing, aiEstimate } = params;

  if (ownerQuoted && ownerQuoted.lowCents > 0) {
    return {
      lowCents: ownerQuoted.lowCents,
      highCents: Math.max(ownerQuoted.highCents, ownerQuoted.lowCents),
      source: "owner_quoted",
    };
  }

  if (category && pricing?.length) {
    const rule = pricing.find((p) => p.serviceCategory === category);
    const configured = rule ? configuredRange(rule) : null;
    if (configured) return { ...configured, source: "configured_price" };
  }

  const factor = calibrationFactor(pricing, benchmarksByCategory);
  const scale = (range: ValueRange): ValueEstimate => ({
    lowCents: Math.round(range.lowCents * factor),
    highCents: Math.round(range.highCents * factor),
    source: factor === 1 ? "benchmark" : "calibrated_benchmark",
    ...(factor === 1 ? {} : { calibration: Math.round(factor * 100) / 100 }),
  });

  if (benchmark) return scale(benchmark);

  // Legacy v1 rules (valueBonus, no ranges) — preserve base + bonus, high = 2×low.
  if (legacyValueBonusCents > 0) {
    return scale({ lowCents: baseLowCents + legacyValueBonusCents, highCents: (baseLowCents + legacyValueBonusCents) * 2 });
  }

  // Off-list / unbenchmarked: the AI's price-list-anchored relative estimate.
  if (aiEstimate && aiEstimate.lowCents > 0) {
    return {
      lowCents: aiEstimate.lowCents,
      highCents: Math.max(aiEstimate.highCents, aiEstimate.lowCents),
      source: "ai_relative",
    };
  }

  // Last resort: the vertical's base range.
  return scale({ lowCents: baseLowCents, highCents: baseLowCents * 2 });
}
