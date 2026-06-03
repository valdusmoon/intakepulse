import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { verticalConfigs } from "../src/lib/db/schema/verticalConfigs";
import type { VerticalQuestion, ScoringRule } from "../src/lib/db/schema/verticalConfigs";

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(sql);

// ─── Restoration Vertical ─────────────────────────────────────────────────────
//
// 5 questions total (down from 8). Step 0 (name/phone/consent) is separate.
// water_category is conditional on damage_type = water.
// Target: under 90 seconds on mobile for someone in an emergency.

const restorationQuestions: VerticalQuestion[] = [
  {
    key: "damage_type",
    label: "What type of damage?",
    type: "single_select",
    options: [
      { value: "water", label: "Water" },
      { value: "fire", label: "Fire or Smoke" },
      { value: "mold", label: "Mold" },
    ],
    required: true,
  },
  {
    key: "water_category",
    label: "What type of water?",
    type: "single_select",
    options: [
      { value: "cat_1", label: "Clean water — pipe, appliance" },
      { value: "cat_2", label: "Gray water — washing machine, dishwasher" },
      { value: "cat_3", label: "Sewage or outdoor flooding" },
    ],
    required: true,
    conditional: { key: "damage_type", value: "water" },
  },
  {
    key: "room_count",
    label: "How many rooms are affected?",
    type: "single_select",
    options: [
      { value: "1_2", label: "1–2 rooms" },
      { value: "3_4", label: "3–4 rooms" },
      { value: "5_plus", label: "5 or more" },
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
      { value: "mixed", label: "Mixed" },
    ],
    required: true,
  },
  {
    key: "has_insurance",
    label: "Do you have homeowner's insurance?",
    type: "single_select",
    options: [
      { value: "yes_filing", label: "Yes — filing a claim" },
      { value: "yes_oop", label: "Yes — paying out of pocket" },
      { value: "no", label: "No" },
      { value: "unsure", label: "Not sure" },
    ],
    required: true,
  },
  {
    key: "time_since_damage",
    label: "When did the damage happen?",
    type: "single_select",
    options: [
      { value: "under_24h", label: "Just happened — under 24 hours" },
      { value: "1_to_3_days", label: "1–3 days ago" },
      { value: "3_to_7_days", label: "3–7 days ago" },
      { value: "over_a_week", label: "Over a week ago" },
    ],
    required: true,
  },
];

const restorationScoringRules: ScoringRule[] = [
  // Water category — gray/black water drives urgency hard
  { answerKey: "water_category", answerValue: "cat_2", urgencyBonus: 3 },
  { answerKey: "water_category", answerValue: "cat_3", urgencyBonus: 4, qualityBonus: 10 },

  // Flooring — hardwood delamination is the key urgency + value driver
  { answerKey: "flooring_type", answerValue: "hardwood", urgencyBonus: 2, valueBonus: 200000 },
  { answerKey: "flooring_type", answerValue: "carpet", urgencyBonus: 1, valueBonus: 75000 },

  // Room count — scope of job drives value estimate
  { answerKey: "room_count", answerValue: "3_4", valueBonus: 100000 },
  { answerKey: "room_count", answerValue: "5_plus", valueBonus: 225000, urgencyBonus: 1 },

  // Insurance — strongest quality signal (insured jobs close at higher rates)
  { answerKey: "has_insurance", answerValue: "yes_filing", qualityBonus: 25 },
  { answerKey: "has_insurance", answerValue: "yes_oop", qualityBonus: 10 },

  // Recency — fresh damage is urgent and more likely to close
  { answerKey: "time_since_damage", answerValue: "under_24h", urgencyBonus: 3, qualityBonus: 15 },
  { answerKey: "time_since_damage", answerValue: "1_to_3_days", urgencyBonus: 1, qualityBonus: 5 },

  // Damage type — fire and mold have distinct value profiles
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

  console.log("✓ Restoration vertical seeded (6 questions — trimmed from 8)");
  await sql.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
