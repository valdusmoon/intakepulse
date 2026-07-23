/**
 * Code-owned action services — the state machine invokes these directly after
 * a validated transition. The model never calls these; they aren't OpenAI tools,
 * they're plain functions. This is what keeps business-critical side effects
 * (pricing, lead creation, notification) out of the model's control entirely.
 */

import { quoteForCategory, type QuoteResult } from "@/lib/leads/quote";
import { createLead } from "@/lib/db/queries/leads";
import { updateCall } from "@/lib/db/queries/calls";
import { getVisibleQuestions, type Answers } from "@/lib/verticals/filterAnswers";
import type { FlowContext } from "../state-machine/types";

export interface ServiceAreaResult {
  eligible: boolean;
  serviceAreaDescription?: string;
}

/**
 * serviceArea is free-text (e.g. "Hoboken, Jersey City, and surrounding areas"),
 * not a structured ZIP list — this is a best-effort substring check. An
 * unconfigured or ambiguous match defaults to eligible; the team can flag a
 * genuinely out-of-area lead manually later.
 */
export function checkServiceArea(ctx: FlowContext, zip: string): ServiceAreaResult {
  const { serviceArea } = ctx.business;
  if (!serviceArea) return { eligible: true };

  const eligible = serviceArea.toLowerCase().includes(zip.toLowerCase());
  return eligible ? { eligible: true } : { eligible: false, serviceAreaDescription: serviceArea };
}

export type PriceRangeResult = QuoteResult;

/**
 * Reads a business-approved message for a service category — never composes
 * a price. serviceCategory should match a pricingRules row's serviceCategory
 * for this business — the value of the vertical's primary (first) intake
 * question, e.g. "water" | "fire" | "mold" for restoration, or "ac_repair" |
 * "furnace_replacement" | ... for HVAC.
 *
 * Thin wrapper over the shared quote step so voice and web quote identically.
 */
export function getPriceRangeForCategory(
  ctx: FlowContext,
  serviceCategory: string
): Promise<PriceRangeResult> {
  return quoteForCategory(ctx.business.id, serviceCategory);
}

export interface CaptureLeadResult {
  leadId: string;
}

/**
 * Whether the vertical's Q&A actually finished, decoupled from the call's
 * overall outcome. Existing-customer/wrap-up short paths never attempt
 * qualification by design, so they're honestly 'not_started', not 'abandoned' —
 * that label is reserved for a new-customer flow that began but didn't finish
 * (e.g. fallback_voicemail after retries are exhausted).
 */
export function deriveIntakeStatus(ctx: FlowContext): "not_started" | "started" | "completed" | "abandoned" {
  const { session, verticalConfig } = ctx;

  // Keyed off hasStartedQualification rather than isNewCustomer: a true
  // existing-customer path never touches qualification, so this is correctly
  // "not_started" regardless of any stray answer value. But jumpToWrapUp
  // (global "wants_human"/"frustrated"/"leave_message" intents) forces
  // isNewCustomer to false even when a NEW customer had already given real
  // qualification answers before being redirected — gating on that flag alone
  // would wrongly discard those answers as "not_started" too.
  if (!session.hasStartedQualification) return "not_started";

  const answers = session.conversationContext.answers;
  const primaryKey = verticalConfig.questions[0]?.key;
  const serviceCaptured = !!session.conversationContext.serviceRequested;
  const visible = getVisibleQuestions(verticalConfig.questions, answers);
  // voiceExtractOnly fields are never asked on a voice call, so a call is
  // "completed" once every *askable* visible question is answered — not gated on
  // enrichment fields the caller may simply never have mentioned. An off-list
  // service counts as answered via serviceRequested (structured primary empty),
  // so an off-list call is completed, not abandoned.
  const allAnswered = visible
    .filter((q) => !q.voiceExtractOnly)
    .every((q) => q.key in answers || (q.key === primaryKey && serviceCaptured));
  return allAnswered ? "completed" : "abandoned";
}

/**
 * Persists the lead row and links it to the call — DELIBERATELY nothing more.
 * This runs inside the live call (between confirmation and goodbye) and inside
 * the WebSocket-close grace window on early hangups; both are places where a
 * multi-second GPT round-trip either adds dead air mid-call or gets frozen by
 * the platform before its writes land (a real prod failure: lead created but
 * never scored, call stuck "ringing", transcript lost). The heavy tail —
 * scoring, assessment, operator notifications, call summary — runs in the
 * durable finalize-voice-call Inngest job, fired by the stream route's cleanup
 * once all critical state is persisted. Voice answers are captured under the
 * vertical's own question keys so the finalizer reuses the exact same scoring
 * pipeline as the web channel with zero voice-specific logic.
 */
export async function captureLead(ctx: FlowContext): Promise<CaptureLeadResult> {
  const { session, business } = ctx;
  // The ZIP is asked for and read back to the caller, but it lives on the call
  // session rather than in answers — fold it in so it survives onto the lead and
  // the owner has a location when they call back. Same key the web form writes.
  const zip = session.conversationContext.zipCode;
  const answers: Answers = zip
    ? { ...session.conversationContext.answers, zip_code: zip }
    : session.conversationContext.answers;

  // A non-job call (existing customer, billing, callback, a question, or an
  // ambiguous non-job) is captured as a MESSAGE: filed + routed, but never scored,
  // ranked, or counted as an opportunity. Confident junk never reaches captureLead
  // at all (the engine ends those with no lead).
  const leadType = session.leadType ?? "job";
  const messageKind = session.messageKind ?? null;

  const lead = await createLead({
    businessId: business.id,
    callerPhone: session.callerPhone,
    callerName: session.conversationContext.callerName ?? null,
    source: session.isTestCall ? "voice_test" : "voice_overflow",
    callStatus: "missed",
    leadType,
    messageKind,
    intakeStatus: deriveIntakeStatus(ctx),
    intakeAnswers: answers,
    serviceRequested: session.conversationContext.serviceRequested ?? null,
    notes: session.conversationContext.reasonForCall ?? null,
    smsConsent: false,
  });

  session.leadId = lead.id;
  if (!session.isTestCall) {
    await updateCall(session.callId, { leadId: lead.id, outcome: "ai_captured" });
  }

  return { leadId: lead.id };
}

/**
 * Ensures captureLead runs at most once per call. session.leadCapturePromise is
 * set synchronously, before any await, so a caller racing in while the first
 * invocation's DB insert is still in flight (e.g. finishCall's normal completion
 * overlapping with the early-disconnect drop handler because the caller hung up
 * their phone right as the confirmation line finished) awaits the same promise
 * instead of starting a second insert — checking session.leadId alone isn't
 * enough since it only gets set once that insert resolves.
 */
export function captureLeadOnce(ctx: FlowContext): Promise<CaptureLeadResult> {
  if (!ctx.session.leadCapturePromise) {
    ctx.session.leadCapturePromise = captureLead(ctx);
  }
  return ctx.session.leadCapturePromise;
}

