-- Store Twilio's SID (PN…) for a business's provisioned number, so provisioning
-- is idempotent (never double-buy) and the number can be released on cancel.
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "twilio_phone_number_sid" text;
