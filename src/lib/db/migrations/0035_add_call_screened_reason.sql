-- Why a call was screened (calls.outcome = 'screened'): 'wrong_number' | 'solicitation'.
-- The AI ends confident-junk calls with no lead row; this records why on the call
-- itself so screening is auditable (visible on the Calls page), not a black box.
ALTER TABLE "calls" ADD COLUMN "screened_reason" text;
