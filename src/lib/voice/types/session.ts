import type { BusinessNotificationPreferences, CustomServiceOption } from "@/lib/db/schema/businesses";
import type { LeadType, MessageKind } from "@/lib/leads/lead-taxonomy";

/**
 * Voice call session state and context — one instance per active Media Stream
 * WebSocket connection (one call = one instance, no cross-instance sharing needed).
 */

/**
 * The call's bookend flow (see state-machine/call-flow.ts).
 * "qualification" is a single state that internally walks the vertical's
 * configured questions one at a time — session.qualificationIndex tracks which.
 */
export type VoiceState =
  | "greeting"
  | "open_description"
  | "new_or_existing"
  | "zip_code"
  | "qualification"
  | "price_eligibility"
  | "price_guidance"
  | "name"
  | "wrap_up_reason"
  | "callback_preference"
  // One "anything important I missed?" beat before confirming — used for messages
  // and routine/partial jobs (an emergency job skips straight to confirmation).
  | "final_check"
  | "confirmation"
  | "create_lead"
  | "end"
  | "fallback_voicemail";

/**
 * What kind of contact a captured call is. 'job' runs the full scoring pipeline
 * and lands as a ranked lead packet; 'message' is captured + routed but never
 * scored. See leads.leadType. Confident junk isn't a lead type at all — it
 * creates no lead row (session.screened → calls.outcome 'screened').
 * Canonical definitions live in the shared cross-channel taxonomy module; this
 * re-export keeps existing "../types/session" import sites working.
 */
export type { LeadType, MessageKind };

export interface SessionState {
  streamSid?: string;
  lastAssistantItem?: string;
  responseStartTimestamp?: number;
  latestMediaTimestamp: number;
  callerPhone: string;
  silenceTimeout?: NodeJS.Timeout;
  conversationContext: ConversationContext;

  correlationId: string;
  callSid: string;
  callId: string; // Callverted `calls` row id
  businessId: string;
  businessName: string;
  callStartTime: Date;

  // True only for a session driven by the admin test-call harness (no real
  // Twilio call/calls-row backing it) — gates captureLead's source tag and
  // notification email so test runs don't page the business owner.
  isTestCall?: boolean;

  // True for the public marketing demo (/api/demo). Like a test call but even
  // more locked down: no lead is created or persisted at all, so nothing hits
  // the DB and no business is ever notified. The demo route computes an
  // ephemeral lead packet from conversationContext instead.
  isDemo?: boolean;

  // Set once the lead has been created — CREATE_LEAD is idempotent against this.
  leadId?: string;
  // True once the durable finalization hand-off has been sent for this call, so
  // the live path and the WS-close fallback can't double-fire it.
  finalizeSent?: boolean;
  // Epoch ms at which every audio chunk sent to Twilio will have finished
  // PLAYING. OpenAI generates far faster than 8kHz real-time, so response.done
  // arrives while the caller still has seconds of speech queued — closing the
  // socket on generation-completion clipped the sign-off mid-sentence. Tracked
  // from the actual μ-law byte count (8 bytes = 1ms) so the hang-up can wait for
  // playback rather than guess.
  audioQueuedUntil?: number;
  // Set synchronously (before any await) the first time captureLeadOnce is called —
  // guards against the normal-completion path and the early-disconnect drop handler
  // both trying to create a lead if the caller hangs up while the first DB insert
  // is still in flight (leadId isn't set until that insert resolves).
  leadCapturePromise?: Promise<{ leadId: string }>;

  // ── State machine ──────────────────────────────────────────────────────────
  state: VoiceState;
  // Legacy linear cursor — retained for back-compat; the adaptive engine tracks
  // the question being asked via currentQuestionKey instead.
  qualificationIndex: number;
  // Which vertical question (by key) the "qualification" state is currently
  // asking — the engine now picks questions adaptively (ask only what's still
  // missing) rather than walking them in order, so it tracks the key directly.
  currentQuestionKey?: string;
  // Which phrasing the wrap_up_reason state should use: "existing" ("what should
  // I tell the team you're calling about?") vs "message" ("what would you like me
  // to pass along?"). Both capture into conversationContext.reasonForCall.
  wrapUpReasonMode?: "existing" | "message";
  // What kind of contact this call is. Defaults to a scored 'job'; the engine
  // flips it to 'message' at any non-job terminal (existing customer, billing,
  // callback, serve-area question, or an ambiguous non-job call). captureLead
  // reads this to decide whether to score+rank+lead-notify or just capture the
  // message with a low-key alert. messageKind is the message sub-label.
  leadType?: LeadType;
  messageKind?: MessageKind;
  // Set only for confident junk (triage contact_type wrong_number / solicitation).
  // enterScreenedHangup sets this and does NOT capture a lead; endCall then reports
  // outcome "screened" so the junk call is recorded without polluting the inbox.
  screened?: boolean;
  // Why the call was screened ("wrong_number" | "solicitation") — persisted to
  // calls.screened_reason so screening is auditable, not a black box.
  screenedReason?: string;
  // Set by the 3-minute graceful-close timer when a response is in flight. The
  // engine checks it at the next safe boundary (handleTranscript / notifyResponseDone)
  // and switches to closing rather than colliding with the in-flight turn.
  closeRequested?: boolean;
  // Retry counter per state key — reset on successful transition into a new state
  attempts: Partial<Record<VoiceState, number>>;
  isNewCustomer?: boolean;
  // Set the first time a real qualification answer is recorded. Distinct from
  // isNewCustomer, which global intents like jumpToWrapUp force to false even
  // when qualification had already genuinely started — deriveIntakeStatus
  // needs to tell "true existing-customer path, never touched qualification"
  // apart from "new customer who gave real answers, then got redirected".
  hasStartedQualification?: boolean;
  // Accumulates keypad digits for multi-digit entry (ZIP code only in V1) —
  // cleared on entering/leaving zip_code
  dtmfBuffer: string;
  // Fires once when the in-flight OpenAI response finishes — used to sequence
  // "speak X, then silently do Y, then speak Z" without overlapping response.create calls.
  // May return a promise (e.g. finishCall's captureLead+goodbye chain) — notifyResponseDone
  // tracks it via pendingContinuation so callers needing full-chain completion (the
  // test-call harness) can await past the async gap between this callback firing and
  // whatever it kicks off actually finishing, rather than just checking responseActive.
  onResponseDone?: () => unknown;
  pendingContinuation?: Promise<unknown>;
  // True from the moment any client.createResponse() call fires until the
  // matching response.done — OpenAI Realtime rejects a second response.create
  // while one is still active. Text-only callers (e.g. the test-call harness)
  // send input much faster than natural speech pauses allow, so this is the
  // reliable "is a response in flight" signal — the transcript array alone
  // isn't enough, since classification-only turns (extract_zip/classify_answer/
  // detect_intent) never push into it the way speak() does.
  responseActive?: boolean;
  // Index into conversationContext.transcript of the assistant turn currently
  // being spoken. Seeded with the text we asked for (so the turn lands in
  // chronological order and a record exists even in text-mode//on failure), then
  // overwritten with what actually went out once response.audio_transcript.done
  // arrives. Without that overwrite the transcript records our intent rather than
  // the call — wrong whenever the model rephrases or the caller barges in
  // mid-sentence, and the transcript is a feature businesses rely on.
  spokenTranscriptIndex?: number;

  // Running OpenAI token usage for the whole call, summed from each response's
  // response.done usage. Audio and text tokens are tracked separately because
  // they price very differently on the Realtime API; cached input tokens are
  // billed at a discount, so they're split out too. Logged at call end so a
  // single call's cost can be computed from published per-1M rates.
  usage?: CallUsage;
}

export interface CallUsage {
  responses: number;
  inputTextTokens: number;
  inputAudioTokens: number;
  inputCachedTokens: number;
  outputTextTokens: number;
  outputAudioTokens: number;
  totalTokens: number;
}

export interface ConversationContext {
  transcript: TranscriptEntry[];
  actionsTaken: string[];

  // Accumulated answers keyed to match verticalConfigs.questions[].key — lets
  // CREATE_LEAD reuse the existing scoreLeadFromAnswers/assessLead pipeline with
  // no vertical-specific voice scoring logic of its own.
  answers: Record<string, string>;

  // Call-metadata fields captured outside the scored vertical Q&A
  callerName?: string;
  zipCode?: string;
  // Set when the caller couldn't give a usable ZIP after retries — we stop asking
  // and continue (the lead is still captured; the team confirms the location).
  zipSkipped?: boolean;
  serviceAreaEligible?: boolean;
  callbackPreference?: string;
  priceEligible?: boolean;
  priceMessage?: string;
  // Free-text reason captured from an existing customer ("what should I tell the
  // team you're calling about?") or a message/frustrated caller ("what would you
  // like me to pass along?") — persisted to the lead's notes field.
  reasonForCall?: string;
  // The caller's own words for the service they asked for (the primary question,
  // asked open-ended). Set whether or not it matched a configured service. When
  // it doesn't match, this is the ONLY record of the service ("off-list"): the
  // structured answers[primaryKey] stays empty, so no quote is given, but the
  // lead is still captured. Persisted to leads.serviceRequested.
  serviceRequested?: string;
}

export interface TranscriptEntry {
  role: "user" | "assistant";
  message: string;
  timestamp?: number;
}

/**
 * Business data enriched with everything the state machine needs for a single
 * call — loaded once at stream start.
 */
export interface BusinessCallData {
  id: string;
  businessName: string;
  ownerEmail: string;
  ownerName: string;
  vertical: string;
  serviceArea: string | null;
  timezone: string;
  forwardingNumber: string | null;
  overflowMode: string;
  greetingMessage: string | null;
  aiInstructions: string | null;
  recordingEnabled: boolean;
  recordingDisclosure: string | null;
  callerNumber: string;
  notificationPreferences: BusinessNotificationPreferences;
  voiceName: string;
  customServiceOptions: CustomServiceOption[];
}

// "screened" = a confident-junk call (wrong number / solicitation) the AI ended
// without creating any lead — recorded on the call so it's auditable but kept out
// of the leads inbox and the AI-completion-rate denominator.
// "transferred" is LEGACY: the AI no longer bridges calls to a human (warm transfer
// was removed), but the value is kept so historical call rows still read/render.
export type CallOutcome = "in_progress" | "business_answered" | "ai_captured" | "transferred" | "abandoned" | "screened" | "error";

export interface EndCallData {
  endedAt: Date;
  durationSeconds: number;
  outcome: CallOutcome;
  summary?: string;
}
