import { inngest } from "@/lib/inngest/client";
import { getAllBusinesses } from "@/lib/db/queries/businesses";
import { getLeadStatsForPeriod } from "@/lib/db/queries/leads";
import { sendWeeklyReportEmail } from "@/lib/email/notifications";
import { logger } from "@/lib/logger";

/**
 * Weekly summary email — fires every Monday at 16:00 UTC (12pm ET, 9am PT).
 * Sends each business owner a digest of the past 7 days.
 * Skips businesses with no leads that week and those missing an owner email.
 */
export const weeklyReport = inngest.createFunction(
  {
    id: "weekly-report",
    name: "Weekly Report Email",
    triggers: [{ cron: "0 16 * * 1" }], // every Monday 16:00 UTC
  },
  async () => {
    const businesses = await getAllBusinesses();

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Format "May 26 – Jun 2" style label for the email subject
    const fmt = (d: Date) =>
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const weekOf = `${fmt(sevenDaysAgo)} – ${fmt(now)}`;

    let sent = 0;
    let skipped = 0;

    for (const business of businesses) {
      if (!business.ownerEmail || business.notificationPreferences?.weeklyReport === false) {
        skipped++;
        continue;
      }

      const stats = await getLeadStatsForPeriod(business.id, sevenDaysAgo);

      // Don't email owners with zero activity — nothing useful to report
      if (stats.total === 0) {
        skipped++;
        continue;
      }

      try {
        await sendWeeklyReportEmail({
          ownerEmail: business.ownerEmail,
          ownerName: business.ownerName,
          businessName: business.businessName,
          businessId: business.id,
          weekOf,
          stats,
        });
        sent++;
        logger.info("weekly-report: sent", { businessId: business.id });
      } catch (err) {
        logger.error("weekly-report: failed to send", {
          businessId: business.id,
          err: String(err),
        });
      }
    }

    logger.info("weekly-report: complete", { sent, skipped });
    return { sent, skipped };
  }
);
