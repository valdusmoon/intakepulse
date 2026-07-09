import type { VerticalQuestion } from "@/lib/db/schema/verticalConfigs";
import type { CustomServiceOption } from "@/lib/db/schema/businesses";

export type { CustomServiceOption };

/** Turns free-typed service text into an enum-safe value, e.g. "Duct Cleaning!" -> "duct_cleaning". */
export function slugifyServiceLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
}

/**
 * Merges a business's own custom service categories into the vertical's
 * primary (menu) question — the only question that's ever business-specific.
 * Every place that reads a vertical's questions (Settings, the public intake
 * form, the live voice call) must go through this, or a custom category the
 * business "added" is just a label nobody — not the caller, not the AI — can
 * actually select.
 */
export function withCustomServiceOptions(
  questions: VerticalQuestion[],
  customOptions: CustomServiceOption[]
): VerticalQuestion[] {
  if (questions.length === 0 || customOptions.length === 0) return questions;

  const [primary, ...rest] = questions;
  const existingValues = new Set((primary.options ?? []).map((o) => o.value));
  const additions = customOptions.filter((o) => !existingValues.has(o.value));
  if (additions.length === 0) return questions;

  return [{ ...primary, options: [...(primary.options ?? []), ...additions] }, ...rest];
}
