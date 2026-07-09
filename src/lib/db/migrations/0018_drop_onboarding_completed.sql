-- Onboarding no longer creates a business row until every step (business
-- info, vertical, number, trial) is submitted in one atomic call, so a
-- business existing is now itself sufficient proof onboarding is done —
-- the separate boolean this column tracked is redundant.
ALTER TABLE "businesses" DROP COLUMN IF EXISTS "onboarding_completed";
