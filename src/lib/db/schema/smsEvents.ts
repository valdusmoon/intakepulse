import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { businesses } from "./businesses";
import { leads } from "./leads";

export const smsEvents = pgTable("sms_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id),

  // Nullable — answered calls that never become leads won't have a leadId
  leadId: uuid("lead_id").references(() => leads.id),

  direction: text("direction").notNull(), // 'outbound' | 'inbound'
  toPhone: text("to_phone").notNull(),
  fromPhone: text("from_phone").notNull(),
  body: text("body").notNull(),

  telnyxMessageId: text("telnyx_message_id").unique(),
  status: text("status").notNull().default("queued"), // 'queued' | 'sent' | 'delivered' | 'failed'

  rawPayload: jsonb("raw_payload"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SmsEvent = typeof smsEvents.$inferSelect;
export type NewSmsEvent = typeof smsEvents.$inferInsert;
