import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { businesses } from "./businesses";
import { leads } from "./leads";

export interface CallTranscriptEntry {
  role: "user" | "assistant";
  message: string;
  timestamp?: number;
}

export const calls = pgTable("calls", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id),

  // Linked once a missed call creates a lead record; null for answered calls
  leadId: uuid("lead_id").references(() => leads.id),

  // Twilio CallSid — the active identifier for the voice overflow receptionist
  twilioCallSid: text("twilio_call_sid").unique(),

  callerPhone: text("caller_phone").notNull(),
  calledNumber: text("called_number").notNull(), // the Twilio number that was called

  status: text("status").notNull().default("initiated"), // 'initiated' | 'ringing' | 'answered' | 'missed' | 'voicemail'

  // 'in_progress' | 'business_answered' | 'ai_captured' | 'abandoned' | 'error'
  outcome: text("outcome").notNull().default("in_progress"),
  // True once the AI overflow receptionist took over this call
  aiHandled: boolean("ai_handled").notNull().default(false),

  answeredAt: timestamp("answered_at"),
  // When the business's Dial leg was actually answered by a human (business_answered outcome)
  businessAnsweredAt: timestamp("business_answered_at"),
  // When the AI overflow receptionist took over (no-answer/busy/failed on the Dial leg)
  overflowStartedAt: timestamp("overflow_started_at"),
  endedAt: timestamp("ended_at"),
  missedAt: timestamp("missed_at"),
  durationSeconds: integer("duration_seconds"),

  recordingUrl: text("recording_url"),
  // Short AI-generated summary of the call, written when the voice session ends
  summary: text("summary"),
  // Full turn-by-turn transcript, written when the voice session ends — the
  // source of truth for what was actually said (pricing disputes, QA, debugging),
  // distinct from the AI-generated summary above.
  transcript: jsonb("transcript").$type<CallTranscriptEntry[]>(),

  rawPayload: jsonb("raw_payload"), // full provider webhook payload for debugging

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Call = typeof calls.$inferSelect;
export type NewCall = typeof calls.$inferInsert;
