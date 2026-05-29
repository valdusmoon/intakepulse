import { inngest } from "../client";
import { db } from "@/lib/db";
import { contracts } from "@/lib/db/schema/contracts";
import { leads } from "@/lib/db/schema/leads";
import { companies } from "@/lib/db/schema/companies";
import { and, eq, inArray, isNull, lt, sql } from "drizzle-orm";
import { buildContractNudgeEmails } from "@/lib/email/notifications";
import { emailClient } from "@/lib/email/email-client";

// Runs daily at 9 AM UTC — nudges painter + homeowner for contracts sent 72h+ ago with no signature
export const contractNudge = inngest.createFunction(
  { id: "contract-nudge", name: "Contract Follow-Up Nudge", triggers: [{ cron: "0 9 * * *" }] },
  async ({ step }) => {
    const result = await step.run("send-contract-nudges", async () => {
      const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000);

      const pending = await db
        .select({
          contract: contracts,
          lead: leads,
          company: companies,
        })
        .from(contracts)
        .innerJoin(leads, eq(contracts.leadId, leads.id))
        .innerJoin(companies, eq(contracts.companyId, companies.id))
        .where(
          and(
            eq(contracts.status, "sent"),
            isNull(contracts.signedAt),
            isNull(contracts.nudgeSentAt),
            isNull(contracts.deletedAt),
            lt(contracts.sentAt, cutoff)
          )
        );

      if (pending.length === 0) return { nudged: 0 };

      // Collect all email payloads across all pending contracts
      const allEmails: Array<{ to: string; subject: string; html: string }> = [];
      for (const { contract, lead, company } of pending) {
        const nudgesEnabled = company.notificationPreferences?.nudgeReminders !== false;
        const emails = buildContractNudgeEmails({
          painterEmail: nudgesEnabled ? company.ownerEmail : null,
          painterName: company.ownerName,
          businessName: company.businessName,
          homeownerName: lead.homeownerName,
          homeownerEmail: lead.homeownerEmail ?? undefined,
          publicToken: contract.publicToken,
        });
        allEmails.push(...emails);
      }

      // Send all in batches of 100 (Resend batch limit)
      await emailClient.batchSend(allEmails);

      // Bulk-stamp nudge_sent_at for all processed contracts
      const ids = pending.map(({ contract }) => contract.id);
      await db
        .update(contracts)
        .set({ nudgeSentAt: sql`now()` })
        .where(inArray(contracts.id, ids));

      return { nudged: pending.length };
    });

    return result;
  }
);
