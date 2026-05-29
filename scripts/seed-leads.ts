/**
 * Seed script — run with: npx tsx scripts/seed-leads.ts
 */
import { db } from "../src/lib/db/index";
import { leads } from "../src/lib/db/schema/leads";
import { companies } from "../src/lib/db/schema/companies";
import { eq } from "drizzle-orm";

const COMPANY_EMAIL = "moonvaldus@gmail.com";

const NAMES = [
  "Sarah Johnson", "Mike Torres", "Emily Chen", "James Williams", "Maria Garcia",
  "David Kim", "Lisa Brown", "Robert Martinez", "Jennifer Lee", "Chris Davis",
  "Amanda Wilson", "Kevin Thompson", "Rachel Adams", "Brian Clark", "Nicole White",
  "Steven Harris", "Megan Lewis", "Daniel Walker", "Ashley Hall", "Justin Young",
  "Brittany Allen", "Nathan Scott", "Stephanie King", "Tyler Wright", "Lauren Hill",
];

const PHONES = [
  "+15125550101", "+15125550102", "+15125550103", "+15125550104", "+15125550105",
  "+15125550106", "+15125550107", "+15125550108", "+15125550109", "+15125550110",
  "+15125550111", "+15125550112", "+15125550113", "+15125550114", "+15125550115",
  "+15125550116", "+15125550117", "+15125550118", "+15125550119", "+15125550120",
  "+15125550121", "+15125550122", "+15125550123", "+15125550124", "+15125550125",
];

const SERVICE_TYPES = ["interior", "exterior", "both", "other"];
const TIMELINES = ["asap", "within_2_weeks", "within_month", "flexible"];
const STATUSES = ["new", "new", "contacted", "contacted", "quoted", "quoted", "scheduled", "won", "won", "lost"];
const DESCRIPTIONS = [
  "3 bedrooms and a hallway, walls only. Currently dark gray, want to go white.",
  "Living room and dining room combo, walls + ceilings. Good condition overall.",
  "Full exterior repaint, 2-story house. Peeling paint on the south side.",
  "Kitchen cabinets, 40 doors and drawers. Want to go from oak to white.",
  "Master bedroom + en-suite bathroom. Accent wall in bold color.",
  "2-car garage interior, walls and ceiling. Currently bare drywall.",
  "Deck staining, about 400 sqft. Old stain is faded.",
  "Entire house interior, 4 bed / 3 bath. Moving in, want fresh paint throughout.",
  "Front door and shutters only. Want to go dark navy.",
  "Basement finishing, 1200 sqft, new drywall — first coat needed.",
  null, null, null, // some without descriptions
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.ownerEmail, COMPANY_EMAIL));

  if (!company) {
    console.error(`No company found with owner email ${COMPANY_EMAIL}`);
    process.exit(1);
  }

  console.log(`Seeding leads for: ${company.businessName} (${company.id})`);

  // Spread leads over the last 90 days
  const seedData = NAMES.map((name, i) => {
    const status = randomFrom(STATUSES);
    const daysBack = Math.floor(Math.random() * 90);
    const createdAt = daysAgo(daysBack);
    const hasEstimate = Math.random() > 0.3;
    const hasDescription = Math.random() > 0.2;

    const estimateLow = hasEstimate ? Math.floor(Math.random() * 3000) + 500 : null;
    const estimateHigh = hasEstimate && estimateLow ? estimateLow + Math.floor(Math.random() * 800) + 200 : null;

    const quotedAmount =
      status === "won" || status === "quoted"
        ? Math.floor(Math.random() * 3500) + 600
        : null;

    return {
      companyId: company.id,
      homeownerName: name,
      homeownerEmail: `${name.toLowerCase().replace(" ", ".")}@example.com`,
      homeownerPhone: PHONES[i],
      address: `${1000 + i * 17} Oak ${["St", "Ave", "Ln", "Blvd"][i % 4]}, Austin TX`,
      serviceType: randomFrom(SERVICE_TYPES),
      description: hasDescription ? randomFrom(DESCRIPTIONS.filter(Boolean) as string[]) : null,
      preferredTimeline: randomFrom(TIMELINES),
      status,
      source: randomFrom(["direct_link", "direct_link", "manual", "qr"]) as "direct_link" | "manual" | "qr" | "widget",
      aiEstimateLow: estimateLow,
      aiEstimateHigh: estimateHigh,
      aiConfidence: hasEstimate ? randomFrom(["low", "medium", "high"]) : null,
      quotedAmount: quotedAmount,
      createdAt,
      updatedAt: createdAt,
    };
  });

  await db.insert(leads).values(seedData);
  console.log(`✓ Inserted ${seedData.length} leads`);

  const wonLeads = seedData.filter((l) => l.status === "won");
  const revenue = wonLeads.reduce((sum, l) => sum + (l.quotedAmount ?? 0), 0);
  console.log(`  Won: ${wonLeads.length}, Revenue: $${revenue.toLocaleString()}`);
  console.log(`  Statuses: ${[...new Set(seedData.map((l) => l.status))].join(", ")}`);

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
