import { boolean, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { staff } from "./staff";

export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),

  // Homeowner contact
  homeownerName: text("homeowner_name").notNull(),
  homeownerEmail: text("homeowner_email"),
  homeownerPhone: text("homeowner_phone").notNull(),

  // Job location
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),

  // Job details
  serviceType: text("service_type"), // interior, exterior, both, cabinet, deck, etc.
  description: text("description"),  // homeowner's freeform description
  preferredTimeline: text("preferred_timeline"), // ASAP, within 2 weeks, flexible

  // Pipeline status
  status: text("status").notNull().default("new"), // new, contacted, quoted, scheduled, won, completed, lost

  // AI estimate (stored in cents to avoid float precision issues)
  aiEstimateLow: integer("ai_estimate_low"),
  aiEstimateHigh: integer("ai_estimate_high"),
  aiConfidence: text("ai_confidence"), // low, medium, high

  // Painter's actual quote (cents)
  quotedAmount: integer("quoted_amount"),

  // AI photo summary (written by GPT-4o vision, for painter's reference)
  aiPhotoSummary: text("ai_photo_summary"),

  // Painter's private notes
  notes: text("notes"),

  // Scheduling
  scheduledAt: timestamp("scheduled_at"),
  scheduledEndAt: timestamp("scheduled_end_at"),
  scheduledNote: text("scheduled_note"),
  scheduledType: text("scheduled_type"), // quote, job, other
  staffId: uuid("staff_id").references(() => staff.id),

  // SMS consent (collected on lead form)
  smsConsent: boolean("sms_consent").default(false).notNull(),

  // Confirmation email sent to homeowner on lead creation
  confirmationSentAt: timestamp("confirmation_sent_at"),

  // Review request
  reviewRequestToken: text("review_request_token").unique(),
  reviewRequestSentAt: timestamp("review_request_sent_at"),
  reviewRequestClickedAt: timestamp("review_request_clicked_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
