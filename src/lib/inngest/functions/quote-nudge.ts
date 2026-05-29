import { inngest } from "../client";
import { db } from "@/lib/db";
import { quotes } from "@/lib/db/schema/quotes";
import { leads } from "@/lib/db/schema/leads";
import { companies } from "@/lib/db/schema/companies";
import { and, eq, inArray, isNull, lt, sql } from "drizzle-orm";
import { buildQuoteNudgeEmails } from "@/lib/email/notifications";
import { emailClient } from "@/lib/email/email-client";

// Runs daily at 9 AM UTC — nudges painter + homeowner for quotes sent 48h+ ago with no view
export const quoteNudge = inngest.createFunction(
  { id: "quote-nudge", name: "Quote Follow-Up Nudge", triggers: [{ cron: "0 9 * * *" }] },
  async ({ step }) => {
    const result = await step.run("send-quote-nudges", async () => {
      const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

      const pending = await db
        .select({
          quote: quotes,
          lead: leads,
          company: companies,
        })
        .from(quotes)
        .innerJoin(leads, eq(quotes.leadId, leads.id))
        .innerJoin(companies, eq(quotes.companyId, companies.id))
        .where(
          and(
            eq(quotes.status, "sent"),
            isNull(quotes.viewedAt),
            isNull(quotes.nudgeSentAt),
            isNull(quotes.deletedAt),
            lt(quotes.sentAt, cutoff)
          )
        );

      if (pending.length === 0) return { nudged: 0 };

      // Collect all email payloads across all pending quotes
      const allEmails: Array<{ to: string; subject: string; html: string }> = [];
      for (const { quote, lead, company } of pending) {
        const nudgesEnabled = company.notificationPreferences?.nudgeReminders !== false;
        const emails = buildQuoteNudgeEmails({
          painterEmail: nudgesEnabled ? company.ownerEmail : null,
          painterName: company.ownerName,
          businessName: company.businessName,
          homeownerName: lead.homeownerName,
          homeownerEmail: lead.homeownerEmail ?? undefined,
          quoteNumber: quote.quoteNumber,
          publicToken: quote.publicToken,
        });
        allEmails.push(...emails);
      }

      // Send all in batches of 100 (Resend batch limit)
      await emailClient.batchSend(allEmails);

      // Bulk-stamp nudge_sent_at for all processed quotes
      const ids = pending.map(({ quote }) => quote.id);
      await db
        .update(quotes)
        .set({ nudgeSentAt: sql`now()` })
        .where(inArray(quotes.id, ids));

      return { nudged: pending.length };
    });

    return result;
  }
);
