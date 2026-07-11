import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Top-of-funnel email capture — anonymous visitors who hand over an email in
// exchange for value (ROI breakdown, lead-magnet). Not a lead and not tied to a
// business; this is pre-account interest that later feeds a drip sequence.
export const emailCaptures = pgTable("email_captures", {
  id: uuid("id").primaryKey().defaultRandom(),

  email: text("email").notNull(),

  // Where the capture happened, e.g. 'roi_calculator' | 'lead_magnet'
  source: text("source").notNull(),

  // Free-form context for the capture — for the ROI calculator this stores the
  // slider inputs and computed number, e.g.
  // { missedCalls: 6, jobValue: 3000, closeRate: 30, atRisk: 5400 }
  context: jsonb("context").$type<Record<string, unknown>>(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type EmailCapture = typeof emailCaptures.$inferSelect;
export type NewEmailCapture = typeof emailCaptures.$inferInsert;
