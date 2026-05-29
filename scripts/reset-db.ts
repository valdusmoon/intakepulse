/**
 * Reset script — wipes all data from all tables (cascade order).
 * Run with: npx tsx scripts/reset-db.ts
 *
 * This deletes everything: companies, leads, staff, quotes, contracts, photos.
 * You'll need to go through onboarding again on any account you want to use.
 */
import "dotenv/config";
import { db, closeConnection } from "../src/lib/db/index";
import { contracts } from "../src/lib/db/schema/contracts";
import { quotes } from "../src/lib/db/schema/quotes";
import { leadPhotos } from "../src/lib/db/schema/lead-photos";
import { leads } from "../src/lib/db/schema/leads";
import { staff } from "../src/lib/db/schema/staff";
import { companies } from "../src/lib/db/schema/companies";

async function reset() {
  console.log("Resetting database...");

  await db.delete(contracts);
  console.log("  ✓ contracts");

  await db.delete(quotes);
  console.log("  ✓ quotes");

  await db.delete(leadPhotos);
  console.log("  ✓ lead_photos");

  await db.delete(leads);
  console.log("  ✓ leads");

  await db.delete(staff);
  console.log("  ✓ staff");

  await db.delete(companies);
  console.log("  ✓ companies");

  console.log("\nDone. All tables cleared.");
  await closeConnection();
}

reset().catch((err) => {
  console.error("Reset failed:", err);
  process.exit(1);
});
