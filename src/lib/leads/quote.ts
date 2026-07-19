import { getActivePricingRule } from "@/lib/db/queries/pricingRules";
import type { VerticalQuestion } from "@/lib/db/schema/verticalConfigs";
import type { Answers } from "@/lib/verticals/filterAnswers";

/** Spoken/shown when nothing is approved for this category. Never a composed
 *  price — if the business hasn't approved wording, we say we can't quote yet. */
export const NO_QUOTE_MESSAGE =
  "The team will need to review the details before discussing pricing.";

export interface QuoteResult {
  eligible: boolean;
  message: string;
}

/**
 * The quote step, shared by every intake channel. Voice used to own this and the
 * web form skipped it entirely, which meant the same caller heard a price range
 * on the phone and nothing on the form. One function so the channels can't drift.
 *
 * A vertical's first question doubles as its pricing category (damage type,
 * service type), so the category is read generically rather than from a
 * hardcoded key. An off-list service has no structured category and therefore no
 * approved rule — that correctly yields NO_QUOTE_MESSAGE.
 */
export async function quoteForAnswers(
  businessId: string,
  questions: VerticalQuestion[],
  answers: Answers
): Promise<QuoteResult> {
  const primaryKey = questions[0]?.key;
  const category = primaryKey ? answers[primaryKey] : undefined;
  if (typeof category !== "string" || !category) {
    return { eligible: false, message: NO_QUOTE_MESSAGE };
  }
  return quoteForCategory(businessId, category);
}

/** Same lookup when the category is already known (the voice flow resolves it
 *  from the state machine's captured answers). */
export async function quoteForCategory(businessId: string, category: string): Promise<QuoteResult> {
  const rule = await getActivePricingRule(businessId, category);
  if (!rule) return { eligible: false, message: NO_QUOTE_MESSAGE };
  return { eligible: true, message: rule.approvedCustomerMessage };
}
