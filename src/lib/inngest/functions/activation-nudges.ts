import { inngest } from "@/lib/inngest/client";
import { getAllBusinesses, updateBusiness } from "@/lib/db/queries/businesses";
import { getLeadStatsForPeriod } from "@/lib/db/queries/leads";
import { hasPaymentOnFile } from "@/lib/subscription";
import { sendActivationNudgeEmail, type ActivationNudgeStage } from "@/lib/email/notifications";
import { logger } from "@/lib/logger";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const DAY_MS = 24 * 60 * 60 * 1000;

// Only nudge accounts created within this many days — keeps the series scoped to
// genuinely new signups and avoids blasting long-dormant pre-existing accounts
// on first deploy.
const RECENCY_WINDOW_DAYS = 14;

// Idempotency mechanism (same as trial-reminders): businesses.activationNudgeStage
// stores the furthest activation nudge already sent. We only send a stage whose
// rank is strictly higher than what's stored, so a daily run never double-sends.
const STAGE_RANK: Record<ActivationNudgeStage, number> = {
  activation_day1: 1,
  activation_day3: 2,
  activation_day7: 3,
};

function targetStage(daysSinceCreated: number): ActivationNudgeStage | null {
  // Collapsed to a SINGLE nudge (early-stage simplification): one "you're not
  // live yet" email around day 3. The day-1 and day-7 stages are intentionally
  // dormant. STAGE_RANK still guards against re-sends once day-3 has gone out.
  // To restore the full 3-stage series, bring back the day-1/day-7 branches.
  if (daysSinceCreated >= 3) return "activation_day3";
  return null; // before day 3 — hold the single nudge
}

/**
 * Welcome -> activation nudges — fires daily at 17:30 UTC (never before 9am Pacific
 * in any US timezone: winter 9:30am PT / 12:30pm ET, summer 10:30am PT / 1:30pm ET).
 * Scans recently-created
 * businesses that are still stalled (no card / no live number / no first lead)
 * and sends day-1, day-3, day-7 nudges. The one-shot welcome email is owned by
 * /api/business; this series is driven purely from the scan. Idempotent via
 * businesses.activationNudgeStage.
 */
export const activationNudges = inngest.createFunction(
  {
    id: "activation-nudges",
    name: "Activation Nudge Emails",
    triggers: [{ cron: "30 17 * * *" }], // daily 17:30 UTC (>= 9am Pacific year-round)
  },
  async () => {
    const businesses = await getAllBusinesses();
    const now = new Date();

    let sent = 0;
    let skipped = 0;

    for (const business of businesses) {
      if (!business.ownerEmail) {
        skipped++;
        continue;
      }

      const daysSinceCreated = Math.floor((now.getTime() - business.createdAt.getTime()) / DAY_MS);
      if (daysSinceCreated > RECENCY_WINDOW_DAYS) {
        skipped++;
        continue;
      }

      const stage = targetStage(daysSinceCreated);
      if (!stage) {
        skipped++;
        continue;
      }

      const currentRank = business.activationNudgeStage
        ? STAGE_RANK[business.activationNudgeStage as ActivationNudgeStage] ?? 0
        : 0;
      if (STAGE_RANK[stage] <= currentRank) {
        skipped++;
        continue;
      }

      // "Stalled" = not fully activated. Fully activated means a card on file, a
      // live number, AND at least one captured lead — then there's nothing to
      // nudge and we skip the rest of the series.
      const stats = await getLeadStatsForPeriod(business.id, business.createdAt);
      // Count job leads only — a lone non-job message (a wrong number filed as a
      // message, a billing question) is not "you've captured your first lead" and
      // must not silence the go-live nudge series.
      const activated = hasPaymentOnFile(business) && !!business.twilioPhoneNumber && stats.jobTotal > 0;
      if (activated) {
        skipped++;
        continue;
      }

      try {
        await sendActivationNudgeEmail({
          ownerEmail: business.ownerEmail,
          ownerName: business.ownerName,
          businessName: business.businessName,
          stage,
          dashboardUrl: `${APP_URL}/dashboard`,
        });
        await updateBusiness(business.id, { activationNudgeStage: stage });
        sent++;
        logger.info("activation-nudges: sent", { businessId: business.id, stage });
      } catch (err) {
        logger.error("activation-nudges: failed to send", {
          businessId: business.id,
          stage,
          err: String(err),
        });
      }
    }

    logger.info("activation-nudges: complete", { sent, skipped });
    return { sent, skipped };
  }
);
