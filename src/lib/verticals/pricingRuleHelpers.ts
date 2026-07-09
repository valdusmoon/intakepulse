import type { PricingType } from "@/lib/db/schema/pricingRules";
import { slugifyServiceLabel } from "@/lib/verticals/customOptions";

export function labelForCategory(serviceOptions: { value: string; label: string }[], serviceCategory: string): string {
  return serviceOptions.find((o) => o.value === serviceCategory)?.label ?? serviceCategory;
}

/** Matches typed text against a known preset/custom option by label (case-insensitive); otherwise mints a new slug. */
export function resolveServiceCategory(serviceOptions: { value: string; label: string }[], typedLabel: string): string {
  const trimmed = typedLabel.trim();
  const match = serviceOptions.find((o) => o.label.toLowerCase() === trimmed.toLowerCase());
  return match ? match.value : slugifyServiceLabel(trimmed);
}

export function fmtDollars(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export interface PricingShape {
  pricingType: PricingType;
  minimumAmount: number | null;
  maximumAmount: number | null;
  fixedAmount: number | null;
  startingAmount: number | null;
}

/** The caller-facing sentence, derived entirely from the service + pricing type + amount — never invented by the AI, and never hand-written either. */
export function buildApprovedMessage(rule: PricingShape): string {
  switch (rule.pricingType) {
    case "preliminary_range":
      return rule.minimumAmount != null && rule.maximumAmount != null
        ? `This typically runs ${fmtDollars(rule.minimumAmount)} to ${fmtDollars(rule.maximumAmount)}, depending on the details — our team will confirm the exact cost after taking a look.`
        : "";
    case "fixed":
      return rule.fixedAmount != null ? `This is typically a flat ${fmtDollars(rule.fixedAmount)}.` : "";
    case "starting":
      return rule.startingAmount != null
        ? `This typically starts around ${fmtDollars(rule.startingAmount)}, depending on the scope — our team will confirm the exact cost.`
        : "";
    case "inspection_required":
      return "This varies too much to estimate over the phone — our team will need to take a look and provide a detailed quote.";
    default:
      return "";
  }
}
