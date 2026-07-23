/**
 * AI relative value estimate for a job that has NO deterministic price source —
 * an off-list service (caller's own words) or a custom/unbenchmarked menu option.
 *
 * The founder's design: give the model the business's ACTUAL service list with
 * prices as anchors ("we know a full pipe gut-and-replace is more than a single
 * pipe") and have it judge how much bigger or smaller the described job is.
 * Anchors are the business's configured prices where set, industry benchmarks
 * otherwise. The result is BACKEND-ONLY (ranking, alerts, reports) — nothing
 * here is ever spoken to a caller (quote.ts owns that, approved messages only) —
 * and it is beaten by every deterministic source (owner-quoted price, configured
 * price, benchmark; see value-estimate.ts).
 *
 * Never throws; returns null whenever it can't produce a trustworthy number
 * (no anchors, no API key, model failure, out-of-bounds answer), which lets the
 * ladder fall through to the vertical base range.
 */

import { openai } from "@/lib/openai";
import { logger } from "@/lib/logger";
import type { ScoringRule, VerticalQuestion } from "@/lib/db/schema/verticalConfigs";
import type { Answers } from "@/lib/verticals/filterAnswers";
import { configuredRange, type PricingRuleLike, type ValueRange } from "./value-estimate";

// Sanity bounds on what the model may claim a home-service job is worth.
const MIN_CENTS = 5_000; // $50
const MAX_CENTS = 25_000_000; // $250,000

interface Anchor {
  label: string;
  lowCents: number;
  highCents: number;
  fromBusinessPricing: boolean;
}

/** Decide whether an AI estimate is needed and produce it. Returns null when a
 *  deterministic source will cover the job (matched service with a configured
 *  price or a benchmark), when there's nothing to estimate, or on any failure. */
export async function maybeEstimateUnlistedValue(params: {
  questions: VerticalQuestion[];
  rules: ScoringRule[];
  answers: Answers;
  serviceRequested?: string | null;
  pricing?: PricingRuleLike[] | null;
  /** Trade label for the prompt, e.g. "plumbing" — business.vertical works. */
  vertical: string;
}): Promise<ValueRange | null> {
  const { questions, rules, answers, serviceRequested, pricing, vertical } = params;
  const primary = questions[0];
  const primaryKey = primary?.key;
  const category = primaryKey && typeof answers[primaryKey] === "string" ? (answers[primaryKey] as string) : null;

  let description: string | null = null;
  if (category) {
    // A matched service that any deterministic source covers needs no AI.
    const priced = pricing?.some((p) => p.serviceCategory === category && configuredRange(p));
    const hasBenchmark = rules.some(
      (r) => r.answerKey === primaryKey && r.answerValue === category && r.valueLowCents != null && r.valueLowCents > 0
    );
    if (priced || hasBenchmark) return null;
    // Custom / unbenchmarked menu option — estimate from its label.
    description = primary?.options?.find((o) => o.value === category)?.label ?? category;
  } else if (serviceRequested?.trim()) {
    description = serviceRequested.trim();
  }
  if (!description || !process.env.OPENAI_API_KEY) return null;

  // Anchors: the business's own prices where configured, benchmarks otherwise.
  const anchors: Anchor[] = [];
  if (primaryKey && primary?.options) {
    for (const opt of primary.options) {
      const rule = pricing?.find((p) => p.serviceCategory === opt.value);
      const priced = rule ? configuredRange(rule) : null;
      if (priced) {
        anchors.push({ label: opt.label, lowCents: priced.lowCents, highCents: priced.highCents, fromBusinessPricing: true });
        continue;
      }
      const benchmark = rules.find(
        (r) => r.answerKey === primaryKey && r.answerValue === opt.value && r.valueLowCents != null && r.valueLowCents > 0
      );
      if (benchmark) {
        anchors.push({
          label: opt.label,
          lowCents: benchmark.valueLowCents!,
          highCents: benchmark.valueHighCents ?? benchmark.valueLowCents! * 2,
          fromBusinessPricing: false,
        });
      }
    }
  }
  // With zero anchors the model has no guidelines — a guess would be ours, not
  // theirs. Fall through to the base range instead.
  if (!anchors.length) return null;

  const usd = (c: number) => `$${Math.round(c / 100).toLocaleString("en-US")}`;
  const anchorLines = anchors
    .map((a) => `- ${a.label}: ${usd(a.lowCents)}–${usd(a.highCents)}${a.fromBusinessPricing ? " (this business's own price)" : " (industry benchmark)"}`)
    .join("\n");

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "You estimate the dollar value of home-service jobs for INTERNAL lead ranking. The number is never shown or quoted to the customer. Judge the described job RELATIVE to the anchor services and their prices: is it bigger or smaller work than each anchor, and by roughly how much? Stay realistic for the trade.",
        },
        {
          role: "user",
          content: `Business type: ${vertical.replace(/_/g, " ")}.

Their service list with prices:
${anchorLines}

A customer described a job that is NOT on that list:
"${description}"

Estimate a realistic low and high dollar value for this job for this business, using the anchor prices as guidelines.`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "estimate_job_value",
            description: "Record the estimated value range for the described job.",
            parameters: {
              type: "object",
              properties: {
                low_dollars: { type: "number", description: "Realistic low end of the job's value, in dollars." },
                high_dollars: { type: "number", description: "Realistic high end of the job's value, in dollars." },
                reasoning: { type: "string", description: "One sentence: which anchors this was judged against and why." },
              },
              required: ["low_dollars", "high_dollars"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "estimate_job_value" } },
    });

    const toolCall = completion.choices[0]?.message?.tool_calls?.[0];
    const raw = toolCall?.type === "function" ? toolCall.function.arguments : null;
    if (!raw) return null;
    const args = JSON.parse(raw) as { low_dollars?: unknown; high_dollars?: unknown; reasoning?: unknown };
    const low = typeof args.low_dollars === "number" ? Math.round(args.low_dollars * 100) : NaN;
    const high = typeof args.high_dollars === "number" ? Math.round(args.high_dollars * 100) : NaN;
    if (!Number.isFinite(low) || low < MIN_CENTS || low > MAX_CENTS) return null;
    const clampedHigh = Number.isFinite(high) ? Math.min(Math.max(high, low), MAX_CENTS) : low * 2;
    logger.info("Unlisted-service value estimated relative to price list", {
      description,
      lowCents: low,
      highCents: clampedHigh,
      reasoning: typeof args.reasoning === "string" ? args.reasoning : undefined,
    });
    return { lowCents: low, highCents: clampedHigh };
  } catch (error) {
    logger.error("estimateUnlistedValue failed", { description, error: String(error) });
    return null;
  }
}
