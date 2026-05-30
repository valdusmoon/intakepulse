import { boolean, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { companies } from "./companies";

// This schema will be fully replaced in Session 1 with the IntakePulse leads table.
// Stripped to remove deleted staff/schedule/photo/quote/contract fields so typecheck passes.
export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),

  homeownerName: text("homeowner_name").notNull(),
  homeownerEmail: text("homeowner_email"),
  homeownerPhone: text("homeowner_phone").notNull(),

  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),

  serviceType: text("service_type"),
  description: text("description"),
  preferredTimeline: text("preferred_timeline"),

  status: text("status").notNull().default("new"),

  aiEstimateLow: integer("ai_estimate_low"),
  aiEstimateHigh: integer("ai_estimate_high"),
  aiConfidence: text("ai_confidence"),

  quotedAmount: integer("quoted_amount"),
  aiPhotoSummary: text("ai_photo_summary"),
  notes: text("notes"),

  smsConsent: boolean("sms_consent").default(false).notNull(),
  confirmationSentAt: timestamp("confirmation_sent_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
