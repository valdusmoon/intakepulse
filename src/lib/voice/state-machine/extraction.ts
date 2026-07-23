/**
 * Multi-field extraction from the caller's opening free-form answer. The model
 * fills an `extract_intake` tool call with every field the caller already
 * mentioned; this validates that structured output against the vertical's real
 * question keys before any of it is trusted — an enum value the model invented,
 * a malformed ZIP, or a field the vertical doesn't have is dropped, not merged.
 *
 * Code still owns what happens next: this only turns one messy sentence into a
 * set of *candidate* answers. The engine decides which remaining fields are
 * worth asking (see engine.ts `advance`).
 */

import type { VerticalQuestion } from "@/lib/db/schema/verticalConfigs";
import { looksLikeName } from "./deterministic";

export interface ExtractionResult {
  /** Only set when the caller clearly signalled new vs existing. */
  isNewCustomer?: boolean;
  /** Only set when a well-formed 5-digit ZIP was stated. */
  zipCode?: string;
  /** Only set when the caller volunteered their name — it is never asked for on
   *  a job call. Shape-checked, so a stray phrase can't land as a name. */
  callerName?: string;
  /** Vertical question key → value, validated against that question's options. */
  answers: Record<string, string>;
}

export function validateExtraction(questions: VerticalQuestion[], args: unknown): ExtractionResult {
  const result: ExtractionResult = { answers: {} };
  const a = (args ?? {}) as Record<string, unknown>;

  if (a.customer_type === "new") result.isNewCustomer = true;
  else if (a.customer_type === "existing") result.isNewCustomer = false;
  // "unclear" or absent → leave undefined so the engine asks.

  if (typeof a.zip_code === "string") {
    const zip = a.zip_code.replace(/\D/g, "");
    if (zip.length === 5) result.zipCode = zip;
  }

  if (typeof a.caller_name === "string") {
    const name = a.caller_name.trim();
    if (looksLikeName(name)) result.callerName = name;
  }

  for (const q of questions) {
    const raw = a[q.key];
    if (typeof raw !== "string" || raw === "" || raw === "unclear") continue;
    const optionValues = q.options?.map((o) => o.value) ?? [];
    // For an option question, only accept a value that actually exists — the
    // model is enum-constrained by the tool schema, but never trust it blindly.
    if (optionValues.length > 0 && !optionValues.includes(raw)) continue;
    result.answers[q.key] = raw;
  }

  return result;
}
