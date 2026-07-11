-- Rename the activation flag to match the real go-live action. There is no
-- owner-line->Callverted carrier forwarding: the Callverted number IS the owner's
-- published public number (Twilio rings their real line first, AI catches
-- no-answers). "Went live" = they published the number, so the column is renamed
-- forwarding_confirmed -> number_published.
ALTER TABLE "businesses" RENAME COLUMN "forwarding_confirmed" TO "number_published";
