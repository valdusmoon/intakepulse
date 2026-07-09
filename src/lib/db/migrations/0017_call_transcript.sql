-- Full turn-by-turn call transcript — was collected in memory during every
-- call (session.conversationContext.transcript) and discarded after being
-- used to generate the summary. Persisting it gives a real record of what
-- was actually said (pricing disputes, QA, debugging), not just a paraphrase.
ALTER TABLE "calls" ADD COLUMN IF NOT EXISTS "transcript" jsonb;
