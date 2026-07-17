-- Activation signal: set the first time an owner completes a test call (reaches
-- the scored lead-packet preview). Test calls persist no lead/call row, so this
-- is the only way the "Make your first test call" activation step can check off
-- without a real inbound call landing.
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "test_call_completed_at" timestamp;
