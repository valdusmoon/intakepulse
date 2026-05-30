import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { followupCron } from "@/lib/inngest/functions/followup-cron";
import { weeklyReport } from "@/lib/inngest/functions/weekly-report";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [followupCron, weeklyReport],
});
