import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { businesses } from "./businesses";
import type { ScoreTrace } from "@/lib/leads/scoring";

export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id),

  // Caller info — populated immediately when a call/form starts; name/email filled once intake completes
  callerPhone: text("caller_phone").notNull(),
  callerName: text("caller_name"),
  callerEmail: text("caller_email"),

  // How this lead entered the system
  source: text("source").notNull().default("direct_intake"), // 'voice_overflow' | 'voice_human' | 'website_widget' | 'direct_intake' | 'email' | 'manual'

  // Telephony state (only relevant for voice_overflow source)
  callStatus: text("call_status"), // 'initiated' | 'ringing' | 'answered' | 'missed'

  // Progress through the vertical Q&A specifically — decoupled from sales
  // progress below. System-derived, not manually set by the business. Manual
  // leads (no Q&A ever ran) and short-path voice calls (existing customer,
  // wants a human) stay 'not_started' — that's an honest label, not a bug.
  intakeStatus: text("intake_status").notNull().default("not_started"), // 'not_started' | 'started' | 'completed' | 'abandoned'

  // The business's own follow-up/sales progress — independent of whether
  // intake finished, so re-submitting intake never resets sales progress.
  // 'converted' is labeled "Won" in the UI — kept as the stored value to avoid
  // an unnecessary rename migration.
  leadStatus: text("lead_status").notNull().default("new"), // 'new' | 'qualified' | 'contacted' | 'booked' | 'estimate_sent' | 'converted' | 'lost'

  // Scores — denormalized from ai_assessments for list view performance (no join needed)
  urgencyScore: integer("urgency_score"),   // 1-10, set by scoring engine
  qualityScore: integer("quality_score"),   // 1-100, set by scoring engine
  // Composite "call first" ranking (0-100) — blends urgency/value/quality; drives
  // the Hot/Warm/Cool tier and the dashboard priority queue. Set by scoring engine.
  priorityScore: integer("priority_score"),
  // Deterministic explanation of how the score was reached (matched rules, floors,
  // normalized sub-scores, model version) — for debugging + "why is this Hot?".
  scoreTrace: jsonb("score_trace").$type<ScoreTrace>(),
  estimatedValueLow: integer("estimated_value_low"),   // cents — AI estimate
  estimatedValueHigh: integer("estimated_value_high"), // cents — AI estimate
  // Actual reported job value once the business knows it — distinct from the
  // AI's estimated range above. Settable any time, not just on conversion.
  confirmedValue: integer("confirmed_value"), // cents

  // The service the caller actually asked for, in their own words — captured on
  // every voice call (primary question is asked open-ended) and by the web form's
  // "Other" option. When it maps to a configured service, that structured value
  // also lands in intakeAnswers and drives scoring/quote; when it doesn't ("off
  // list"), this free text is the only service record and no quote is given.
  serviceRequested: text("service_requested"),

  // Intake answers stored as a single JSONB object keyed to vertical config question keys.
  // e.g. { service_type: "water", urgency: "emergency", time_since_issue: "today", has_coverage: "covered" }
  // Nullable — a lead exists before intake is completed (do not assume this is populated).
  intakeAnswers: jsonb("intake_answers").$type<Record<string, string | string[]>>(),

  // TCPA compliance — must be true before any follow-up SMS fires
  smsConsent: boolean("sms_consent").notNull().default(false),

  notes: text("notes"),
  followupPausedAt: timestamp("followup_paused_at"),
  // First time leadStatus reached 'contacted' or beyond — powers "average callback time"
  contactedAt: timestamp("contacted_at"),
  convertedAt: timestamp("converted_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
