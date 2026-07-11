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
import { buildClassifyAnswerTool, buildExtractIntakeTool, DETECT_INTENT_TOOL, EXTRACT_ZIP_TOOL } from "./tools";
import { validateExtraction } from "./extraction";
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
  newOrExistingPrompt,
  noTransferAvailableLine,
  qualificationPrompt,
  questionDtmfMap,
  questionOptions,
  startOverAckLine,
  transferringLine,
  wrapUpReasonPrompt,
  zipPrompt,
} from "./call-flow";
import { captureLeadOnce, checkServiceArea, getPriceRangeForCategory, transferCallAction } from "../functions/actions";
import { INTERRUPTION } from "../config/constants";

const RETRY_LIMIT = 1; // "maximum clarification attempts per state: 1"

// ─── Entry point ──────────────────────────────────────────────────────────────

export function startCall(ctx: FlowContext, client: RealtimeClient): void {
  // Open with a broad "what's going on?" — the caller's own words are run
  // through extract_intake, which typically fills several fields at once, so the
  // engine can skip straight past everything they've already told us (advance()).
  ctx.session.state = "open_description";
  speak(ctx, client, greetingPrompt(ctx));
}

// ─── Caller input entry points (called from the stream route / openai-handler) ─

export async function handleTranscript(ctx: FlowContext, client: RealtimeClient, transcript: string): Promise<void> {
  ctx.session.conversationContext.transcript.push({ role: "user", message: transcript });

  // Cheap, deterministic global-intent check first — no model call. Skipped in
  // wrap_up_reason: there the caller's whole utterance IS the free-form message,
  // so a phrase like "following up on my job" or "tell them I want a person" is
  // content to capture, not a command to route on.
  if (ctx.session.state !== "wrap_up_reason") {
    let intent = matchDeterministicIntent(transcript);
    // On the opener, let extract_intake decide new-vs-existing — it also captures
    // the reason ("following up on my water job" → customer_type existing AND
    // service_type water), which the existing_customer shortcut would throw away,
    // causing a redundant "what are you calling about?" later.
    if (intent === "existing_customer" && ctx.session.state === "open_description") {
      intent = null;
    }
    if (intent) {
      await handleGlobalIntent(ctx, client, intent);
      return;
    }
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
  if (name === "extract_intake") {
    await applyExtraction(ctx, client, args);
    return;
  }

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

  if (state === "open_description") {
    // Free-form opener → one forced extraction pass over the vertical's fields.
    ctx.session.responseActive = true;
    client.createResponse({
      instructions:
        `The caller was asked "what's going on?" and said: "${transcript}".\n` +
        `Fill ONLY the fields the caller EXPLICITLY stated in that message. Rules:\n` +
        `- If they did not mention a field, OMIT that key entirely. Do NOT include it.\n` +
        `- NEVER fill a field with a default, typical, likely, or guessed value. When unsure, omit.\n` +
        `- customer_type: "new" if they're describing a fresh problem or request, "existing" only if ` +
        `they reference an existing/ongoing job, appointment, or that they're already a customer. ` +
        `Omit if truly unclear.\n` +
        `Example: "it's a new issue" → {"customer_type":"new"} and nothing else, because no other detail was given.`,
      output_modalities: ["text"],
      tools: [buildExtractIntakeTool(ctx.verticalConfig.questions)],
      tool_choice: { type: "function", name: "extract_intake" },
    });
    return;
  }

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
        // Existing customer / message wrap-up — grab a reason if we don't have one.
        proceedAfterNameWrapUp(ctx, client);
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

  if (state === "wrap_up_reason") {
    // Free-form single turn — anything non-trivial is the reason/message.
    const reason = transcript.trim();
    if (reason) {
      ctx.session.conversationContext.reasonForCall = reason;
      enterConfirmation(ctx, client);
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
    ctx.session.isNewCustomer = value !== "existing";
    await advance(ctx, client);
    return;
  }

  if (ctx.session.state === "qualification") {
    const question = currentQuestion(ctx);
    if (!question) return;
    ctx.session.hasStartedQualification = true;
    ctx.session.conversationContext.answers[question.key] = value;
    ctx.session.currentQuestionKey = undefined;
    await advance(ctx, client);
    return;
  }

  if (ctx.session.state === "callback_preference") {
    ctx.session.conversationContext.callbackPreference = value;
    enterConfirmation(ctx, client);
    return;
  }
}

/**
 * The adaptive router — after any answer (or the opening extraction) is merged,
 * this picks the next thing to ask by looking at what's still MISSING, rather
 * than walking a fixed script. Code owns the order; the model never chooses.
 *
 * Order for a new customer: know new-vs-existing → the primary "what happened"
 * question → ZIP → any remaining qualification questions → price+name. Anything
 * the opening description already filled is simply skipped.
 */
async function advance(ctx: FlowContext, client: RealtimeClient): Promise<void> {
  const { session } = ctx;
  const cc = session.conversationContext;

  // 1. New vs existing unknown → ask it (only reached when the opener didn't say).
  if (session.isNewCustomer === undefined) {
    session.state = "new_or_existing";
    speak(ctx, client, newOrExistingPrompt());
    return;
  }

  // 2. Existing customer → skip qualification; get a name, a reason if we don't
  //    already have one, then confirm.
  if (session.isNewCustomer === false) {
    if (!cc.callerName) enterName(ctx, client, existingCustomerAck());
    else proceedAfterNameWrapUp(ctx, client);
    return;
  }

  // 3. New customer — ask only the still-missing pieces. voiceExtractOnly fields
  //    (cause, rooms_affected, ...) are captured from the opener if mentioned and
  //    fed to scoring, but never *asked* on the call — skip them here.
  const questions = ctx.verticalConfig.questions;
  const visible = getVisibleQuestions(questions, cc.answers);
  const firstUnanswered = visible.find((q) => !q.voiceExtractOnly && !(q.key in cc.answers));
  const primaryKey = questions[0]?.key;

  // 3a. The primary "what's going on" question comes before ZIP (less transactional).
  if (firstUnanswered && firstUnanswered.key === primaryKey) {
    enterQualificationFor(ctx, client, firstUnanswered);
    return;
  }

  // 3b. ZIP, once we know the primary problem.
  if (!cc.zipCode) {
    enterZipCode(ctx, client);
    return;
  }

  // 3c. Any remaining qualification questions.
  if (firstUnanswered) {
    enterQualificationFor(ctx, client, firstUnanswered);
    return;
  }

  // 3d. Everything gathered → price guidance folded into the name ask.
  await enterPriceEligibility(ctx, client);
}

// ─── State transitions ─────────────────────────────────────────────────────────

/** Merge the opening extraction into the call context, then hand off to advance()
 *  which decides what (if anything) still needs asking. */
async function applyExtraction(ctx: FlowContext, client: RealtimeClient, args: unknown): Promise<void> {
  const cc = ctx.session.conversationContext;
  const extracted = validateExtraction(ctx.verticalConfig.questions, args);

  if (extracted.isNewCustomer !== undefined) ctx.session.isNewCustomer = extracted.isNewCustomer;

  if (extracted.zipCode && !cc.zipCode) {
    cc.zipCode = extracted.zipCode;
    cc.serviceAreaEligible = checkServiceArea(ctx, extracted.zipCode).eligible;
  }

  for (const [key, value] of Object.entries(extracted.answers)) {
    if (!(key in cc.answers)) {
      cc.answers[key] = value;
      ctx.session.hasStartedQualification = true;
    }
  }

  // Infer new-vs-existing in code rather than leaning on the model: a caller who
  // just described an actual service problem is a new request by default. The
  // model reliably flags EXISTING (they reference an ongoing job) but often omits
  // customer_type otherwise — without this we'd ask "new or existing?" right
  // after someone said "my basement is flooding". Only a bare opener with nothing
  // extracted falls through to actually asking.
  if (ctx.session.isNewCustomer === undefined && Object.keys(cc.answers).length > 0) {
    ctx.session.isNewCustomer = true;
  }

  await advance(ctx, client);
}

function enterQualificationFor(ctx: FlowContext, client: RealtimeClient, question: VerticalQuestion): void {
  ctx.session.state = "qualification";
  ctx.session.currentQuestionKey = question.key;
  speak(ctx, client, qualificationPrompt(question));
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
  await advance(ctx, client);
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
  // The public marketing demo never persists a lead — the route builds an
  // ephemeral packet from the collected answers instead.
  if (!ctx.session.isDemo) {
    try {
      await captureLeadOnce(ctx);
    } catch (err) {
      logger.error("captureLead failed", { correlationId: ctx.session.correlationId, error: String(err) });
    }
  }
  ctx.session.state = "end";
  speak(ctx, client, goodbyeLine());
  ctx.session.onResponseDone = () => {
    ctx.onComplete();
  };
}

function enterName(ctx: FlowContext, client: RealtimeClient, prefix?: string): void {
  ctx.session.state = "name";
  speak(ctx, client, namePrompt(prefix));
}

function enterExistingCustomerPath(ctx: FlowContext, client: RealtimeClient, ackLine: string = existingCustomerAck()): void {
  ctx.session.isNewCustomer = false;
  enterName(ctx, client, ackLine);
}

async function enterFallbackVoicemail(ctx: FlowContext, client: RealtimeClient): Promise<void> {
  ctx.session.state = "fallback_voicemail";
  speak(ctx, client, fallbackVoicemailLine());
  ctx.session.onResponseDone = () => finishCall(ctx, client);
}

async function jumpToWrapUp(ctx: FlowContext, client: RealtimeClient, ackLine?: string): Promise<void> {
  // Reached via leave_message / frustrated / no-transfer — take a message rather
  // than run qualification. Get a name first, then one open "what to pass along".
  ctx.session.isNewCustomer = false;
  ctx.session.wrapUpReasonMode = "message";
  if (!ctx.session.conversationContext.callerName) {
    enterName(ctx, client, ackLine);
    return;
  }
  proceedAfterNameWrapUp(ctx, client);
}

/** After the name is captured on an existing/message wrap-up path: ask a single
 *  open reason turn if we don't already know why they called, else confirm. */
function proceedAfterNameWrapUp(ctx: FlowContext, client: RealtimeClient): void {
  if (hasKnownReason(ctx)) {
    enterConfirmation(ctx, client);
  } else {
    enterWrapUpReason(ctx, client, ctx.session.wrapUpReasonMode ?? "existing");
  }
}

function enterWrapUpReason(ctx: FlowContext, client: RealtimeClient, mode: "existing" | "message"): void {
  ctx.session.state = "wrap_up_reason";
  ctx.session.wrapUpReasonMode = mode;
  speak(ctx, client, wrapUpReasonPrompt(mode));
}

/** We already know why they called if a reason was captured, or the opening
 *  extraction filled any qualification answer (which is the reason, structured). */
function hasKnownReason(ctx: FlowContext): boolean {
  const cc = ctx.session.conversationContext;
  return Boolean(cc.reasonForCall) || Object.keys(cc.answers).length > 0;
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
      ctx.session.conversationContext.answers = {};
      ctx.session.conversationContext.zipCode = undefined;
      ctx.session.conversationContext.serviceAreaEligible = undefined;
      ctx.session.currentQuestionKey = undefined;
      speak(ctx, client, startOverAckLine());
      ctx.session.onResponseDone = () => advance(ctx, client);
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

/** The question the "qualification" state is currently asking — tracked by key
 *  now that questions are selected adaptively rather than by a linear index. */
function currentQuestion(ctx: FlowContext): VerticalQuestion | undefined {
  const key = ctx.session.currentQuestionKey;
  return key ? ctx.verticalConfig.questions.find((q) => q.key === key) : undefined;
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
    case "wrap_up_reason":
      return wrapUpReasonPrompt(ctx.session.wrapUpReasonMode ?? "existing");
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
  // Only cancel when a response is actually in flight — cancelling a finished
  // response is rejected by OpenAI ("no active response found"). This is common
  // for a keypress arriving after a prompt already finished playing.
  if (ctx.session.responseActive) client.cancelResponse();

  if (ctx.session.lastAssistantItem && ctx.session.responseStartTimestamp !== undefined) {
    const audioEndMs = ctx.session.latestMediaTimestamp - ctx.session.responseStartTimestamp;
    if (audioEndMs > INTERRUPTION.MIN_TRUNCATION_TIME) {
      client.truncateItem(ctx.session.lastAssistantItem, audioEndMs);
    }
    ctx.session.lastAssistantItem = undefined;
    ctx.session.responseStartTimestamp = undefined;
  }
}
