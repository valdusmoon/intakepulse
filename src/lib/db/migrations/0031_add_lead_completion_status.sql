-- Coarse "how far did the intake get" signal for voice leads, so the owner can
-- triage at a glance without reading the transcript: complete | partial |
-- message_only | abandoned. Nullable (only set on the voice path).
ALTER TABLE "leads" ADD COLUMN "lead_completion_status" text;
