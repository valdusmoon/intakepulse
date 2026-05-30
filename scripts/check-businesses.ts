import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { businesses } from "../src/lib/db/schema/businesses";

async function main() {
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client);

  const rows = await db.select({
    id: businesses.id,
    name: businesses.businessName,
    telnyx: businesses.telnyxPhoneNumber,
    forwarding: businesses.forwardingNumber,
    email: businesses.ownerEmail,
  }).from(businesses).limit(3);

  console.log(JSON.stringify(rows, null, 2));
  await client.end();
}

main().catch(console.error);
