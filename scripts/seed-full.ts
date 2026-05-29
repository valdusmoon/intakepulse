/**
 * Full seed — leads + quotes + contracts + photos + scheduled jobs
 * Run with: npx dotenv-cli -e .env.local -- npx tsx scripts/seed-full.ts
 */
import { db } from "../src/lib/db/index";
import { leads } from "../src/lib/db/schema/leads";
import { quotes } from "../src/lib/db/schema/quotes";
import { contracts } from "../src/lib/db/schema/contracts";
import { leadPhotos } from "../src/lib/db/schema/lead-photos";
import { companies } from "../src/lib/db/schema/companies";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const COMPANY_EMAIL = "moonvaldus@gmail.com";

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number, hour = 8): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, 0, 0, 0);
  return d;
}

function token() {
  return randomUUID().replace(/-/g, "").slice(0, 24);
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function main() {
  const [company] = await db.select().from(companies).where(eq(companies.ownerEmail, COMPANY_EMAIL));
  if (!company) { console.error("Company not found"); process.exit(1); }
  console.log(`Seeding for: ${company.businessName}`);

  // ── LEADS ──────────────────────────────────────────────────────────────────

  const leadData = [
    {
      homeownerName: "Sarah Mitchell",
      homeownerPhone: "+15125550301",
      homeownerEmail: "sarah.mitchell@example.com",
      address: "142 Oak St", city: "Austin", state: "TX", zip: "78701",
      serviceType: "interior", status: "scheduled",
      description: "3 bedrooms + hallway, walls only. Going from dark gray to white.",
      preferredTimeline: "asap",
      aiEstimateLow: 1800, aiEstimateHigh: 2550, aiConfidence: "high",
      quotedAmount: 2200,
      scheduledAt: daysFromNow(0, 8), scheduledEndAt: daysFromNow(0, 14),
      notes: "Has a dog, needs booties. Prefers morning start.",
      createdAt: daysAgo(10), updatedAt: daysAgo(2),
    },
    {
      homeownerName: "James Rodriguez",
      homeownerPhone: "+15125550302",
      homeownerEmail: "james.r@example.com",
      address: "88 Maple Ave", city: "Austin", state: "TX", zip: "78702",
      serviceType: "exterior", status: "won",
      description: "Full exterior repaint, 2-story. Peeling on south side.",
      preferredTimeline: "within_2_weeks",
      aiEstimateLow: 4200, aiEstimateHigh: 6100, aiConfidence: "medium",
      quotedAmount: 5400,
      scheduledAt: daysFromNow(3, 8), scheduledEndAt: daysFromNow(4, 17),
      createdAt: daysAgo(20), updatedAt: daysAgo(5),
    },
    {
      homeownerName: "Linda Kim",
      homeownerPhone: "+15125550303",
      homeownerEmail: "linda.kim@example.com",
      address: "9 River Rd", city: "Round Rock", state: "TX", zip: "78664",
      serviceType: "both", status: "won",
      description: "Full interior + exterior. Moving in next month.",
      preferredTimeline: "within_month",
      aiEstimateLow: 6500, aiEstimateHigh: 9200, aiConfidence: "medium",
      quotedAmount: 7800,
      scheduledAt: daysFromNow(7, 8), scheduledEndAt: daysFromNow(10, 17),
      createdAt: daysAgo(30), updatedAt: daysAgo(7),
    },
    {
      homeownerName: "Marcus Davis",
      homeownerPhone: "+15125550304",
      homeownerEmail: "marcus.d@example.com",
      address: "310 Cedar Ln", city: "Pflugerville", state: "TX", zip: "78660",
      serviceType: "exterior", status: "quoted",
      description: "Single story exterior, good condition.",
      preferredTimeline: "flexible",
      aiEstimateLow: 3100, aiEstimateHigh: 4400, aiConfidence: "high",
      quotedAmount: 3800,
      createdAt: daysAgo(8), updatedAt: daysAgo(3),
    },
    {
      homeownerName: "Patricia Wong",
      homeownerPhone: "+15125550305",
      homeownerEmail: "patricia.wong@example.com",
      address: "55 Sunset Blvd", city: "Austin", state: "TX", zip: "78703",
      serviceType: "interior", status: "contacted",
      description: "Living room + dining, walls + ceilings.",
      preferredTimeline: "within_2_weeks",
      aiEstimateLow: 1400, aiEstimateHigh: 2000, aiConfidence: "high",
      createdAt: daysAgo(3), updatedAt: daysAgo(1),
    },
    {
      homeownerName: "Tom Brewer",
      homeownerPhone: "+15125550306",
      homeownerEmail: "tom.brewer@example.com",
      address: "201 Elm St", city: "Georgetown", state: "TX", zip: "78626",
      serviceType: "exterior", status: "new",
      description: "Two-story colonial, needs full exterior including trim.",
      preferredTimeline: "flexible",
      aiEstimateLow: 5800, aiEstimateHigh: 8200, aiConfidence: "low",
      createdAt: daysAgo(1), updatedAt: daysAgo(1),
    },
    {
      homeownerName: "Angela Torres",
      homeownerPhone: "+15125550307",
      homeownerEmail: "angela.t@example.com",
      address: "420 Willow Way", city: "Austin", state: "TX", zip: "78704",
      serviceType: "interior", status: "lost",
      description: "Whole house repaint, went with another contractor.",
      preferredTimeline: "asap",
      aiEstimateLow: 4100, aiEstimateHigh: 5900, aiConfidence: "medium",
      createdAt: daysAgo(45), updatedAt: daysAgo(30),
    },
  ];

  const insertedLeads = await db.insert(leads).values(
    leadData.map((l) => ({ companyId: company.id, source: "direct_link" as const, ...l }))
  ).returning();

  console.log(`✓ ${insertedLeads.length} leads`);

  // ── PHOTOS ─────────────────────────────────────────────────────────────────

  const photoLeads = insertedLeads.filter((l) =>
    ["scheduled", "won", "quoted"].includes(l.status)
  );

  const photoRows = photoLeads.flatMap((l) => [
    { leadId: l.id, photoUrl: `https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800`, photoType: "room" as const },
    { leadId: l.id, photoUrl: `https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800`, photoType: "room" as const },
  ]);

  await db.insert(leadPhotos).values(photoRows);
  console.log(`✓ ${photoRows.length} photos`);

  // ── QUOTES ─────────────────────────────────────────────────────────────────

  const quotedLeads = insertedLeads.filter((l) =>
    ["quoted", "scheduled", "won"].includes(l.status)
  );

  const quoteRows = quotedLeads.map((l, i) => {
    const total = (l.quotedAmount ?? 3000) * 100; // convert to cents for storage... wait, quotedAmount is already in dollars in seed
    // quotedAmount in DB is actually stored as dollars not cents based on schema comments
    const totalCents = (l.quotedAmount ?? 3000);
    const isAccepted = ["scheduled", "won"].includes(l.status);
    const sentAt = daysAgo(15 - i * 3);
    return {
      companyId: company.id,
      leadId: l.id,
      quoteNumber: `CC-${String(i + 1).padStart(4, "0")}`,
      quoteType: l.serviceType ?? "interior",
      status: isAccepted ? "accepted" : "sent",
      issueDate: isoDate(sentAt),
      validUntil: isoDate(new Date(sentAt.getTime() + 30 * 24 * 60 * 60 * 1000)),
      lineItems: [
        {
          id: randomUUID(),
          sortOrder: 0,
          name: "Labor",
          description: "Surface prep, prime, 2-coat finish",
          quantity: "1",
          unit: "flat",
          unitPrice: String(Math.round(totalCents * 0.7)),
          totalCents: Math.round(totalCents * 0.7),
        },
        {
          id: randomUUID(),
          sortOrder: 1,
          name: "Materials",
          description: "Paint, primer, sundries",
          quantity: "1",
          unit: "flat",
          unitPrice: String(Math.round(totalCents * 0.3)),
          totalCents: Math.round(totalCents * 0.3),
        },
      ],
      subtotalCents: totalCents,
      discountCents: 0,
      taxRateBps: 0,
      taxCents: 0,
      totalCents,
      publicToken: token(),
      sentAt,
      acceptedAt: isAccepted ? daysAgo(10 - i * 2) : null,
      createdAt: sentAt,
      updatedAt: new Date(),
    };
  });

  const insertedQuotes = await db.insert(quotes).values(quoteRows).returning();
  console.log(`✓ ${insertedQuotes.length} quotes`);

  // ── CONTRACTS ──────────────────────────────────────────────────────────────

  const wonLeads = insertedLeads.filter((l) => ["scheduled", "won"].includes(l.status));
  const quoteMap = new Map(insertedQuotes.map((q) => [q.leadId, q]));

  const contractRows = wonLeads.map((l, i) => {
    const isSigned = l.status === "won" || i === 0;
    const signedAt = isSigned ? daysAgo(8 - i) : null;
    return {
      companyId: company.id,
      leadId: l.id,
      quoteId: quoteMap.get(l.id)?.id ?? null,
      status: isSigned ? "signed" : "sent",
      contractBody: `This agreement is between Dallas Painters and ${l.homeownerName} for painting services at ${l.address ?? "the project address"}.\n\nScope: ${l.serviceType} painting as quoted.\nTotal: $${l.quotedAmount?.toLocaleString()}\n\nPayment due upon completion.`,
      signerName: isSigned ? l.homeownerName : null,
      signerEmail: isSigned ? l.homeownerEmail : null,
      signerIp: isSigned ? "72.14.100.42" : null,
      publicToken: token(),
      sentAt: daysAgo(12 - i),
      signedAt,
      createdAt: daysAgo(13 - i),
      updatedAt: new Date(),
    };
  });

  await db.insert(contracts).values(contractRows);
  console.log(`✓ ${contractRows.length} contracts`);

  console.log("\nDone. Test export at: /api/leads/export and /api/schedule/export");
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
