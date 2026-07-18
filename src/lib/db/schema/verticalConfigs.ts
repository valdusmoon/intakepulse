import { integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Question definition stored in the questions JSONB array
export interface VerticalQuestion {
  key: string;
  label: string;
  type: "single_select" | "multi_select" | "text" | "scale";
  options?: { value: string; label: string }[];
  required: boolean;
  // Show this question only when a prior answer matches. e.g. { key: "damage_type", value: "water" }
  conditional?: { key: string; value: string };
  // Enrichment fields captured from the caller's own words if mentioned (via
  // extract_intake) and fed to scoring, but never spoken as a question on a
  // voice call — asking them would just lengthen the call. The web intake form
  // still renders them (as optional). e.g. cause, rooms_affected.
  voiceExtractOnly?: boolean;
  // Ask this question open-ended on a voice call (no spoken option menu / DTMF
  // read-out). The caller's own words are classified against the options; if
  // nothing matches, the raw phrase is captured as an off-list service. Set on
  // each vertical's primary service question. Web/other channels ignore this.
  voiceOpenAsk?: boolean;
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

  // Unique per vertical — 'restoration' | 'hvac' | 'plumbing' | 'electrical' | 'general_contracting' | 'other'
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

  // Floor for estimatedValueLow (cents) before scoringRules valueBonus is added.
  // Per-vertical because job sizes vary wildly — a cheap thermostat call and a
  // restoration job shouldn't share the same $1,500 floor.
  baseValueLow: integer("base_value_low").notNull().default(150000),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type VerticalConfig = typeof verticalConfigs.$inferSelect;
export type NewVerticalConfig = typeof verticalConfigs.$inferInsert;
