/**
 * Test setup — sets a fake Telnyx number on the dev business so
 * the call webhook lookup succeeds during manual testing.
 * Run once before firing test curl commands.
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { businesses } from "../src/lib/db/schema/businesses";
import { eq } from "drizzle-orm";

const BUSINESS_ID = "637f4b9b-24b3-4d4c-9d81-1888fcd0c5f5";
const FAKE_TELNYX_NUMBER = "+18005550100"; // fake number used only in test payloads

async function main() {
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client);

  await db.update(businesses)
    .set({ telnyxPhoneNumber: FAKE_TELNYX_NUMBER })
    .where(eq(businesses.id, BUSINESS_ID));

  console.log(`✓ Set telnyxPhoneNumber = ${FAKE_TELNYX_NUMBER} on business ${BUSINESS_ID}`);
  console.log(`\nNow start the dev server (npm run dev) and run these curl commands in order:\n`);

  const callControlId = "test-ctrl-" + Date.now();
  const callLegId = "test-leg-" + Date.now();
  const callerPhone = "+16465559999"; // fake caller

  console.log("── Step 1: call.initiated (someone calls our Telnyx number) ──");
  console.log(`curl -X POST http://localhost:3000/api/telnyx/call \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({
    data: {
      event_type: "call.initiated",
      payload: {
        call_control_id: callControlId,
        call_leg_id: callLegId,
        from: callerPhone,
        to: FAKE_TELNYX_NUMBER,
      },
    },
  })}'\n`);

  console.log("── Step 2: call.hangup WITHOUT call.answered (missed call) ──");
  console.log(`curl -X POST http://localhost:3000/api/telnyx/call \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({
    data: {
      event_type: "call.hangup",
      payload: {
        call_control_id: callControlId,
        call_leg_id: callLegId,
        from: callerPhone,
        to: FAKE_TELNYX_NUMBER,
      },
    },
  })}'\n`);

  console.log("── Step 3 (optional): simulate inbound SMS reply ──");
  console.log(`curl -X POST http://localhost:3000/api/telnyx/sms \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({
    data: {
      event_type: "message.received",
      payload: {
        from: { phone_number: callerPhone },
        to: [{ phone_number: FAKE_TELNYX_NUMBER }],
        text: "Yes I need help, my basement is flooded",
      },
    },
  })}'\n`);

  await client.end();
}

main().catch(console.error);
