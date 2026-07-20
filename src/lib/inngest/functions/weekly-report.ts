import { inngest } from "@/lib/inngest/client";
import { getAllBusinesses } from "@/lib/db/queries/businesses";
import { getLeadStatsForPeriod } from "@/lib/db/queries/leads";
import { sendWeeklyReportEmail } from "@/lib/email/notifications";
import { logger } from "@/lib/logger";

/**
 * Weekly summary email — fires every Monday at 17:00 UTC. Chosen so the send is
 * never before 9am Pacific in any US timezone year-round (winter 9am PT / 12pm ET,
 * summer 10am PT / 1pm ET). Fixed UTC, so the local wall-clock shifts one hour
 * across DST but always stays >= 9am Pacific.
 * Sends each business owner a digest of the past 7 days.
 * Skips businesses with no leads that week and those missing an owner email.
 */
export const weeklyReport = inngest.createFunction(
  {
    id: "weekly-report",
    name: "Weekly Report Email",
    triggers: [{ cron: "0 17 * * 1" }], // every Monday 17:00 UTC (>= 9am Pacific year-round)
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

      // Don't email owners with zero JOB activity — a week of only non-job messages
      // isn't a performance report worth sending.
      if (stats.jobTotal === 0) {
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
          // Headline "new leads" reflects job leads only — messages are captured but
          // aren't leads, so they must not inflate the reported count.
          stats: { ...stats, total: stats.jobTotal },
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
