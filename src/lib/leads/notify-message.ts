import { sendMessageNotificationEmail } from "@/lib/email/notifications";
import { sendLeadPushNotification } from "@/lib/push/send";
import { buildMessagePushPayload } from "@/lib/push/payload";
import { logger } from "@/lib/logger";
import type { BusinessNotificationPreferences } from "@/lib/db/schema/businesses";

/**
 * Low-key operator alert for a captured MESSAGE (non-job) — shared by every channel
 * that alerts on messages (voice AI overflow, web form valve; human-answered calls
 * stay silent by design since the operator was on the call). Deliberately NOT the
 * "New Qualified Lead" packet — no scores, no value, no Hot/Warm/Cool. Email is
 * gated on the messageNotification pref (default on); push reuses pushNewLead.
 * Never throws — each channel failure is logged and swallowed independently.
 */
export async function notifyMessageCaptured(params: {
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
  messageKind: string | null;
  notes: string | null;
}): Promise<void> {
  const { business, leadId, callerName, callerPhone, messageKind, notes } = params;

  // Concurrent, for the same reason as the job alert: the push must not queue
  // behind an email API round-trip.
  const emailTask =
    business.notificationPreferences?.messageNotification !== false
      ? sendMessageNotificationEmail({
          ownerEmail: business.ownerEmail,
          ownerName: business.ownerName,
          businessName: business.businessName,
          leadId,
          callerName,
          callerPhone,
          messageKind,
          notes,
        }).catch((err) => {
          logger.error("Failed to send message notification email", { leadId, error: String(err) });
        })
      : Promise.resolve();

  const pushTask =
    business.notificationPreferences?.pushNewLead !== false
      ? sendLeadPushNotification(
          business.id,
          buildMessagePushPayload({ leadId, callerName, messageKind, notes }),
        )
      : Promise.resolve();

  await Promise.allSettled([emailTask, pushTask]);
}
