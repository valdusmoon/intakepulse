import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Question definition stored in the questions JSONB array
export interface VerticalQuestion {
  key: string;
  label: string;
  type: "single_select" | "multi_select" | "text" | "scale";
  options?: { value: string; label: string }[];
  required: boolean;
  // Show this question only when a prior answer matches. e.g. { key: "damage_type", value: "water" }
  conditional?: { key: string; value: string };
}

// Scoring rule stored in the scoringRules JSONB array.
// The generic scoring engine reads these and applies them — no vertical-specific code.
export interface ScoringRule {
  answerKey: string;
  answerValue: string;
  urgencyBonus?: number;
  qualityBonus?: number;
  valueBonus?: number; // cents added to estimated value
}

export const verticalConfigs = pgTable("vertical_configs", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Unique per vertical — 'restoration' | 'pi_law' | 'hvac' | etc.
  vertical: text("vertical").notNull().unique(),
  displayName: text("display_name").notNull(),

  // MCQ question definitions. The intake form renders these generically.
  questions: jsonb("questions").$type<VerticalQuestion[]>().notNull(),

  // Rules applied by the deterministic scoring engine. Adding a new vertical
  // means writing new rules here — zero code changes to the engine.
  scoringRules: jsonb("scoring_rules").$type<ScoringRule[]>().notNull(),

  // Prompt template for the GPT reasoning pass. Receives already-computed scores
  // + intake answers. Returns plain-English reasoning only — never scores.
  aiPromptTemplate: text("ai_prompt_template").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type VerticalConfig = typeof verticalConfigs.$inferSelect;
export type NewVerticalConfig = typeof verticalConfigs.$inferInsert;
