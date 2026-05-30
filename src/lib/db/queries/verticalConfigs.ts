import { eq } from "drizzle-orm";
import { db } from "../index";
import { verticalConfigs, type NewVerticalConfig } from "../schema/verticalConfigs";

export async function getVerticalConfig(vertical: string) {
  return db.query.verticalConfigs.findFirst({
    where: eq(verticalConfigs.vertical, vertical),
  }) ?? null;
}

export async function upsertVerticalConfig(data: NewVerticalConfig) {
  const result = await db
    .insert(verticalConfigs)
    .values(data)
    .onConflictDoUpdate({
      target: verticalConfigs.vertical,
      set: {
        displayName: data.displayName,
        questions: data.questions,
        scoringRules: data.scoringRules,
        aiPromptTemplate: data.aiPromptTemplate,
        updatedAt: new Date(),
      },
    })
    .returning();
  return result[0];
}
