CREATE TABLE "staff" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL REFERENCES "companies"("id"),
  "name" text NOT NULL,
  "email" text,
  "phone" text,
  "address" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "deleted_at" timestamp
);

ALTER TABLE "leads" ADD COLUMN "scheduled_at" timestamp;
ALTER TABLE "leads" ADD COLUMN "staff_id" uuid REFERENCES "staff"("id");
