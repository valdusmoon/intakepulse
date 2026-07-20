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
  // ── Non-job intents added for the leadType='message' axis ──────────────────
  // "Soft" message intents: captured as a message record, but job signal wins —
  // the engine runs extract_intake FIRST at the opener, so a real job that
  // happens to mention money/a callback ("leak, and have someone call me back")
  // is still a job. These only divert when the opener has no job signal, or on a
  // later turn.
  | "billing"
  | "callback_request"
  // "Hard" junk intents: confident, unambiguous non-job phrasing that never
  // coexists with a real job. These short-circuit to a screened hang-up (NO lead
  // row) even at the opener. Kept deliberately tight — ambiguous never lands here.
  | "wrong_number"
  | "solicitation"
  | "unknown";

/** Junk intents that end the call with no lead (calls.outcome = 'screened'). */
export const HARD_JUNK_INTENTS: ReadonlySet<GlobalIntent> = new Set(["wrong_number", "solicitation"]);

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
  // Hard junk first so an obvious wrong-number / solicitation wins over any
  // softer match. These end the call with no lead.
  {
    intent: "wrong_number",
    patterns: [
      /\b(sorry,?\s*)?wrong number\b/i,
      /\bwrong (business|place|company)\b/i,
      /\bi (must have|might have|think i) (dialed|got|have|called) the wrong\b/i,
    ],
  },
  {
    intent: "solicitation",
    patterns: [
      /\b(seo|search engine optimization)\b.{0,20}\bservices?\b/i,
      /\b(marketing|advertising|web ?design|website|digital) (services|agency|company|solutions)\b/i,
      /\b(calling|reaching out)\b.{0,30}\b(to offer|about (our|your))\b.{0,30}\b(marketing|seo|website|advertising|leads?|ranking)\b/i,
      /\bmerchant (cash advance|services|processing)\b/i,
      /\bbusiness (loan|funding|financing)\b/i,
      /\blower your\b.{0,20}\b(processing|merchant|credit card) (fees|rates)\b/i,
    ],
  },
  // Soft message intents. Kept precise: these describe an existing-account money
  // matter or an explicit callback ask, NOT a new-job price question ("how much
  // to fix X" never matches these). Job signal still wins at the opener (engine
  // runs extraction first).
  {
    intent: "billing",
    patterns: [
      /\b(my|the|a|an|our) (bill|invoice|statement|balance|receipt|account balance)\b/i,
      /\bbilling (department|question|issue|problem|error)\b/i,
      /\bpay (my|the|a|an|off) (bill|invoice|balance)\b/i,
      /\bcharged (me )?(twice|again|too much|the wrong|extra|more)\b/i,
      /\bdouble[- ]charged\b/i,
      /\b(get|want|need)?\s*a refund\b/i,
      /\b(question|issue|problem) (about|with) (my|the|a) (bill|invoice|charge|payment)\b/i,
    ],
  },
  {
    intent: "callback_request",
    patterns: [
      /\b(can|could|would|will) (you|someone|somebody) (please )?call me back\b/i,
      /\bcall me back\b/i,
      /\bhave (someone|somebody|him|her|them|the owner) call me\b/i,
      /\breturn my call\b/i,
      /\bcall me (when|as soon as|back when)\b/i,
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
