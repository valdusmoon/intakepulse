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
  | "new_or_existing"
  | "zip_code"
  | "qualification"
  | "price_eligibility"
  | "price_guidance"
  | "name"
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
  callStartTime: Date;

  // Set once the lead has been created — CREATE_LEAD is idempotent against this.
  leadId?: string;

  // ── State machine ──────────────────────────────────────────────────────────
  state: VoiceState;
  // Which visible vertical question (getVisibleQuestions index) we're currently asking
  qualificationIndex: number;
  // Retry counter per state key — reset on successful transition into a new state
  attempts: Partial<Record<VoiceState, number>>;
  isNewCustomer?: boolean;
  // Accumulates keypad digits for multi-digit entry (ZIP code only in V1) —
  // cleared on entering/leaving zip_code
  dtmfBuffer: string;
  // Fires once when the in-flight OpenAI response finishes — used to sequence
  // "speak X, then silently do Y, then speak Z" without overlapping response.create calls
  onResponseDone?: () => void;
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

export type CallOutcome = "in_progress" | "business_answered" | "ai_captured" | "abandoned" | "error";

export interface EndCallData {
  endedAt: Date;
  durationSeconds: number;
  outcome: CallOutcome;
  summary?: string;
}
