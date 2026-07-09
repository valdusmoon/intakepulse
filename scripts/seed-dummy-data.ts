/**
 * Seeds a comprehensive, realistic dataset for exercising the dashboard
 * (Leads, Calls, Reports) against real data — funnel stages, sources, dates,
 * and call outcomes all vary so every chart/column has something to show.
 *
 * Targets a business by clerkUserId — defaults to a dedicated "dev_seed_business"
 * placeholder (never a real signed-in account) so this is safe to run without
 * touching whatever business is tied to your actual Clerk user (e.g. mid-onboarding
 * testing). Pass a real Clerk user id as the first CLI arg to re-seed that
 * account's business instead: `npx tsx scripts/seed-dummy-data.ts user_xxx`.
 * Re-running wipes and re-seeds only the targeted business.
 *
 * Intake answers use the CURRENT normalized schema (service_type / urgency /
 * time_since_issue / has_coverage) — matching scripts/seed-verticals.ts, not
 * the older per-vertical question set.
 *
 * All phone numbers use the NANP-reserved 555-01XX fictional block.
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { businesses } from "../src/lib/db/schema/businesses";
import { leads, type NewLead } from "../src/lib/db/schema/leads";
import { calls, type NewCall } from "../src/lib/db/schema/calls";
import { aiAssessments } from "../src/lib/db/schema/aiAssessments";
import { followups } from "../src/lib/db/schema/followups";
import { smsEvents } from "../src/lib/db/schema/smsEvents";
import { pricingRules } from "../src/lib/db/schema/pricingRules";

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(sql);

const SEED_CLERK_USER_ID = process.argv[2] ?? "dev_seed_business";
const NOW = Date.now();
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const ago = (ms: number) => new Date(NOW - ms);

async function main() {
  let [business] = await db.select().from(businesses).where(eq(businesses.clerkUserId, SEED_CLERK_USER_ID)).limit(1);

  if (!business) {
    console.log("No dedicated seed business found — creating one...");
    [business] = await db
      .insert(businesses)
      .values({ clerkUserId: SEED_CLERK_USER_ID, businessName: "Blue Star Restoration", ownerName: "Jordan Blake", ownerEmail: "jordan@example.test" })
      .returning();
  }

  console.log(`Cleaning up existing seed data for business ${business.id}...`);
  const existingLeadIds = (await db.select({ id: leads.id }).from(leads).where(eq(leads.businessId, business.id))).map((l) => l.id);
  for (const leadId of existingLeadIds) {
    await db.delete(aiAssessments).where(eq(aiAssessments.leadId, leadId));
    await db.delete(followups).where(eq(followups.leadId, leadId));
    await db.delete(smsEvents).where(eq(smsEvents.leadId, leadId));
  }
  await db.delete(calls).where(eq(calls.businessId, business.id));
  await db.delete(leads).where(eq(leads.businessId, business.id));
  await db.delete(pricingRules).where(eq(pricingRules.businessId, business.id));

  console.log("Updating business to a clean, voice-ready configuration...");
  await db.update(businesses).set({
    businessName: "Blue Star Restoration",
    ownerName: "Jordan Blake",
    ownerEmail: "jordan@example.test",
    serviceArea: "Austin, Round Rock, and surrounding Travis County",
    timezone: "America/Chicago",
    vertical: "restoration",
    twilioPhoneNumber: "+15125550100",
    telnyxPhoneNumber: null,
    forwardingNumber: "+15125550101",
    overflowMode: "ring_then_ai",
    callTimeoutSeconds: 20,
    recordingEnabled: false,
    recordingDisclosure: null,
    urgentTransferNumber: "+15125550102",
    greetingMessage: null,
    aiInstructions: null,
    isPaused: false,
    subscriptionStatus: "trialing",
    trialEndsAt: ago(-14 * DAY),
  }).where(eq(businesses.id, business.id));

  console.log("Seeding pricing rules (water / fire / mold)...");
  await db.insert(pricingRules).values([
    {
      businessId: business.id,
      vertical: "restoration",
      serviceCategory: "water",
      pricingType: "preliminary_range",
      minimumAmount: 140000,
      maximumAmount: 640000,
      approvedCustomerMessage:
        "Water damage restoration typically runs $1,400 to $6,400 depending on the extent of the damage — our team will confirm the exact scope after inspecting.",
      isActive: true,
    },
    {
      businessId: business.id,
      vertical: "restoration",
      serviceCategory: "fire",
      pricingType: "inspection_required",
      approvedCustomerMessage: "Fire and smoke damage varies too much to estimate over the phone — our team will assess the damage in person and provide a detailed quote.",
      isActive: true,
    },
    {
      businessId: business.id,
      vertical: "restoration",
      serviceCategory: "mold",
      pricingType: "preliminary_range",
      minimumAmount: 112500,
      maximumAmount: 375000,
      approvedCustomerMessage:
        "Mold remediation typically runs $1,125 to $3,750 depending on the affected area — our team will confirm the exact scope after inspecting.",
      isActive: true,
    },
  ]);

  console.log("Seeding leads across the full funnel, every source, and a range of dates...");

  type SeedLead = Omit<NewLead, "businessId" | "intakeAnswers"> & {
    intakeAnswers?: Record<string, string>;
    service: "water" | "fire" | "mold";
    urgency: "emergency" | "soon" | "flexible";
    recency: "today" | "this_week" | "longer";
    coverage: "covered" | "out_of_pocket" | "not_sure";
  };

  const seedLeads: SeedLead[] = [
    {
      callerPhone: "+15125550111", callerName: "Marcus Webb", source: "voice_overflow", callStatus: "missed", intakeStatus: "completed",
      leadStatus: "qualified", urgencyScore: 8, qualityScore: 75, estimatedValueLow: 175000, estimatedValueHigh: 425000,
      service: "water", urgency: "emergency", recency: "today", coverage: "covered", smsConsent: false, createdAt: ago(2 * HOUR),
    },
    {
      callerPhone: "+15125550112", callerName: "Priya Nandakumar", callerEmail: "priya.n@example.test", source: "website_widget", intakeStatus: "completed",
      leadStatus: "new", urgencyScore: 4, qualityScore: 55, estimatedValueLow: 112500, estimatedValueHigh: 225000,
      service: "mold", urgency: "soon", recency: "longer", coverage: "out_of_pocket", smsConsent: true, createdAt: ago(26 * HOUR),
    },
    {
      callerPhone: "+15125550113", callerName: null, source: "voice_overflow", callStatus: "missed", intakeStatus: "abandoned",
      leadStatus: "new", service: "fire", urgency: "emergency", recency: "today", coverage: "not_sure", smsConsent: false, createdAt: ago(4 * HOUR),
      intakeAnswers: { service_type: "fire" }, // abandoned mid-intake — only the first answer was ever captured
    },
    {
      callerPhone: "+15125550114", callerName: "Diane Ostrowski", callerEmail: "diane.ostrowski@example.test", source: "direct_intake", intakeStatus: "completed",
      leadStatus: "converted", urgencyScore: 6, qualityScore: 78, estimatedValueLow: 200000, estimatedValueHigh: 400000, confirmedValue: 285000,
      service: "water", urgency: "soon", recency: "this_week", coverage: "out_of_pocket", convertedAt: ago(3 * DAY), smsConsent: true, createdAt: ago(5 * DAY),
    },
    {
      callerPhone: "+15125550115", callerName: "Tom Reyes", source: "manual", intakeStatus: "not_started",
      leadStatus: "lost", notes: "Called back — went with a competitor who could start same day.", createdAt: ago(8 * DAY),
      service: "water", urgency: "soon", recency: "longer", coverage: "not_sure",
      intakeAnswers: undefined,
    },
    {
      callerPhone: "+15125550116", callerName: "Sarah Kim", source: "voice_overflow", callStatus: "missed", intakeStatus: "completed",
      leadStatus: "contacted", urgencyScore: 9, qualityScore: 60, estimatedValueLow: 300000, estimatedValueHigh: 600000, contactedAt: ago(20 * HOUR),
      service: "fire", urgency: "emergency", recency: "today", coverage: "covered", smsConsent: false, createdAt: ago(1 * DAY),
    },
    {
      callerPhone: "+15125550117", callerName: "Robert Chen", source: "website_widget", intakeStatus: "completed",
      leadStatus: "qualified", urgencyScore: 5, qualityScore: 62, estimatedValueLow: 140000, estimatedValueHigh: 280000,
      service: "water", urgency: "soon", recency: "this_week", coverage: "covered", smsConsent: true, createdAt: ago(3 * DAY),
    },
    {
      callerPhone: "+15125550118", callerName: "Lisa Martinez", source: "voice_overflow", callStatus: "missed", intakeStatus: "completed",
      leadStatus: "new", urgencyScore: 2, qualityScore: 30, estimatedValueLow: 112500, estimatedValueHigh: 225000,
      service: "mold", urgency: "flexible", recency: "longer", coverage: "not_sure", smsConsent: false, createdAt: ago(6 * DAY),
    },
    {
      callerPhone: "+15125550119", callerName: "James Wilson", callerEmail: "jwilson@example.test", source: "direct_intake", intakeStatus: "completed",
      leadStatus: "booked", urgencyScore: 7, qualityScore: 80, estimatedValueLow: 220000, estimatedValueHigh: 500000,
      service: "water", urgency: "emergency", recency: "today", coverage: "covered", smsConsent: true, createdAt: ago(10 * DAY),
    },
    {
      callerPhone: "+15125550120", callerName: "Angela Torres", source: "voice_overflow", callStatus: "missed", intakeStatus: "completed",
      leadStatus: "estimate_sent", urgencyScore: 5, qualityScore: 58, estimatedValueLow: 150000, estimatedValueHigh: 320000,
      service: "water", urgency: "soon", recency: "this_week", coverage: "out_of_pocket", smsConsent: false, createdAt: ago(12 * DAY),
    },
    {
      callerPhone: "+15125550121", callerName: "David Park", source: "manual", intakeStatus: "completed",
      leadStatus: "contacted", urgencyScore: 3, qualityScore: 45, estimatedValueLow: 250000, estimatedValueHigh: 500000, contactedAt: ago(14 * DAY),
      service: "fire", urgency: "flexible", recency: "longer", coverage: "covered", smsConsent: false, createdAt: ago(15 * DAY),
    },
    {
      callerPhone: "+15125550122", callerName: "Emily Foster", callerEmail: "emily.foster@example.test", source: "voice_overflow", callStatus: "missed", intakeStatus: "completed",
      leadStatus: "converted", urgencyScore: 8, qualityScore: 82, estimatedValueLow: 180000, estimatedValueHigh: 360000, confirmedValue: 210000,
      service: "water", urgency: "emergency", recency: "today", coverage: "covered", convertedAt: ago(16 * DAY), smsConsent: true, createdAt: ago(18 * DAY),
    },
    {
      callerPhone: "+15125550123", callerName: "Michael Brooks", source: "website_widget", intakeStatus: "completed",
      leadStatus: "lost", notes: "Price shopping — decided to DIY the cleanup.", urgencyScore: 2, qualityScore: 25, estimatedValueLow: 112500, estimatedValueHigh: 225000,
      service: "mold", urgency: "soon", recency: "this_week", coverage: "not_sure", smsConsent: true, createdAt: ago(20 * DAY),
    },
    {
      callerPhone: "+15125550124", callerName: "Nina Patel", source: "voice_overflow", callStatus: "missed", intakeStatus: "completed",
      leadStatus: "qualified", urgencyScore: 7, qualityScore: 68, estimatedValueLow: 175000, estimatedValueHigh: 425000,
      service: "water", urgency: "emergency", recency: "today", coverage: "covered", smsConsent: false, createdAt: ago(22 * DAY),
    },
    {
      callerPhone: "+15125550125", callerName: "Carlos Ruiz", source: "direct_intake", intakeStatus: "completed",
      leadStatus: "new", urgencyScore: 3, qualityScore: 40, estimatedValueLow: 300000, estimatedValueHigh: 600000,
      service: "fire", urgency: "flexible", recency: "longer", coverage: "out_of_pocket", smsConsent: true, createdAt: ago(25 * DAY),
    },
    {
      callerPhone: "+15125550126", callerName: "Olivia Grant", callerEmail: "olivia.grant@example.test", source: "voice_overflow", callStatus: "missed", intakeStatus: "completed",
      leadStatus: "converted", urgencyScore: 6, qualityScore: 70, estimatedValueLow: 150000, estimatedValueHigh: 320000, confirmedValue: 195000,
      service: "water", urgency: "soon", recency: "this_week", coverage: "covered", convertedAt: ago(25 * DAY), smsConsent: false, createdAt: ago(28 * DAY),
    },
  ];

  const insertedLeads: Record<string, string> = {}; // callerPhone -> leadId, for wiring up calls below

  for (const l of seedLeads) {
    const { service, urgency, recency, coverage, intakeAnswers: explicitAnswers, ...rest } = l;
    const intakeAnswers =
      explicitAnswers !== undefined
        ? Object.keys(explicitAnswers).length > 0 ? explicitAnswers : null
        : { service_type: service, urgency, time_since_issue: recency, has_coverage: coverage };

    const [inserted] = await db.insert(leads).values({ ...rest, businessId: business.id, intakeAnswers }).returning();
    insertedLeads[l.callerPhone] = inserted.id;
  }

  console.log(`Seeded ${seedLeads.length} leads.`);

  console.log("Seeding calls — some tied to leads, some not, across every outcome...");

  const seedCalls: Omit<NewCall, "businessId">[] = [
    {
      leadId: insertedLeads["+15125550111"],
      twilioCallSid: "CAseed0001aaaaaaaaaaaaaaaaaaaaaaaa",
      callerPhone: "+15125550111", calledNumber: "+15125550100", status: "answered", outcome: "ai_captured", aiHandled: true,
      overflowStartedAt: ago(2 * HOUR), endedAt: ago(2 * HOUR - 95 * 1000), durationSeconds: 95,
      summary: "Caller reported gray-water damage in the kitchen from a dishwasher leak, under 24 hours old, filing an insurance claim. Urgent — recommend calling back within 10 minutes.",
      transcript: [
        { role: "assistant", message: "Thanks for calling Blue Star Restoration. I'm their automated intake assistant. Is this for a new issue, or are you calling about work already in progress?" },
        { role: "user", message: "New issue, my dishwasher is leaking everywhere" },
        { role: "assistant", message: "I have this noted as Water. How urgent is this?" },
        { role: "user", message: "Very urgent, water is spreading into the living room" },
      ],
    },
    {
      leadId: insertedLeads["+15125550113"],
      twilioCallSid: "CAseed0002aaaaaaaaaaaaaaaaaaaaaaaa",
      callerPhone: "+15125550113", calledNumber: "+15125550100", status: "answered", outcome: "abandoned", aiHandled: true,
      overflowStartedAt: ago(4 * HOUR), endedAt: ago(4 * HOUR - 22 * 1000), durationSeconds: 22,
      summary: "Caller mentioned fire damage but hung up before completing intake.",
      transcript: [
        { role: "assistant", message: "Thanks for calling Blue Star Restoration. I'm their automated intake assistant. Is this for a new issue, or are you calling about work already in progress?" },
        { role: "user", message: "New — there was a small fire in the garage" },
      ],
    },
    {
      leadId: insertedLeads["+15125550116"],
      twilioCallSid: "CAseed0003aaaaaaaaaaaaaaaaaaaaaaaa",
      callerPhone: "+15125550116", calledNumber: "+15125550100", status: "answered", outcome: "ai_captured", aiHandled: true,
      overflowStartedAt: ago(1 * DAY), endedAt: ago(1 * DAY - 110 * 1000), durationSeconds: 110,
      summary: "Caller reported a kitchen fire, extinguished but heavy smoke damage throughout the first floor. Wants a callback today.",
      transcript: [
        { role: "assistant", message: "Thanks for calling Blue Star Restoration. I'm their automated intake assistant." },
        { role: "user", message: "We had a small kitchen fire, it's out now but there's smoke everywhere" },
        { role: "assistant", message: "I have this noted as Fire or Smoke. How urgent is this?" },
        { role: "user", message: "Pretty urgent, the smell is awful and we have kids" },
      ],
    },
    // Business answered directly — no AI, no lead.
    {
      leadId: null, twilioCallSid: "CAseed0004aaaaaaaaaaaaaaaaaaaaaaaa",
      callerPhone: "+15125550140", calledNumber: "+15125550100", status: "answered", outcome: "business_answered", aiHandled: false,
      businessAnsweredAt: ago(5 * HOUR), endedAt: ago(5 * HOUR - 180 * 1000), durationSeconds: 180,
    },
    // Rang out, caller hung up before AI ever engaged — no lead, no summary.
    {
      leadId: null, twilioCallSid: "CAseed0005aaaaaaaaaaaaaaaaaaaaaaaa",
      callerPhone: "+15125550141", calledNumber: "+15125550100", status: "missed", outcome: "abandoned", aiHandled: false,
      missedAt: ago(9 * HOUR), durationSeconds: 0,
    },
    // AI captured the call and produced a real transcript/summary, but no lead
    // record exists for it — the exact case the Calls page "Details" expand
    // was built to surface (summary/transcript with no linked lead).
    {
      leadId: null, twilioCallSid: "CAseed0006aaaaaaaaaaaaaaaaaaaaaaaa",
      callerPhone: "+15125550142", calledNumber: "+15125550100", status: "answered", outcome: "ai_captured", aiHandled: true,
      overflowStartedAt: ago(30 * HOUR), endedAt: ago(30 * HOUR - 40 * 1000), durationSeconds: 40,
      summary: "Caller asked about pricing only, didn't want to proceed with intake — no lead created.",
      transcript: [
        { role: "assistant", message: "Thanks for calling Blue Star Restoration. I'm their automated intake assistant." },
        { role: "user", message: "I just wanted to know your rates, not calling about a job" },
        { role: "assistant", message: "I'll pass this along so the team can follow up on that." },
      ],
    },
    {
      leadId: insertedLeads["+15125550119"],
      twilioCallSid: "CAseed0007aaaaaaaaaaaaaaaaaaaaaaaa",
      callerPhone: "+15125550119", calledNumber: "+15125550100", status: "answered", outcome: "ai_captured", aiHandled: true,
      overflowStartedAt: ago(10 * DAY), endedAt: ago(10 * DAY - 130 * 1000), durationSeconds: 130,
      summary: "Caller reported significant water damage after a burst pipe, insured, wants work booked ASAP.",
      recordingUrl: "https://example.test/fake-recordings/CAseed0007.mp3",
    },
    // Transfer failed.
    {
      leadId: null, twilioCallSid: "CAseed0008aaaaaaaaaaaaaaaaaaaaaaaa",
      callerPhone: "+15125550143", calledNumber: "+15125550100", status: "answered", outcome: "error", aiHandled: true,
      overflowStartedAt: ago(2 * DAY), endedAt: ago(2 * DAY - 15 * 1000), durationSeconds: 15,
    },
  ];

  for (const c of seedCalls) {
    await db.insert(calls).values({ ...c, businessId: business.id });
  }

  console.log(`Seeded ${seedCalls.length} calls.`);
  console.log(`\nDone. Seed business id: ${business.id} (clerkUserId: ${SEED_CLERK_USER_ID})`);
  console.log("This is a dedicated seed business, not tied to any real Clerk account.");
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
