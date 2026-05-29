/**
 * Demo seed — realistic painter pipeline for live demos
 * Clears leads, quotes, contracts, lead_photos for the company then reseeds.
 * Run with: npx dotenv-cli -e .env.local -- npx tsx scripts/seed-demo.ts
 */
import { db } from "../src/lib/db/index";
import { leads } from "../src/lib/db/schema/leads";
import { quotes } from "../src/lib/db/schema/quotes";
import { contracts } from "../src/lib/db/schema/contracts";
import { leadPhotos } from "../src/lib/db/schema/lead-photos";
import { companies } from "../src/lib/db/schema/companies";
import { eq, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";

const COMPANY_EMAIL = "nile@evolvereview.com";

const DEMO_PHOTO = "https://vyxcmjkeqtwrkukhebcy.supabase.co/storage/v1/object/public/lead-photos/leads/972805c2-8755-4bbd-ac98-040a5db223b4/68e66487-ec00-4814-881e-0dc5f58c71a7.jpg";

function daysAgo(n: number, hour = 10): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d;
}

function daysFromNow(n: number, hour = 8): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, 0, 0, 0);
  return d;
}

function hoursAgo(h: number): Date {
  return new Date(Date.now() - h * 60 * 60 * 1000);
}

function token() {
  return randomUUID().replace(/-/g, "").slice(0, 24);
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Amounts in cents for quotes/contracts/quotedAmount
function dollars(n: number) { return n * 100; }

async function main() {
  const [company] = await db.select().from(companies).where(eq(companies.ownerEmail, COMPANY_EMAIL));
  if (!company) { console.error("Company not found for:", COMPANY_EMAIL); process.exit(1); }
  console.log(`Seeding demo for: ${company.businessName}`);

  // ── CLEAR ───────────────────────────────────────────────────────────────────
  const existingLeads = await db.select({ id: leads.id }).from(leads).where(eq(leads.companyId, company.id));
  const leadIds = existingLeads.map((l) => l.id);

  if (leadIds.length > 0) {
    await db.delete(leadPhotos).where(inArray(leadPhotos.leadId, leadIds));
    await db.delete(contracts).where(inArray(contracts.leadId, leadIds));
    await db.delete(quotes).where(inArray(quotes.leadId, leadIds));
    await db.delete(leads).where(eq(leads.companyId, company.id));
    console.log(`✓ Cleared ${leadIds.length} existing leads + related records`);
  }

  // ── LEADS ───────────────────────────────────────────────────────────────────

  const [
    sarah, james, linda,       // won / scheduled → have quotes + contracts
    marcus, kevin,             // quoted → quotes sent, awaiting response
    patricia,                  // contacted
    rachel, tom,               // new (fresh leads with estimates)
    david,                     // completed
    angela,                    // lost
  ] = await db.insert(leads).values([

    // ── SCHEDULED — job tomorrow ─────────────────────────────────────────────
    {
      companyId: company.id,
      homeownerName: "Sarah Mitchell",
      homeownerPhone: "+15125550301",
      homeownerEmail: "sarah.mitchell@example.com",
      address: "142 Oak St", city: "Austin", state: "TX", zip: "78701",
      serviceType: "interior",
      description: "3 bedrooms + hallway, walls only. Going from dark gray to SW Accessible Beige.",
      preferredTimeline: "asap",
      aiEstimateLow: 1800, aiEstimateHigh: 2550, aiConfidence: "high",
      aiPhotoSummary: "Living space shows dark charcoal walls in good condition. No major surface damage. Minor scuff marks near door frames. Standard prep work expected.",
      quotedAmount: dollars(2200),
      scheduledAt: daysFromNow(1, 8),
      scheduledEndAt: daysFromNow(1, 17),
      scheduledType: "job",
      notes: "Has a dog — needs booties on. Morning start preferred. Key under mat.",
      status: "scheduled",
      createdAt: daysAgo(12), updatedAt: daysAgo(1),
    },

    // ── SCHEDULED — multi-day exterior next week ──────────────────────────────
    {
      companyId: company.id,
      homeownerName: "James Rodriguez",
      homeownerPhone: "+15125550302",
      homeownerEmail: "james.r@example.com",
      address: "88 Maple Ave", city: "Austin", state: "TX", zip: "78702",
      serviceType: "exterior",
      description: "Full exterior repaint, 2-story colonial. Peeling on south side needs scraping. Trim included.",
      preferredTimeline: "within_2_weeks",
      aiEstimateLow: 4200, aiEstimateHigh: 6100, aiConfidence: "medium",
      aiPhotoSummary: "South-facing exterior shows significant paint peeling and chalking. Fascia boards in good shape. Trim paint worn but intact. Recommend power wash + spot prime before painting.",
      quotedAmount: dollars(5400),
      scheduledAt: daysFromNow(6, 8),
      scheduledEndAt: daysFromNow(8, 17),
      scheduledType: "job",
      notes: "3 crew. Park in driveway. HOA requires neutral tones — Benjamin Moore Revere Pewter approved.",
      status: "scheduled",
      createdAt: daysAgo(18), updatedAt: daysAgo(2),
    },

    // ── WON — large job scheduled 2 weeks out ────────────────────────────────
    {
      companyId: company.id,
      homeownerName: "Linda Kim",
      homeownerPhone: "+15125550303",
      homeownerEmail: "linda.kim@example.com",
      address: "9 River Rd", city: "Round Rock", state: "TX", zip: "78664",
      serviceType: "both",
      description: "Full interior + exterior. Moving in next month, wants everything done before furniture arrives. 2,400 sqft home.",
      preferredTimeline: "within_month",
      aiEstimateLow: 6500, aiEstimateHigh: 9200, aiConfidence: "medium",
      quotedAmount: dollars(7800),
      scheduledAt: daysFromNow(13, 8),
      scheduledEndAt: daysFromNow(17, 17),
      scheduledType: "job",
      notes: "Biggest job this quarter. Pre-move-in — no furniture to work around. Access code: 4821.",
      status: "won",
      createdAt: daysAgo(25), updatedAt: daysAgo(1),
    },

    // ── QUOTED — viewed, awaiting response ───────────────────────────────────
    {
      companyId: company.id,
      homeownerName: "Marcus Davis",
      homeownerPhone: "+15125550304",
      homeownerEmail: "marcus.d@example.com",
      address: "310 Cedar Ln", city: "Pflugerville", state: "TX", zip: "78660",
      serviceType: "exterior",
      description: "Single story exterior, good overall condition. Wants a darker color — currently light beige.",
      preferredTimeline: "flexible",
      aiEstimateLow: 3100, aiEstimateHigh: 4400, aiConfidence: "high",
      quotedAmount: dollars(3800),
      notes: "Viewed the quote 2 days ago — no response yet. Follow up.",
      status: "quoted",
      createdAt: daysAgo(10), updatedAt: daysAgo(2),
    },

    // ── QUOTED — sent but not yet opened ─────────────────────────────────────
    {
      companyId: company.id,
      homeownerName: "Kevin Park",
      homeownerPhone: "+15125550305",
      homeownerEmail: "kevin.park@example.com",
      address: "77 Birchwood Dr", city: "Austin", state: "TX", zip: "78745",
      serviceType: "interior",
      description: "Living room, kitchen, and 2 bedrooms. Currently builder-grade white, wants warm greige throughout.",
      preferredTimeline: "within_2_weeks",
      aiEstimateLow: 2400, aiEstimateHigh: 3300, aiConfidence: "high",
      quotedAmount: dollars(2900),
      notes: "Quote sent 8 days ago — not opened. May need a nudge.",
      status: "quoted",
      createdAt: daysAgo(14), updatedAt: daysAgo(8),
    },

    // ── CONTACTED ────────────────────────────────────────────────────────────
    {
      companyId: company.id,
      homeownerName: "Patricia Wong",
      homeownerPhone: "+15125550306",
      homeownerEmail: "patricia.wong@example.com",
      address: "55 Sunset Blvd", city: "Austin", state: "TX", zip: "78703",
      serviceType: "interior",
      description: "Living room + dining room, walls and ceiling. High ceilings — ~12ft. Accent wall requested.",
      preferredTimeline: "within_2_weeks",
      aiEstimateLow: 1400, aiEstimateHigh: 2000, aiConfidence: "high",
      notes: "Called her yesterday. She's getting one more quote before deciding.",
      status: "contacted",
      createdAt: daysAgo(4), updatedAt: daysAgo(1),
    },

    // ── NEW — submitted yesterday with photos ────────────────────────────────
    {
      companyId: company.id,
      homeownerName: "Rachel Greene",
      homeownerPhone: "+15125550307",
      homeownerEmail: "rachel.g@example.com",
      address: "204 Lakeview Dr", city: "Austin", state: "TX", zip: "78731",
      serviceType: "exterior",
      description: "Single story, stucco exterior. Wants bright white — currently a dingy cream. Some hairline cracks near windows.",
      preferredTimeline: "within_month",
      aiEstimateLow: 3400, aiEstimateHigh: 4800, aiConfidence: "medium",
      aiPhotoSummary: "Stucco exterior in fair condition. Hairline cracks visible near 2 window frames — will need patching before paint. Fascia and trim paint faded. South wall shows minor efflorescence.",
      status: "new",
      confirmationSentAt: daysAgo(1, 14),
      createdAt: daysAgo(1, 14), updatedAt: daysAgo(1, 14),
    },

    // ── NEW — submitted 2 hours ago ──────────────────────────────────────────
    {
      companyId: company.id,
      homeownerName: "Tom Bradley",
      homeownerPhone: "+15125550308",
      homeownerEmail: "tom.bradley@example.com",
      address: "501 Ridgewood Ct", city: "Cedar Park", state: "TX", zip: "78613",
      serviceType: "interior",
      description: "Whole house interior — 4 bed, 2.5 bath, open plan. Builder grade white everything. Wants warm neutrals.",
      preferredTimeline: "asap",
      aiEstimateLow: 3200, aiEstimateHigh: 4600, aiConfidence: "medium",
      status: "new",
      confirmationSentAt: hoursAgo(2),
      createdAt: hoursAgo(2), updatedAt: hoursAgo(2),
    },

    // ── COMPLETED ────────────────────────────────────────────────────────────
    {
      companyId: company.id,
      homeownerName: "David Chen",
      homeownerPhone: "+15125550309",
      homeownerEmail: "david.chen@example.com",
      address: "18 Pinecrest Ave", city: "Austin", state: "TX", zip: "78757",
      serviceType: "interior",
      description: "Master bedroom + en-suite + walk-in closet. Feature wall in master.",
      preferredTimeline: "flexible",
      aiEstimateLow: 900, aiEstimateHigh: 1400, aiConfidence: "high",
      quotedAmount: dollars(1250),
      notes: "Great client — left a 5-star review same day we asked.",
      reviewRequestSentAt: daysAgo(8),
      reviewRequestClickedAt: daysAgo(7),
      status: "completed",
      createdAt: daysAgo(30), updatedAt: daysAgo(8),
    },

    // ── LOST ─────────────────────────────────────────────────────────────────
    {
      companyId: company.id,
      homeownerName: "Angela Torres",
      homeownerPhone: "+15125550310",
      homeownerEmail: "angela.t@example.com",
      address: "420 Willow Way", city: "Austin", state: "TX", zip: "78704",
      serviceType: "interior",
      description: "Whole house repaint. Went with a cheaper quote.",
      preferredTimeline: "asap",
      aiEstimateLow: 4100, aiEstimateHigh: 5900, aiConfidence: "medium",
      notes: "Lost to cheaper bid. She mentioned $3,200 — we were at $5,100.",
      status: "lost",
      createdAt: daysAgo(45), updatedAt: daysAgo(30),
    },

  ]).returning();

  console.log(`✓ 10 leads`);

  // ── PHOTOS ──────────────────────────────────────────────────────────────────

  await db.insert(leadPhotos).values([
    // Sarah — interior job photos
    { leadId: sarah.id, photoUrl: DEMO_PHOTO, photoType: "room" },
    { leadId: sarah.id, photoUrl: DEMO_PHOTO, photoType: "room" },
    // James — exterior photos
    { leadId: james.id, photoUrl: DEMO_PHOTO, photoType: "exterior" },
    { leadId: james.id, photoUrl: DEMO_PHOTO, photoType: "damage" },
    // Rachel — new lead with photos
    { leadId: rachel.id, photoUrl: DEMO_PHOTO, photoType: "exterior" },
    { leadId: rachel.id, photoUrl: DEMO_PHOTO, photoType: "damage" },
    // David — completed job after photos
    { leadId: david.id, photoUrl: DEMO_PHOTO, photoType: "room" },
  ]);
  console.log(`✓ 7 photos`);

  // ── QUOTES ───────────────────────────────────────────────────────────────────

  function makeLineItems(totalCents: number, type: string) {
    const laborCents = Math.round(totalCents * 0.72);
    const materialCents = totalCents - laborCents;
    return [
      {
        id: randomUUID(), sortOrder: 0,
        name: type === "exterior" ? "Exterior Labor" : "Interior Labor",
        description: "Surface prep, prime coat, 2-coat finish",
        quantity: "1", unit: "flat",
        unitPrice: String((laborCents / 100).toFixed(2)),
        totalCents: laborCents,
      },
      {
        id: randomUUID(), sortOrder: 1,
        name: "Paint & Materials",
        description: "Sherwin-Williams SuperPaint, primer, sundries",
        quantity: "1", unit: "flat",
        unitPrice: String((materialCents / 100).toFixed(2)),
        totalCents: materialCents,
      },
    ];
  }

  const sarahTotal = dollars(2200);
  const jamesTotal = dollars(5400);
  const lindaTotal = dollars(7800);
  const marcusTotal = dollars(3800);
  const kevinTotal = dollars(2900);
  const davidTotal = dollars(1250);

  const insertedQuotes = await db.insert(quotes).values([

    // Sarah — accepted
    {
      companyId: company.id, leadId: sarah.id,
      quoteNumber: "CC-0001", quoteType: "interior", status: "accepted",
      issueDate: isoDate(daysAgo(10)), validUntil: isoDate(daysFromNow(20)),
      lineItems: makeLineItems(sarahTotal, "interior"),
      subtotalCents: sarahTotal, discountCents: 0, taxRateBps: 0, taxCents: 0, totalCents: sarahTotal,
      homeownerMessage: "Hi Sarah, thanks for submitting — here's the quote for your interior project. Let me know if you have any questions!",
      depositNote: "50% deposit requested before work begins.",
      publicToken: token(),
      sentAt: daysAgo(10), viewedAt: daysAgo(9), acceptedAt: daysAgo(8),
      createdAt: daysAgo(10), updatedAt: daysAgo(8),
    },

    // James — accepted
    {
      companyId: company.id, leadId: james.id,
      quoteNumber: "CC-0002", quoteType: "exterior", status: "accepted",
      issueDate: isoDate(daysAgo(7)), validUntil: isoDate(daysFromNow(23)),
      lineItems: [
        { id: randomUUID(), sortOrder: 0, name: "Exterior Labor", description: "Power wash, scrape, prime, 2-coat finish", quantity: "1", unit: "flat", unitPrice: "3888.00", totalCents: dollars(3888) },
        { id: randomUUID(), sortOrder: 1, name: "Materials", description: "SW Duration Exterior, primer, caulk, sundries", quantity: "1", unit: "flat", unitPrice: "1296.00", totalCents: dollars(1296) },
        { id: randomUUID(), sortOrder: 2, name: "Trim & Fascia", description: "All trim boards and fascia — 2 coats", quantity: "1", unit: "flat", unitPrice: "216.00", totalCents: dollars(216) },
      ],
      subtotalCents: jamesTotal, discountCents: 0, taxRateBps: 0, taxCents: 0, totalCents: jamesTotal,
      homeownerMessage: "Hi James — quote attached for the full exterior. Includes power wash, scraping, prime, and 2 coats throughout.",
      depositNote: "50% deposit to hold the date.",
      publicToken: token(),
      sentAt: daysAgo(7), viewedAt: daysAgo(6), acceptedAt: daysAgo(5),
      createdAt: daysAgo(7), updatedAt: daysAgo(5),
    },

    // Linda — accepted
    {
      companyId: company.id, leadId: linda.id,
      quoteNumber: "CC-0003", quoteType: "both", status: "accepted",
      issueDate: isoDate(daysAgo(4)), validUntil: isoDate(daysFromNow(26)),
      lineItems: [
        { id: randomUUID(), sortOrder: 0, name: "Interior — All Rooms", description: "Full interior, all walls + ceilings", quantity: "1", unit: "flat", unitPrice: "4200.00", totalCents: dollars(4200) },
        { id: randomUUID(), sortOrder: 1, name: "Exterior", description: "Full exterior repaint", quantity: "1", unit: "flat", unitPrice: "2800.00", totalCents: dollars(2800) },
        { id: randomUUID(), sortOrder: 2, name: "Materials", description: "Premium paint, primer, sundries", quantity: "1", unit: "flat", unitPrice: "800.00", totalCents: dollars(800) },
      ],
      subtotalCents: lindaTotal, discountCents: 0, taxRateBps: 0, taxCents: 0, totalCents: lindaTotal,
      homeownerMessage: "Linda, here's the full quote for the interior + exterior. Given the timeline before your move-in, we'll have everything done with time to spare.",
      publicToken: token(),
      sentAt: daysAgo(4), viewedAt: daysAgo(3), acceptedAt: daysAgo(2),
      createdAt: daysAgo(4), updatedAt: daysAgo(2),
    },

    // Marcus — sent + viewed, awaiting response
    {
      companyId: company.id, leadId: marcus.id,
      quoteNumber: "CC-0004", quoteType: "exterior", status: "sent",
      issueDate: isoDate(daysAgo(5)), validUntil: isoDate(daysFromNow(25)),
      lineItems: makeLineItems(marcusTotal, "exterior"),
      subtotalCents: marcusTotal, discountCents: 0, taxRateBps: 0, taxCents: 0, totalCents: marcusTotal,
      homeownerMessage: "Hi Marcus — here's your quote for the exterior repaint. Happy to answer any questions before you decide.",
      publicToken: token(),
      sentAt: daysAgo(5), viewedAt: daysAgo(2), acceptedAt: null,
      createdAt: daysAgo(5), updatedAt: daysAgo(2),
    },

    // Kevin — sent but NOT viewed
    {
      companyId: company.id, leadId: kevin.id,
      quoteNumber: "CC-0005", quoteType: "interior", status: "sent",
      issueDate: isoDate(daysAgo(8)), validUntil: isoDate(daysFromNow(22)),
      lineItems: makeLineItems(kevinTotal, "interior"),
      subtotalCents: kevinTotal, discountCents: 0, taxRateBps: 0, taxCents: 0, totalCents: kevinTotal,
      homeownerMessage: "Hi Kevin — quote attached for the interior. Let me know if you'd like to adjust any rooms or discuss the color selection.",
      publicToken: token(),
      sentAt: daysAgo(8), viewedAt: null, acceptedAt: null,
      createdAt: daysAgo(8), updatedAt: daysAgo(8),
    },

    // David — accepted (completed job)
    {
      companyId: company.id, leadId: david.id,
      quoteNumber: "CC-0006", quoteType: "interior", status: "accepted",
      issueDate: isoDate(daysAgo(25)), validUntil: isoDate(daysAgo(5)),
      lineItems: makeLineItems(davidTotal, "interior"),
      subtotalCents: davidTotal, discountCents: 0, taxRateBps: 0, taxCents: 0, totalCents: davidTotal,
      homeownerMessage: "David — quote for the master suite and walk-in. Clean and simple job.",
      publicToken: token(),
      sentAt: daysAgo(25), viewedAt: daysAgo(24), acceptedAt: daysAgo(23),
      createdAt: daysAgo(25), updatedAt: daysAgo(23),
    },

  ]).returning();

  console.log(`✓ ${insertedQuotes.length} quotes`);

  // ── CONTRACTS ────────────────────────────────────────────────────────────────

  const quoteByLead = new Map(insertedQuotes.map((q) => [q.leadId, q]));

  function contractBody(name: string, address: string, service: string, amount: number) {
    return `PAINTING SERVICES AGREEMENT

This agreement is entered into between Austin Pro Painting ("Contractor") and ${name} ("Client").

Project Address: ${address}
Scope of Work: ${service}
Total Contract Amount: $${(amount / 100).toLocaleString()}

SCOPE
Contractor agrees to perform all painting services as described in the approved quote, including surface preparation, priming where required, and finish coats using Sherwin-Williams SuperPaint or equivalent.

PAYMENT TERMS
50% deposit due before work begins. Remaining balance due upon completion.

TIMELINE
Work will begin on the scheduled date and be completed within the agreed timeframe, weather permitting.

WARRANTY
Contractor warrants workmanship for 2 years from completion date. Paint manufacturer warranty applies separately.

By signing below, Client acknowledges they have read and agree to the terms of this agreement.`;
  }

  await db.insert(contracts).values([

    // Sarah — signed
    {
      companyId: company.id,
      leadId: sarah.id,
      quoteId: quoteByLead.get(sarah.id)?.id ?? null,
      status: "signed",
      contractBody: contractBody("Sarah Mitchell", "142 Oak St, Austin TX", "Interior painting — 3 bedrooms + hallway", sarahTotal),
      signerName: "Sarah Mitchell",
      signerEmail: "sarah.mitchell@example.com",
      signerIp: "98.114.200.12",
      publicToken: token(),
      sentAt: daysAgo(8), viewedAt: daysAgo(7), signedAt: daysAgo(7),
      createdAt: daysAgo(8), updatedAt: daysAgo(7),
    },

    // James — signed
    {
      companyId: company.id,
      leadId: james.id,
      quoteId: quoteByLead.get(james.id)?.id ?? null,
      status: "signed",
      contractBody: contractBody("James Rodriguez", "88 Maple Ave, Austin TX", "Full exterior repaint including trim and fascia", jamesTotal),
      signerName: "James Rodriguez",
      signerEmail: "james.r@example.com",
      signerIp: "71.88.155.44",
      publicToken: token(),
      sentAt: daysAgo(5), viewedAt: daysAgo(4), signedAt: daysAgo(4),
      createdAt: daysAgo(5), updatedAt: daysAgo(4),
    },

    // Linda — signed yesterday
    {
      companyId: company.id,
      leadId: linda.id,
      quoteId: quoteByLead.get(linda.id)?.id ?? null,
      status: "signed",
      contractBody: contractBody("Linda Kim", "9 River Rd, Round Rock TX", "Full interior + exterior repaint, 2,400 sqft", lindaTotal),
      signerName: "Linda Kim",
      signerEmail: "linda.kim@example.com",
      signerIp: "24.196.88.31",
      publicToken: token(),
      sentAt: daysAgo(2), viewedAt: daysAgo(1), signedAt: daysAgo(1),
      createdAt: daysAgo(2), updatedAt: daysAgo(1),
    },

    // David — signed (completed job)
    {
      companyId: company.id,
      leadId: david.id,
      quoteId: quoteByLead.get(david.id)?.id ?? null,
      status: "signed",
      contractBody: contractBody("David Chen", "18 Pinecrest Ave, Austin TX", "Interior painting — master bedroom, en-suite, walk-in closet", davidTotal),
      signerName: "David Chen",
      signerEmail: "david.chen@example.com",
      signerIp: "66.102.14.55",
      publicToken: token(),
      sentAt: daysAgo(23), viewedAt: daysAgo(22), signedAt: daysAgo(22),
      createdAt: daysAgo(23), updatedAt: daysAgo(22),
    },

  ]);

  console.log(`✓ 4 contracts (all signed)`);
  console.log(`\n✅ Demo seed complete for ${company.businessName}`);
  console.log(`\nPipeline summary:`);
  console.log(`  New:       2 (Rachel Greene, Tom Bradley)`);
  console.log(`  Contacted: 1 (Patricia Wong)`);
  console.log(`  Quoted:    2 (Marcus Davis — viewed, Kevin Park — not opened)`);
  console.log(`  Scheduled: 2 (Sarah Mitchell — tomorrow, James Rodriguez — ${isoDate(daysFromNow(6))} multiday)`);
  console.log(`  Won:       1 (Linda Kim — $7,800, starts ${isoDate(daysFromNow(13))})`);
  console.log(`  Completed: 1 (David Chen — review sent + clicked)`);
  console.log(`  Lost:      1 (Angela Torres)`);

  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
