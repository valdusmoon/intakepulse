/**
 * Model-facing classification tool schemas. The engine forces exactly one tool
 * per turn via tool_choice, so there's no need for a large per-concept registry.
 * Most states never reach the model at all (see deterministic.ts) — these are
 * the fallback/extraction paths.
 */

import type { VerticalQuestion } from "@/lib/db/schema/verticalConfigs";

export interface FunctionDefinition {
  name: string;
  type: "function";
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * Multi-field extractor for the caller's opening free-form answer — the crux of
 * adaptive intake. Built per-vertical so its schema mirrors that vertical's real
 * question keys (enum-constrained for option questions), plus the two bookend
 * fields every call needs (customer_type, zip_code). ALL fields are optional:
 * the model must only fill what the caller actually said and omit the rest, so
 * one sentence can populate several fields at once without inviting guesses.
 * Validated by extraction.ts before anything is merged.
 */
export function buildExtractIntakeTool(questions: VerticalQuestion[]): FunctionDefinition {
  const properties: Record<string, unknown> = {
    customer_type: {
      type: "string",
      enum: ["new", "existing", "unclear"],
      description:
        "Whether this is a brand-new request/issue or an existing job already in progress. Use \"unclear\" if the caller didn't indicate.",
    },
    zip_code: {
      type: "string",
      description: "The 5-digit US ZIP code where the work is needed, only if the caller stated it. Omit otherwise.",
    },
  };

  for (const q of questions) {
    const opts = q.options ?? [];
    if (opts.length > 0) {
      // Spell out what each enum value means so the model maps a phrase ("three
      // rooms") onto the right bucket value ("two_three") instead of guessing.
      const guide = opts.map((o) => `${o.value} = ${o.label}`).join("; ");
      properties[q.key] = { type: "string", enum: opts.map((o) => o.value), description: `${q.label} Options: ${guide}` };
    } else {
      properties[q.key] = { type: "string", description: q.label };
    }
  }

  return {
    name: "extract_intake",
    type: "function",
    description:
      "Capture every field the caller has ALREADY mentioned in their own words, in a single pass. " +
      "Include a field only if the caller clearly indicated it — omit anything they did not say. " +
      "Do not guess or infer beyond what was actually stated.",
    parameters: { type: "object", properties },
  };
}

/**
 * Three-way classifier for the open-ended primary SERVICE question. Unlike the
 * generic classify_answer (matched-or-unclear), this separates a clear service
 * that just isn't configured ("off_list" — capture it, no re-ask, no quote) from
 * a genuinely vague non-answer ("unclear" — worth one clarification). This is the
 * "unclear ≠ off-list" rule: only vague answers get retried.
 */
export function buildClassifyServiceTool(options: { value: string; label: string }[]): FunctionDefinition {
  return {
    name: "classify_service",
    type: "function",
    description:
      "Classify the service the caller asked for. Use \"matched\" (with matched_value) only if it clearly maps to one of the business's configured services. Use \"off_list\" if they named a specific service, trade, or issue that is NOT one of those configured services. Use \"unclear\" ONLY if they were vague and did not name any specific service or problem at all.",
    parameters: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["matched", "off_list", "unclear"] },
        matched_value: {
          type: "string",
          enum: options.map((o) => o.value),
          description: `Only when status is "matched" — the configured service value. Options: ${options.map((o) => `${o.value} = ${o.label}`).join("; ")}`,
        },
      },
      required: ["status"],
    },
  };
}

/** Generic single-value classifier — the allowed enum is built per-state from
 *  that state's actual options (e.g. a vertical question's option values, or
 *  callback-preference choices). Reused for every enum-based state. */
export function buildClassifyAnswerTool(allowedValues: string[]): FunctionDefinition {
  return {
    name: "classify_answer",
    type: "function",
    description:
      "Classify the caller's spoken answer into exactly one of the allowed values. If none fit, return \"unclear\".",
    parameters: {
      type: "object",
      properties: {
        value: {
          type: "string",
          enum: [...allowedValues, "unclear"],
        },
      },
      required: ["value"],
    },
  };
}

/** Fallback extractor for ZIP code when deterministic digit-parsing fails
 *  (e.g. the caller said "one two three four five" instead of digits). */
export const EXTRACT_ZIP_TOOL: FunctionDefinition = {
  name: "extract_zip",
  type: "function",
  description: "Extract a 5-digit US ZIP code from what the caller said, normalizing spoken digits.",
  parameters: {
    type: "object",
    properties: {
      zip: { type: "string", description: "Exactly 5 digits, or empty string if none could be determined" },
    },
    required: ["zip"],
  },
};

/**
 * Fallback-only global intent classifier — invoked when a state's own
 * classification fails to match an allowed value, not on every turn.
 */
export const DETECT_INTENT_TOOL: FunctionDefinition = {
  name: "detect_intent",
  type: "function",
  description:
    "The caller's answer didn't fit what was asked. Classify what they actually seem to want.",
  parameters: {
    type: "object",
    properties: {
      intent: {
        type: "string",
        enum: [
          "wants_human",
          "existing_customer",
          "unsupported_question",
          "leave_message",
          "start_over",
          "repeat",
          "frustrated",
          "billing",
          "callback_request",
          "wrong_number",
          "solicitation",
          "unknown",
        ],
      },
    },
    required: ["intent"],
  },
};
