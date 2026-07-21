/**
 * Code-owned action services — the state machine invokes these directly after
 * a validated transition. The model never calls these; they aren't OpenAI tools,
 * they're plain functions. This is what keeps business-critical side effects
 * (pricing, lead creation, notification) out of the model's control entirely.
 */

import { quoteForCategory, type QuoteResult } from "@/lib/leads/quote";
import { createLead } from "@/lib/db/queries/leads";
import { updateCall } from "@/lib/db/queries/calls";
import { scoreLeadFromAnswers } from "@/lib/leads/scoring";
import { assessLead } from "@/lib/leads/assess";
import { sendLeadPacketEmail, sendMessageNotificationEmail } from "@/lib/email/notifications";
import { sendLeadPushNotification } from "@/lib/push/send";
import { buildLeadPushPayload, buildMessagePushPayload } from "@/lib/push/payload";
import { logger } from "@/lib/logger";
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
 * Creates the lead and runs it through the SAME scoring pipeline the web
 * intake form uses (scoreLeadFromAnswers + assessLead) — voice answers are
 * captured under the vertical's own question keys specifically so this works
 * with zero voice-specific scoring logic. Sends the same notification email
 * used by the web channel.
 */
export async function captureLead(ctx: FlowContext): Promise<CaptureLeadResult> {
  const { session, business, verticalConfig } = ctx;
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

  // Message path: skip scoring/assessment entirely (leadStatus stays 'new', scores
  // stay null) and send a low-key "new message" alert instead of a lead packet.
  if (leadType === "message") {
    if (!session.isTestCall) {
      await notifyMessageCaptured(ctx, lead.id, messageKind);
    }
    return { leadId: lead.id };
  }

  const scores = scoreLeadFromAnswers(answers, verticalConfig.scoringRules, verticalConfig.questions, verticalConfig.baseValueLow, {
    serviceRequested: session.conversationContext.serviceRequested ?? null,
    signalText: session.conversationContext.reasonForCall ?? null,
  });
  const reasoning = await assessLead(lead.id, answers, scores, verticalConfig.aiPromptTemplate);

  if (!session.isTestCall && business.notificationPreferences?.qualifiedLead !== false) {
    try {
      await sendLeadPacketEmail({
        ownerEmail: business.ownerEmail,
        ownerName: business.ownerName,
        businessName: business.businessName,
        leadId: lead.id,
        callerName: session.conversationContext.callerName ?? null,
        callerPhone: session.callerPhone,
        urgencyScore: scores.urgencyScore,
        qualityScore: scores.qualityScore,
        estimatedValueLow: scores.estimatedValueLow,
        estimatedValueHigh: scores.estimatedValueHigh,
        urgencyReasoning: reasoning.urgencyReasoning,
        qualityReasoning: reasoning.qualityReasoning,
        recommendedActions: reasoning.recommendedActions,
        intakeAnswers: answers,
        questions: verticalConfig.questions,
      });
    } catch (err) {
      logger.error("Failed to send lead packet email for voice lead", { leadId: lead.id, error: String(err) });
    }

    // Push-primary operator alert (PWA/browser), same message as the web path.
    if (business.notificationPreferences?.pushNewLead !== false) {
      await sendLeadPushNotification(
        business.id,
        buildLeadPushPayload({
          leadId: lead.id,
          callerName: session.conversationContext.callerName ?? null,
          priorityScore: scores.priorityScore,
          estimatedValueLow: scores.estimatedValueLow,
          estimatedValueHigh: scores.estimatedValueHigh,
        }),
      );
    }
  }

  return { leadId: lead.id };
}

/**
 * Low-key operator alert for a captured MESSAGE (non-job). Deliberately NOT the
 * "New Qualified Lead" packet — no scores, no value, no Hot/Warm/Cool. Email is
 * gated on the messageNotification pref (default on); push reuses pushNewLead.
 */
async function notifyMessageCaptured(ctx: FlowContext, leadId: string, messageKind: string | null): Promise<void> {
  const { session, business } = ctx;
  const callerName = session.conversationContext.callerName ?? null;
  const notes = session.conversationContext.reasonForCall ?? null;

  if (business.notificationPreferences?.messageNotification !== false) {
    try {
      await sendMessageNotificationEmail({
        ownerEmail: business.ownerEmail,
        ownerName: business.ownerName,
        businessName: business.businessName,
        leadId,
        callerName,
        callerPhone: session.callerPhone,
        messageKind,
        notes,
      });
    } catch (err) {
      logger.error("Failed to send message notification email", { leadId, error: String(err) });
    }
  }

  if (business.notificationPreferences?.pushNewLead !== false) {
    await sendLeadPushNotification(
      business.id,
      buildMessagePushPayload({ leadId, callerName, messageKind, notes }),
    );
  }
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

