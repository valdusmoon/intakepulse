/**
 * The ONE callback-promise phrase, shared by every channel — the voice
 * confirmation (scripted line + Realtime instruction), the web/widget form's
 * AI-generated closing, and the form's static fallback all import this, so a
 * caller and a web submitter are always promised the same thing.
 *
 * Every phrase here is deliberately relative, never a clock. We're speaking on
 * the business's behalf to someone who will hold them to it, and we have no
 * visibility into their crew's day — so nothing here may name a time, a window,
 * or a day ("today", "within the hour"). Convey priority, not a deadline: the
 * goal is that they wait for the callback instead of contacting the next
 * company, and a prompt-sounding promise that can't be broken beats a specific
 * one that can.
 *
 * Kept in its own module (no server-only imports) so client components can use
 * it too.
 */
export function callbackPhraseForUrgency(urgency?: unknown): string {
  if (urgency === "emergency") return "as soon as possible";
  if (urgency === "soon") return "as soon as they can";
  return "shortly";
}
