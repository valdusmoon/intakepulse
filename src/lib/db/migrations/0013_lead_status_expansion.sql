-- Expands leadStatus to a real sales pipeline (contacted/booked/estimate_sent
-- added — 'lead_status' is plain text, not a Postgres enum, so no ALTER TYPE
-- is needed for that; this migration only adds the two new physical columns
-- the mockup's "Update outcome" panel and Reports/Home metrics need.

ALTER TABLE "leads" ADD COLUMN "confirmed_value" integer;
ALTER TABLE "leads" ADD COLUMN "contacted_at" timestamp;
