import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { weeklyReport } from "@/lib/inngest/functions/weekly-report";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [weeklyReport],
});
