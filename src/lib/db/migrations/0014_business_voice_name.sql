-- Per-business OpenAI Realtime voice selection (Settings > Call setup > Caller
-- experience). Real voice ids only (alloy/ash/coral/marin) — never the mockup's
-- fictional "Harbor/Juniper/Slate" names, which aren't valid Realtime API voices.
ALTER TABLE "businesses" ADD COLUMN "voice_name" text NOT NULL DEFAULT 'alloy';
