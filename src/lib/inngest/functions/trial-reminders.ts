import { inngest } from "@/lib/inngest/client";
import { getAllBusinesses, updateBusiness } from "@/lib/db/queries/businesses";
import { getLeadStatsForPeriod } from "@/lib/db/queries/leads";
import { sendTrialReminderEmail, type TrialReminderStage } from "@/lib/email/notifications";
import { logger } from "@/lib/logger";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const DAY_MS = 24 * 60 * 60 * 1000;

// Rank-ordered stages. Idempotency mechanism: businesses.trialReminderStage
// stores the furthest stage already emailed. We only send a stage whose rank is
// strictly higher than what's stored, so a daily run never double-sends the same
// stage and never regresses to an earlier one if the trial window is already
// deep (e.g. the business signed up mid-window). Works on the mock trial, which
// sets subscriptionStatus='trialing' + trialEndsAt.
const STAGE_RANK: Record<TrialReminderStage, number> = {
  trial_day10: 1,
  trial_day13: 2,
  trial_expiry: 3,
};

function targetStage(daysUntilExpiry: number): TrialReminderStage | null {
  if (daysUntilExpiry <= 0) return "trial_expiry";
  if (daysUntilExpiry === 1) return "trial_day13";
  if (daysUntilExpiry >= 2 && daysUntilExpiry <= 4) return "trial_day10";
  return null; // more than 4 days left — nothing to send yet
}

/**
 * Trial-ending reminders — fires daily at 15:00 UTC. Scans trialing businesses
 * and sends the day-10, day-13, and expiry-day emails based on trialEndsAt.
 * Leads with "here's what Callverted captured for you." Idempotent via
 * businesses.trialReminderStage (see STAGE_RANK above).
 */
export const trialReminders = inngest.createFunction(
  {
    id: "trial-reminders",
    name: "Trial-ending Reminder Emails",
    triggers: [{ cron: "0 15 * * *" }],
  },
  async () => {
    const businesses = await getAllBusinesses();
    const now = new Date();

    let sent = 0;
    let skipped = 0;

    for (const business of businesses) {
      if (business.subscriptionStatus !== "trialing" || !business.trialEndsAt || !business.ownerEmail) {
        skipped++;
        continue;
      }

      const daysUntilExpiry = Math.ceil((business.trialEndsAt.getTime() - now.getTime()) / DAY_MS);
      const stage = targetStage(daysUntilExpiry);
      if (!stage) {
        skipped++;
        continue;
      }

      const currentRank = business.trialReminderStage
        ? STAGE_RANK[business.trialReminderStage as TrialReminderStage] ?? 0
        : 0;
      if (STAGE_RANK[stage] <= currentRank) {
        skipped++;
        continue;
      }

      try {
        const stats = await getLeadStatsForPeriod(business.id, business.createdAt);
        await sendTrialReminderEmail({
          ownerEmail: business.ownerEmail,
          ownerName: business.ownerName,
          businessName: business.businessName,
          stage,
          billingUrl: `${APP_URL}/dashboard/billing`,
          // Count job leads only in the "you captured X" figure — messages aren't leads.
          stats: { ...stats, total: stats.jobTotal },
        });
        // Record the stage only after a successful send so a failure retries.
        await updateBusiness(business.id, { trialReminderStage: stage });
        sent++;
        logger.info("trial-reminders: sent", { businessId: business.id, stage });
      } catch (err) {
        logger.error("trial-reminders: failed to send", {
          businessId: business.id,
          stage,
          err: String(err),
        });
      }
    }

    logger.info("trial-reminders: complete", { sent, skipped });
    return { sent, skipped };
  }
);
