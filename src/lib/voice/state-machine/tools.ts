/**
 * Model-facing classification tool schemas. Only three tools exist across the
 * entire flow — the engine forces exactly one of them per turn via tool_choice,
 * so there's no need for a large per-concept tool registry. Most states never
 * reach the model at all (see deterministic.ts) — these are the fallback path.
 */

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
          "unknown",
        ],
      },
    },
    required: ["intent"],
  },
};
