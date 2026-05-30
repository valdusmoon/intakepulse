import { integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { businesses } from "./businesses";
import { leads } from "./leads";

export const calls = pgTable("calls", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id),

  // Linked once a missed call creates a lead record; null for answered calls
  leadId: uuid("lead_id").references(() => leads.id),

  // Telnyx identifiers — both needed, they are different values
  // telnyxCallControlId: used to perform actions on an active call
  // telnyxCallLegId: present in call.hangup payload, used to match hangup events to call records
  telnyxCallControlId: text("telnyx_call_control_id").unique(),
  telnyxCallLegId: text("telnyx_call_leg_id").unique(),

  callerPhone: text("caller_phone").notNull(),
  calledNumber: text("called_number").notNull(), // the Telnyx number that was called

  status: text("status").notNull().default("initiated"), // 'initiated' | 'ringing' | 'answered' | 'missed' | 'voicemail'

  answeredAt: timestamp("answered_at"),
  endedAt: timestamp("ended_at"),
  missedAt: timestamp("missed_at"),
  durationSeconds: integer("duration_seconds"),

  rawPayload: jsonb("raw_payload"), // full Telnyx webhook payload for debugging

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Call = typeof calls.$inferSelect;
export type NewCall = typeof calls.$inferInsert;
