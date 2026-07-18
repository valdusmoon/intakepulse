-- The website_url column was collected in settings but read nowhere in the app
-- (dead/vestigial). Dropping it removes the misleading unused field.
ALTER TABLE "businesses" DROP COLUMN IF EXISTS "website_url";
