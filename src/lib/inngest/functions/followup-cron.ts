import { inngest } from "@/lib/inngest/client";
import { getDueFollowups, markFollowupSent, cancelFollowupsForLead } from "@/lib/db/queries/followups";
import { getLeadById } from "@/lib/db/queries/leads";
import { getBusinessById } from "@/lib/db/queries/businesses";
import { createSmsEvent } from "@/lib/db/queries/smsEvents";
import { sendSms, smsFollowup } from "@/lib/sms";
import { sendFollowupEmail } from "@/lib/email/notifications";
import { logger } from "@/lib/logger";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.callverted.com";

/**
 * Follow-up SMS cron — runs 3x/day at times that land 8am–7pm across all
 * major US time zones (16:00, 20:00, 23:00 UTC).
 *
 * Picks up any followup row where scheduledAt <= now and sentAt/canceledAt
 * are null. The initial missed-call SMS (Session 3) creates these rows with
 * scheduledAt = missedAt + 3 hours.
 */
export const followupCron = inngest.createFunction(
  {
    id: "followup-cron",
    name: "Follow-up SMS Cron",
    triggers: [{ cron: "0 16,20,23 * * *" }],
  },
  async () => {
    const due = await getDueFollowups();

    if (due.length === 0) {
      logger.info("followup-cron: nothing due");
      return { sent: 0 };
    }

    logger.info(`followup-cron: ${due.length} due`);
    let sent = 0;

    for (const followup of due) {
      try {
        const lead = await getLeadById(followup.leadId);

        // Lead completed intake or was lost — cancel and skip
        if (!lead || lead.status !== "sms_sent") {
          await cancelFollowupsForLead(followup.leadId, "intake_completed");
          continue;
        }

        const business = await getBusinessById(followup.businessId);
        if (!business?.telnyxPhoneNumber) {
          logger.warn("followup-cron: business missing telnyxPhoneNumber", {
            businessId: followup.businessId,
          });
          continue;
        }

        const intakeUrl = `${APP_URL}/intake/${business.id}?lead=${lead.id}&source=missed_call`;
        const smsBody = smsFollowup(business.businessName, intakeUrl);

        const messageId = await sendSms(business.telnyxPhoneNumber, lead.callerPhone, smsBody);

        await createSmsEvent({
          businessId: business.id,
          leadId: lead.id,
          direction: "outbound",
          fromPhone: business.telnyxPhoneNumber,
          toPhone: lead.callerPhone,
          body: smsBody,
          telnyxMessageId: messageId ?? undefined,
          status: "sent",
        });

        // Also send email follow-up if the lead provided an address
        if (lead.callerEmail) {
          void sendFollowupEmail({
            toEmail: lead.callerEmail,
            businessName: business.businessName,
            intakeUrl,
          }).catch((e) => logger.error("followup-cron: email failed", { leadId: lead.id, err: String(e) }));
        }

        await markFollowupSent(followup.id);
        sent++;

        logger.info("followup-cron: follow-up sent", { leadId: lead.id, followupId: followup.id, email: !!lead.callerEmail });
      } catch (err) {
        logger.error("followup-cron: error on followup", {
          followupId: followup.id,
          err: String(err),
        });
      }
    }

    return { sent };
  }
);
