import { NextRequest, NextResponse } from "next/server";

import { serverEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { getDueFollowups, markFollowupSent } from "@/lib/db/queries/followups";
import { getLeadById } from "@/lib/db/queries/leads";
import { getBusinessById } from "@/lib/db/queries/businesses";
import { sendFollowupEmail } from "@/lib/email/notifications";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * Daily cron — declared in vercel.json ("0 2 * * *") and allowlisted in
 * middleware (/api/cron(.*)). Vercel Cron calls this with an
 * `Authorization: Bearer <CRON_SECRET>` header; we reject anything else when a
 * secret is configured. Drains due follow-ups: getDueFollowups -> send ->
 * markFollowupSent, resilient per item so one bad row never aborts the batch.
 */
export async function GET(req: NextRequest) {
  const secret = serverEnv.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const due = await getDueFollowups();

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const followup of due) {
    try {
      const lead = await getLeadById(followup.leadId);
      const business = await getBusinessById(followup.businessId);

      // Missing lead/business or no address to send to: mark sent so the row
      // drains instead of being retried forever.
      if (!lead || !business || !lead.callerEmail) {
        await markFollowupSent(followup.id);
        skipped++;
        continue;
      }

      // Defensive guard: a non-job MESSAGE (billing question, existing customer,
      // wrong-number-turned-message) must NEVER receive a "still need that service?
      // finish your intake" sales drip. Follow-up scheduling isn't wired today
      // (createFollowup is never called), but if it's ever added this keeps messages
      // out of it. Drain the row rather than retry it.
      if (lead.leadType === "message") {
        await markFollowupSent(followup.id);
        skipped++;
        continue;
      }

      await sendFollowupEmail({
        toEmail: lead.callerEmail,
        businessName: business.businessName,
        intakeUrl: `${APP_URL}/intake/${business.id}`,
      });
      await markFollowupSent(followup.id);
      sent++;
    } catch (err) {
      // Leave the row unsent so the next daily run retries it.
      failed++;
      logger.error("cron/daily: followup send failed", {
        followupId: followup.id,
        err: String(err),
      });
    }
  }

  logger.info("cron/daily: complete", { due: due.length, sent, skipped, failed });
  return NextResponse.json({ due: due.length, sent, skipped, failed });
}
