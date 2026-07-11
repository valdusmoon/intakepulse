import { inngest } from "@/lib/inngest/client";
import { getAllBusinesses, updateBusiness } from "@/lib/db/queries/businesses";
import { getLeadStatsForPeriod } from "@/lib/db/queries/leads";
import { isBusinessSubscriptionActive } from "@/lib/subscription";
import { sendWinbackEmail } from "@/lib/email/notifications";
import { logger } from "@/lib/logger";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const DAY_MS = 24 * 60 * 60 * 1000;

// Only win back accounts that churned within this window — avoids emailing
// long-dead accounts on first deploy.
const CHURN_WINDOW_DAYS = 30;

/**
 * Win-back — fires daily at 17:00 UTC. Scans businesses that recently churned
 * (subscription canceled, or trial expired without converting) and sends a
 * single reactivation email leading with the value Callverted already captured.
 * Idempotent via businesses.winbackSentAt (fires exactly once per business).
 */
export const winbackEmails = inngest.createFunction(
  {
    id: "winback-emails",
    name: "Win-back Emails",
    triggers: [{ cron: "0 17 * * *" }],
  },
  async () => {
    const businesses = await getAllBusinesses();
    const now = new Date();

    let sent = 0;
    let skipped = 0;

    for (const business of businesses) {
      // Fire exactly once.
      if (business.winbackSentAt || !business.ownerEmail) {
        skipped++;
        continue;
      }

      // Only target businesses that no longer have access (churned).
      if (isBusinessSubscriptionActive(business)) {
        skipped++;
        continue;
      }

      const status = business.subscriptionStatus;
      const trialExpired =
        status === "trialing" && !!business.trialEndsAt && business.trialEndsAt.getTime() < now.getTime();
      const canceled = status === "canceled";
      if (!trialExpired && !canceled) {
        skipped++;
        continue;
      }

      // Recency guard: churn reference date is canceledAt (cancel) or trialEndsAt
      // (expired trial).
      const churnedAt = canceled ? business.canceledAt : business.trialEndsAt;
      if (!churnedAt || (now.getTime() - churnedAt.getTime()) > CHURN_WINDOW_DAYS * DAY_MS) {
        skipped++;
        continue;
      }

      try {
        const stats = await getLeadStatsForPeriod(business.id, business.createdAt);
        await sendWinbackEmail({
          ownerEmail: business.ownerEmail,
          ownerName: business.ownerName,
          businessName: business.businessName,
          reactivateUrl: `${APP_URL}/dashboard/billing`,
          stats,
        });
        await updateBusiness(business.id, { winbackSentAt: new Date() });
        sent++;
        logger.info("winback-emails: sent", { businessId: business.id });
      } catch (err) {
        logger.error("winback-emails: failed to send", {
          businessId: business.id,
          err: String(err),
        });
      }
    }

    logger.info("winback-emails: complete", { sent, skipped });
    return { sent, skipped };
  }
);
