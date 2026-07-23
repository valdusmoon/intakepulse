import { sendLeadPacketEmail } from "@/lib/email/notifications";
import { sendLeadPushNotification } from "@/lib/push/send";
import { buildLeadPushPayload } from "@/lib/push/payload";
import { logger } from "@/lib/logger";
import type { BusinessNotificationPreferences } from "@/lib/db/schema/businesses";
import type { VerticalQuestion } from "@/lib/db/schema/verticalConfigs";
import type { ScoringResult } from "@/lib/leads/scoring";
import type { ReasoningResult } from "@/lib/leads/assess";
import type { Answers } from "@/lib/verticals/filterAnswers";

/**
 * The full "New Qualified Lead" operator alert for a scored JOB — the loud
 * counterpart to notifyMessageCaptured, shared by every channel that alerts on
 * jobs (voice finalizer, web intake). Everything is gated on the qualifiedLead
 * pref; push additionally on pushNewLead. Email and push are independent
 * channels — a failure in one must not skip the other (push is the primary,
 * more-reliable alert). Never throws.
 */
export async function notifyJobLead(params: {
  business: {
    id: string;
    ownerEmail: string;
    ownerName: string;
    businessName: string;
    notificationPreferences: BusinessNotificationPreferences;
  };
  leadId: string;
  callerName: string | null;
  callerPhone: string;
  scores: ScoringResult;
  reasoning: ReasoningResult;
  answers: Answers;
  questions: VerticalQuestion[];
}): Promise<void> {
  const { business, leadId, callerName, callerPhone, scores, reasoning, answers, questions } = params;

  if (business.notificationPreferences?.qualifiedLead === false) return;

  try {
    await sendLeadPacketEmail({
      ownerEmail: business.ownerEmail,
      ownerName: business.ownerName,
      businessName: business.businessName,
      leadId,
      callerName,
      callerPhone,
      urgencyScore: scores.urgencyScore,
      qualityScore: scores.qualityScore,
      estimatedValueLow: scores.estimatedValueLow,
      estimatedValueHigh: scores.estimatedValueHigh,
      urgencyReasoning: reasoning.urgencyReasoning,
      qualityReasoning: reasoning.qualityReasoning,
      recommendedActions: reasoning.recommendedActions,
      intakeAnswers: answers,
      questions,
    });
  } catch (err) {
    logger.error("lead packet email failed", { leadId, error: String(err) });
  }

  if (business.notificationPreferences?.pushNewLead !== false) {
    await sendLeadPushNotification(
      business.id,
      buildLeadPushPayload({
        leadId,
        callerName,
        priorityScore: scores.priorityScore,
        estimatedValueLow: scores.estimatedValueLow,
        estimatedValueHigh: scores.estimatedValueHigh,
      }),
    );
  }
}
