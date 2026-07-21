-- Warm transfer has been removed from the AI: it no longer bridges a live call to
-- a human. In ai_immediate the owner opted into "capture and call back", and in
-- ring_then_ai the line already rang out, so there's no human to hand back to.
-- A caller who asks for a person now gets a captured callback message + alert.
-- This column configured the (now-removed) urgent-transfer target, so drop it.
ALTER TABLE "businesses" DROP COLUMN IF EXISTS "urgent_transfer_number";
