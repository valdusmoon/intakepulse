import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { businesses } from "./businesses";

export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id),

  // Caller info — populated from Telnyx event immediately; name/email filled once intake completes
  callerPhone: text("caller_phone").notNull(),
  callerName: text("caller_name"),
  callerEmail: text("caller_email"),

  // How this lead entered the system
  source: text("source").notNull().default("missed_call"), // 'missed_call' | 'embed' | 'email' | 'manual'

  // Telephony state (only relevant for missed_call source)
  callStatus: text("call_status"), // 'initiated' | 'ringing' | 'answered' | 'missed'

  // Business lifecycle state
  status: text("status").notNull().default("sms_sent"), // 'sms_sent' | 'intake_started' | 'intake_completed' | 'qualified' | 'converted' | 'lost'

  // Scores — denormalized from ai_assessments for list view performance (no join needed)
  urgencyScore: integer("urgency_score"),   // 1-10, set by scoring engine
  qualityScore: integer("quality_score"),   // 1-100, set by scoring engine
  estimatedValueLow: integer("estimated_value_low"),   // cents
  estimatedValueHigh: integer("estimated_value_high"), // cents

  // Intake answers stored as a single JSONB object keyed to vertical config question keys.
  // e.g. { damage_type: "water", water_category: "cat_2", flooring: "hardwood", ... }
  // Nullable — a lead exists before intake is completed (do not assume this is populated).
  intakeAnswers: jsonb("intake_answers").$type<Record<string, string | string[]>>(),

  // TCPA compliance — must be true before any follow-up SMS fires
  smsConsent: boolean("sms_consent").notNull().default(false),

  notes: text("notes"),
  followupPausedAt: timestamp("followup_paused_at"),
  convertedAt: timestamp("converted_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
