/**
 * The control loop. Code owns the current state and every transition — the
 * model is only ever asked to (a) speak an exact fixed line, or (b) classify
 * the caller's last answer into one of a small allowed set. It never decides
 * what happens next; that's entirely this file.
 *
 * Turn shape for an option-based state: speak the prompt (tool_choice:"none") →
 * wait for the caller's transcript or a DTMF digit → resolve the answer via
 * DTMF map → deterministic option match → forced classify_answer tool call
 * (in that order of preference) → apply + transition.
 *
 * NOTE ON SEQUENCING: OpenAI Realtime rejects a new response.create while one
 * is still in flight. Any transition that needs to speak, then silently do
 * something, then speak again (e.g. confirmation → create the lead → hang up)
 * goes through session.onResponseDone, fired from the response.done event
 * (wired in openai-handler.service.ts) — never two response.create calls back
 * to back without waiting for the first to finish.
 */

import type WebSocket from "ws";
import { getVisibleQuestions } from "@/lib/verticals/filterAnswers";
import type { VerticalQuestion } from "@/lib/db/schema/verticalConfigs";
import { logger } from "@/lib/logger";
import type { RealtimeClient } from "../realtime-client";
import type { FlowContext } from "./types";
import { matchDeterministicIntent, type GlobalIntent } from "./global-intent";
import { cleanSpokenName, tryExtractZipDeterministic, tryMatchOptionLabel, tryMatchOrdinal, type OptionLike } from "./deterministic";
import { buildClassifyAnswerTool, DETECT_INTENT_TOOL, EXTRACT_ZIP_TOOL } from "./tools";
import {
  CALLBACK_DTMF,
  CALLBACK_OPTIONS,
  NEW_OR_EXISTING_DTMF,
  NEW_OR_EXISTING_OPTIONS,
  callbackPreferencePrompt,
  confirmationLine,
  existingCustomerAck,
  fallbackVoicemailLine,
  goodbyeLine,
  greetingPrompt,
  namePrompt,
  noTransferAvailableLine,
  qualificationPrompt,
  questionDtmfMap,
  questionOptions,
  startOverAckLine,
  transferringLine,
  zipPrompt,
} from "./call-flow";
import { captureLeadOnce, checkServiceArea, getPriceRangeForCategory, transferCallAction } from "../functions/actions";
import { INTERRUPTION } from "../config/constants";

const RETRY_LIMIT = 1; // "maximum clarification attempts per state: 1"

// ─── Entry point ──────────────────────────────────────────────────────────────

export function startCall(ctx: FlowContext, client: RealtimeClient): void {
  ctx.session.state = "new_or_existing";
  speak(ctx, client, greetingPrompt(ctx));
}

// ─── Caller input entry points (called from the stream route / openai-handler) ─

export async function handleTranscript(ctx: FlowContext, client: RealtimeClient, transcript: string): Promise<void> {
  ctx.session.conversationContext.transcript.push({ role: "user", message: transcript });

  // Cheap, deterministic global-intent check first — no model call, runs every turn.
  const intent = matchDeterministicIntent(transcript);
  if (intent) {
    await handleGlobalIntent(ctx, client, intent);
    return;
  }

  await routeAnswer(ctx, client, transcript);
}

export async function handleDtmf(
  ctx: FlowContext,
  client: RealtimeClient,
  ws: WebSocket,
  digit: string
): Promise<void> {
  // Only interrupt in-progress audio when this digit is actually going to be
  // acted on — a stray/unmapped keypress in a state with no DTMF meaning (e.g.
  // during the price-guidance or name prompt) used to cut off whatever the AI
  // was saying at that instant, even though the digit itself was ignored.
  if (ctx.session.state === "zip_code") {
    interruptCurrentResponse(ctx, client, ws);
    ctx.session.dtmfBuffer += digit;
    if (ctx.session.dtmfBuffer.length < 5) return;
    await applyZip(ctx, client, ctx.session.dtmfBuffer);
    return;
  }

  const dtmfMap = currentDtmfMap(ctx);
  const value = dtmfMap?.[digit];
  if (value) {
    interruptCurrentResponse(ctx, client, ws);
    await applyStateAnswer(ctx, client, value);
  }
  // Unmapped digit for the current state — silently ignored, no reprompt needed
}

export async function handleToolCall(ctx: FlowContext, client: RealtimeClient, name: string, args: any): Promise<void> {
  if (name === "classify_answer") {
    const value = args?.value;
    if (!value || value === "unclear") {
      await handleStateFailure(ctx, client);
      return;
    }
    await applyStateAnswer(ctx, client, value);
    return;
  }

  if (name === "extract_zip") {
    const zip = typeof args?.zip === "string" ? args.zip.replace(/\D/g, "") : "";
    if (zip.length !== 5) {
      await handleStateFailure(ctx, client);
      return;
    }
    await applyZip(ctx, client, zip);
    return;
  }

  if (name === "detect_intent") {
    const intent = args?.intent as GlobalIntent | undefined;
    if (intent && intent !== "unknown") {
      await handleGlobalIntent(ctx, client, intent);
    } else {
      await enterFallbackVoicemail(ctx, client);
    }
    return;
  }
}

/** Wired to the OpenAI response.done event — fires and clears any pending
 *  "speak, then silently do X" continuation. */
export function notifyResponseDone(ctx: FlowContext, client: RealtimeClient): void {
  // A response that finished normally has nothing left to truncate — without
  // this, a later interrupt (e.g. a DTMF digit pressed seconds after a prompt
  // already finished playing) computes a truncation point past the item's
  // actual audio length, using a stale timestamp baseline from this now-
  // completed turn (OpenAI rejects it: "Audio content of Xms is already
  // shorter than Yms").
  ctx.session.lastAssistantItem = undefined;
  ctx.session.responseStartTimestamp = undefined;
  ctx.session.responseActive = false;

  const cb = ctx.session.onResponseDone;
  if (!cb) return;
  ctx.session.onResponseDone = undefined;
  const result = cb();
  if (result instanceof Promise) {
    ctx.session.pendingContinuation = result;
  }
}

// ─── Answer routing ────────────────────────────────────────────────────────────

async function routeAnswer(ctx: FlowContext, client: RealtimeClient, transcript: string): Promise<void> {
  const { state } = ctx.session;

  if (state === "zip_code") {
    const zip = tryExtractZipDeterministic(transcript);
    if (zip) {
      await applyZip(ctx, client, zip);
    } else {
      ctx.session.responseActive = true;
      client.createResponse({
        instructions: `The caller said: "${transcript}". Extract their ZIP code.`,
        output_modalities: ["text"],
        tools: [EXTRACT_ZIP_TOOL],
        tool_choice: { type: "function", name: "extract_zip" },
      });
    }
    return;
  }

  if (state === "name") {
    const name = cleanSpokenName(transcript);
    if (name) {
      ctx.session.conversationContext.callerName = name;
      if (ctx.session.isNewCustomer === false) {
        enterConfirmation(ctx, client);
      } else if (!shouldAskCallbackPreference(ctx)) {
        // Already urgent enough (or the vertical has a strong urgency signal) —
        // don't make the caller answer a near-duplicate question.
        ctx.session.conversationContext.callbackPreference = "as soon as possible";
        enterConfirmation(ctx, client);
      } else {
        enterCallbackPreference(ctx, client);
      }
    } else {
      await handleStateFailure(ctx, client);
    }
    return;
  }

  const options = currentOptions(ctx);
  if (!options) return; // not currently awaiting an option-based answer (e.g. confirmation/end)

  const deterministic = tryMatchOptionLabel(transcript, options);
  if (deterministic) {
    await applyStateAnswer(ctx, client, deterministic);
    return;
  }

  // Spoken equivalent of a keypad press ("say two" == pressing 2) — only where
  // this state actually offered a numbered menu, so a number spoken in a
  // free-text state can't be misread as a menu position.
  if (currentDtmfMap(ctx)) {
    const ordinal = tryMatchOrdinal(transcript, options);
    if (ordinal) {
      await applyStateAnswer(ctx, client, ordinal);
      return;
    }
  }

  const allowedValues = options.map((o) => o.value);
  // Spell out the menu for the classifier — number, label, and the value to
  // return — rather than handing it bare enum codes with no idea what they mean
  // or that the caller may have answered with a menu number.
  const optionGuide = options.map((o, i) => `${i + 1} = "${o.label}" → return ${o.value}`).join("; ");
  ctx.session.responseActive = true;
  client.createResponse({
    instructions:
      `The caller was asked a multiple-choice question with these options: ${optionGuide}. ` +
      `They said: "${transcript}". Return the value for the option they chose — they may answer with ` +
      `the option's number, its name, or a close synonym. If nothing clearly matches, return "unclear".`,
    output_modalities: ["text"],
    tools: [buildClassifyAnswerTool(allowedValues)],
    tool_choice: { type: "function", name: "classify_answer" },
  });
}

async function applyStateAnswer(ctx: FlowContext, client: RealtimeClient, value: string): Promise<void> {
  resetAttempts(ctx, ctx.session.state);

  if (ctx.session.state === "new_or_existing") {
    if (value === "existing") {
      enterExistingCustomerPath(ctx, client);
    } else {
      ctx.session.isNewCustomer = true;
      ctx.session.qualificationIndex = 0;
      enterQualification(ctx, client);
    }
    return;
  }

  if (ctx.session.state === "qualification") {
    const question = currentQuestion(ctx);
    if (!question) return;
    ctx.session.hasStartedQualification = true;
    ctx.session.conversationContext.answers[question.key] = value;
    ctx.session.qualificationIndex += 1;

    // Ask ZIP right after the caller's said what happened, before the rest of
    // the qualification questions — feels less transactional than leading with it.
    if (!ctx.session.conversationContext.zipCode) {
      enterZipCode(ctx, client);
      return;
    }

    await continueQualification(ctx, client);
    return;
  }

  if (ctx.session.state === "callback_preference") {
    ctx.session.conversationContext.callbackPreference = value;
    enterConfirmation(ctx, client);
    return;
  }
}

// ─── State transitions ─────────────────────────────────────────────────────────

function enterQualification(ctx: FlowContext, client: RealtimeClient): void {
  const q = currentQuestion(ctx);
  if (q) {
    ctx.session.state = "qualification";
    speak(ctx, client, qualificationPrompt(q));
  } else {
    // Vertical has no configured questions at all — skip straight to ZIP
    enterZipCode(ctx, client);
  }
}

function enterZipCode(ctx: FlowContext, client: RealtimeClient): void {
  ctx.session.state = "zip_code";
  ctx.session.dtmfBuffer = "";
  speak(ctx, client, zipPrompt());
}

async function applyZip(ctx: FlowContext, client: RealtimeClient, zip: string): Promise<void> {
  resetAttempts(ctx, "zip_code");
  ctx.session.conversationContext.zipCode = zip;
  const result = checkServiceArea(ctx, zip);
  ctx.session.conversationContext.serviceAreaEligible = result.eligible;

  // Resume qualification from wherever it left off — NOT reset to 0, since the
  // first question was already answered before we asked for ZIP.
  await continueQualification(ctx, client);
}

async function continueQualification(ctx: FlowContext, client: RealtimeClient): Promise<void> {
  const next = currentQuestion(ctx);
  if (next) {
    ctx.session.state = "qualification";
    speak(ctx, client, qualificationPrompt(next));
    return;
  }
  await enterPriceEligibility(ctx, client);
}

async function enterPriceEligibility(ctx: FlowContext, client: RealtimeClient): Promise<void> {
  ctx.session.state = "price_eligibility";
  // The first question in a vertical's config doubles as its primary
  // category (e.g. damage type, service type) — read it generically rather
  // than a hardcoded key so this works for every vertical.
  const primaryQuestionKey = ctx.verticalConfig.questions[0]?.key;
  const category = primaryQuestionKey ? ctx.session.conversationContext.answers[primaryQuestionKey] : undefined;
  const price = category
    ? await getPriceRangeForCategory(ctx, category)
    : { eligible: false, message: "The team will need to review the details before discussing pricing." };

  ctx.session.conversationContext.priceEligible = price.eligible;
  ctx.session.conversationContext.priceMessage = price.message;

  ctx.session.state = "price_guidance"; // momentary — folded into the next spoken turn below
  ctx.session.state = "name";
  speak(ctx, client, namePrompt(price.message));
}

function enterCallbackPreference(ctx: FlowContext, client: RealtimeClient): void {
  ctx.session.state = "callback_preference";
  speak(ctx, client, callbackPreferencePrompt());
}

function enterConfirmation(ctx: FlowContext, client: RealtimeClient): void {
  ctx.session.state = "confirmation";
  speak(ctx, client, confirmationLine(ctx));
  ctx.session.onResponseDone = () => finishCall(ctx, client);
}

async function finishCall(ctx: FlowContext, client: RealtimeClient): Promise<void> {
  ctx.session.state = "create_lead";
  try {
    await captureLeadOnce(ctx);
  } catch (err) {
    logger.error("captureLead failed", { correlationId: ctx.session.correlationId, error: String(err) });
  }
  ctx.session.state = "end";
  speak(ctx, client, goodbyeLine());
  ctx.session.onResponseDone = () => {
    ctx.onComplete();
  };
}

function enterExistingCustomerPath(ctx: FlowContext, client: RealtimeClient, ackLine: string = existingCustomerAck()): void {
  ctx.session.isNewCustomer = false;
  ctx.session.state = "name";
  speak(ctx, client, namePrompt(ackLine));
}

async function enterFallbackVoicemail(ctx: FlowContext, client: RealtimeClient): Promise<void> {
  ctx.session.state = "fallback_voicemail";
  speak(ctx, client, fallbackVoicemailLine());
  ctx.session.onResponseDone = () => finishCall(ctx, client);
}

async function jumpToWrapUp(ctx: FlowContext, client: RealtimeClient, ackLine?: string): Promise<void> {
  ctx.session.isNewCustomer = false;
  if (ctx.session.conversationContext.callerName) {
    enterConfirmation(ctx, client);
  } else {
    ctx.session.state = "name";
    speak(ctx, client, namePrompt(ackLine));
  }
}

async function handleWantsHuman(ctx: FlowContext, client: RealtimeClient): Promise<void> {
  if (!ctx.session.urgentTransferNumber) {
    await jumpToWrapUp(ctx, client, noTransferAvailableLine());
    return;
  }
  speak(ctx, client, transferringLine());
  ctx.session.onResponseDone = () => transferCallAction(ctx); // fires only after the line finishes playing
}

// ─── Global intent dispatch ─────────────────────────────────────────────────────

async function handleGlobalIntent(ctx: FlowContext, client: RealtimeClient, intent: GlobalIntent): Promise<void> {
  switch (intent) {
    case "wants_human":
      await handleWantsHuman(ctx, client);
      return;
    case "existing_customer":
      enterExistingCustomerPath(ctx, client);
      return;
    case "leave_message":
      await jumpToWrapUp(ctx, client, "No problem, I'll take a quick message.");
      return;
    case "frustrated":
      await jumpToWrapUp(ctx, client, "I understand — let's make this quick.");
      return;
    case "start_over":
      ctx.session.qualificationIndex = 0;
      ctx.session.conversationContext.answers = {};
      ctx.session.conversationContext.zipCode = undefined;
      speak(ctx, client, startOverAckLine());
      ctx.session.onResponseDone = () => {
        enterQualification(ctx, client);
      };
      return;
    case "repeat":
      speak(ctx, client, retryPromptText(ctx));
      return;
    case "unsupported_question":
      speak(ctx, client, `I can take the details of your request, but the team will need to answer that directly. ${retryPromptText(ctx)}`);
      return;
    default:
      await handleStateFailure(ctx, client);
  }
}

// ─── Retry / fallback ───────────────────────────────────────────────────────────

async function handleStateFailure(ctx: FlowContext, client: RealtimeClient): Promise<void> {
  const state = ctx.session.state;
  const attempts = (ctx.session.attempts[state] ?? 0) + 1;
  ctx.session.attempts[state] = attempts;

  if (attempts <= RETRY_LIMIT) {
    speak(ctx, client, `Sorry, I didn't quite catch that. ${retryPromptText(ctx)}`);
    return;
  }

  // Retries exhausted — one last attempt via the global-intent fallback classifier
  // before giving up to voicemail.
  ctx.session.responseActive = true;
  client.createResponse({
    instructions: "The caller's last answer didn't match what was asked. Classify what they actually want.",
    output_modalities: ["text"],
    tools: [DETECT_INTENT_TOOL],
    tool_choice: { type: "function", name: "detect_intent" },
  });
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

/** Skip the near-duplicate "when should we call you back" question once urgency
 *  already answered it implicitly — only asked when the vertical has no urgency
 *  question at all, or the caller said it's not urgent. */
function shouldAskCallbackPreference(ctx: FlowContext): boolean {
  const hasUrgencyQuestion = ctx.verticalConfig.questions.some((q) => q.key === "urgency");
  if (!hasUrgencyQuestion) return true;
  return ctx.session.conversationContext.answers.urgency === "flexible";
}

function currentQuestion(ctx: FlowContext): VerticalQuestion | undefined {
  const visible = getVisibleQuestions(ctx.verticalConfig.questions, ctx.session.conversationContext.answers);
  return visible[ctx.session.qualificationIndex];
}

function currentOptions(ctx: FlowContext): OptionLike[] | null {
  switch (ctx.session.state) {
    case "new_or_existing":
      return NEW_OR_EXISTING_OPTIONS;
    case "callback_preference":
      return CALLBACK_OPTIONS;
    case "qualification": {
      const q = currentQuestion(ctx);
      return q ? questionOptions(q) : null;
    }
    default:
      return null;
  }
}

function currentDtmfMap(ctx: FlowContext): Record<string, string> | undefined {
  switch (ctx.session.state) {
    case "new_or_existing":
      return NEW_OR_EXISTING_DTMF;
    case "callback_preference":
      return CALLBACK_DTMF;
    case "qualification": {
      const q = currentQuestion(ctx);
      return q ? questionDtmfMap(q) : undefined;
    }
    default:
      return undefined;
  }
}

function retryPromptText(ctx: FlowContext): string {
  switch (ctx.session.state) {
    case "new_or_existing":
      return "Is this for a new issue, or an existing job? Press 1 for new, 2 for existing, or just tell me.";
    case "zip_code":
      return zipPrompt();
    case "qualification": {
      const q = currentQuestion(ctx);
      return q ? qualificationPrompt(q) : "Could you say that again?";
    }
    case "name":
      return "Sorry, what's your name?";
    case "callback_preference":
      return callbackPreferencePrompt();
    default:
      return "Could you say that again?";
  }
}

function resetAttempts(ctx: FlowContext, state: string): void {
  delete (ctx.session.attempts as Record<string, number>)[state];
}

function speak(ctx: FlowContext, client: RealtimeClient, text: string): void {
  ctx.session.responseActive = true;
  client.createResponse({
    instructions: `Say exactly, naturally, in one short turn: "${text}"`,
    tool_choice: "none",
  });
  ctx.session.conversationContext.transcript.push({ role: "assistant", message: text });
}

/** DTMF cuts off in-progress audio immediately — no VAD false-positive risk
 *  since a keypress is unambiguous. Mirrors the barge-in truncation math, just
 *  triggered by a different event. */
function interruptCurrentResponse(ctx: FlowContext, client: RealtimeClient, ws: WebSocket): void {
  if (ctx.session.streamSid) {
    ws.send(JSON.stringify({ event: "clear", streamSid: ctx.session.streamSid }));
  }
  client.cancelResponse();

  if (ctx.session.lastAssistantItem && ctx.session.responseStartTimestamp !== undefined) {
    const audioEndMs = ctx.session.latestMediaTimestamp - ctx.session.responseStartTimestamp;
    if (audioEndMs > INTERRUPTION.MIN_TRUNCATION_TIME) {
      client.truncateItem(ctx.session.lastAssistantItem, audioEndMs);
    }
    ctx.session.lastAssistantItem = undefined;
    ctx.session.responseStartTimestamp = undefined;
  }
}
