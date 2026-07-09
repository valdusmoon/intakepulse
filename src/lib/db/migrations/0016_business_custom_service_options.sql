-- Per-business custom service categories (Settings > Services & pricing >
-- Add service, when the business types something not in the vertical's
-- preset menu). See src/lib/verticals/customOptions.ts for how these merge
-- into the vertical's primary question options everywhere they're read.
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "custom_service_options" jsonb NOT NULL DEFAULT '[]'::jsonb;
