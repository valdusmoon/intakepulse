/**
 * Resets dev/test data to a clean, representative state matching the current
 * architecture (Twilio voice overflow, restoration vertical, split lead status).
 *
 * Preserves the existing business row's id/clerkUserId (so whoever's logged-in
 * Clerk account is tied to it keeps seeing it) — only cleans up its fields and
 * replaces leads/calls/pricing with fresh, realistic data. All phone numbers use
 * the NANP-reserved 555-01XX fictional block, never a real subscriber range.
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { businesses } from "../src/lib/db/schema/businesses";
import { leads } from "../src/lib/db/schema/leads";
import { calls } from "../src/lib/db/schema/calls";
import { aiAssessments } from "../src/lib/db/schema/aiAssessments";
import { followups } from "../src/lib/db/schema/followups";
import { smsEvents } from "../src/lib/db/schema/smsEvents";
import { pricingRules } from "../src/lib/db/schema/pricingRules";

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(sql);

async function main() {
  const existing = await db.select().from(businesses).limit(1);

  if (existing.length === 0) {
    console.error("No business found to seed against — run onboarding first, or insert one manually.");
    process.exit(1);
  }

  const business = existing[0];
  console.log(`Cleaning up test data for business ${business.id} (keeping its id/clerkUserId intact)...`);

  await db.delete(aiAssessments);
  await db.delete(followups);
  await db.delete(smsEvents);
  await db.delete(calls).where(eq(calls.businessId, business.id));
  await db.delete(leads).where(eq(leads.businessId, business.id));
  await db.delete(pricingRules).where(eq(pricingRules.businessId, business.id));

  console.log("Updating business to a clean, voice-ready configuration...");
  await db.update(businesses).set({
    businessName: "Blue Star Restoration",
    ownerName: "Jordan Blake",
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
    onboardingCompleted: true,
    subscriptionStatus: "trialing",
    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  }).where(eq(businesses.id, business.id));

  console.log("Seeding pricing rules (water / fire / mold)...");
  await db.insert(pricingRules).values([
    {
      businessId: business.id,
      vertical: "restoration",
      serviceCategory: "water",
      pricingType: "preliminary_range",
      minimumAmount: 175000,
      maximumAmount: 425000,
      approvedCustomerMessage:
        "For water damage restoration, Blue Star typically sees a preliminary range of $1,750 to $4,250. Final pricing depends on what the technician finds on-site.",
      disclaimer: "Estimate only — confirmed after inspection.",
      isActive: true,
    },
    {
      businessId: business.id,
      vertical: "restoration",
      serviceCategory: "fire",
      pricingType: "inspection_required",
      approvedCustomerMessage:
        "Fire and smoke damage restoration requires an on-site inspection before we can provide any pricing.",
      isActive: true,
    },
    {
      businessId: business.id,
      vertical: "restoration",
      serviceCategory: "mold",
      pricingType: "starting",
      startingAmount: 80000,
      approvedCustomerMessage:
        "Mold remediation starts at $800, with final pricing depending on the extent of the affected area.",
      isActive: true,
    },
  ]);

  console.log("Seeding representative leads...");
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;

  const [voiceLead] = await db.insert(leads).values({
    businessId: business.id,
    callerPhone: "+15125550111",
    callerName: "Marcus Webb",
    source: "voice_overflow",
    callStatus: "missed",
    intakeStatus: "completed",
    leadStatus: "qualified",
    urgencyScore: 8,
    qualityScore: 71,
    estimatedValueLow: 175000,
    estimatedValueHigh: 425000,
    intakeAnswers: {
      damage_type: "water",
      water_category: "cat_2",
      room_count: "3_4",
      flooring_type: "hardwood",
      has_insurance: "yes_filing",
      time_since_damage: "under_24h",
    },
    smsConsent: false,
    createdAt: new Date(now - 2 * hour),
  }).returning();

  await db.insert(calls).values({
    businessId: business.id,
    leadId: voiceLead.id,
    twilioCallSid: `CAseed${voiceLead.id.replace(/-/g, "").slice(0, 28)}`,
    callerPhone: "+15125550111",
    calledNumber: "+15125550100",
    status: "answered",
    outcome: "ai_captured",
    aiHandled: true,
    overflowStartedAt: new Date(now - 2 * hour),
    endedAt: new Date(now - 2 * hour + 95 * 1000),
    durationSeconds: 95,
    summary:
      "Caller reported gray-water damage in the kitchen from a dishwasher leak, under 24 hours old, three affected rooms with hardwood flooring, filing an insurance claim. Urgent — recommend calling back within 10 minutes.",
  });

  await db.insert(leads).values([
    {
      businessId: business.id,
      callerPhone: "+15125550112",
      callerName: "Priya Nandakumar",
      source: "website_widget",
      intakeStatus: "completed",
      leadStatus: "new",
      urgencyScore: 4,
      qualityScore: 55,
      estimatedValueLow: 80000,
      estimatedValueHigh: 160000,
      intakeAnswers: {
        damage_type: "mold",
        room_count: "1_2",
        flooring_type: "tile",
        has_insurance: "no",
        time_since_damage: "over_a_week",
      },
      smsConsent: true,
      createdAt: new Date(now - 26 * hour),
    },
    {
      businessId: business.id,
      callerPhone: "+15125550113",
      callerName: null,
      source: "voice_overflow",
      callStatus: "missed",
      intakeStatus: "abandoned",
      leadStatus: "new",
      intakeAnswers: { damage_type: "fire" },
      smsConsent: false,
      createdAt: new Date(now - 4 * hour),
    },
    {
      businessId: business.id,
      callerPhone: "+15125550114",
      callerName: "Diane Ostrowski",
      callerEmail: "diane.ostrowski@example.test",
      source: "direct_intake",
      intakeStatus: "completed",
      leadStatus: "converted",
      urgencyScore: 6,
      qualityScore: 78,
      estimatedValueLow: 200000,
      estimatedValueHigh: 400000,
      intakeAnswers: {
        damage_type: "water",
        water_category: "cat_1",
        room_count: "5_plus",
        flooring_type: "carpet",
        has_insurance: "yes_oop",
        time_since_damage: "1_to_3_days",
      },
      convertedAt: new Date(now - 3 * day),
      smsConsent: true,
      createdAt: new Date(now - 5 * day),
    },
    {
      businessId: business.id,
      callerPhone: "+15125550115",
      callerName: "Tom Reyes",
      source: "manual",
      intakeStatus: "not_started",
      leadStatus: "lost",
      notes: "Called back — went with a competitor who could start same day.",
      createdAt: new Date(now - 8 * day),
    },
  ]);

  console.log("Done. Seeded 1 business, 3 pricing rules, 5 leads, 1 call.");
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
