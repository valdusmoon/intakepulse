import { eq } from "drizzle-orm";
import { db } from "../index";
import { aiAssessments, type NewAiAssessment } from "../schema/aiAssessments";

export async function createAiAssessment(data: NewAiAssessment) {
  const result = await db.insert(aiAssessments).values(data).returning();
  return result[0];
}

export async function getAiAssessmentByLeadId(leadId: string) {
  const assessment = await db.query.aiAssessments.findFirst({
    where: eq(aiAssessments.leadId, leadId),
  });
  return assessment ?? null;
}
