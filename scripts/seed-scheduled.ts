/**
 * Seed scheduled jobs for testing the schedule view.
 * Run with: npx tsx scripts/seed-scheduled.ts
 */
import { db } from "../src/lib/db/index";
import { leads } from "../src/lib/db/schema/leads";
import { companies } from "../src/lib/db/schema/companies";
import { eq } from "drizzle-orm";

const COMPANY_EMAIL = "moonvaldus@gmail.com";

function daysFromNow(n: number, hour = 8): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, 0, 0, 0);
  return d;
}

async function main() {
  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.ownerEmail, COMPANY_EMAIL));

  if (!company) {
    console.error(`No company found for ${COMPANY_EMAIL}`);
    process.exit(1);
  }

  console.log(`Seeding scheduled jobs for: ${company.businessName}`);

  const jobs = [
    {
      homeownerName: "Sarah M.",
      homeownerPhone: "+15125550201",
      homeownerEmail: "sarah.m@example.com",
      address: "142 Oak St",
      city: "Austin",
      serviceType: "interior",
      status: "scheduled",
      scheduledAt: daysFromNow(0, 8),    // Today 8am
      scheduledEndAt: daysFromNow(0, 13), // Today 1pm
      quotedAmount: 2400,
    },
    {
      homeownerName: "Marcus D.",
      homeownerPhone: "+15125550202",
      homeownerEmail: "marcus.d@example.com",
      address: "88 Maple Ave",
      city: "Austin",
      serviceType: "exterior",
      status: "scheduled",
      scheduledAt: daysFromNow(0, 13),   // Today 1pm
      scheduledEndAt: daysFromNow(0, 17), // Today 5pm
      quotedAmount: 3800,
    },
    {
      homeownerName: "Linda K.",
      homeownerPhone: "+15125550203",
      homeownerEmail: "linda.k@example.com",
      address: "9 River Rd",
      city: "Round Rock",
      serviceType: "both",
      status: "scheduled",
      scheduledAt: daysFromNow(2, 8),
      scheduledEndAt: daysFromNow(2, 16),
      quotedAmount: 7200,
    },
    {
      homeownerName: "James R.",
      homeownerPhone: "+15125550204",
      homeownerEmail: "james.r@example.com",
      address: "310 Cedar Ln",
      city: "Pflugerville",
      serviceType: "exterior",
      status: "scheduled",
      scheduledAt: daysFromNow(4, 9),
      scheduledEndAt: daysFromNow(4, 15),
      quotedAmount: 5100,
    },
    {
      homeownerName: "Patricia W.",
      homeownerPhone: "+15125550205",
      homeownerEmail: "patricia.w@example.com",
      address: "55 Sunset Blvd",
      city: "Austin",
      serviceType: "interior",
      status: "scheduled",
      scheduledAt: daysFromNow(7, 8),
      scheduledEndAt: daysFromNow(7, 12),
      quotedAmount: 1800,
    },
    {
      homeownerName: "Tom B.",
      homeownerPhone: "+15125550206",
      homeownerEmail: "tom.b@example.com",
      address: "201 Elm St",
      city: "Georgetown",
      serviceType: "exterior",
      status: "scheduled",
      scheduledAt: daysFromNow(10, 7),
      scheduledEndAt: daysFromNow(10, 17),
      quotedAmount: 6400,
    },
    {
      homeownerName: "David & Carol H.",
      homeownerPhone: "+15125550207",
      homeownerEmail: "david.h@example.com",
      address: "77 Lakeview Dr",
      city: "Austin",
      serviceType: "both",
      status: "scheduled",
      scheduledAt: daysFromNow(5, 8),    // Starts in 5 days
      scheduledEndAt: daysFromNow(8, 17), // Ends 3 days later
      quotedAmount: 11200,
    },
  ];

  const rows = jobs.map((j) => ({
    companyId: company.id,
    homeownerName: j.homeownerName,
    homeownerPhone: j.homeownerPhone,
    homeownerEmail: j.homeownerEmail,
    address: j.address,
    city: j.city,
    serviceType: j.serviceType,
    status: j.status,
    scheduledAt: j.scheduledAt,
    scheduledEndAt: j.scheduledEndAt,
    quotedAmount: j.quotedAmount,
    source: "manual" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  await db.insert(leads).values(rows);
  console.log(`✓ Inserted ${rows.length} scheduled jobs`);
  console.log("  Today: Sarah M. (8am) + Marcus D. (1pm)");
  console.log("  In 2 days: Linda K.");
  console.log("  In 4 days: James R.");
  console.log("  In 7 days: Patricia W.");
  console.log("  In 10 days: Tom B.");

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
