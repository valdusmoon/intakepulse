-- Per-business voice selection was removed from the UI; the app now uses a fixed
-- product voice (OPENAI_CONFIG.VOICE = 'marin'). Align the column default so newly
-- created businesses store the real voice instead of the stale 'alloy'.
ALTER TABLE "businesses" ALTER COLUMN "voice_name" SET DEFAULT 'marin';
