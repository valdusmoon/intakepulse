ALTER TABLE "contracts" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "deleted_at" timestamp;