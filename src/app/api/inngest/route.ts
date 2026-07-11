import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { weeklyReport } from "@/lib/inngest/functions/weekly-report";
import { trialReminders } from "@/lib/inngest/functions/trial-reminders";
import { activationNudges } from "@/lib/inngest/functions/activation-nudges";
import { winbackEmails } from "@/lib/inngest/functions/winback-emails";
import { monthlyRoiRecap } from "@/lib/inngest/functions/monthly-roi-recap";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    weeklyReport,
    trialReminders,
    activationNudges,
    winbackEmails,
    monthlyRoiRecap,
  ],
});
