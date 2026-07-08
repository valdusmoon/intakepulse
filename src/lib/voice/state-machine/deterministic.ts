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
 * Match a transcript against a set of option labels via case-insensitive
 * substring containment. Only returns a value when exactly one option matches —
 * anything ambiguous or unmatched falls through to model classification.
 */
export function tryMatchOptionLabel(transcript: string, options: OptionLike[]): string | null {
  const normalized = transcript.toLowerCase();
  const matches = options.filter((opt) => normalized.includes(opt.label.toLowerCase()));
  return matches.length === 1 ? matches[0].value : null;
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
