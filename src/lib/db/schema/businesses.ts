import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export interface BusinessNotificationPreferences {
  newLead: boolean;
  qualifiedLead: boolean;
  smsNewLead: boolean;
  weeklyReport: boolean;
}

const DEFAULT_NOTIFICATION_PREFERENCES: BusinessNotificationPreferences = {
  newLead: true,
  qualifiedLead: true,
  smsNewLead: false,
  weeklyReport: true,
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

  // Telnyx — dormant. Retained for the deferred SMS/A2P module, not used by the
  // voice overflow receptionist. See docs/telnyx-a2p-productionization-spec.md
  telnyxPhoneNumber: text("telnyx_phone_number"),
  forwardingNumber: text("forwarding_number"),
  callTimeoutSeconds: integer("call_timeout_seconds").notNull().default(20),

  // SMS template — dormant, see Telnyx note above
  missedCallSmsTemplate: text("missed_call_sms_template"),

  // Twilio — the business's dedicated inbound voice number
  twilioPhoneNumber: text("twilio_phone_number"),

  // 'ring_then_ai' (default): dial forwardingNumber first, AI overflow only on no-answer/busy/failed.
  // 'ai_immediate': AI answers every call without ringing the business first.
  overflowMode: text("overflow_mode").notNull().default("ring_then_ai"),

  recordingEnabled: boolean("recording_enabled").notNull().default(false),
  // Spoken disclosure text if recordingEnabled — read by the AI at call start
  recordingDisclosure: text("recording_disclosure"),

  // Number to warm-transfer to when the AI classifies a call as urgent/emergency
  urgentTransferNumber: text("urgent_transfer_number"),

  // Spoken opening line — falls back to a generated default if unset
  greetingMessage: text("greeting_message"),
  // Free-text appended to the AI's system instructions for business-specific nuance
  aiInstructions: text("ai_instructions"),
  // OpenAI Realtime voice id — 'alloy' | 'ash' | 'coral' | 'marin'
  voiceName: text("voice_name").notNull().default("alloy"),

  // Emergency kill switch for this tenant only — blocks all inbound call handling
  isPaused: boolean("is_paused").notNull().default(false),

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
