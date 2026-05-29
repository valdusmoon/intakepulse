import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { expireQuotes } from "@/lib/inngest/functions/quote-expiration";
import { quoteNudge } from "@/lib/inngest/functions/quote-nudge";
import { contractNudge } from "@/lib/inngest/functions/contract-nudge";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [expireQuotes, quoteNudge, contractNudge],
});
