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

/**
 * Light cleanup for a spoken name — strips common lead-in phrases rather than
 * calling the model. "My name is Daniel" → "Daniel".
 */
export function cleanSpokenName(transcript: string): string {
  return transcript
    .replace(/^\s*(my name is|this is|it'?s|i'?m|i am)\s+/i, "")
    .replace(/[.!?]+$/, "")
    .trim();
}
