import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { businesses } from "./businesses";
import { leads } from "./leads";

export const followups = pgTable("followups", {
  id: uuid("id").primaryKey().defaultRandom(),
  leadId: uuid("lead_id").notNull().references(() => leads.id),
  businessId: uuid("business_id").notNull().references(() => businesses.id),

  // Position in sequence. V1 only ever writes sequence=1.
  // Schema supports multiple so V2 multi-step is additive — no migration needed.
  sequence: integer("sequence").notNull().default(1),

  scheduledAt: timestamp("scheduled_at").notNull(),
  sentAt: timestamp("sent_at"),
  canceledAt: timestamp("canceled_at"),

  // 'replied' | 'intake_completed' | 'manual_stop'
  cancelReason: text("cancel_reason"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Followup = typeof followups.$inferSelect;
export type NewFollowup = typeof followups.$inferInsert;
