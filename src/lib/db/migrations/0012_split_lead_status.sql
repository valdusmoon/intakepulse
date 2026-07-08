-- Split leads.status into two independent axes: intakeStatus (did the vertical
-- Q&A finish?) and leadStatus (where is the business in working the lead?).
-- The single combined field conflated these — e.g. a voice call that gave up
-- after 1 of 6 questions still got marked "intake_completed", and manual leads
-- (no Q&A at all) got a status implying an intake process that never ran.

ALTER TABLE "leads" ADD COLUMN "intake_status" text NOT NULL DEFAULT 'not_started';
ALTER TABLE "leads" ADD COLUMN "lead_status" text NOT NULL DEFAULT 'new';
--> statement-breakpoint

UPDATE "leads" SET "intake_status" = 'completed'
  WHERE "status" IN ('intake_completed', 'qualified', 'converted', 'lost');
UPDATE "leads" SET "intake_status" = 'started' WHERE "status" = 'intake_started';
-- 'new' already defaults to 'not_started' — no-op

UPDATE "leads" SET "lead_status" = 'qualified' WHERE "status" = 'qualified';
UPDATE "leads" SET "lead_status" = 'converted' WHERE "status" = 'converted';
UPDATE "leads" SET "lead_status" = 'lost' WHERE "status" = 'lost';
-- 'new', 'intake_started', 'intake_completed' all map to lead_status = 'new' — already the default
--> statement-breakpoint

ALTER TABLE "leads" DROP COLUMN "status";
