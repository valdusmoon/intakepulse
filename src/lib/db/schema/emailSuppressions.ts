import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

// CAN-SPAM suppression list for COMMERCIAL email. Keyed by the lowercased email
// address rather than a foreign key on purpose: a marketing recipient can be a
// pre-account prospect (email_captures) OR a signed-up business owner
// (businesses.ownerEmail), so opt-out has to work across both. Any address in
// here must be excluded from all marketing sends (ROI capture + drip, win-back,
// monthly recap). Transactional email (lead packet, receipt, dunning,
// trial-ending, welcome) is exempt and does NOT consult this list.
export const emailSuppressions = pgTable("email_suppressions", {
  // Lowercased email address; the primary key so opt-out is idempotent.
  email: text("email").primaryKey(),

  // Where the opt-out came from, e.g. 'unsubscribe_link' | 'one_click' | 'manual'
  source: text("source").notNull().default("unsubscribe_link"),

  unsubscribedAt: timestamp("unsubscribed_at").defaultNow().notNull(),
});

export type EmailSuppression = typeof emailSuppressions.$inferSelect;
export type NewEmailSuppression = typeof emailSuppressions.$inferInsert;
