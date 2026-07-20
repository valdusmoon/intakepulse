-- Non-job calls become "message" records instead of scored job leads. leadType is
-- a third orthogonal axis alongside leadStatus (sales pipeline) and intakeStatus
-- (intake completion): it answers "what kind of contact is this?". A 'job' is
-- scored (Hot/Warm/Cool); a 'message' (existing customer, billing, callback,
-- serve-area question, ambiguous non-job) is captured + routed but never scored.
-- Confident junk (deterministic wrong-number / solicitation) creates no lead row
-- at all — that's recorded on the call (calls.outcome = 'screened'), not here.
ALTER TABLE "leads" ADD COLUMN "lead_type" text NOT NULL DEFAULT 'job'; -- 'job' | 'message'
-- Sub-label for a message row: 'existing_customer' | 'billing' | 'callback' | 'question' | 'general'. Null for jobs.
ALTER TABLE "leads" ADD COLUMN "message_kind" text;
