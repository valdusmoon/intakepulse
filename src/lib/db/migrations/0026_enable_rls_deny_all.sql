-- Enable Row Level Security (deny-by-default, no policies) on every public table.
--
-- WHY: Supabase exposes an auto-generated PostgREST API at
--   https://<project>.supabase.co/rest/v1/<table>
-- reachable with the *public* anon key (NEXT_PUBLIC_SUPABASE_ANON_KEY, shipped to
-- the browser). With RLS disabled, the anon/authenticated roles could read every
-- businesses/leads/calls row (customer PII) and INSERT rows — bypassing Clerk and
-- all app-level auth. (Verified 2026-07-12: anon key returned real rows + a 201 on
-- insert before this migration; [] and 401 after.)
--
-- WHY THIS IS SAFE FOR THE APP: the app never uses the anon/PostgREST path for
-- table data — it connects via a direct Postgres connection (postgres.js over
-- DATABASE_URL) as the `postgres` role, which OWNS these tables. Table owners are
-- exempt from RLS unless FORCE ROW LEVEL SECURITY is set (it is not), so every
-- Drizzle query keeps working unchanged. Enabling RLS with no policies simply
-- denies the anon/authenticated roles that arrive through the REST API.
--
-- Applied to prod 2026-07-12 via Supabase MCP (migration
-- enable_rls_deny_all_public_tables); this file mirrors it for local + the record.

ALTER TABLE public.ai_assessments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_captures          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_suppressions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followups               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vertical_configs        ENABLE ROW LEVEL SECURITY;
