import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export interface BusinessNotificationPreferences {
  newLead: boolean;
  qualifiedLead: boolean;
  smsNewLead: boolean;
}

const DEFAULT_NOTIFICATION_PREFERENCES: BusinessNotificationPreferences = {
  newLead: true,
  qualifiedLead: true,
  smsNewLead: false,
};

export const businesses = pgTable("businesses", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: text("clerk_user_id").notNull().unique(),

  businessName: text("business_name").notNull(),
  ownerName: text("owner_name").notNull(),
  ownerEmail: text("owner_email").notNull(),
  ownerPhone: text("owner_phone"),
  serviceArea: text("service_area"),
  timezone: text("timezone").notNull().default("America/New_York"),
  websiteUrl: text("website_url"),

  // V1: hardcoded to 'restoration'. Field exists for future vertical expansion.
  vertical: text("vertical").notNull().default("restoration"),

  // Telnyx — provisioned manually via Telnyx console for V1
  telnyxPhoneNumber: text("telnyx_phone_number"),
  forwardingNumber: text("forwarding_number"),
  callTimeoutSeconds: integer("call_timeout_seconds").notNull().default(20),

  // SMS template — editable in settings
  missedCallSmsTemplate: text("missed_call_sms_template"),

  notificationPreferences: jsonb("notification_preferences")
    .$type<BusinessNotificationPreferences>()
    .notNull()
    .default(DEFAULT_NOTIFICATION_PREFERENCES),

  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),

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

export type Business = typeof businesses.$inferSelect;
export type NewBusiness = typeof businesses.$inferInsert;
