# IntakePulse — Development Plan

**Product:** IntakePulse — Missed-call recovery and AI-powered intake infrastructure for high-ticket service businesses.
**Last Updated:** 2026-05-29
**Status:** Session 2 complete ✓ — Session 3 (Telnyx Integration) next

### V1 Scope Decisions
- **Verticals:** Restoration only in V1. Architecture uses JSON vertical config so any new vertical is a seed script, not a code change.
- **Follow-ups:** 1 follow-up text only in V1 (structured for multiple later). Multiple texts require opt-in consent flow — defer to V2.
- **Intake form:** Submit on completion only — no auto-save per step. Simple is better for V1.
- **Lead sources:** `missed_call` (Telnyx webhook → SMS → form), `embed` (HTML widget on business site), `email` (link in email signature / Google Business), `manual` (owner adds in dashboard).
**Stack:** Next.js 15, Tailwind/Shadcn, Drizzle ORM, Supabase PostgreSQL, Clerk Auth, Stripe, OpenAI (GPT-4o), Inngest, Resend, Telnyx

---

## What We're Starting With

CraftCapture V1 (painting contractor lead capture app) copied into this repo. All CraftCapture infrastructure is live and working — Clerk, Supabase/Drizzle, Stripe webhooks, Inngest, Resend, OpenAI. The domain layer (painting-specific) gets deleted and replaced with IntakePulse logic. ~60% of the code transfers directly.

**Key reuse wins:**
- `subscription.ts` — transfers unchanged (just update `companies` import path to `businesses`)
- Stripe webhook handler — transfers unchanged
- Resend email client — transfers unchanged
- OpenAI client — transfers unchanged
- Auth middleware pattern — add `/api/telnyx(.*)` to public routes, keep everything else
- Lead query layer (pagination, search, filters) — rename columns, keep logic
- Onboarding multi-step form — swap content, keep structure

---

# SESSION 0: HOUSEKEEPING (Run First, Before Any Schema Work)

> Quick fixes to remove CraftCapture identity from the repo. Takes ~15 minutes. Do this before writing a single line of IntakePulse code.

## 0.1 Rename Package and Service Identity
- [x] `package.json` — rename `"your-app-name"` → `"intakepulse"`
- [x] `src/lib/inngest/client.ts` — rename id `"craftcapture"` → `"intakepulse"`, name → `"IntakePulse"`
- [x] `src/middleware.ts` — add `/api/telnyx(.*)` to `isPublicRoute` matcher (Telnyx webhooks must not hit Clerk auth)
- [x] `src/lib/sms.ts` — update comment from "CraftCapture notifications number" to reflect IntakePulse

## 0.2 Delete CraftCapture-Specific Files
> Delete all painting/quoting/contracting/scheduling domain code. Do not touch infrastructure files.

**API routes to delete:**
- [x] `src/app/api/quotes/` (entire directory)
- [x] `src/app/api/contracts/` (entire directory)
- [x] `src/app/api/schedule/` (entire directory)
- [x] `src/app/api/staff/` (entire directory)
- [x] `src/app/api/visualize/route.ts`
- [x] `src/app/api/qr/route.ts`

**Dashboard pages to delete:**
- [x] `src/app/(authenticated)/dashboard/schedule/` (entire directory)
- [x] `src/app/(authenticated)/dashboard/leads/[id]/quote/page.tsx`
- [x] `src/app/(authenticated)/dashboard/leads/[id]/contract/page.tsx`
- [x] `src/app/(authenticated)/dashboard/leads/[id]/job-photos.tsx`
- [x] `src/app/(authenticated)/dashboard/leads/leads-kanban.tsx`

**Public pages to delete:**
- [x] `src/app/q/` (quote respond flow)
- [x] `src/app/contract/` (contract signing flow)
- [x] `src/app/review/` (review request redirect)
- [x] `src/app/features/page.tsx`
- [x] `src/app/_backups/` (entire directory)
- [x] `src/app/quote/` (CraftCapture lead form — will be replaced by `src/app/intake/`)

**Schema files to delete:**
- [x] `src/lib/db/schema/quotes.ts`
- [x] `src/lib/db/schema/contracts.ts`
- [x] `src/lib/db/schema/lead-photos.ts`
- [x] `src/lib/db/schema/staff.ts`

**Query files to delete:**
- [x] `src/lib/db/queries/quotes.ts`
- [x] `src/lib/db/queries/contracts.ts`
- [x] `src/lib/db/queries/lead-photos.ts`
- [x] `src/lib/db/queries/staff.ts`

**Lib files to delete:**
- [x] `src/lib/inngest/functions/quote-nudge.ts`
- [x] `src/lib/inngest/functions/quote-expiration.ts`
- [x] `src/lib/inngest/functions/contract-nudge.ts`
- [x] `src/lib/leads/estimate.ts`
- [x] `src/lib/quotes/` (entire directory)
- [x] `src/lib/storage.ts` (Supabase photo storage — not needed for V1)

**Component files to delete:**
- [x] `src/components/quotes/` (entire directory)
- [x] `src/components/marketing/` (entire directory — will rewrite for IntakePulse)

## 0.3 Remove Unused Packages
- [x] `npm uninstall twilio @react-pdf/renderer qrcode pdf-lib`
- [x] Remove `@types/qrcode` from devDependencies in `package.json`
- [x] Confirm `npm run build` (or `typecheck`) still passes after deletions

---

# SESSION 1: DATABASE SCHEMA

> Write the 8 new Drizzle schema files. No UI. No API routes. Just schema, migrate, and confirm zero TypeScript errors.

## 1.1 New Schema Files

**`src/lib/db/schema/businesses.ts`** (replaces `companies.ts`)
- [ ] `id` uuid pk
- [ ] `clerkUserId` text unique
- [ ] `businessName`, `ownerName`, `ownerEmail`, `ownerPhone` text
- [ ] `vertical` text default `'restoration'` — V1 hardcoded to restoration; field exists for future vertical expansion
- [ ] `telnyxPhoneNumber` text nullable — provisioned Telnyx number
- [ ] `forwardingNumber` text nullable — where calls forward to
- [ ] `callTimeoutSeconds` integer default 20 — seconds before missed-call triggers
- [ ] `serviceArea`, `timezone`, `websiteUrl` text
- [ ] `onboardingCompleted` boolean default false
- [ ] Stripe fields: `stripeCustomerId`, `stripeSubscriptionId`, `stripePriceId`, `subscriptionStatus`, `trialEndsAt`, `currentPeriodStart`, `currentPeriodEnd`, `canceledAt`
- [ ] `createdAt`, `updatedAt` timestamps

**`src/lib/db/schema/leads.ts`** (replace current leads.ts)
- [ ] `id` uuid pk
- [ ] `businessId` uuid fk → businesses
- [ ] `callerName` text nullable — filled once intake completed
- [ ] `callerPhone` text notNull — from Telnyx call event
- [ ] `callerEmail` text nullable
- [ ] `source` text — `'missed_call' | 'embed' | 'email' | 'manual'`
- [ ] `callStatus` text — `'initiated' | 'ringing' | 'answered' | 'missed'`
- [ ] `status` text — `'sms_sent' | 'intake_started' | 'intake_completed' | 'qualified' | 'converted' | 'lost'`
- [ ] `urgencyScore` integer nullable — 1-10, denormalized from ai_assessments for list view performance
- [ ] `qualityScore` integer nullable — 1-100, denormalized from ai_assessments for list view performance
- [ ] `estimatedValueLow` integer nullable — cents, denormalized for list display
- [ ] `estimatedValueHigh` integer nullable — cents, denormalized for list display
- [ ] `intakeAnswers` jsonb nullable — full answer object `{ damage_type: "water", water_category: "cat_2", flooring: "hardwood", ... }`, keyed to vertical config question keys
- [ ] `smsConsent` boolean default false notNull — TCPA compliance, must be true before any follow-up SMS fires
- [ ] `notes` text nullable
- [ ] `followupPausedAt` timestamp nullable
- [ ] `convertedAt` timestamp nullable
- [ ] `createdAt`, `updatedAt`, `deletedAt` timestamps

**`src/lib/db/schema/calls.ts`**
- [ ] `id` uuid pk
- [ ] `businessId` uuid fk → businesses
- [ ] `leadId` uuid nullable fk → leads (linked once missed-call fires)
- [ ] `telnyxCallControlId` text unique — used for performing actions on an active call
- [ ] `telnyxCallLegId` text unique nullable — present in `call.hangup` payload; needed to match hangup events to call records (different from callControlId)
- [ ] `callerPhone` text
- [ ] `calledNumber` text — the Telnyx number that was called
- [ ] `status` text — `'initiated' | 'ringing' | 'answered' | 'missed' | 'voicemail'`
- [ ] `answeredAt`, `endedAt`, `missedAt` timestamps nullable
- [ ] `durationSeconds` integer nullable
- [ ] `rawPayload` jsonb — store full Telnyx webhook payload
- [ ] `createdAt` timestamp

**`src/lib/db/schema/smsEvents.ts`**
- [ ] `id` uuid pk
- [ ] `businessId` uuid fk → businesses
- [ ] `leadId` uuid nullable fk → leads
- [ ] `direction` text — `'outbound' | 'inbound'`
- [ ] `toPhone`, `fromPhone` text
- [ ] `body` text
- [ ] `telnyxMessageId` text unique nullable
- [ ] `status` text — `'queued' | 'sent' | 'delivered' | 'failed'`
- [ ] `rawPayload` jsonb nullable
- [ ] `createdAt` timestamp

**`intake_answers` table — eliminated.** Collapsed into `intakeAnswers jsonb` column on `leads`. 8 rows per lead with a join every render is over-normalized for V1. JSONB is queryable in Postgres if analytics are needed later.

**`src/lib/db/schema/verticalConfigs.ts`**
- [ ] `id` uuid pk
- [ ] `vertical` text unique — `'restoration' | 'pi_law' | 'hvac'`
- [ ] `displayName` text
- [ ] `questions` jsonb — array of `{ key, label, type, options?, required, conditional? }`
- [ ] `scoringRules` jsonb — array of rule objects: `{ answerKey, answerValue, urgencyBonus?, qualityBonus?, valueBonus? }`. The generic scoring engine reads these and applies them — no vertical-specific code. Adding a new vertical = writing new rules as JSON, zero code changes.
- [ ] `aiPromptTemplate` text — system prompt for GPT reasoning pass. Receives already-computed scores + answers. Returns reasoning text only, never scores. Vertical-specific context (e.g. "delamination risk", "statute of limitations") lives here as data, not code.
- [ ] `createdAt`, `updatedAt` timestamps

**`src/lib/db/schema/followups.ts`**
- [ ] `id` uuid pk
- [ ] `leadId` uuid fk → leads
- [ ] `businessId` uuid fk → businesses
- [ ] `sequence` integer — position in sequence (1, 2, 3…); V1 only uses sequence=1
- [ ] `scheduledAt` timestamp — when Inngest should fire
- [ ] `sentAt` timestamp nullable
- [ ] `canceledAt` timestamp nullable
- [ ] `cancelReason` text nullable — `'replied' | 'intake_completed' | 'manual_stop'`
- [ ] `createdAt` timestamp

**`src/lib/db/schema/aiAssessments.ts`**
> Kept separate from leads for query performance. Scores are denormalized onto leads for the list view. This table holds the heavy reasoning text and raw GPT-4o blob which are only loaded when viewing a single lead detail.
- [ ] `id` uuid pk
- [ ] `leadId` uuid fk → leads unique — one assessment per lead
- [ ] `urgencyReasoning` text — plain-English explanation (e.g. "Cat 2 water with hardwood floors — delamination risk within 48 hours")
- [ ] `qualityReasoning` text
- [ ] `recommendedActions` jsonb — array of action strings
- [ ] `rawResponse` jsonb — full GPT-4o API response (heavy blob, never loaded in list queries)
- [ ] `model` text — model version used, for auditing
- [ ] `createdAt` timestamp

## 1.2 Schema Index & Migration
- [ ] Rewrite `src/lib/db/schema/index.ts` — export all 7 new tables, remove old exports
- [ ] Rewrite `src/lib/db/queries/index.ts` to match
- [ ] Create stub query files: `businesses.ts`, `leads.ts`, `calls.ts`, `smsEvents.ts`, `followups.ts`, `aiAssessments.ts`
- [ ] Run `npm run db:generate` — generate migration
- [ ] Run `npm run db:push` — apply to local dev database
- [ ] Run `npm run typecheck` — confirm zero TypeScript errors before moving on

## 1.3 Seed Vertical Configs
- [ ] Create `scripts/seed-verticals.ts`
- [ ] Seed restoration vertical: questions (damage type, affected rooms, flooring, insurance, time since damage, severity), scoring rules (Cat 2/3 water, hardwood, active leak, insurance confirmed), AI prompt template
- [ ] Run seed script: `npx tsx scripts/seed-verticals.ts`

---

# SESSION 2: AUTH, BILLING, ONBOARDING

> Port Clerk and Stripe. Minimal changes — rename `companies` → `businesses`, update painting-specific fields, update price IDs.

## 2.1 Update Clerk Webhook
- [x] `src/app/api/webhooks/clerk/route.ts` — create new webhook, insert into `businesses` on user.created
- [x] Remove `paintTier`, `defaultSqftRate` from initial insert
- [x] Add `vertical: null`, `forwardingNumber: null` placeholders

## 2.2 Update Stripe Webhook
- [x] `src/app/api/stripe/webhook/route.ts` — update all `companies` table references → `businesses`
- [x] Update price ID logic for 3-tier pricing ($299/$499/$799)
- [x] Update `subscription.ts` — change import from `companies` → `businesses`

## 2.3 Update Subscription Banner
- [x] `src/components/dashboard/subscription-banner.tsx` — update copy from CraftCapture → IntakePulse
- [x] Update trial messaging ("recover leads" vs. "capture leads")

## 2.4 Rewrite Onboarding
- [x] Rewrite `src/app/(authenticated)/onboarding/page.tsx`
- [x] Step 1 — Business info: name, owner, phone, service area
- [x] Step 2 — Vertical selection: Restoration only in V1 (pre-selected, non-editable), with placeholder cards for PI Law / HVAC showing "Coming soon"
- [x] Step 3 — Phone config: forwarding number, call timeout (slider 10–45s)
- [x] Step 4 — Setup complete: instructions to contact IntakePulse to get a number assigned, link to dashboard
- [x] Update `POST /api/company/route.ts` → `POST /api/business/route.ts` (or update existing route)
- [x] Remove QR code step entirely

## 2.5 Update Company/Business API
- [x] Rename `src/app/api/company/route.ts` → `src/app/api/business/route.ts`
- [x] Update all field names to match new businesses schema
- [x] Update `src/lib/db/queries/businesses.ts` with `getBusinessByClerkId`, `updateBusiness`

## 2.6 Update Dashboard Layout
- [x] `src/app/(authenticated)/dashboard/layout.tsx` — update nav links (remove Schedule, remove Quotes)
- [x] Nav: Dashboard, Leads, Settings, Billing
- [x] Update `src/components/dashboard/NavLinks.tsx`

## 2.7 Update Settings Page
- [x] `src/app/(authenticated)/dashboard/settings/page.tsx` — remove QR code, remove lead form link
- [x] Add: Telnyx phone number display (editable text field — owner pastes in number provisioned manually via Telnyx console)
- [x] Add: forwarding number edit, call timeout slider
- [x] Add: SMS template editor (missed-call message body)
- [x] Add: vertical display (read-only for now)

## 2.8 Telnyx Number Provisioning (V1 Manual Ops Process)
> V1 does NOT programmatically provision numbers. Full Telnyx Numbers API provisioning is a V2 feature.
- [x] Document ops runbook: log into Telnyx console → buy number → assign to TeXML app → paste number into business settings
- [x] Settings page has a "Your IntakePulse Number" field where the owner enters the provisioned number
- [x] This populates `businesses.telnyxPhoneNumber` — used by call/SMS webhooks to look up the business
- [x] Programmatic provisioning via Telnyx Numbers API deferred to V2

---

# SESSION 3: TELNYX INTEGRATION

> Build the telecom layer. Use Telnyx test mode throughout. Get missed-call → SMS → intake link chain working end-to-end before touching the intake form UI.

## 3.1 Telnyx Client
- [ ] Install: `npm install @telnyx/node-client` (or use raw fetch — evaluate)
- [ ] `src/lib/telnyx/client.ts` — Telnyx API client singleton
- [ ] `src/lib/telnyx/webhooks.ts` — HMAC-SHA256 signature verification (NOT svix — different pattern)
- [ ] Add env vars to `src/lib/env.ts`: `TELNYX_API_KEY`, `TELNYX_APP_ID`, `TELNYX_WEBHOOK_SECRET`
- [ ] Add to `.env.example`

## 3.2 Rewrite SMS Layer
- [ ] Rewrite `src/lib/sms.ts` — swap Twilio for Telnyx, keep `sendSms(to, body)` interface
- [ ] Update env var checks: `TELNYX_API_KEY`, `TELNYX_PHONE_NUMBER` (or per-business)
- [ ] Keep `SMS_FEATURE_ENABLED` kill switch
- [ ] New message templates: `smsMissedCallRecovery(businessName, intakeUrl)`, `smsFollowup(businessName, intakeUrl)`, `smsReply(body)` (inbound)

## 3.3 Call Webhook Handler
- [ ] Create `src/app/api/telnyx/call/route.ts`
- [ ] Verify Telnyx signature on every request
- [ ] Handle `call.initiated` — create call record
- [ ] Handle `call.answered` — update call status, stop missed-call timer
- [ ] Handle `call.hangup` — if never answered: mark missed, fire Inngest `call.missed` event
- [ ] Look up business by `to` phone number (Telnyx number)
- [ ] Create lead record on missed call with `callerPhone` from event

## 3.4 SMS Webhook Handler
- [ ] Create `src/app/api/telnyx/sms/route.ts`
- [ ] Verify Telnyx signature
- [ ] Handle inbound SMS — look up lead by `from` phone, store in `sms_events`
- [ ] If inbound reply: cancel pending followups (fire Inngest `sms.reply` event)

## 3.5 Middleware Update
- [ ] Confirm `/api/telnyx(.*)` is in public routes (done in Session 0, verify here)

---

# SESSION 4: INTAKE FORM

> Build the public mobile-first intake form at `/intake/[businessId]`. This is what gets texted to the missed caller.

## 4.1 Intake Form Page
- [x] Create `src/app/intake/[businessId]/page.tsx` — public, no auth
- [x] Fetch business info + vertical config for the businessId
- [x] If business not found or not subscribed: show "This form is no longer available"
- [x] Pass vertical questions to client component

## 4.2 Intake Form Client Component
- [x] Create `src/app/intake/[businessId]/_form.tsx` — `"use client"`
- [x] Mobile-first MCQ card flow (one question per screen)
- [x] Progress bar (question X of Y)
- [x] Question types: single-select cards, multi-select, text input, phone input
- [x] Conditional logic: show/hide questions based on prior answers (from `conditional` field in vertical config)
- [x] Step 0 — name, phone, and SMS consent checkbox: "By proceeding you agree to receive texts from [BusinessName] regarding your inquiry." (required — cannot advance without checking)
- [x] All answers held in local state until submission — no auto-save per step
- [x] Final step — confirmation screen: "We have everything we need. [BusinessName] will be in touch shortly."
- [x] On final submit: single POST to `/api/intake/[businessId]/submit` with all answers + name + phone + smsConsent=true

## 4.3 Intake API Routes
- [x] `POST /api/intake/[businessId]/submit` — create/find lead by phone, write all answers as single `intakeAnswers` jsonb object on the lead record, mark `intake_completed`, fire Inngest `intake.completed` event
- [x] Rate limit by IP — use **Upstash Redis** rate limiter (not in-memory Map — in-memory resets on each serverless invocation and doesn't work across Vercel instances)
- [x] Add `@upstash/ratelimit` and `@upstash/redis` to dependencies; add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to env
- [x] Add `/api/intake(.*)` to public routes in middleware
- [x] No partial-save endpoints needed in V1

## 4.4 Seed Restoration Vertical Questions
- [x] Define restoration question set in `scripts/seed-verticals.ts`:
  - `damage_type`: Water / Fire / Mold (single-select)
  - `water_category`: Category 1 (clean) / Category 2 (gray) / Category 3 (black) — conditional on water
  - `affected_rooms`: multiselect (living room, bedroom, bathroom, kitchen, basement, etc.)
  - `flooring_type`: Hardwood / Carpet / Tile / Concrete / Mixed
  - `has_insurance`: Yes — filing claim / Yes — paying out of pocket / No / Unsure
  - `time_since_damage`: Less than 24 hours / 1-3 days / 3-7 days / Over a week
  - `active_leak`: Is water still entering? Yes / No
  - `emergency_severity`: 1-5 scale card (1=minor, 5=structural risk)
- [x] Re-run seed: `npx tsx scripts/seed-verticals.ts`

---

# SESSION 5: SCORING AND AI ASSESSMENT

> Build the rule-based scoring engine and replace `estimate.ts` with the new AI assessment layer.

## 5.1 Lead Scoring Engine (Deterministic — No AI)
- [ ] Create `src/lib/leads/scoring.ts`
- [ ] `scoreLeadFromAnswers(answers: Record<string, string>, rules: ScoringRule[]): ScoringResult`
- [ ] Generic engine — reads rules from vertical config JSON, applies them to answers. No vertical-specific code in this file.
- [ ] Rule application: for each rule, if `answers[rule.answerKey] === rule.answerValue`, add the bonuses
- [ ] Sum urgency bonuses → normalize to 1–10. Sum quality bonuses → normalize to 1–100. Sum value bonuses → low/high range in cents.
- [ ] Restoration example rules (stored as JSON in vertical_configs, NOT hardcoded here):
  - `{ answerKey: "water_category", answerValue: "cat_2", urgencyBonus: 3 }`
  - `{ answerKey: "water_category", answerValue: "cat_3", urgencyBonus: 3 }`
  - `{ answerKey: "flooring_type", answerValue: "hardwood", urgencyBonus: 2, valueBonus: 200000 }`
  - `{ answerKey: "active_leak", answerValue: "yes", urgencyBonus: 3 }`
  - `{ answerKey: "has_insurance", answerValue: "yes_filing", qualityBonus: 20 }`
  - `{ answerKey: "time_since_damage", answerValue: "under_24h", urgencyBonus: 2 }`
  - `{ answerKey: "emergency_severity", answerValue: "4", urgencyBonus: 2 }`
  - `{ answerKey: "emergency_severity", answerValue: "5", urgencyBonus: 2 }`
- [ ] Return `{ urgencyScore: number, qualityScore: number, estimatedValueLow: number | null, estimatedValueHigh: number | null }`
- [ ] Adding PI law or HVAC later = write new rules as JSON in vertical_configs seed. Zero code changes to this file.

## 5.2 AI Reasoning Pass (GPT for Text Only — Not Scores)
- [ ] Create `src/lib/leads/assess.ts`
- [ ] `generateReasoning(answers: Record<string, string>, scores: ScoringResult, promptTemplate: string): Promise<ReasoningResult>`
- [ ] GPT receives: the already-computed scores (numbers are fixed), all intake answers, and the vertical's prompt template
- [ ] GPT's only job: write the plain-English explanation of WHY the scores are what they are
- [ ] Prompt instructs GPT: "The urgency score is [X]. Explain in 1-2 sentences why, using the following answers: [answers]. Do not change the score."
- [ ] Response shape (text only, no scores): `{ urgencyReasoning: string, qualityReasoning: string, recommendedActions: string[] }`
- [ ] Save full record to `ai_assessments`: reasoning + raw response + model
- [ ] Write scores to `leads`: `urgencyScore`, `qualityScore`, `estimatedValueLow`, `estimatedValueHigh` — these come from the formula, not from GPT

## 5.3 Wire Assessment to Intake Completion
- [ ] In Inngest `intake.completed` handler — trigger `assessLead()` as background step
- [ ] Update lead status to `qualified` after assessment completes

---

# SESSION 6: INNGEST FUNCTIONS

> Delete the 3 CraftCapture cron functions. Write the 3 IntakePulse functions.

## 6.1 Delete Old Functions
- [ ] Already deleted in Session 0: `quote-nudge.ts`, `quote-expiration.ts`, `contract-nudge.ts`
- [ ] Update `src/app/api/inngest/route.ts` — remove old function registrations

## 6.2 Missed Call Recovery Function
- [ ] Create `src/lib/inngest/functions/missed-call-recovery.ts`
- [ ] Triggered by event: `call.missed`
- [ ] Step 1: look up business + lead
- [ ] Step 2: generate intake URL (`{APP_URL}/intake/{businessId}?lead={leadId}`)
- [ ] Step 3: send SMS via `sendSms()` with missed-call recovery template
- [ ] Step 4: create `sms_events` record
- [ ] Step 5: schedule followup sequence (send `followup.schedule` event with leadId)

## 6.3 Follow-up Sequence Function
- [ ] Create `src/lib/inngest/functions/followup-sequence.ts`
- [ ] Triggered by event: `followup.schedule`
- [ ] V1: single follow-up only — `step.sleepUntil()` for +4 hour delay (restoration is emergency vertical — 1hr is too soon, 24hr is too late; 4hr catches them after initial chaos settles but before they've committed to a competitor)
- [ ] Before sending: check `followups` table — skip if `canceledAt` is set
- [ ] Before sending: verify `leads.smsConsent = true` — never send follow-up without explicit consent
- [ ] Send SMS, update `followups` record `sentAt`
- [ ] Cancel trigger: inbound `sms.reply` event or `intake.completed` event
- [ ] Structure supports multiple sequences (check `sequence` field) so V2 multi-step just adds more steps here — no schema change needed

## 6.4 AI Assessment Function
- [ ] Create `src/lib/inngest/functions/ai-assessment.ts`
- [ ] Triggered by event: `intake.completed`
- [ ] Step 1: fetch lead + `intakeAnswers` jsonb + business vertical
- [ ] Step 2: fetch `scoringRules` and `aiPromptTemplate` from `vertical_configs` for the vertical
- [ ] Step 3: run `scoreLeadFromAnswers()` — deterministic, instant, no API call. Produces the numbers.
- [ ] Step 4: run `generateReasoning()` — GPT call with scores already fixed. Produces the text.
- [ ] Step 5: save to `ai_assessments` (reasoning + raw response + model)
- [ ] Step 6: update `leads` with scores (from formula) + status `qualified`
- [ ] Step 7: send lead packet email to business owner (see template definition in 6.6)

## 6.6 Lead Packet Email Template
> The most important email in the product — arrives on the owner's phone at 2am when a restoration job just came in.
- [ ] Add `sendLeadPacketEmail(business, lead, assessment)` to `src/lib/email/notifications.ts`
- [ ] Template content (in order):
  - **Header:** "New Qualified Lead — [urgency label: Critical / High / Medium]" with urgency score badge
  - **Caller:** name (if captured) + phone number as `tel:` link — one tap to call
  - **Estimated job value:** "$X,XXX – $X,XXX" range
  - **AI Summary:** `urgencyReasoning` in plain English (e.g. "Category 2 water with hardwood floors — delamination risk within 48 hours.")
  - **Recommended actions:** bulleted list from `recommendedActions`
  - **Intake answers:** key/value list of all answers (damage type, rooms, flooring, insurance, etc.)
  - **CTA button:** "View Full Lead" → `/dashboard/leads/[id]`
  - **Secondary CTA:** "Call Now" → `tel:[callerPhone]`
- [ ] Keep email failure non-blocking (Promise.allSettled pattern from existing notifications.ts)

## 6.5 Register Functions
- [ ] Update `src/app/api/inngest/route.ts` — register all 3 new functions

---

# SESSION 7: DASHBOARD

> Replace CraftCapture dashboard with IntakePulse leads recovery dashboard.

## 7.1 Dashboard Home Page
- [ ] Rewrite `src/app/(authenticated)/dashboard/page.tsx`
- [ ] Metrics strip (4 cards):
  - Recovered leads this month
  - Avg response time (missed → SMS sent)
  - Intake completion rate
  - Estimated recovered revenue
- [ ] Recent leads table (last 10, link to detail)
- [ ] Quick actions: "Add lead manually", "View all leads"

## 7.2 Leads List Page
- [ ] Rewrite `src/app/(authenticated)/dashboard/leads/page.tsx`
- [ ] Table columns: caller, source (missed call / embed / email / manual), timestamp, urgency badge, score, estimated value, status
- [ ] Status badges: `sms_sent`, `intake_started`, `intake_completed`, `qualified`, `converted`, `lost`
- [ ] Urgency indicator (color-coded 1-10)
- [ ] Filters: missed calls, completed intake, high urgency (7+), uncontacted, converted
- [ ] Search by name/phone
- [ ] Pagination (25/page)

## 7.3 Lead Detail Page
- [ ] Rewrite `src/app/(authenticated)/dashboard/leads/[id]/page.tsx`
- [ ] Left column: caller info, call timeline, SMS history, intake answers (collapsible per section)
- [ ] Right column: AI assessment card (urgency score, quality score, estimated value, reasoning, recommended actions), status selector, notes
- [ ] Quick actions: "Call lead" (tel: link), "Send SMS", "Mark Won", "Mark Lost", "Pause automation", "Schedule callback"
- [ ] Follow-up status: show pending/sent/canceled follow-ups with timestamps

## 7.4 Update Lead API Routes
- [ ] Rename/rewrite `src/app/api/leads/route.ts` — update all column names (businessId, callerName, callerPhone, urgencyScore, etc.)
- [ ] `GET /api/leads` — add urgency/score sort options, status filter for new statuses
- [ ] `PATCH /api/leads/[id]` — update status, notes, convertedAt
- [ ] `DELETE /api/leads/[id]` — keep ownership check

## 7.5 Manual Lead Creation
- [ ] Rewrite `src/app/(authenticated)/dashboard/leads/new/page.tsx`
- [ ] Fields: caller name, phone, source (manual), notes
- [ ] Option: "Send intake link via SMS" checkbox

---

# SESSION 8: LANDING PAGE + LEGAL

> Replace CraftCapture marketing content with IntakePulse positioning.

## 8.1 Landing Page
- [ ] Rewrite `src/app/page.tsx` for restoration/high-ticket service audience
- [ ] Hero: "No inbound lead ever goes unanswered." + CTA
- [ ] How it works: 4 steps (missed call → SMS → intake → scored lead packet)
- [ ] Pricing: Starter $299, Growth $499, Pro $799 with feature comparison
- [ ] Social proof / vertical examples (restoration, PI law, HVAC)
- [ ] FAQ

## 8.2 Embeddable HTML Form Widget
> Businesses can embed the intake form on their own website as a floating button or inline form. Source tag = `embed`.

- [ ] Create `src/app/api/widget/[businessId]/route.ts` — returns a small JS snippet (served as `text/javascript`)
- [ ] Snippet injects an iframe pointing to `/intake/[businessId]?source=embed` into the page
- [ ] Widget builder in settings: copy-paste `<script>` tag
- [ ] The intake form detects `source=embed` param and passes it through to the lead record on submit
- [ ] No CORS issues — iframe loads from IntakePulse domain

## 8.3 Legal Pages
- [ ] Rewrite `src/app/legal/terms/page.tsx` — IntakePulse terms
- [ ] Rewrite `src/app/legal/privacy/page.tsx` — IntakePulse privacy
- [ ] Rewrite `src/app/legal/sms/page.tsx` — A2P SMS compliance disclosure (required for 10DLC)
- [ ] Remove `src/app/legal/refunds/page.tsx` or rewrite

## 8.4 Stripe Pricing Update
- [ ] Create 3 Stripe products: Starter ($299), Growth ($499), Pro ($799) in Stripe dashboard
- [ ] Update env: `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_GROWTH`, `STRIPE_PRICE_PRO`
- [ ] Update `src/app/api/stripe/checkout/route.ts` — accept tier param
- [ ] Update billing page to show tier name

---

# SESSION 9: DEPLOYMENT & LAUNCH PREP

## 9.1 Environment Variables
- [ ] Add all new vars to `.env.example`: `TELNYX_API_KEY`, `TELNYX_APP_ID`, `TELNYX_WEBHOOK_SECRET`, `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_GROWTH`, `STRIPE_PRICE_PRO`
- [ ] Remove old vars from `.env.example`: `TWILIO_*`, `NEXT_PUBLIC_STRIPE_PRICE_ID`

## 9.2 Deployment Checklist
- [ ] All env vars set in Vercel
- [ ] Telnyx webhook URLs configured (call + SMS)
- [ ] Stripe live mode with 3 price IDs
- [ ] Inngest production connected
- [ ] Database schema pushed to production
- [ ] Smoke test: provision test number → missed call → SMS fires → intake opens → lead appears in dashboard

---

# PARALLEL TRACK: TELNYX A2P 10DLC REGISTRATION (DO IMMEDIATELY)

> This takes 2-3 weeks and cannot be sped up. Register now so it's approved by the time the code is done.

- [ ] Create Telnyx account at telnyx.com
- [ ] Register Brand under Messaging → Regulatory
- [ ] Register Campaign (use case: mixed/lead recovery, website: app URL)
- [ ] Purchase a test number for development
- [ ] Await approval (~2-3 weeks)

---

# TECHNICAL REFERENCE

## Key File Paths

```
src/
├── app/
│   ├── page.tsx                              # Marketing landing page (rewrite)
│   ├── intake/[businessId]/page.tsx          # Public intake form (new)
│   ├── (authenticated)/
│   │   ├── onboarding/page.tsx               # Onboarding (rewrite)
│   │   └── dashboard/
│   │       ├── page.tsx                      # Dashboard home (rewrite)
│   │       ├── leads/
│   │       │   ├── page.tsx                  # Leads list (rewrite)
│   │       │   └── [id]/page.tsx             # Lead detail (rewrite)
│   │       ├── settings/page.tsx             # Settings (update)
│   │       └── billing/page.tsx              # Billing (keep, minor copy update)
│   └── api/
│       ├── telnyx/
│       │   ├── call/route.ts                 # Telnyx call webhook (new)
│       │   └── sms/route.ts                  # Telnyx SMS webhook (new)
│       ├── intake/
│       │   └── [businessId]/
│       │       └── submit/route.ts           # Single submit endpoint (new)
│       ├── leads/                            # Keep, update schema refs
│       ├── business/route.ts                 # Replace /api/company (new)
│       ├── inngest/route.ts                  # Update function registrations
│       └── stripe/                           # Keep, update table refs
├── lib/
│   ├── db/
│   │   └── schema/
│   │       ├── businesses.ts                 # New
│   │       ├── leads.ts                      # Rewrite
│   │       ├── calls.ts                      # New
│   │       ├── smsEvents.ts                  # New
│   │       ├── verticalConfigs.ts            # New
│   │       ├── followups.ts                  # New
│   │       └── aiAssessments.ts              # New
│   ├── telnyx/
│   │   ├── client.ts                         # New
│   │   └── webhooks.ts                       # New (HMAC-SHA256, not svix)
│   ├── leads/
│   │   ├── scoring.ts                        # New
│   │   └── assess.ts                         # Replaces estimate.ts
│   ├── sms.ts                                # Rewrite (Telnyx provider)
│   ├── subscription.ts                       # Keep, update companies→businesses import
│   └── inngest/functions/
│       ├── missed-call-recovery.ts           # New
│       ├── followup-sequence.ts              # New
│       └── ai-assessment.ts                  # New
```

## Environment Variables

```
# App
NEXT_PUBLIC_APP_URL=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Database
DATABASE_URL=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STARTER=
STRIPE_PRICE_GROWTH=
STRIPE_PRICE_PRO=

# OpenAI
OPENAI_API_KEY=

# Inngest
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# Resend (Email)
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# Telnyx
TELNYX_API_KEY=
TELNYX_APP_ID=
TELNYX_WEBHOOK_SECRET=

# Upstash Redis (rate limiting — works correctly across serverless instances)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Feature flags
SMS_FEATURE_ENABLED=false

# Cron
CRON_SECRET=
```

## State Machine

```
Call initiated
  → ringing
  → answered (lead not created — call handled)
  → missed
    → sms_sent (Inngest: missed-call-recovery)
      → intake_started (prospect opens form)
        → intake_completed (all questions answered)
          → qualified (Inngest: ai-assessment done)
            → converted (business marks won)
            → lost
```
