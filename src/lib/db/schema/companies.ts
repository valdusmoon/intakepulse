import { boolean, decimal, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export interface NotificationPreferences {
  newLead: boolean;
  newContact: boolean;
  quoteResponded: boolean;
  contractSigned: boolean;
  nudgeReminders: boolean;
  smsNewLead?: boolean;
  smsQuoteResponded?: boolean;
  smsContractSigned?: boolean;
  smsSchedule?: boolean;
}

const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  newLead: true,
  newContact: true,
  quoteResponded: true,
  contractSigned: true,
  nudgeReminders: true,
  smsNewLead: false,
  smsQuoteResponded: false,
  smsContractSigned: false,
  smsSchedule: false,
};

export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: text("clerk_user_id").notNull().unique(),

  // Business info
  businessName: text("business_name").notNull(),
  ownerName: text("owner_name").notNull(),
  ownerEmail: text("owner_email").notNull(),
  ownerPhone: text("owner_phone").notNull(),
  businessPhone: text("business_phone"),
  businessEmail: text("business_email"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  serviceArea: text("service_area"), // e.g. "Greater Austin area"

  // Optional profile
  logoUrl: text("logo_url"),
  websiteUrl: text("website_url"),
  googleReviewUrl: text("google_review_url"),

  // Pricing settings (painter configures their own rates)
  defaultSqftRate: decimal("default_sqft_rate", { precision: 10, scale: 2 }), // base labor $/sqft (good condition)
  paintTier: text("paint_tier").notNull().default("standard"), // budget | standard | premium

  timezone: text("timezone").notNull().default("America/New_York"),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),

  // Notification preferences — painter controls which emails they receive
  notificationPreferences: jsonb("notification_preferences")
    .$type<NotificationPreferences>()
    .notNull()
    .default(DEFAULT_NOTIFICATION_PREFERENCES),

  // Stripe billing
  stripeCustomerId: text("stripe_customer_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  stripePriceId: text("stripe_price_id"),
  subscriptionStatus: text("subscription_status"),
  trialEndsAt: timestamp("trial_ends_at"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  canceledAt: timestamp("canceled_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
