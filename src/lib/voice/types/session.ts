import type { BusinessNotificationPreferences, CustomServiceOption } from "@/lib/db/schema/businesses";

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
  | "confirmation"
  | "create_lead"
  | "end"
  | "fallback_voicemail";

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
  urgentTransferNumber: string | null;
  // The line Callverted rings first (ring_then_ai). Kept on the session so a
  // warm transfer can refuse to dial a number that already rang out this call.
  forwardingNumber: string | null;
  // True when the business's own line was dialed and went unanswered before the
  // AI took over on THIS call (ring_then_ai overflow). Used to suppress a warm
  // transfer back to that same number — it would just ring out again.
  businessLineAlreadyTried: boolean;
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
  // Retry counter per state key — reset on successful transition into a new state
  attempts: Partial<Record<VoiceState, number>>;
  isNewCustomer?: boolean;
  // Set when transferCallAction successfully bridges the call to a human —
  // endCall uses this so a successful transfer reports outcome "transferred"
  // rather than "abandoned" once the WS closes (the transfer itself doesn't
  // create a lead; a human is already handling the caller live).
  transferred?: boolean;
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
  serviceAreaEligible?: boolean;
  callbackPreference?: string;
  priceEligible?: boolean;
  priceMessage?: string;
  // Free-text reason captured from an existing customer ("what should I tell the
  // team you're calling about?") or a message/frustrated caller ("what would you
  // like me to pass along?") — persisted to the lead's notes field.
  reasonForCall?: string;
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
  urgentTransferNumber: string | null;
  greetingMessage: string | null;
  aiInstructions: string | null;
  recordingEnabled: boolean;
  recordingDisclosure: string | null;
  callerNumber: string;
  notificationPreferences: BusinessNotificationPreferences;
  voiceName: string;
  customServiceOptions: CustomServiceOption[];
}

export type CallOutcome = "in_progress" | "business_answered" | "ai_captured" | "transferred" | "abandoned" | "error";

export interface EndCallData {
  endedAt: Date;
  durationSeconds: number;
  outcome: CallOutcome;
  summary?: string;
}
