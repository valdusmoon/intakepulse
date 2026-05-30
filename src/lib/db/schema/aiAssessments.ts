import { integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { leads } from "./leads";

// One assessment per lead. Kept in a separate table so the heavy rawResponse blob
// is never loaded during leads list queries. Scores are denormalized onto the leads
// table for list performance; this table holds the reasoning text and raw GPT output.
export const aiAssessments = pgTable("ai_assessments", {
  id: uuid("id").primaryKey().defaultRandom(),
  leadId: uuid("lead_id").notNull().unique().references(() => leads.id),

  // Plain-English reasoning — the output the owner reads in the lead packet email
  // and on the lead detail page. GPT writes these given the already-computed scores.
  urgencyReasoning: text("urgency_reasoning").notNull(),
  qualityReasoning: text("quality_reasoning").notNull(),
  recommendedActions: jsonb("recommended_actions").$type<string[]>().notNull(),

  // Full GPT-4o API response — stored for debugging and future model comparison.
  // Never loaded in list queries.
  rawResponse: jsonb("raw_response"),
  model: text("model").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AiAssessment = typeof aiAssessments.$inferSelect;
export type NewAiAssessment = typeof aiAssessments.$inferInsert;
