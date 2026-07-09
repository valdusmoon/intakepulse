import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { verticalConfigs } from "../src/lib/db/schema/verticalConfigs";
import { VERTICALS, buildAiPromptTemplate } from "../src/lib/verticals/verticalDefinitions";

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(sql);

async function seed() {
  console.log("Seeding vertical configs...");

  for (const v of VERTICALS) {
    await db
      .insert(verticalConfigs)
      .values({
        vertical: v.vertical,
        displayName: v.displayName,
        questions: v.questions,
        scoringRules: v.scoringRules,
        aiPromptTemplate: buildAiPromptTemplate(v.industryLabel),
        baseValueLow: v.baseValueLow,
      })
      .onConflictDoUpdate({
        target: verticalConfigs.vertical,
        set: {
          displayName: v.displayName,
          questions: v.questions,
          scoringRules: v.scoringRules,
          aiPromptTemplate: buildAiPromptTemplate(v.industryLabel),
          baseValueLow: v.baseValueLow,
          updatedAt: new Date(),
        },
      });
    console.log(`✓ ${v.displayName} vertical seeded (${v.questions.length} questions)`);
  }

  await sql.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
