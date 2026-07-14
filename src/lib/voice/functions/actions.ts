/**
 * Code-owned action services — the state machine invokes these directly after
 * a validated transition. The model never calls these; they aren't OpenAI tools,
 * they're plain functions. This is what keeps business-critical side effects
 * (pricing, lead creation, notification) out of the model's control entirely.
 */

import { getActivePricingRule } from "@/lib/db/queries/pricingRules";
import { createLead } from "@/lib/db/queries/leads";
import { updateCall } from "@/lib/db/queries/calls";
import { scoreLeadFromAnswers } from "@/lib/leads/scoring";
import { assessLead } from "@/lib/leads/assess";
import { sendLeadPacketEmail } from "@/lib/email/notifications";
import { sendLeadPushNotification } from "@/lib/push/send";
import { buildLeadPushPayload } from "@/lib/push/payload";
import { updateCallWithTwiml } from "@/lib/twilio/client";
import { generateTransferTwiml } from "@/lib/twilio/twiml";
import { logger } from "@/lib/logger";
import { getVisibleQuestions, type Answers } from "@/lib/verticals/filterAnswers";
import type { FlowContext } from "../state-machine/types";
import type { SessionState } from "../types/session";

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

export interface PriceRangeResult {
  eligible: boolean;
  message: string;
}

/**
 * Reads a business-approved message for a service category — never composes
 * a price. serviceCategory should match a pricingRules row's serviceCategory
 * for this business — the value of the vertical's primary (first) intake
 * question, e.g. "water" | "fire" | "mold" for restoration, or "ac_repair" |
 * "furnace_replacement" | ... for HVAC.
 */
export async function getPriceRangeForCategory(
  ctx: FlowContext,
  serviceCategory: string
): Promise<PriceRangeResult> {
  const rule = await getActivePricingRule(ctx.business.id, serviceCategory);
  if (!rule) {
    return { eligible: false, message: "The team will need to review the details before discussing pricing." };
  }
  return { eligible: true, message: rule.approvedCustomerMessage };
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
  const visible = getVisibleQuestions(verticalConfig.questions, answers);
  // voiceExtractOnly fields are never asked on a voice call, so a call is
  // "completed" once every *askable* visible question is answered — not gated on
  // enrichment fields the caller may simply never have mentioned.
  const allAnswered = visible.filter((q) => !q.voiceExtractOnly).every((q) => q.key in answers);
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
  const answers: Answers = session.conversationContext.answers;

  const lead = await createLead({
    businessId: business.id,
    callerPhone: session.callerPhone,
    callerName: session.conversationContext.callerName ?? null,
    source: session.isTestCall ? "voice_test" : "voice_overflow",
    callStatus: "missed",
    intakeStatus: deriveIntakeStatus(ctx),
    intakeAnswers: answers,
    notes: session.conversationContext.reasonForCall ?? null,
    smsConsent: false,
  });

  session.leadId = lead.id;
  if (!session.isTestCall) {
    await updateCall(session.callId, { leadId: lead.id, outcome: "ai_captured" });
  }

  const scores = scoreLeadFromAnswers(answers, verticalConfig.scoringRules, verticalConfig.questions, verticalConfig.baseValueLow);
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
          urgencyScore: scores.urgencyScore,
          estimatedValueLow: scores.estimatedValueLow,
          estimatedValueHigh: scores.estimatedValueHigh,
        }),
      );
    }
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

/**
 * Whether a live warm transfer is possible for this call. Requires a configured
 * urgent-transfer number AND — when the business's own line already rang out on
 * this call (ring_then_ai) — that the transfer number is a *different* line.
 * Transferring back to the number Callverted just tried would only ring out
 * again, so we take a message instead.
 */
export function canWarmTransfer(session: SessionState): boolean {
  if (!session.urgentTransferNumber) return false;
  if (session.businessLineAlreadyTried && session.forwardingNumber) {
    // Compare the last 10 significant digits directly rather than via a strict
    // phone validator: differently-formatted versions of the same US line still
    // match, and we never fail open (allow a dead-end transfer) just because a
    // validator rejected an oddly-formatted number.
    const last10 = (p: string) => p.replace(/\D/g, "").slice(-10);
    const transferTo = last10(session.urgentTransferNumber);
    const alreadyTried = last10(session.forwardingNumber);
    if (transferTo.length === 10 && transferTo === alreadyTried) return false;
  }
  return true;
}

/**
 * Warm-transfers the live call to the business's urgent line. Triggered by the
 * engine on a detected wants_human/emergency-adjacent global intent — the model
 * never decides this on its own.
 */
export async function transferCallAction(ctx: FlowContext): Promise<{ transferred: boolean }> {
  const { session } = ctx;
  if (!canWarmTransfer(session) || !session.urgentTransferNumber) return { transferred: false };

  try {
    await updateCallWithTwiml(session.callSid, generateTransferTwiml(session.urgentTransferNumber));
    session.conversationContext.actionsTaken.push(`transferred to ${session.urgentTransferNumber}`);
    session.transferred = true;
    return { transferred: true };
  } catch (err) {
    logger.error("Failed to transfer call", { correlationId: session.correlationId, error: String(err) });
    return { transferred: false };
  }
}
