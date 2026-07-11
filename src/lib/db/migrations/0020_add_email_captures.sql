-- Top-of-funnel email capture: anonymous visitors who hand over an email in
-- exchange for value (ROI calculator breakdown, lead-magnet). Not a lead and
-- not tied to a business — pre-account interest that feeds a drip sequence.
CREATE TABLE "email_captures" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" text NOT NULL,
  "source" text NOT NULL,
  "context" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);
