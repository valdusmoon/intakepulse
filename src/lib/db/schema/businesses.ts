import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export interface BusinessNotificationPreferences {
  newLead: boolean;
  qualifiedLead: boolean;
  smsNewLead: boolean;
  // Web Push alert to the operator's installed PWA / browser on a new qualified
  // lead. Push-primary (instant, free, no A2P); SMS stays as the fallback.
  pushNewLead: boolean;
  weeklyReport: boolean;
}

export interface CustomServiceOption {
  value: string;
  label: string;
}

const DEFAULT_NOTIFICATION_PREFERENCES: BusinessNotificationPreferences = {
  newLead: true,
  qualifiedLead: true,
  smsNewLead: false,
  pushNewLead: true,
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

  // Selected during onboarding — see src/lib/verticals/pricingTemplates.ts and
  // scripts/seed-verticals.ts for the set of supported verticals.
  vertical: text("vertical").notNull().default("restoration"),

  // Extra service categories this business added itself (Settings > Services &
  // pricing > Add service, when typing something not in the vertical's preset
  // menu). Merged into the vertical's primary question options everywhere
  // they're read — see src/lib/verticals/customOptions.ts — so the live call
  // and public intake form can actually offer/recognize them, not just price them.
  customServiceOptions: jsonb("custom_service_options").$type<CustomServiceOption[]>().notNull().default([]),

  forwardingNumber: text("forwarding_number"),
  callTimeoutSeconds: integer("call_timeout_seconds").notNull().default(20),

  // Twilio — the business's dedicated inbound voice number
  twilioPhoneNumber: text("twilio_phone_number"),
  // Twilio's SID for that number (PN…). Stored on purchase so provisioning is
  // idempotent (never double-buy) and the number can be released on cancel.
  twilioPhoneNumberSid: text("twilio_phone_number_sid"),

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
  voiceName: text("voice_name").notNull().default("marin"),

  // Emergency kill switch for this tenant only — blocks all inbound call handling
  isPaused: boolean("is_paused").notNull().default(false),

  // Activation: the owner has confirmed they published their Callverted number as
  // their public business number (GBP, socials, website, directories). This is the
  // true "went live" signal — it can't be auto-detected (external), so the owner
  // self-confirms it. Drives the "Get your line live" activation-checklist step.
  numberPublished: boolean("number_published").notNull().default(false),

  // Activation: set the first time the owner completes a test call (reaches the
  // scored lead-packet preview). Test calls persist no lead/call row by design,
  // so this is the only signal that the "Make your first test call" step is done
  // — without it that step could only ever check off on a real inbound call.
  testCallCompletedAt: timestamp("test_call_completed_at"),

  notificationPreferences: jsonb("notification_preferences")
    .$type<BusinessNotificationPreferences>()
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

  // ─── Lifecycle email idempotency (Phase 3) ─────────────────────────────────
  // Each column records the furthest stage of a given email series already sent
  // to this business, so the daily/monthly crons never double-send. They are the
  // single, lowest-risk idempotency mechanism for the whole lifecycle system:
  // a per-row guard read+written in the same updateBusiness call, no extra table.
  //
  // trialReminderStage:   'trial_day10' | 'trial_day13' | 'trial_expiry' (rank-ordered)
  // activationNudgeStage:  'activation_day1' | 'activation_day3' | 'activation_day7'
  // winbackSentAt:         set once when the post-cancel win-back email is sent
  // monthlyRecapSentFor:   'YYYY-MM' of the last monthly ROI recap emailed
  trialReminderStage: text("trial_reminder_stage"),
  activationNudgeStage: text("activation_nudge_stage"),
  winbackSentAt: timestamp("winback_sent_at"),
  monthlyRecapSentFor: text("monthly_recap_sent_for"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Business = typeof businesses.$inferSelect;
export type NewBusiness = typeof businesses.$inferInsert;
