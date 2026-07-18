-- The voice AI now asks the service question open-ended and the web form has an
-- "Other" option, so a caller can request a service that isn't on the business's
-- configured list. Store their own words here (on every lead); when it maps to a
-- configured service the structured value in intake_answers still drives the quote.
ALTER TABLE "leads" ADD COLUMN "service_requested" text;
