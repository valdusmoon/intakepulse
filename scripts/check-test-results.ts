import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { calls } from "../src/lib/db/schema/calls";
import { leads } from "../src/lib/db/schema/leads";
import { followups } from "../src/lib/db/schema/followups";
import { desc } from "drizzle-orm";

async function main() {
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client);

  const recentCalls = await db.select().from(calls).orderBy(desc(calls.createdAt)).limit(3);
  const recentLeads = await db.select({
    id: leads.id, callerPhone: leads.callerPhone, source: leads.source,
    intakeStatus: leads.intakeStatus, leadStatus: leads.leadStatus, createdAt: leads.createdAt,
  }).from(leads).orderBy(desc(leads.createdAt)).limit(3);
  const recentFollowups = await db.select().from(followups).orderBy(desc(followups.createdAt)).limit(3);

  console.log("=== CALLS ===");
  console.log(JSON.stringify(recentCalls.map(c => ({
    id: c.id, status: c.status, callerPhone: c.callerPhone,
    answeredAt: c.answeredAt, missedAt: c.missedAt, leadId: c.leadId,
  })), null, 2));

  console.log("\n=== LEADS ===");
  console.log(JSON.stringify(recentLeads, null, 2));

  console.log("\n=== FOLLOWUPS ===");
  console.log(JSON.stringify(recentFollowups.map(f => ({
    id: f.id, leadId: f.leadId, sequence: f.sequence,
    scheduledAt: f.scheduledAt, sentAt: f.sentAt, canceledAt: f.canceledAt,
  })), null, 2));

  await client.end();
}

main().catch(console.error);
