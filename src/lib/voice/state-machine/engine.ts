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
import type { MessageKind } from "../types/session";
import { isNameRefusal, trustDeterministicName, mentionsServiceNeed, isNegatedOptionMatch, tryExtractZipDeterministic, tryMatchOptionLabel, tryMatchOrdinal, type OptionLike } from "./deterministic";
import { extractCallerNameLLM } from "./name-extract";
import { buildClassifyAnswerTool, buildClassifyServiceTool, buildExtractIntakeTool, EXTRACT_ZIP_TOOL } from "./tools";
import { validateExtraction } from "./extraction";
import {
  CALLBACK_DTMF,
  CALLBACK_OPTIONS,
  NEW_OR_EXISTING_DTMF,
  NEW_OR_EXISTING_OPTIONS,
  callbackPreferencePrompt,
  confirmationLine,
  existingCustomerAck,
  finalCheckPrompt,
  goodbyeLine,
  gracefulCloseLine,
  greetingPrompt,
  humanCallbackLine,
  namePrompt,
  newOrExistingPrompt,
  qualificationPrompt,
  questionDtmfMap,
  questionOptions,
  screenedGoodbyeLine,
  startOverAckLine,
  triageClarifyPrompt,
  wrapUpReasonPrompt,
  zipPrompt,
} from "./call-flow";
import { voiceReassuranceInstruction } from "@/lib/leads/reassurance";
import { captureLeadOnce, checkServiceArea } from "../functions/actions";
import { quoteForAnswers } from "@/lib/leads/quote";
import { INTERRUPTION } from "../config/constants";

// Retries are deliberately light. ZIP is the one field worth pushing on (it
// affects service-area fit and lead usefulness); every other field gets a single
// clarification and then gracefully degrades. We NEVER dead-end a call to
// voicemail — a partial/vague lead always beats a lost call.
const RETRY_LIMITS: Record<string, number> = { zip_code: 2 };
function retryLimitFor(state: string): number {
  return RETRY_LIMITS[state] ?? 1;
}

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

  // Out of time (3-min soft cap fired mid-turn): wrap up now rather than start
  // another round. Skipped once we're already in a closing/terminal state.
  if (ctx.session.closeRequested && !isClosing(ctx)) {
    await enterGracefulClose(ctx, client);
    return;
  }

  // Cheap, deterministic escape check first — no model call. This is just the
  // handful of unambiguous phrases ("talk to a person", "take a message"); the
  // real job-vs-message-vs-junk decision is the model's extract_intake triage,
  // not here. Skipped in wrap_up_reason / final_check, where the caller's whole
  // utterance IS the free-form content to capture, not a command to route on.
  if (ctx.session.state !== "wrap_up_reason" && ctx.session.state !== "final_check") {
    let intent = matchDeterministicIntent(transcript);
    // On the opener, let extract_intake's triage decide new-vs-existing / message
    // rather than the existing-customer shortcut (which would throw away any reason
    // the opener also stated).
    if (intent === "existing_customer" && ctx.session.state === "open_description") {
      intent = null;
    }
    // "Wrong number" is contradictory once a real job is in play — if this utterance
    // mentions a service need, or the call already captured a service, keep the job
    // rather than screen. Otherwise it screens (catches a misdial at any turn).
    const cc = ctx.session.conversationContext;
    const jobInProgress = Object.keys(cc.answers).length > 0 || !!cc.serviceRequested;
    if (intent === "wrong_number" && (mentionsServiceNeed(transcript) || jobInProgress)) {
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
    return;
  }

  // A keypress in a state that's waiting on a SPOKEN answer (the name and
  // wrap-up-reason prompts have no keypad option) isn't a valid input — but it
  // still means the caller tried to answer and would otherwise get dead air.
  // The prior menu questions often train a caller into keypad mode, so this is
  // a real path: reprompt via the same failure handler an unrecognized spoken
  // answer takes (which retries, then falls through to voicemail), instead of
  // silently swallowing the press.
  if (ctx.session.state === "name" || ctx.session.state === "wrap_up_reason") {
    // Collapse a multi-digit burst (a caller keying, say, a whole ZIP by
    // mistake sends one DTMF event per digit) into a single reprompt: once the
    // reprompt is already playing, swallow the rest of the burst rather than
    // stacking one failure per digit and blowing the retry limit into voicemail.
    if (!ctx.session.responseActive) {
      await handleStateFailure(ctx, client);
    }
    return;
  }
  // Unmapped digit for a menu state (e.g. pressing 9 on a 1/2/3 prompt) —
  // silently ignored; the still-audible prompt already tells them the options.
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

  if (name === "classify_service") {
    const status = args?.status;
    if (status === "matched" && typeof args?.matched_value === "string" && args.matched_value) {
      // Maps to a configured service → structured answer + quote, as usual.
      await applyStateAnswer(ctx, client, args.matched_value);
    } else if (status === "off_list") {
      // A clear service that just isn't configured → capture it now (their own
      // words are already in serviceRequested), no re-ask, no quote.
      captureOffListService(ctx);
      ctx.session.currentQuestionKey = undefined;
      resetAttempts(ctx, ctx.session.state);
      await advance(ctx, client);
    } else {
      // Vague / no specific service named → one clarification with examples; a
      // second miss is captured as off-list by handleStateFailure.
      await handleStateFailure(ctx, client);
    }
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
  if (cb) {
    ctx.session.onResponseDone = undefined;
    const result = cb();
    if (result instanceof Promise) {
      ctx.session.pendingContinuation = result;
    }
  }

  // The 3-min soft cap fired mid-turn and set closeRequested. Now that this turn
  // has finished, close gracefully — but only if the callback above didn't start a
  // new response or queue its own continuation (in which case defer to the next
  // notifyResponseDone rather than collide).
  if (ctx.session.closeRequested && !isClosing(ctx) && !ctx.session.responseActive && !ctx.session.onResponseDone) {
    void enterGracefulClose(ctx, client);
  }
}

// ─── Answer routing ────────────────────────────────────────────────────────────

async function routeAnswer(ctx: FlowContext, client: RealtimeClient, transcript: string): Promise<void> {
  const { state } = ctx.session;

  if (state === "open_description") {
    // Free-form opener → one forced extraction pass over the vertical's fields.
    requestIntakeExtraction(
      ctx,
      client,
      `The caller was asked "what's going on?" and said: "${transcript}".\n` +
        `Example: "it's a new issue" → {"customer_type":"new"} and nothing else, because no other detail was given.`,
    );
    return;
  }

  if (state === "new_or_existing") {
    // A plain "new"/"existing" (or a clear yes/no) resolves cheaply with no
    // model call. But callers often answer this gate with actual detail ("it's
    // new, my kitchen flooded") — run the same extraction pass the opener uses
    // so volunteered service/urgency/etc isn't dropped, and let the inferred
    // customer_type drive the gate. applyExtraction escalates to a reprompt if
    // the answer resolves to neither a customer type nor any field.
    // Only take the cheap deterministic path for a SHORT answer that's really
    // just new/existing ("new", "it's an existing job"). A longer answer can
    // contain the word "new" while also volunteering real detail ("it's new, my
    // kitchen flooded"), so route those through extraction rather than letting
    // the keyword match short-circuit and drop everything else.
    const wordCount = transcript.trim().split(/\s+/).length;
    const direct = wordCount <= 4 ? tryMatchOptionLabel(transcript, NEW_OR_EXISTING_OPTIONS) : null;
    if (direct) {
      await applyStateAnswer(ctx, client, direct);
      return;
    }
    requestIntakeExtraction(
      ctx,
      client,
      `The caller was asked whether this is a new issue or an existing job, and said: "${transcript}". ` +
        `Capture any problem details they volunteered along with whether they're a new or existing customer.`,
    );
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
    // The caller declined — proceed on their phone number, never store the refusal
    // as a name ("I'd rather not say" must not become the callback name).
    if (isNameRefusal(transcript)) {
      proceedPastName(ctx, client);
      return;
    }
    // Deterministic-first: a short, clean, name-shaped answer is used with no model
    // call. A longer/rambly answer is low-confidence → model extraction.
    const fast = trustDeterministicName(transcript);
    if (fast) {
      applyCallerName(ctx, client, fast);
      return;
    }
    // Low confidence (rambling / embedded name) → surgical gpt-4o-mini extraction,
    // off the audio path. Null = declined/no name → proceed on the phone number.
    const extracted = await extractCallerNameLLM(transcript);
    if (extracted) {
      applyCallerName(ctx, client, extracted);
    } else {
      proceedPastName(ctx, client);
    }
    return;
  }

  if (state === "final_check") {
    // The "anything important I missed?" beat. Whatever they add is appended to the
    // note (a question here is captured for the team, not answered) — then close.
    const extra = transcript.trim();
    if (extra && !/^(no|nope|nah|that'?s (it|all|everything)|nothing|i'?m good|all good)\b/i.test(extra)) {
      const prior = ctx.session.conversationContext.reasonForCall;
      ctx.session.conversationContext.reasonForCall = prior ? `${prior} — ${extra}` : extra;
    }
    enterConfirmation(ctx, client);
    return;
  }

  if (state === "wrap_up_reason") {
    // Free-form single turn — anything non-trivial is the reason/message. They just
    // had their open turn, so close straight (no redundant "anything I missed?").
    const reason = transcript.trim();
    if (reason) {
      ctx.session.conversationContext.reasonForCall = reason;
      enterConfirmation(ctx, client);
    } else {
      await handleStateFailure(ctx, client);
    }
    return;
  }

  // For the open-ended primary service question, capture the caller's own words
  // as serviceRequested — this becomes the lead's service, and the off-list
  // fallback if their answer maps to no configured option.
  if (ctx.session.state === "qualification" && isPrimaryQuestion(ctx)) {
    const raw = transcript.trim();
    if (raw) ctx.session.conversationContext.serviceRequested = raw;
  }

  const options = currentOptions(ctx);
  if (!options) return; // not currently awaiting an option-based answer (e.g. confirmation/end)

  const deterministic = tryMatchOptionLabel(transcript, options);
  // Trust a deterministic keyword hit UNLESS it's negated — "it's NOT an emergency"
  // must not match the emergency option. A negated hit defers to the model classifier.
  if (deterministic && !isNegatedOptionMatch(transcript, deterministic, options)) {
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

  // The open-ended primary SERVICE question uses a 3-way classifier: a clear
  // off-list service is captured immediately (no re-ask, no quote); only a vague
  // non-answer is retried. "unclear ≠ off-list".
  if (isPrimaryQuestion(ctx)) {
    const primary = currentQuestion(ctx);
    const guide = (primary?.options ?? []).map((o) => `${o.value} = "${o.label}"`).join("; ");
    ctx.session.responseActive = true;
    client.createResponse({
      instructions:
        `The caller was asked what service they need and said: "${transcript}". ` +
        `The business's configured services are: ${guide}. Classify it: "matched" (with matched_value) if it clearly maps to one of these; ` +
        `"off_list" if they named a specific but different service, trade, or issue; or "unclear" ONLY if they were vague and named no specific service or problem.`,
      output_modalities: ["text"],
      tools: [buildClassifyServiceTool(primary?.options ?? [])],
      tool_choice: { type: "function", name: "classify_service" },
    });
    return;
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
      `the option's number, its name, or a close synonym. ` +
      `Watch for NEGATION: if they say an option is NOT the case ("it's not an emergency", "no rush", "not urgent"), ` +
      `do NOT pick that option — pick the one that matches what they actually mean. ` +
      `If nothing clearly matches, return "unclear".`,
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
    enterClose(ctx, client);
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
  //    already have one, then confirm. An existing customer isn't a new scored job
  //    (extraction may have set isNewCustomer=false from "following up on my job"),
  //    so it's a message unless a message intent already tagged a more specific kind.
  if (session.isNewCustomer === false) {
    markMessage(ctx, session.messageKind ?? "existing_customer");
    if (!cc.callerName) enterName(ctx, client, existingCustomerAck());
    else proceedAfterNameWrapUp(ctx, client);
    return;
  }

  // 3. New customer — ask only the still-missing pieces. voiceExtractOnly fields
  //    (cause, rooms_affected, ...) are captured from the opener if mentioned and
  //    fed to scoring, but never *asked* on the call — skip them here.
  const questions = ctx.verticalConfig.questions;
  const primaryKey = questions[0]?.key;
  const visible = getVisibleQuestions(questions, cc.answers);
  // The primary service question counts as handled once it's answered OR we've
  // captured an off-list service (serviceRequested) — so an unmatched service is
  // never re-asked in a loop.
  const isAnswered = (q: VerticalQuestion) =>
    q.key in cc.answers || (q.key === primaryKey && !!cc.serviceRequested);
  const firstUnanswered = visible.find((q) => !q.voiceExtractOnly && !isAnswered(q));

  // 3a. The primary "what's going on" question comes before ZIP (less transactional).
  if (firstUnanswered && firstUnanswered.key === primaryKey) {
    enterQualificationFor(ctx, client, firstUnanswered);
    return;
  }

  // 3b. ZIP, once we know the primary problem (skipped once the caller couldn't
  //     give a usable one after retries — the lead is still captured).
  if (!cc.zipCode && !cc.zipSkipped) {
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

/** One forced extract_intake pass over the vertical's fields — fills only what
 *  the caller explicitly stated. Shared by the opener and the new/existing gate
 *  (a caller often volunteers problem details when answering "new or existing?"),
 *  so both capture the same way instead of the gate losing everything but the
 *  new/existing bit. `framing` is the state-specific lead-in; the extraction
 *  rules are identical everywhere. */
function requestIntakeExtraction(ctx: FlowContext, client: RealtimeClient, framing: string): void {
  ctx.session.responseActive = true;
  client.createResponse({
    instructions:
      `${framing}\n` +
      `Fill ONLY the fields the caller EXPLICITLY stated in that message. Rules:\n` +
      `- If they did not mention a field, OMIT that key entirely. Do NOT include it.\n` +
      `- NEVER fill a field with a default, typical, likely, or guessed value. When unsure, omit.\n` +
      `- customer_type: "new" if they're describing a fresh problem or request, "existing" only if ` +
      `they reference an existing/ongoing job, appointment, or that they're already a customer. ` +
      `Omit if truly unclear.`,
    output_modalities: ["text"],
    tools: [buildExtractIntakeTool(ctx.verticalConfig.questions)],
    tool_choice: { type: "function", name: "extract_intake" },
  });
}

/** Merge the opening extraction into the call context, then hand off to advance()
 *  which decides what (if anything) still needs asking. */
async function applyExtraction(ctx: FlowContext, client: RealtimeClient, args: unknown): Promise<void> {
  const cc = ctx.session.conversationContext;
  const fromState = ctx.session.state;
  const answerCountBefore = Object.keys(cc.answers).length;
  const hadZip = !!cc.zipCode;
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

  // Bounded escalation for the new/existing gate: when the caller was answering
  // "new or existing?" and this pass resolved neither a customer type nor any
  // field/ZIP, it's a failed attempt — reprompt (and eventually voicemail) via
  // the retry handler rather than silently re-asking the gate forever. The
  // opener (open_description) is exempt: an empty opener legitimately just falls
  // through to asking the gate.
  const gainedNothing =
    ctx.session.isNewCustomer === undefined &&
    Object.keys(cc.answers).length === answerCountBefore &&
    (hadZip || !cc.zipCode);
  if (fromState === "new_or_existing" && gainedNothing) {
    await handleStateFailure(ctx, client);
    return;
  }

  // The single silent triage. Extraction has already run (job signal always wins):
  // if the caller stated any job field, or the model classified this as a job, fall
  // through to the job flow. Otherwise route by contact_type into exactly one of the
  // three endings (job / message / screened), a transfer, or one clarification.
  if (fromState === "open_description") {
    const jobFieldsFound = Object.keys(cc.answers).length > 0;
    const contactType = typeof (args as { contact_type?: unknown })?.contact_type === "string"
      ? (args as { contact_type: string }).contact_type
      : undefined;
    const messageKindArg = normalizeMessageKind((args as { message_kind?: unknown })?.message_kind);

    // Route only when there's no job signal AND the model explicitly classified a
    // non-job contact_type. A missing contact_type or contact_type="job" falls
    // through to the normal job flow — job signal always wins.
    if (!jobFieldsFound) {
      switch (contactType) {
        case "message":
          markMessage(ctx, messageKindArg ?? "general");
          // The opener IS the message content ("question about my invoice") — save
          // it as the reason so we don't ask the caller to repeat what they just
          // said, and it's never lost. hasKnownReason then routes name → final-check.
          captureOpenerAsReason(ctx);
          await jumpToWrapUp(ctx, client, "Got it — I'll pass that along to the team.", messageKindArg ?? "general");
          return;
        case "wrong_number":
        case "solicitation":
          // Screening is the one irreversible door (no record). NEVER screen a call
          // that mentions a real service need — if the classifier says junk but the
          // caller mentioned water/fire/mold/etc, take a message instead. Erring to a
          // message beats ever losing a real job.
          if (mentionsServiceNeed(lastUserUtterance(ctx) ?? "")) {
            markMessage(ctx, "general");
            captureOpenerAsReason(ctx);
            await jumpToWrapUp(ctx, client, "Got it — I'll pass that along to the team.", "general");
          } else {
            await enterScreenedHangup(ctx, client, contactType);
          }
          return;
        case "wants_human":
          await handleWantsHuman(ctx, client);
          return;
        case "unclear":
          return await clarifyOrTakeMessage(ctx, client);
      }

      // Missing contact_type + a totally empty opener (no fields, no new/existing,
      // no ZIP) → same clarify-then-message safety net, so a silent/gibberish opener
      // never dead-ends. (The real model always returns contact_type; this is the
      // robustness backstop.)
      const gotSomething = ctx.session.isNewCustomer !== undefined || !!cc.zipCode;
      if (contactType === undefined && !gotSomething) {
        return await clarifyOrTakeMessage(ctx, client);
      }
    }
  }

  await advance(ctx, client);
}

/** One 3-way clarification for an unclassifiable opener, then default to a general
 *  message so the call never loops or drops. */
async function clarifyOrTakeMessage(ctx: FlowContext, client: RealtimeClient): Promise<void> {
  const attempts = (ctx.session.attempts["open_description"] ?? 0) + 1;
  ctx.session.attempts["open_description"] = attempts;
  if (attempts <= 1) {
    speak(ctx, client, triageClarifyPrompt());
    return;
  }
  markMessage(ctx, "general");
  captureOpenerAsReason(ctx);
  await jumpToWrapUp(ctx, client, "No problem — I'll take a quick message for the team.", "general");
}

/** Seed reasonForCall from the caller's own words when an opener is routed to a
 *  message — the opener is the message. Prevents asking them to repeat it, and
 *  makes hasKnownReason true so the flow goes name → final-check, not a re-ask. */
function captureOpenerAsReason(ctx: FlowContext): void {
  const cc = ctx.session.conversationContext;
  if (cc.reasonForCall) return;
  const utterance = lastUserUtterance(ctx);
  if (utterance) cc.reasonForCall = utterance;
}

/** Coerce a raw message_kind from the model to a known MessageKind, or undefined. */
function normalizeMessageKind(raw: unknown): MessageKind | undefined {
  const kinds: MessageKind[] = ["existing_customer", "billing", "callback", "question", "general"];
  return typeof raw === "string" && (kinds as string[]).includes(raw) ? (raw as MessageKind) : undefined;
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
  // Same quote step the web form runs — the vertical's first question doubles
  // as its pricing category, resolved inside the shared helper.
  const price = await quoteForAnswers(
    ctx.business.id,
    ctx.verticalConfig.questions,
    ctx.session.conversationContext.answers
  );

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
  ctx.session.onResponseDone = () => finishCall(ctx, client);
  speakConfirmation(ctx, client);
}

/** The close decision, once everything's collected. An emergency job gets a
 *  frictionless straight confirmation; a message or a routine/partial job gets one
 *  "anything important I missed?" beat first. */
function enterClose(ctx: FlowContext, client: RealtimeClient): void {
  const isEmergencyJob =
    ctx.session.leadType !== "message" && ctx.session.conversationContext.answers.urgency === "emergency";
  if (isEmergencyJob) {
    enterConfirmation(ctx, client);
    return;
  }
  ctx.session.state = "final_check";
  speak(ctx, client, finalCheckPrompt());
}

/** Whether a close/terminal sequence is already underway — so the graceful-close
 *  timer never re-triggers on top of an in-progress ending. */
function isClosing(ctx: FlowContext): boolean {
  const s = ctx.session.state;
  return s === "final_check" || s === "confirmation" || s === "create_lead" || s === "end";
}

/** Called by the 3-minute soft-cap timer (from the stream route). If we can speak
 *  now, close gracefully; otherwise flag it and let the next safe boundary
 *  (handleTranscript / notifyResponseDone) pick it up without colliding with an
 *  in-flight turn. */
export async function requestGracefulClose(ctx: FlowContext, client: RealtimeClient): Promise<void> {
  if (isClosing(ctx)) return;
  if (ctx.session.responseActive || ctx.session.onResponseDone) {
    ctx.session.closeRequested = true;
    return;
  }
  await enterGracefulClose(ctx, client);
}

/** Soft-cap close: say we have enough, then capture what exists and hang up.
 *  Skips the "anything I missed?" beat — we're out of time. */
async function enterGracefulClose(ctx: FlowContext, client: RealtimeClient): Promise<void> {
  ctx.session.closeRequested = false;
  ctx.session.state = "end";
  ctx.session.onResponseDone = () => finishCall(ctx, client);
  speak(ctx, client, gracefulCloseLine());
}

/**
 * The one turn the model words itself. Everything else in this engine is dictated
 * verbatim, but the closing line has to reflect what the caller actually described,
 * and the model in the call already has that context — so it writes this one under
 * a tight set of rules rather than us round-tripping to a second model mid-call.
 */
function speakConfirmation(ctx: FlowContext, client: RealtimeClient): void {
  const cc = ctx.session.conversationContext;
  const callbackPhrase = cc.callbackPreference ?? "as soon as possible";

  ctx.session.responseActive = true;
  client.createResponse({
    instructions: voiceReassuranceInstruction(ctx.business.businessName, callbackPhrase),
    tool_choice: "none",
  });
  // Seeded with the scripted line purely so the turn is never unrecorded; unlike
  // every other turn this text was never what we asked for, so the overwrite from
  // the real audio transcript is what actually makes this entry correct.
  pushSpokenTurn(ctx, confirmationLine(ctx));
}

async function finishCall(ctx: FlowContext, client: RealtimeClient): Promise<void> {
  ctx.session.state = "create_lead";
  // Neither the public marketing demo nor the in-app test tool persists a lead —
  // both build an ephemeral packet from the collected answers instead, so test
  // runs never pollute real data or page the owner. Only genuine calls capture.
  if (!ctx.session.isDemo && !ctx.session.isTestCall) {
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
  markMessage(ctx, "existing_customer");
  enterName(ctx, client, ackLine);
}

/** Never route a call to voicemail: after retries are exhausted (or the intent
 *  classifier can't tell what the caller wants), capture whatever we have for
 *  THIS field and continue toward a saved lead. A partial/vague lead beats a
 *  lost call — the whole product promise is "stop losing calls." */
async function degradeAndContinue(ctx: FlowContext, client: RealtimeClient): Promise<void> {
  const state = ctx.session.state;
  const cc = ctx.session.conversationContext;

  if (state === "qualification") {
    const q = currentQuestion(ctx);
    ctx.session.currentQuestionKey = undefined;
    if (q && isPrimaryQuestion(ctx)) {
      captureOffListService(ctx);
    } else if (q) {
      // A useful-but-not-critical field (e.g. urgency): mark it unknown and move
      // on rather than interrogate. The lead just scores with less confidence.
      cc.answers[q.key] = "unknown";
      ctx.session.hasStartedQualification = true;
    }
    await advance(ctx, client);
    return;
  }

  if (state === "zip_code") {
    cc.zipSkipped = true;
    await advance(ctx, client);
    return;
  }

  if (state === "name") {
    proceedPastName(ctx, client);
    return;
  }

  if (state === "callback_preference") {
    cc.callbackPreference = cc.callbackPreference ?? "as soon as possible";
    enterClose(ctx, client);
    return;
  }

  if (state === "new_or_existing") {
    await jumpToWrapUp(ctx, client, "No problem — I'll take a quick message for the team.", "general");
    return;
  }

  // wrap_up_reason or any other state → confirm/save what we have.
  enterClose(ctx, client);
}

/** Capture the caller's own words as an off-list service (no configured match,
 *  so no quote) and mark qualification started. */
function captureOffListService(ctx: FlowContext): void {
  const cc = ctx.session.conversationContext;
  if (!cc.serviceRequested) {
    const last = lastUserUtterance(ctx);
    if (last) cc.serviceRequested = last;
  }
  ctx.session.hasStartedQualification = true;
}

function lastUserUtterance(ctx: FlowContext): string | undefined {
  const entry = [...ctx.session.conversationContext.transcript].reverse().find((e) => e.role === "user");
  return entry?.message?.trim() || undefined;
}

/** Record the caller's name, then continue exactly as the no-name path would. */
function applyCallerName(ctx: FlowContext, client: RealtimeClient, name: string): void {
  ctx.session.conversationContext.callerName = name;
  proceedPastName(ctx, client);
}

/** Proceed past the name step without a name (couldn't catch it, or they declined) —
 *  the lead is saved with the caller's phone number; the team asks their name on callback. */
function proceedPastName(ctx: FlowContext, client: RealtimeClient): void {
  const cc = ctx.session.conversationContext;
  if (ctx.session.isNewCustomer === false) {
    proceedAfterNameWrapUp(ctx, client);
  } else if (!shouldAskCallbackPreference(ctx)) {
    cc.callbackPreference = "as soon as possible";
    enterClose(ctx, client);
  } else {
    enterCallbackPreference(ctx, client);
  }
}

async function jumpToWrapUp(ctx: FlowContext, client: RealtimeClient, ackLine?: string, kind: MessageKind = "general"): Promise<void> {
  // Reached via leave_message / frustrated / no-transfer / billing / callback /
  // question / empty-opener — take a message rather than run qualification. Get a
  // name first, then one open "what to pass along". This is a non-job contact, so
  // tag it as a message so captureLead skips scoring and just files it.
  ctx.session.isNewCustomer = false;
  ctx.session.wrapUpReasonMode = "message";
  markMessage(ctx, kind);
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
    // Reason already known → no open turn was needed, so give the one "anything I
    // missed?" beat here (enterClose) rather than confirming blind.
    enterClose(ctx, client);
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
  // The AI never bridges a live call to a human — even in ai_immediate the owner
  // opted into "capture and call back", and in ring_then_ai the line already rang
  // out, so there's no human to hand back to. A caller who asks for a person gets a
  // callback message: name + what to pass along, alerted like any other message.
  await jumpToWrapUp(ctx, client, humanCallbackLine(), "callback");
}

/** Tag this call as a captured message (not a scored job). captureLead reads
 *  session.leadType to skip scoring/ranking and file it with a low-key alert. */
function markMessage(ctx: FlowContext, kind: MessageKind): void {
  ctx.session.leadType = "message";
  ctx.session.messageKind = kind;
}

/** Confident junk (triage contact_type wrong_number / solicitation): end the call
 *  with NO lead. The call row still records it — endCall reads session.screened →
 *  outcome 'screened' and session.screenedReason → the reason — so it's auditable
 *  but never pollutes the leads inbox or the completion rate. */
async function enterScreenedHangup(ctx: FlowContext, client: RealtimeClient, reason: string): Promise<void> {
  ctx.session.screened = true;
  ctx.session.screenedReason = reason;
  ctx.session.state = "end";
  speak(ctx, client, screenedGoodbyeLine());
  ctx.session.onResponseDone = () => ctx.onComplete();
}

// ─── Global intent dispatch (the cheap deterministic escapes only) ───────────────

async function handleGlobalIntent(ctx: FlowContext, client: RealtimeClient, intent: GlobalIntent): Promise<void> {
  switch (intent) {
    case "wants_human":
      await handleWantsHuman(ctx, client);
      return;
    case "existing_customer":
      enterExistingCustomerPath(ctx, client);
      return;
    case "leave_message":
      await jumpToWrapUp(ctx, client, "No problem, I'll take a quick message.", "general");
      return;
    case "frustrated":
      await jumpToWrapUp(ctx, client, "I understand — let's make this quick.", "general");
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
    case "wrong_number":
      // A misdial caught mid-call (the guard in handleTranscript already let any
      // real-service-need "wrong number" through). End cleanly with no lead.
      await enterScreenedHangup(ctx, client, "wrong_number");
      return;
  }
}

// ─── Retry / fallback ───────────────────────────────────────────────────────────

async function handleStateFailure(ctx: FlowContext, client: RealtimeClient): Promise<void> {
  const state = ctx.session.state;
  const attempts = (ctx.session.attempts[state] ?? 0) + 1;
  ctx.session.attempts[state] = attempts;

  if (attempts <= retryLimitFor(state)) {
    speak(ctx, client, `Sorry, I didn't quite catch that. ${retryPromptText(ctx)}`);
    return;
  }
  resetAttempts(ctx, state);

  // The service question never dead-ends: capture whatever the caller asked for
  // as an off-list service (serviceRequested was set from their words in
  // routeAnswer) and move on — no quote, but the lead is still taken.
  if (state === "qualification" && isPrimaryQuestion(ctx)) {
    captureOffListService(ctx);
    ctx.session.currentQuestionKey = undefined;
    await advance(ctx, client);
    return;
  }

  // Retries exhausted on a non-primary field → gracefully degrade: capture what we
  // have and keep moving toward a saved lead. No mid-flow model re-triage — the
  // deterministic escapes already catch "talk to a person" / "take a message", and
  // the opener triage classified the call; a blunt degrade beats an FAQ loop.
  await degradeAndContinue(ctx, client);
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

/** True while the "qualification" state is asking the vertical's primary service
 *  question (index 0) — the open-ended ask that can capture an off-list service. */
function isPrimaryQuestion(ctx: FlowContext): boolean {
  const primaryKey = ctx.verticalConfig.questions[0]?.key;
  return !!primaryKey && ctx.session.currentQuestionKey === primaryKey;
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
      return q ? qualificationPrompt(q, { retry: true }) : "Could you say that again?";
    }
    case "name":
      return "What's your name?";
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
  pushSpokenTurn(ctx, text);
}

/** Records the turn we're about to speak so it lands in the transcript in order,
 *  and marks it to be replaced by the audio that actually goes out. */
function pushSpokenTurn(ctx: FlowContext, intended: string): void {
  ctx.session.spokenTranscriptIndex = ctx.session.conversationContext.transcript.length;
  ctx.session.conversationContext.transcript.push({ role: "assistant", message: intended });
}

/**
 * Replaces the intended text of the in-flight assistant turn with what was really
 * said. Fires for every spoken turn, so a rephrase or a caller barging in
 * mid-sentence is reflected in the record rather than papered over.
 */
export function recordSpokenTranscript(ctx: FlowContext, spoken: string): void {
  const idx = ctx.session.spokenTranscriptIndex;
  if (idx === undefined) return;
  ctx.session.spokenTranscriptIndex = undefined;
  const text = spoken.trim();
  if (!text) return;
  const entry = ctx.session.conversationContext.transcript[idx];
  if (entry?.role === "assistant") entry.message = text;
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
