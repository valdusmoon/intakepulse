import { inngest } from "@/lib/inngest/client";
import { getAllBusinesses, updateBusiness } from "@/lib/db/queries/businesses";
import { getLeadStatsBetween } from "@/lib/db/queries/leads";
import { isBusinessSubscriptionActive } from "@/lib/subscription";
import { sendMonthlyRoiRecapEmail } from "@/lib/email/notifications";
import { zonedMonthStartUtc, formatInTimezone, dateKeyInTimezone } from "@/lib/utils/datetime";
import { logger } from "@/lib/logger";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * Monthly ROI recap — fires on the 1st of each month at 15:00 UTC. Sends
 * active/trialing owners a "you recovered $X in missed calls" digest for the
 * month that just ended. Anti-churn value reinforcement. Idempotent via
 * businesses.monthlyRecapSentFor ('YYYY-MM' of the recapped month).
 */
export const monthlyRoiRecap = inngest.createFunction(
  {
    id: "monthly-roi-recap",
    name: "Monthly ROI Recap Emails",
    triggers: [{ cron: "0 15 1 * *" }],
  },
  async () => {
    const now = new Date();
    const businesses = await getAllBusinesses();

    let sent = 0;
    let skipped = 0;

    for (const business of businesses) {
      if (!business.ownerEmail || !isBusinessSubscriptionActive(business)) {
        skipped++;
        continue;
      }

      // The calendar month that just ended, on the business's own calendar:
      // [firstOfPrevMonth, firstOfThisMonth). Computed per-business so a lead created
      // late on the last day of the month (business-local) lands in the right recap.
      const tz = business.timezone;
      const firstOfThisMonth = zonedMonthStartUtc(tz, 0, now);
      const firstOfPrevMonth = zonedMonthStartUtc(tz, -1, now);
      const monthLabel = formatInTimezone(firstOfPrevMonth, tz, { month: "long", year: "numeric" });
      const periodKey = dateKeyInTimezone(firstOfPrevMonth, tz).slice(0, 7); // 'YYYY-MM'

      // Already recapped this month.
      if (business.monthlyRecapSentFor === periodKey) {
        skipped++;
        continue;
      }

      const stats = await getLeadStatsBetween(business.id, firstOfPrevMonth, firstOfThisMonth);

      // Nothing captured last month — skip rather than send an empty recap.
      if (stats.total === 0) {
        skipped++;
        continue;
      }

      try {
        await sendMonthlyRoiRecapEmail({
          ownerEmail: business.ownerEmail,
          ownerName: business.ownerName,
          businessName: business.businessName,
          monthLabel,
          dashboardUrl: `${APP_URL}/dashboard`,
          stats,
        });
        await updateBusiness(business.id, { monthlyRecapSentFor: periodKey });
        sent++;
        logger.info("monthly-roi-recap: sent", { businessId: business.id, periodKey });
      } catch (err) {
        logger.error("monthly-roi-recap: failed to send", {
          businessId: business.id,
          err: String(err),
        });
      }
    }

    logger.info("monthly-roi-recap: complete", { sent, skipped });
    return { sent, skipped };
  }
);
