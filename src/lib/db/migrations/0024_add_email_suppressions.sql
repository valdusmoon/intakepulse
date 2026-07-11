-- CAN-SPAM suppression list for commercial email. Keyed by lowercased email so
-- opt-out works for both pre-account prospects (email_captures) and signed-up
-- owners (businesses.owner_email). Marketing sends must exclude these addresses;
-- transactional email ignores this table.
CREATE TABLE IF NOT EXISTS "email_suppressions" (
  "email" text PRIMARY KEY,
  "source" text NOT NULL DEFAULT 'unsubscribe_link',
  "unsubscribed_at" timestamp NOT NULL DEFAULT now()
);
