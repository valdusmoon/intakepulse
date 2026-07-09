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

export function questionOptions(question: VerticalQuestion): OptionLike[] {
  return (question.options ?? []).map((o) => ({ label: o.label, value: o.value }));
}

/** DTMF only offered for 2-3 option questions — a 4th+ option is speech-only. */
export function questionDtmfMap(question: VerticalQuestion): Record<string, string> | undefined {
  const opts = question.options ?? [];
  if (opts.length === 0 || opts.length > 3) return undefined;
  return Object.fromEntries(opts.map((o, i) => [String(i + 1), o.value]));
}

export function greetingPrompt(ctx: FlowContext): string {
  const { business } = ctx;
  const greeting =
    business.greetingMessage ||
    `Thanks for calling ${business.businessName}. The team is currently helping another customer and couldn't get to the phone.`;
  const disclosure =
    business.recordingEnabled && business.recordingDisclosure ? ` ${business.recordingDisclosure}` : "";

  return (
    `${greeting} I'm their automated intake assistant, and I can take a few details so they can follow up.${disclosure} ` +
    `Is this for a new issue, or are you calling about work already in progress? ` +
    `Press 1 for a new issue, press 2 if it's an existing job, or just tell me.`
  );
}

export function qualificationPrompt(question: VerticalQuestion): string {
  const opts = questionOptions(question);
  const dtmf = questionDtmfMap(question);
  if (!dtmf) {
    return `${question.label} You can just tell me.`;
  }
  const digitPhrases = opts.map((o, i) => `press ${i + 1} for ${o.label.toLowerCase()}`).join(", ");
  return `${question.label} ${digitPhrases}, or say your answer.`;
}

export function zipPrompt(): string {
  return "What's the ZIP code where the work is needed? You can say it or key it in on your keypad.";
}

export function namePrompt(prefix?: string): string {
  const ask = "Can I get your name?";
  return prefix ? `${prefix} ${ask}` : ask;
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
  const primaryQuestion = verticalConfig.questions[0];
  const primaryAnswer = primaryQuestion ? session.conversationContext.answers[primaryQuestion.key] : undefined;
  const primaryLabel = primaryQuestion?.options?.find((o) => o.value === primaryAnswer)?.label;

  const parts = [`Thanks, ${name}.`];
  if (primaryLabel) parts.push(`I have this noted as ${primaryLabel}${zip ? ` in ZIP code ${zip}` : ""}.`);
  parts.push(`${business.businessName} has received the request and will call you back${callback ? ` ${callback}` : " as soon as possible"}.`);
  return parts.join(" ");
}

export function goodbyeLine(): string {
  return "Thanks for calling — the team will be in touch soon. Goodbye.";
}

export function fallbackVoicemailLine(): string {
  return "I'm having trouble understanding — I'll save what we have so far and have the team call you back.";
}

export function existingCustomerAck(): string {
  return "Got it — I'll pass this along so the team can follow up on that.";
}

export function noTransferAvailableLine(): string {
  return "I'll make sure the team calls you back as soon as possible.";
}
