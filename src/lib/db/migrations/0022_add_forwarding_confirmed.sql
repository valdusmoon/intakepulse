-- Activation: owner-confirmed call forwarding is set up (real/GBP number ->
-- Callverted number). The true "went live" signal; can't be auto-detected, so
-- the owner self-confirms it. Drives the activation checklist "Get your line live".
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "forwarding_confirmed" boolean NOT NULL DEFAULT false;
