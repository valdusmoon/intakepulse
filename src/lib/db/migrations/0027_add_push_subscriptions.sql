-- Web Push subscriptions for operator lead alerts (PWA push-primary, SMS-fallback).
-- One row per browser/device endpoint; a business can have several. Additive and
-- low-risk — no existing table is touched.
--
-- RLS is enabled with no policies to match the deny-all posture set in migration
-- 0026: the app connects as the table-owning `postgres` role (exempt from RLS
-- without FORCE), so Drizzle keeps working; the anon/authenticated PostgREST roles
-- are denied. This table stores push endpoints (not customer PII), but we keep the
-- posture uniform across every public table.

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   uuid NOT NULL REFERENCES public.businesses(id),
  clerk_user_id text,
  endpoint      text NOT NULL UNIQUE,
  p256dh        text NOT NULL,
  auth          text NOT NULL,
  user_agent    text,
  created_at    timestamp NOT NULL DEFAULT now(),
  updated_at    timestamp NOT NULL DEFAULT now()
);

-- Fan-out query is "all subscriptions for this business" on lead-ready.
CREATE INDEX IF NOT EXISTS push_subscriptions_business_id_idx
  ON public.push_subscriptions (business_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
