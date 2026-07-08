/**
 * Global intent detection — the escape hatch that keeps a rigid state machine
 * from getting stuck when a caller says something the current state doesn't
 * expect ("let me talk to a person", "I'm already a customer", etc).
 *
 * Two tiers, cheapest first:
 *  1. Deterministic phrase match (no model call) for a handful of unambiguous phrases.
 *  2. Model classification via the detect_intent tool (fallback only — never on
 *     every turn, only when a state's own classification has already failed).
 */

export type GlobalIntent =
  | "wants_human"
  | "existing_customer"
  | "unsupported_question"
  | "leave_message"
  | "start_over"
  | "repeat"
  | "frustrated"
  | "unknown";

const PHRASE_PATTERNS: Array<{ intent: GlobalIntent; patterns: RegExp[] }> = [
  {
    intent: "wants_human",
    patterns: [
      /\b(speak|talk) (to|with) (a |someone|somebody)?\s*(person|human|representative|manager|agent)\b/i,
      /\breal person\b/i,
      /\brepresentative\b/i,
    ],
  },
  {
    intent: "existing_customer",
    patterns: [
      /\balready (a |an )?(customer|client)\b/i,
      /\bexisting (job|customer|appointment)\b/i,
      /\byou (already |guys )?came out\b/i,
      /\bfollow(ing)? up on\b/i,
      /\bcalling about (my|the) (job|appointment|estimate)\b/i,
    ],
  },
  {
    intent: "leave_message",
    patterns: [
      /\bjust (leave|take) a message\b/i,
      /\bleave a voicemail\b/i,
    ],
  },
  {
    intent: "start_over",
    patterns: [/\bstart over\b/i, /\brestart\b/i, /\bfrom the beginning\b/i],
  },
  {
    intent: "repeat",
    patterns: [
      /\b(say|repeat) that again\b/i,
      /\bcan you repeat\b/i,
      /\bdidn'?t (hear|catch) (that|you)\b/i,
      /\bcome again\b/i,
    ],
  },
  {
    intent: "frustrated",
    patterns: [
      /\bthis is ridiculous\b/i,
      /\bforget (it|this)\b/i,
      /\bwaste of time\b/i,
      /\bfrustrat(ed|ing)\b/i,
    ],
  },
];

/** Cheap, deterministic first pass — no model call. Returns null if nothing matches. */
export function matchDeterministicIntent(transcript: string): GlobalIntent | null {
  for (const { intent, patterns } of PHRASE_PATTERNS) {
    if (patterns.some((p) => p.test(transcript))) return intent;
  }
  return null;
}
