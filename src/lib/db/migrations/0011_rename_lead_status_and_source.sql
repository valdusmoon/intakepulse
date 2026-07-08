-- Rename the stale 'sms_sent' initial status to 'new', and update source
-- values to match the current channels ('missed_call' -> 'voice_overflow',
-- 'embed' -> 'website_widget'). Purely a naming cleanup — no behavior change.

UPDATE "leads" SET "status" = 'new' WHERE "status" = 'sms_sent';
UPDATE "leads" SET "source" = 'voice_overflow' WHERE "source" = 'missed_call';
UPDATE "leads" SET "source" = 'website_widget' WHERE "source" = 'embed';
--> statement-breakpoint

ALTER TABLE "leads" ALTER COLUMN "status" SET DEFAULT 'new';
ALTER TABLE "leads" ALTER COLUMN "source" SET DEFAULT 'direct_intake';
