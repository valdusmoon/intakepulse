/**
 * Deterministic-first parsing — cheaper and more reliable than a model call.
 * Hierarchy used throughout the engine: DTMF → deterministic parse → forced
 * model classification → global-intent fallback → retry/fallback state.
 */

export interface OptionLike {
  label: string;
  value: string;
}

/**
 * Match a transcript against a set of options via case-insensitive substring
 * containment on either the option's label OR its value — so "fire" matches an
 * option whose label is "Fire or Smoke" (value "fire"), not just a caller who
 * recites the whole label. Only returns a value when exactly one option matches;
 * anything ambiguous or unmatched falls through to model classification.
 */
export function tryMatchOptionLabel(transcript: string, options: OptionLike[]): string | null {
  const normalized = transcript.toLowerCase();
  const matches = options.filter((opt) => {
    const label = opt.label.toLowerCase();
    const value = opt.value.toLowerCase().replace(/_/g, " ");
    // Skip 1-2 char values (e.g. codes) to avoid incidental substring hits.
    const valueMatch = value.length >= 3 && normalized.includes(value);
    return normalized.includes(label) || valueMatch;
  });
  return matches.length === 1 ? matches[0].value : null;
}

// Spoken forms of a menu position — both the cardinal ("two") and ordinal
// ("second") a caller might use when a prompt said "press 2 for ...".
const ORDINAL_WORDS: Record<string, number> = {
  one: 1, first: 1,
  two: 2, second: 2,
  three: 3, third: 3,
  four: 4, fourth: 4,
  five: 5, fifth: 5,
  six: 6, sixth: 6,
  seven: 7, seventh: 7,
  eight: 8, eighth: 8,
  nine: 9, ninth: 9,
};

/**
 * Resolve a spoken menu number ("one", "1", "number two", "the second one",
 * "press 3") to the option at that 1-based position — the spoken equivalent of
 * pressing that key, and just as deterministic. Only fires when, after stripping
 * menu filler, the utterance is essentially *just* the number: "one" resolves,
 * but "I have one flooded room" does not (that's a real answer, left for the
 * classifier). Callers should only be given numbers where a keypad menu exists,
 * so the engine gates this on the current state actually offering DTMF.
 */
export function tryMatchOrdinal(transcript: string, options: OptionLike[]): string | null {
  let cleaned = transcript
    .toLowerCase()
    .replace(/[.!?,]/g, " ")
    .replace(/\b(press|option|number|choice|answer|select|choose|go with|the|just|uh+|um+|i'?ll do|that'?s|it'?s|my answer is)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // "the second one" — the trailing "one" is a pronoun ("that one"), not 1.
  const ordinalThenOne = cleaned.match(
    /^(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth)\s+one$/
  );
  if (ordinalThenOne) cleaned = ordinalThenOne[1];

  let n: number | null = null;
  if (/^\d+$/.test(cleaned)) n = parseInt(cleaned, 10);
  else if (cleaned in ORDINAL_WORDS) n = ORDINAL_WORDS[cleaned];

  if (n === null || n < 1 || n > options.length) return null;
  return options[n - 1].value;
}

/**
 * Extract a 5-digit US ZIP from a transcript. Whisper transcription normally
 * renders spoken digits as numerals ("oh seven oh three oh" → "07030"), so a
 * simple digit-run match handles the common case without any model call.
 */
export function tryExtractZipDeterministic(transcript: string): string | null {
  const match = transcript.match(/\b(\d{5})\b/);
  return match ? match[1] : null;
}

// Leading conversational filler before a name: "yeah, it's ...", "sure, my name is ...".
const NAME_LEAD_FILLER = /^\s*(yeah|yes|yep|sure|ok|okay|um+|uh+|hi|hello|hey|well|so|and|it'?s|its|i'?m|im|i am|my name is|the name is|name'?s|name is|this is)[\s,.:;-]+/i;

/**
 * Deterministic cleanup for a spoken name — strips lead-in filler and trims to the
 * first clause. "Yeah, it's Dolores Rivera. I have insurance too." → "Dolores Rivera".
 * The result is only trusted when looksLikeName() agrees; otherwise the engine falls
 * back to a model extraction. Never over-trust this: real callers ramble.
 */
export function cleanSpokenName(transcript: string): string {
  let s = transcript.trim();
  let prev = "";
  while (s !== prev) { prev = s; s = s.replace(NAME_LEAD_FILLER, ""); }
  // Cut at the first sentence boundary and drop any trailing "and/but/, ..." clause.
  s = s.split(/[.!?;]/)[0];
  s = s.replace(/\s+(and|but)\s+.*$/i, "").split(",")[0];
  return s.replace(/[.!?,]+$/, "").trim();
}

// The caller declined to give a name ("I'd rather not say"). Distinct from an
// unparseable answer — we proceed on their phone number, never store the refusal.
const NAME_REFUSAL = /\b(rather not|prefer not|won'?t (say|give|tell)|do(n'?t| not) (want|wanna|care) to (say|give|tell)|not (comfortable|gonna|going to) (say|give|tell)|no name|why do you need|none of your|keep (it|that) private|anonymous)\b/i;
export function isNameRefusal(transcript: string): boolean {
  return NAME_REFUSAL.test(transcript);
}

// Common one-word non-name answers that would otherwise pass the shape check
// ("No", "Bye", "okay thanks") — reject so they go to the model extractor / no-name.
const NAME_STOPWORDS = new Set([
  "no", "yes", "yeah", "yep", "nope", "nah", "bye", "goodbye", "okay", "ok", "hi", "hello", "hey",
  "thanks", "thank", "you", "sure", "nevermind", "nothing", "none", "wrong", "number", "sorry",
  "stop", "help", "what", "who", "why", "wait", "um", "uh", "please", "good",
]);

/** A conservative "does this look like an actual name?" check — 1-4 alphabetic
 *  tokens, reasonable length, not just filler words. Anything else goes to the
 *  model extractor. */
export function looksLikeName(s: string): boolean {
  if (!s || s.length > 40) return false;
  const tokens = s.split(/\s+/).filter(Boolean);
  if (tokens.length < 1 || tokens.length > 4) return false;
  if (!tokens.every((t) => /^[A-Za-z][A-Za-z'’.-]*$/.test(t))) return false;
  // "No", "okay thanks", "bye" — every token is filler, not a name.
  if (tokens.every((t) => NAME_STOPWORDS.has(t.toLowerCase()))) return false;
  return true;
}

// Words that indicate a caller actually has a restoration problem — used to refuse
// to SCREEN (irreversibly drop) any call mentioning a real service need. Deliberately
// the caller's problem nouns, not the industry name ("restoration"), which appears in
// sales pitches. Erring toward a message beats ever screening a real job.
const SERVICE_NEED = /\b(water|flood(ed|ing)?|leak(ing|s|ed)?|burst|pipe|sewage|sewer|backup|overflow(ing)?|fire|smoke|soot|mold|mould|mildew|damage|basement|ceiling|roof|attic|storm|wet|soaked|moisture|drywall|carpet|standing water)\b/i;
export function mentionsServiceNeed(text: string): boolean {
  return SERVICE_NEED.test(text);
}

/** True when the option that deterministically "matched" is actually NEGATED in the
 *  transcript ("it's NOT an emergency" wrongly matching the emergency option). Lets
 *  the engine discard a false keyword hit and defer to the model classifier. */
export function isNegatedOptionMatch(transcript: string, value: string, options: OptionLike[]): boolean {
  const opt = options.find((o) => o.value === value);
  if (!opt) return false;
  const keywords = [opt.label.toLowerCase(), opt.value.toLowerCase().replace(/_/g, " ")].filter((k) => k.length >= 3);
  const t = transcript.toLowerCase();
  return keywords.some((kw) =>
    new RegExp(`\\b(not|isn'?t|no|don'?t|doesn'?t|didn'?t|never|not really|not an?)\\b[^.?!]{0,25}\\b${escapeRe(kw)}\\b`, "i").test(t)
  );
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
