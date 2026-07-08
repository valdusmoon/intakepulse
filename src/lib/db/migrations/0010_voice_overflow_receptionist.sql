-- Voice-first overflow receptionist (Twilio + OpenAI Realtime).
-- Purely additive: Telnyx/SMS columns are left in place and dormant.
--
-- NOTE: hand-written and applied directly (not via `drizzle-kit generate`). The local
-- migrations journal/snapshot history is stale as of 0006 (migrations 0007-0009 were
-- also applied without journal entries, likely via `drizzle-kit push`), which makes
-- `drizzle-kit generate` misidentify unrelated schema drift (an orphaned `companies`
-- table from the pre-rebrand schema, still physically present in the DB but no longer
-- exported from src/lib/db/schema/index.ts) as a rename candidate for new tables.
-- Fixing that drift is out of scope here; this migration only adds the columns/tables
-- below.

ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "twilio_phone_number" text;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "overflow_mode" text NOT NULL DEFAULT 'ring_then_ai';
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "recording_enabled" boolean NOT NULL DEFAULT false;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "recording_disclosure" text;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "urgent_transfer_number" text;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "greeting_message" text;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "ai_instructions" text;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "is_paused" boolean NOT NULL DEFAULT false;
--> statement-breakpoint

ALTER TABLE "calls" ADD COLUMN IF NOT EXISTS "twilio_call_sid" text;
ALTER TABLE "calls" ADD COLUMN IF NOT EXISTS "outcome" text NOT NULL DEFAULT 'in_progress';
ALTER TABLE "calls" ADD COLUMN IF NOT EXISTS "ai_handled" boolean NOT NULL DEFAULT false;
ALTER TABLE "calls" ADD COLUMN IF NOT EXISTS "business_answered_at" timestamp;
ALTER TABLE "calls" ADD COLUMN IF NOT EXISTS "overflow_started_at" timestamp;
ALTER TABLE "calls" ADD COLUMN IF NOT EXISTS "recording_url" text;
ALTER TABLE "calls" ADD COLUMN IF NOT EXISTS "summary" text;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "calls" ADD CONSTRAINT "calls_twilio_call_sid_unique" UNIQUE ("twilio_call_sid");
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "pricing_rules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "business_id" uuid NOT NULL,
  "vertical" text NOT NULL,
  "service_category" text NOT NULL,
  "pricing_type" text NOT NULL,
  "minimum_amount" integer,
  "maximum_amount" integer,
  "fixed_amount" integer,
  "starting_amount" integer,
  "approved_customer_message" text NOT NULL,
  "disclaimer" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_business_id_businesses_id_fk"
    FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id");
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "provider_webhook_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "provider" text NOT NULL,
  "provider_event_id" text NOT NULL,
  "event_type" text NOT NULL,
  "payload" jsonb,
  "processed_at" timestamp DEFAULT now() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "provider_webhook_events_provider_event_unique"
  ON "provider_webhook_events" ("provider", "provider_event_id");
