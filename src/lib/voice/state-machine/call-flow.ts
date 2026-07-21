/**
 * Fixed/near-fixed prompt text for each bookend state of a call (greeting,
 * confirmation, goodbye, etc.), shared across every vertical.
 *
 * The qualification loop itself (the intake questions) is fully data-driven
 * from verticalConfigs.questions — nothing vertical-specific is hardcoded
 * there. These bookend prompts reference the vertical config generically too
 * (e.g. confirmationLine reads verticalConfig.questions[0] rather than a
 * hardcoded key), so adding a new vertical only means writing new seed data.
 */

import type { VerticalQuestion } from "@/lib/db/schema/verticalConfigs";
import type { OptionLike } from "./deterministic";
import type { FlowContext } from "./types";

export const NEW_OR_EXISTING_OPTIONS: OptionLike[] = [
  { label: "new", value: "new" },
  { label: "existing", value: "existing" },
];
export const NEW_OR_EXISTING_DTMF: Record<string, string> = { "1": "new", "2": "existing" };

export const CALLBACK_OPTIONS: OptionLike[] = [
  { label: "as soon as possible", value: "asap" },
  { label: "today", value: "today" },
  { label: "tomorrow", value: "tomorrow" },
];
export const CALLBACK_DTMF: Record<string, string> = { "1": "asap", "2": "today", "3": "tomorrow" };

/** "a" / "an" by the first sound of the following phrase — good enough for the
 *  short category/urgency labels this is used with (e.g. "an emergency water"). */
function aOrAn(phrase: string): string {
  return /^[aeiou]/i.test(phrase.trim()) ? `an ${phrase}` : `a ${phrase}`;
}

export function questionOptions(question: VerticalQuestion): OptionLike[] {
  return (question.options ?? []).map((o) => ({ label: o.label, value: o.value }));
}

/** DTMF only offered for 2-3 option questions — a 4th+ option is speech-only.
 *  Open-ended (voiceOpenAsk) questions get no keypad at all: we never read a
 *  numbered menu for them, so a "press 2" shortcut would be meaningless. */
export function questionDtmfMap(question: VerticalQuestion): Record<string, string> | undefined {
  if (question.voiceOpenAsk) return undefined;
  const opts = question.options ?? [];
  if (opts.length === 0 || opts.length > 3) return undefined;
  return Object.fromEntries(opts.map((o, i) => [String(i + 1), o.value]));
}

export function greetingPrompt(ctx: FlowContext): string {
  const { business } = ctx;

  // Spoken recording disclosure — only when the business has recording enabled AND
  // a disclosure configured (never leak an empty/null value into speech). This is
  // the AI (overflow) leg; the human-answered Dial leg speaks the same disclosure
  // via generateDialTwiml. Both legs disclose before any capture — the
  // two-party-consent point.
  const disclosure =
    business.recordingEnabled && business.recordingDisclosure ? `${business.recordingDisclosure} ` : "";

  // Custom greeting: keep the owner's line intact and slot any disclosure right
  // after it, before the open question.
  if (business.greetingMessage) {
    return `${business.greetingMessage} ${disclosure}Briefly, what's going on?`;
  }

  // Default greeting: lead with the business name, place the recording disclosure
  // BEFORE the bot self-identifies (so the notice lands first), then an open,
  // job-first question. Free-flow instead of a new/existing menu — the caller's
  // own description runs through extract_intake, which usually fills several fields
  // at once so the engine can skip straight past what they've told us. Keeps the AI
  // self-identification (transparency / bot-disclosure) the flow has always led with.
  return `Thanks for calling ${business.businessName}. ${disclosure}I'm the automated assistant and can get this to the team. Briefly, what's going on?`;
}

/** Asked only when the opening description didn't make new-vs-existing clear. */
export function newOrExistingPrompt(): string {
  return "Is this a new issue, or an existing job? Press 1 for new, press 2 for existing, or just tell me.";
}

/** The ONLY category question, and only when the opener was genuinely unclassifiable
 *  (triage contact_type = "unclear"). This is the fallback tree, never the opener. */
export function triageClarifyPrompt(): string {
  return "Sure — is this about a new job, an existing job, or should I take a message?";
}

/** One focused re-ask when the opener was empty/gibberish — gives concrete
 *  examples of what "what's going on?" means, before falling back to a message. */
export function descriptionRetryPrompt(): string {
  return "I just need a quick description — like “burst pipe,” “no heat,” or “mold inspection.” What's happening?";
}

export function qualificationPrompt(question: VerticalQuestion, opts?: { retry?: boolean }): string {
  // Open-ended service ask — no spoken menu. On a retry, offer the configured
  // services as examples (still "or describe it") so an off-list caller isn't
  // funneled back into a menu.
  if (question.voiceOpenAsk) {
    if (opts?.retry) {
      const examples = (question.options ?? []).map((o) => o.label.toLowerCase()).join(", ");
      return examples
        ? `${question.label} For example, ${examples} — or just describe what you need.`
        : `${question.label} Just tell me in a few words.`;
    }
    return `${question.label} Just tell me in a few words.`;
  }

  const options = questionOptions(question);
  const dtmf = questionDtmfMap(question);
  if (!dtmf) {
    return `${question.label} You can just tell me.`;
  }
  const digitPhrases = options.map((o, i) => `press ${i + 1} for ${o.label.toLowerCase()}`).join(", ");
  return `${question.label} ${digitPhrases}, or say your answer.`;
}

export function zipPrompt(): string {
  return "What's the ZIP code where the work is needed? You can say it or key it in on your keypad.";
}

export function namePrompt(prefix?: string): string {
  const ask = "Can I get your name?";
  return prefix ? `${prefix} ${ask}` : ask;
}

/** One open turn to capture why an existing customer called, or what a
 *  message/frustrated caller wants passed along — stored as reasonForCall. */
export function wrapUpReasonPrompt(mode: "existing" | "message"): string {
  return mode === "message"
    ? "Sure. Briefly, what would you like me to pass along?"
    : "Got it. What should I tell the team you're calling about?";
}

export function callbackPreferencePrompt(): string {
  return "When would you like the team to call you back? Press 1 for as soon as possible, press 2 for today, press 3 for tomorrow, or say your answer.";
}

export function confirmationLine(ctx: FlowContext): string {
  const { session, business, verticalConfig } = ctx;
  const name = session.conversationContext.callerName || "there";
  const zip = session.conversationContext.zipCode;
  const callback = session.conversationContext.callbackPreference;

  // The first question in a vertical's config doubles as its primary
  // category (e.g. damage type, service type) — reference it generically
  // rather than a hardcoded key so this line works for every vertical.
  const answers = session.conversationContext.answers;
  const primaryQuestion = verticalConfig.questions[0];
  const primaryLabel = primaryQuestion?.options?.find((o) => o.value === answers[primaryQuestion.key])?.label;

  // Reflect urgency back too when it's notable, so the caller hears we understood
  // how pressing it is. The urgency values are universal across verticals; map to
  // a short adjective rather than echoing the verbose menu label ("Emergency —
  // need help right now"). "flexible" adds nothing, so it's omitted.
  const URGENCY_WORD: Record<string, string> = { emergency: "emergency", soon: "urgent" };
  const urgencyWord = URGENCY_WORD[answers.urgency];

  const issue = [urgencyWord, primaryLabel?.toLowerCase()].filter(Boolean).join(" ");

  const parts = [`Thanks, ${name}.`];
  if (issue) parts.push(`I have this noted as ${aOrAn(issue)} issue${zip ? ` in ZIP code ${zip}` : ""}.`);
  else if (zip) parts.push(`I have this noted for ZIP code ${zip}.`);
  parts.push(`${business.businessName} has received the request and will call you back${callback ? ` ${callback}` : " as soon as possible"}.`);
  return parts.join(" ");
}

/** Spoken as the last turn before hangup, after confirmation or fallback-voicemail. */
export function goodbyeLine(): string {
  return "Thanks for calling — we'll get back to you shortly.";
}

/** Neutral sign-off for a screened call (wrong number / solicitation) — no lead is
 *  taken, so it must NOT promise a callback the way goodbyeLine does. */
export function screenedGoodbyeLine(): string {
  return "No problem — thanks for calling. Goodbye.";
}

/** The "anything I missed?" beat before confirming — used for messages and
 *  routine/partial jobs (an emergency job skips straight to confirmation). One
 *  chance to add context; a question here is captured for the team, not answered. */
export function finalCheckPrompt(): string {
  return "I'll send this to the team now. Is there anything important I missed?";
}

/** Spoken when the ~3-minute soft cap is hit — wrap the call gracefully and send
 *  what we have to the team rather than let it run on. */
export function gracefulCloseLine(): string {
  return "I have what I need to get this to the team — I'll send it over now so they can follow up.";
}

export function fallbackVoicemailLine(): string {
  return "I'm having trouble understanding — I'll save what we have so far and have the team call you back.";
}

export function existingCustomerAck(): string {
  return "Got it — I'll pass this along so the team can follow up on that.";
}

export function humanCallbackLine(): string {
  return "I'll make sure the team calls you back as soon as possible.";
}

export function startOverAckLine(): string {
  return "Okay, let's start over.";
}
