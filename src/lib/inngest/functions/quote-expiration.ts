import { inngest } from "../client";
import { db } from "@/lib/db";
import { quotes } from "@/lib/db/schema/quotes";
import { leads } from "@/lib/db/schema/leads";
import { and, eq, lt, isNull } from "drizzle-orm";

// Runs daily at 8 AM UTC — marks expired quotes and rewinds lead status
export const expireQuotes = inngest.createFunction(
  { id: "expire-quotes", name: "Expire Overdue Quotes", triggers: [{ cron: "0 8 * * *" }] },
  async ({ step }) => {
    const expired = await step.run("mark-expired-quotes", async () => {
      const now = new Date();
      const today = now.toISOString().split("T")[0];

      // Find sent quotes past their valid_until date
      const expiredQuotes = await db
        .select({ id: quotes.id, leadId: quotes.leadId })
        .from(quotes)
        .where(
          and(
            eq(quotes.status, "sent"),
            lt(quotes.validUntil, today),
            isNull(quotes.deletedAt)
          )
        );

      for (const quote of expiredQuotes) {
        await db
          .update(quotes)
          .set({ status: "expired" })
          .where(eq(quotes.id, quote.id));

        // Rewind lead: quoted → contacted
        if (quote.leadId) {
          await db
            .update(leads)
            .set({ status: "contacted" })
            .where(and(eq(leads.id, quote.leadId), eq(leads.status, "quoted")));
        }
      }

      return { count: expiredQuotes.length };
    });

    return { expired: expired.count };
  }
);
