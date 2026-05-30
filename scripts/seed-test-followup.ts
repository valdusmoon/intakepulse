/**
 * Seeds a due followup row for a lead that's still in sms_sent status,
 * so the followup-cron has something to process when manually triggered.
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { leads } from "../src/lib/db/schema/leads";
import { followups } from "../src/lib/db/schema/followups";
import { eq } from "drizzle-orm";

const BUSINESS_ID = "637f4b9b-24b3-4d4c-9d81-1888fcd0c5f5";

async function main() {
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client);

  // Create a fresh test lead in sms_sent status
  const [lead] = await db.insert(leads).values({
    businessId: BUSINESS_ID,
    callerPhone: "+16465550001",
    source: "missed_call",
    callStatus: "missed",
    status: "sms_sent",
    smsConsent: false,
  }).returning();

  // Create a followup with scheduledAt in the past so getDueFollowups picks it up
  const pastTime = new Date(Date.now() - 4 * 60 * 60 * 1000); // 4 hours ago
  const [followup] = await db.insert(followups).values({
    leadId: lead.id,
    businessId: BUSINESS_ID,
    sequence: 1,
    scheduledAt: pastTime,
  }).returning();

  console.log("✓ Test lead created:", lead.id);
  console.log("✓ Due followup created:", followup.id);
  console.log("  scheduledAt:", pastTime.toISOString(), "(past — cron will pick this up)");
  console.log("\nNow trigger the followup-cron function in the Inngest UI at http://localhost:8288");

  await client.end();
}

main().catch(console.error);
