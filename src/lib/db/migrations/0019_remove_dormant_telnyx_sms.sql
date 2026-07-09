-- Removes the dormant Telnyx/SMS scaffolding — retained for a "deferred SMS/A2P
-- module" that was never built (zero webhook routes, zero callers of the
-- sms_events query functions). The product pivoted to voice-first with no
-- customer-facing SMS in V1; this columns/table never held real data.
ALTER TABLE "businesses" DROP COLUMN IF EXISTS "telnyx_phone_number";
ALTER TABLE "businesses" DROP COLUMN IF EXISTS "missed_call_sms_template";
ALTER TABLE "calls" DROP COLUMN IF EXISTS "telnyx_call_control_id";
ALTER TABLE "calls" DROP COLUMN IF EXISTS "telnyx_call_leg_id";
DROP TABLE IF EXISTS "sms_events";
