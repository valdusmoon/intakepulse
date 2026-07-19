// Single source of truth for the two billing options (same product, two Stripe
// prices — see NEXT_PUBLIC_STRIPE_PRICE_ID / _ANNUAL). No feature tiers: monthly
// and annual are the identical product, the choice is only cadence vs savings.

export type Plan = "monthly" | "annual";

export const MONTHLY_PRICE = 149; // $/mo
export const ANNUAL_PRICE = 1499; // $/yr, billed upfront, auto-renews
// 1499 / 12 = 124.92 → shown as the effective monthly on the annual option.
export const ANNUAL_MONTHLY_EQUIV = 125;
// Savings vs paying monthly for a year (149*12 = 1788).
export const ANNUAL_SAVINGS = MONTHLY_PRICE * 12 - ANNUAL_PRICE; // 289

export const PLAN_FEATURES = [
  "24/7 live answering on missed calls",
  "Answered-call summaries and transcripts",
  "Trade-specific qualification + priority scoring",
  "Ranked leads with value estimates",
  "Website widget + intake link",
  "Weekly performance recap",
] as const;
