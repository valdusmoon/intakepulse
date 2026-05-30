import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { verticalConfigs } from "../src/lib/db/schema/verticalConfigs";
import type { VerticalQuestion, ScoringRule } from "../src/lib/db/schema/verticalConfigs";

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(sql);

// ─── Restoration Vertical ─────────────────────────────────────────────────────

const restorationQuestions: VerticalQuestion[] = [
  {
    key: "damage_type",
    label: "What type of damage occurred?",
    type: "single_select",
    options: [
      { value: "water", label: "Water Damage" },
      { value: "fire", label: "Fire / Smoke Damage" },
      { value: "mold", label: "Mold" },
    ],
    required: true,
  },
  {
    key: "water_category",
    label: "What type of water?",
    type: "single_select",
    options: [
      { value: "cat_1", label: "Category 1 — Clean water (pipe burst, appliance)" },
      { value: "cat_2", label: "Category 2 — Gray water (washing machine, dishwasher)" },
      { value: "cat_3", label: "Category 3 — Black water (sewage, flooding)" },
    ],
    required: true,
    conditional: { key: "damage_type", value: "water" },
  },
  {
    key: "affected_rooms",
    label: "Which areas are affected?",
    type: "multi_select",
    options: [
      { value: "living_room", label: "Living Room" },
      { value: "bedroom", label: "Bedroom" },
      { value: "bathroom", label: "Bathroom" },
      { value: "kitchen", label: "Kitchen" },
      { value: "basement", label: "Basement" },
      { value: "garage", label: "Garage" },
      { value: "multiple", label: "Multiple Rooms" },
    ],
    required: true,
  },
  {
    key: "flooring_type",
    label: "What type of flooring is affected?",
    type: "single_select",
    options: [
      { value: "hardwood", label: "Hardwood" },
      { value: "carpet", label: "Carpet" },
      { value: "tile", label: "Tile" },
      { value: "concrete", label: "Concrete" },
      { value: "mixed", label: "Mixed / Multiple Types" },
    ],
    required: true,
  },
  {
    key: "has_insurance",
    label: "Do you have homeowner's insurance?",
    type: "single_select",
    options: [
      { value: "yes_filing", label: "Yes — I'm filing a claim" },
      { value: "yes_oop", label: "Yes — paying out of pocket" },
      { value: "no", label: "No insurance" },
      { value: "unsure", label: "Not sure" },
    ],
    required: true,
  },
  {
    key: "time_since_damage",
    label: "When did the damage occur?",
    type: "single_select",
    options: [
      { value: "under_24h", label: "Less than 24 hours ago" },
      { value: "1_to_3_days", label: "1–3 days ago" },
      { value: "3_to_7_days", label: "3–7 days ago" },
      { value: "over_a_week", label: "Over a week ago" },
    ],
    required: true,
  },
  {
    key: "active_leak",
    label: "Is water still actively entering the property?",
    type: "single_select",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No, it has stopped" },
    ],
    required: true,
    conditional: { key: "damage_type", value: "water" },
  },
  {
    key: "emergency_severity",
    label: "How severe is the situation right now?",
    type: "scale",
    options: [
      { value: "1", label: "1 — Minor, no immediate risk" },
      { value: "2", label: "2" },
      { value: "3", label: "3 — Moderate" },
      { value: "4", label: "4" },
      { value: "5", label: "5 — Severe, structural risk" },
    ],
    required: true,
  },
];

// Scoring rules applied by the generic scoring engine.
// No code changes needed to add a new vertical — just write new rules here.
const restorationScoringRules: ScoringRule[] = [
  // Water category — gray/black water significantly increases urgency
  { answerKey: "water_category", answerValue: "cat_2", urgencyBonus: 3 },
  { answerKey: "water_category", answerValue: "cat_3", urgencyBonus: 4, qualityBonus: 10 },

  // Hardwood flooring — delamination risk drives urgency and value
  { answerKey: "flooring_type", answerValue: "hardwood", urgencyBonus: 2, valueBonus: 200000 },
  { answerKey: "flooring_type", answerValue: "carpet", urgencyBonus: 1, valueBonus: 75000 },

  // Active leak — highest urgency signal
  { answerKey: "active_leak", answerValue: "yes", urgencyBonus: 3 },

  // Insurance confirmed — strong quality signal (insured jobs close at higher rates)
  { answerKey: "has_insurance", answerValue: "yes_filing", qualityBonus: 25 },
  { answerKey: "has_insurance", answerValue: "yes_oop", qualityBonus: 10 },

  // Recency — fresh damage is more urgent and more likely to close
  { answerKey: "time_since_damage", answerValue: "under_24h", urgencyBonus: 3, qualityBonus: 15 },
  { answerKey: "time_since_damage", answerValue: "1_to_3_days", urgencyBonus: 1, qualityBonus: 5 },

  // Self-reported severity
  { answerKey: "emergency_severity", answerValue: "4", urgencyBonus: 1 },
  { answerKey: "emergency_severity", answerValue: "5", urgencyBonus: 2 },

  // Multiple rooms — higher value job
  { answerKey: "affected_rooms", answerValue: "multiple", valueBonus: 150000 },
  { answerKey: "affected_rooms", answerValue: "basement", valueBonus: 100000, urgencyBonus: 1 },

  // Fire/mold — different risk profiles
  { answerKey: "damage_type", answerValue: "fire", urgencyBonus: 2, valueBonus: 300000, qualityBonus: 10 },
  { answerKey: "damage_type", answerValue: "mold", qualityBonus: 5, valueBonus: 80000 },
];

const restorationAiPromptTemplate = `You are an expert restoration industry consultant helping a restoration company understand an inbound lead.

The lead scoring engine has already computed objective scores based on the intake answers:
- Urgency score: {urgencyScore}/10
- Quality score: {qualityScore}/100
- Estimated job value: {estimatedValueLow} to {estimatedValueHigh} (cents)

Your job is to write the plain-English explanation for WHY these scores are what they are, using the intake answers below. Do NOT change the scores — they are already computed. Write as if you are briefing the restoration company owner at 2am on their phone.

Intake answers:
{intakeAnswers}

Respond with a JSON object with exactly these fields:
{
  "urgencyReasoning": "1-2 sentences explaining the urgency score in plain English. Reference specific answers. Example: 'Category 2 water with hardwood floors creates delamination risk within 24-48 hours — the window to save the floors is closing.'",
  "qualityReasoning": "1-2 sentences explaining the quality score. Reference insurance status, recency, and engagement signals.",
  "recommendedActions": ["array", "of", "3-5", "specific", "next", "actions", "for", "the", "owner"]
}

Be specific and actionable. This owner is deciding in the next 60 seconds whether to call back immediately or wait until morning.`;

// ─── Seed ──────────────────────────────────────────────────────────────────────

async function seed() {
  console.log("Seeding vertical configs...");

  await db
    .insert(verticalConfigs)
    .values({
      vertical: "restoration",
      displayName: "Water / Fire / Mold Restoration",
      questions: restorationQuestions,
      scoringRules: restorationScoringRules,
      aiPromptTemplate: restorationAiPromptTemplate,
    })
    .onConflictDoUpdate({
      target: verticalConfigs.vertical,
      set: {
        displayName: "Water / Fire / Mold Restoration",
        questions: restorationQuestions,
        scoringRules: restorationScoringRules,
        aiPromptTemplate: restorationAiPromptTemplate,
        updatedAt: new Date(),
      },
    });

  console.log("✓ Restoration vertical seeded");
  await sql.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
