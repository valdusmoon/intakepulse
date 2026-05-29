# CraftCapture - Development Plan & Roadmap

**Product Name:** CraftCapture
**Last Updated:** April 2, 2026
**Status:** Phase 0 — AI Spike (Pre-Development)
**Tech Stack:** Next.js 15, Tailwind/Shadcn, Drizzle ORM, Supabase PostgreSQL, Clerk Auth, Stripe, OpenAI (GPT-4o+), Inngest, Vercel, GitHub
**Pricing:** $79/month single tier (expand tiers later as product grows)

---

## Executive Summary

A **painting contractor lead capture and quoting platform** targeting 87,000–178,000 painting businesses in the US. Core differentiators: homeowner-facing lead capture widget, AI-powered photo-to-estimate, AI color visualization, and automated follow-up — all at a price point under $100/month.

**V1 MVP Goal:** Lean lead capture + AI estimate testing + basic painter dashboard. Validate the AI angle first before building the full platform.

**V2+ Vision:** Full lead-to-payment workflow, missed-call text-back (Twilio), scheduling, invoicing, job pipeline, crew management, multi-trade expansion (flooring, exterior remodeling).

---

## Existing Boilerplate (Already in Repo)

The starter template provides:
- Clerk authentication (sign-up, sign-in, webhook sync)
- Supabase + Drizzle ORM with users table and migrations
- Stripe subscription billing (checkout, portal, webhooks)
- Protected dashboard layout with authenticated routes
- Marketing landing page shell (header, footer, hero)
- Legal pages (terms, privacy, refunds)
- Onboarding page shell
- Toast system, error boundary, logger, theme provider
- ESLint, Prettier, TypeScript config
- Vercel deployment config

---

# PHASE 0: AI SPIKE — VALIDATE BEFORE BUILDING

> **Purpose:** Before writing any product code, prove that GPT-4o (or newer models) can analyze wall/room photos and produce estimates within ±20% accuracy. Also test OpenAI image generation for color visualization. If neither works well enough, the product still works without AI — but we need to know now.

## 0.1 Wall/Room Photo Estimate Test Utility

### Environment & Dependencies
- [x] Install OpenAI SDK: `npm install openai`
- [x] Add `OPENAI_API_KEY` to `.env.example` and `.env.local`
- [x] Create `/src/lib/openai.ts` — OpenAI client singleton

### AI Estimate API Route
- [x] Create `POST /api/ai/estimate` route
- [x] Accept: image (base64 or URL), structured form data (room type, rough dimensions, surface condition, number of coats)
- [x] Send image + structured prompt to GPT-4o vision
- [x] Prompt engineering: ask model to identify:
  - Room type (bedroom, living room, kitchen, bathroom, exterior wall, etc.)
  - Approximate wall surface area (sq ft) from visual cues
  - Surface condition (good, fair, needs prep)
  - Number of surfaces/walls visible
  - Ceiling height estimate
  - Architectural features (trim, crown molding, windows, doors)
- [x] Combine AI visual analysis with user-provided dimensions for cross-validation
- [x] Calculate estimate range using:
  - Labor rate: $1.50–$3.50/sq ft (based on surface condition + room type)
  - Paint cost: $25–$75/gallon, ~350 sq ft/gallon coverage
  - Prep work multiplier (1.0x good, 1.3x fair, 1.6x needs work)
  - Number of coats multiplier
- [x] Return JSON: `{ estimateRange: { low, high }, confidence, breakdown, roomAnalysis }`
- [x] Frame output as "preliminary estimate range" — never a single number
- [x] Include confidence score (low/medium/high) based on image quality + dimension availability

### AI Estimate Test UI
- [x] Create `/src/app/(authenticated)/tools/estimate-test/page.tsx`
- [x] **Guided multi-photo capture** — prompt user to take specific shots in order:
  1. "Stand in the doorway — take a wide shot of the whole room"
  2. "Take a straight-on photo of each wall you want painted" (up to 4)
  3. "Take a photo of the ceiling if it's being painted" (optional)
- [x] Each photo slot has a label/instruction card so the homeowner knows exactly what to shoot
- [x] Per-slot capture: camera button (mobile, `capture="environment"`) + file upload (desktop)
- [x] Photo preview thumbnails with remove/retake per slot
- [x] Minimum 1 photo required, encourage 3-5 for better accuracy
- [x] Structured input form (supplements photos, does NOT replace them):
  - Room type dropdown (bedroom, living room, kitchen, bathroom, hallway, exterior, other)
  - Surface type (drywall, plaster, wood, brick, stucco)
  - Current condition (good, fair, needs prep work)
  - Number of coats (1, 2, 3)
  - Include ceiling? (yes/no)
  - Include trim? (yes/no)
- [x] All photos sent together in a single GPT-4o vision request — model cross-references them to build a fuller picture of the room
- [x] Submit button → show loading state → display results
- [x] Results display:
  - Estimate range (e.g., "$1,200 – $1,800")
  - Confidence indicator (low/medium/high)
  - Breakdown (labor, materials, prep)
  - Room analysis from AI (surfaces detected, coverage areas, any flags)
- [x] Test multiple sessions back-to-back and compare results
- [x] Log all test results to console/local storage for accuracy tracking

### Estimate Test UI — Redesign (based on ChatGPT architecture review)
- [x] Job type selector: Interior Rooms / Exterior / Single Surface
- [x] Interior flow: room-by-room cards (1 photo per room), condition per room, optional notes + dimensions, global coats + surface type, per-room estimate → rolled up total
- [x] Exterior flow: facade cards (Front/Back/Left/Right), 1 photo per side, global condition/material/stories/coats, per-facade estimate → total
- [x] Single surface flow: 1 photo, surface type, condition, optional dimensions + notes
- [x] Per-unit API calls (one per room/facade) — aggregate results client-side
- [x] Results view: total range at top, per-unit confidence-scored cards, AI notes per unit
- [x] API: add optional `notes` and `dimensions` fields to EstimateRequest, incorporate into prompt

### Estimate Test UI — V2 Redesign (homeowner-optimized, low-friction)
- [x] Replace "coats" selector with homeowner-friendly repaint intent (refresh / full repaint / color change / dark to light) — maps to 1/2/3 coats internally
- [x] Move ceiling/trim per-room checkboxes to a single post-photo "What's included?" step (walls only / walls+ceiling / walls+trim / full room)
- [x] Default interior surface type to Drywall, remove from per-room UI
- [x] Exterior: one side at a time (Front → Back → Left → Right) with progress dots, skip by advancing without photo
- [x] Add 4th mode: "Describe Your Project" — conversational chat, photos optional, AI asks ≤3 follow-up questions then estimates
- [x] New API route: `POST /api/ai/chat-estimate` — extracts structured inputs from conversation, runs same pricing engine, returns assumptions list
- [x] Simplified room cards: photo + room type + condition only (details collapsible)
- [x] Reusable `RadioOption` component for scope/intent selection steps

### Accuracy Testing Protocol
> **Deferred** — shipping AI estimates in V1 with "ballpark only" disclaimer. Will tune accuracy iteratively post-launch with real job data.

---

## 0.2 Phase 0 Decision Checkpoint

- [x] **AI Estimates:** Ship in V1 with heavy "ballpark only" disclaimer. Estimate UI built, tested manually, good enough to validate with real users. Will refine post-launch.
- [x] Update dev plan — proceeding to Phase 1.

> **Color Visualization:** Deferred to V1.5. Add it after MVP ships if it feels low-effort at that point. Test utility can be built quickly then — don't invest time now.

---

# PHASE 1: V1 MVP — LEAN LEAD CAPTURE PLATFORM

> **Goal:** Get a working product that painters can use to capture leads from homeowners, view them in a dashboard, and optionally get AI-powered estimates. Ship fast, validate with 5-10 beta users.

## 1.1 Database Schema & Architecture

### Core Tables
- [x] `companies` table — painter business profiles
  - id (uuid, pk)
  - clerk_user_id (text, unique, fk to users)
  - business_name (text)
  - owner_name (text)
  - owner_email (text)
  - owner_phone (text)
  - business_phone (text)
  - address, city, state, zip (text)
  - logo_url (text, nullable)
  - website_url (text, nullable)
  - service_area (text) — "Greater Austin area" etc.
  - default_hourly_rate (decimal, nullable)
  - default_sqft_rate (decimal, nullable)
  - timezone (text, default 'America/New_York')
  - onboarding_completed (boolean, default false)
  - created_at, updated_at (timestamps)

- [x] `leads` table — homeowner submissions
  - id (uuid, pk)
  - company_id (uuid, fk to companies)
  - homeowner_name (text)
  - homeowner_email (text, nullable)
  - homeowner_phone (text)
  - address (text, nullable)
  - city, state, zip (text, nullable)
  - service_type (text) — interior, exterior, both, cabinet, deck, etc.
  - description (text, nullable) — homeowner's description of the job
  - room_type (text, nullable)
  - estimated_sqft (integer, nullable)
  - number_of_rooms (integer, nullable)
  - preferred_timeline (text, nullable) — ASAP, within 2 weeks, flexible, etc.
  - source (text) — 'widget', 'qr', 'direct_link', 'manual'
  - status (text) — 'new', 'contacted', 'quoted', 'scheduled', 'won', 'lost'
  - ai_estimate_low (integer, nullable) — cents
  - ai_estimate_high (integer, nullable) — cents
  - ai_confidence (text, nullable) — 'low', 'medium', 'high'
  - quoted_amount (integer, nullable) — cents, painter's actual quote
  - notes (text, nullable) — painter's private notes
  - created_at, updated_at (timestamps)

- [x] `lead_photos` table — photos uploaded by homeowner
  - id (uuid, pk)
  - lead_id (uuid, fk to leads)
  - photo_url (text) — Supabase storage URL
  - photo_type (text) — 'room', 'wall', 'exterior', 'damage', 'other'
  - ai_analysis (jsonb, nullable) — stored AI vision response
  - created_at (timestamp)

- [ ] `visualizations` table — AI color renders
  - id (uuid, pk)
  - lead_id (uuid, fk to leads, nullable)
  - lead_photo_id (uuid, fk to lead_photos)
  - original_photo_url (text)
  - rendered_photo_url (text)
  - target_color_hex (text)
  - target_color_name (text, nullable)
  - cost_cents (integer) — track API cost per render
  - created_at (timestamp)

> **follow_ups table — dropped for V1.** Single confirmation email tracked via `confirmation_sent_at` on the leads table. Multi-touch drip deferred to V1.5 (needs Twilio A2P anyway).
> **visualizations table — dropped for V1.** Deferred to V1.5.

### Schema Setup
- [x] Create schema files in `/src/lib/db/schema/` — companies.ts, leads.ts, lead-photos.ts
- [x] Update `/src/lib/db/schema/index.ts` to export all tables
- [x] Run `db:generate` and `db:push` to apply schema to local `painter_app_dev`
- [x] Create query files in `/src/lib/db/queries/` — companies.ts, leads.ts, lead-photos.ts

### Supabase Storage Setup
- [x] `lead-photos` bucket created, anon upload policy, image/* MIME restriction, 5MB file size limit
- [x] `src/lib/storage.ts` — uploadLeadPhoto with canvas compression (max 1600px, JPEG 85%)
- [x] Photos uploaded browser → Supabase directly (bypasses Vercel 4.5MB limit)
- [x] Photo URLs stored in `lead_photos` table

---

## 1.2 Company Onboarding Flow

### Onboarding Page Redesign
- [x] Redesign `/src/app/(authenticated)/onboarding/page.tsx`
- [x] Multi-step form (3 steps):
  1. **Business Info:** business name, owner name, phone, service area
  2. **Rates:** default sqft rate (optional)
  3. **Setup Complete:** generate shareable lead capture link, show QR code, copy link, download QR
- [x] Form validation with proper error messages
- [x] Save to `companies` table on completion via `POST /api/company`
- [x] Set `onboarding_completed = true`
- [x] Redirect to dashboard
- [x] Pre-fill name/phone from Clerk user

### Company Profile Settings
- [x] Create `/src/app/(authenticated)/dashboard/settings/page.tsx`
- [x] Edit business info (all fields from onboarding)
- [ ] Logo upload (Supabase storage) — deferred
- [x] View/copy shareable lead capture link
- [x] Download QR code (PNG)
- [x] Manage subscription (Stripe portal link — already in boilerplate)

---

## 1.3 Homeowner Lead Capture Form (Public)

> This is the **core product surface** — the form homeowners interact with. Must be mobile-optimized, fast, and dead simple.

### Public Lead Form Page
- [x] Create `/src/app/quote/[companyId]/page.tsx` — public, no auth required
- [x] Fetch company info (business name, phone, service area) for branding
- [x] Mobile-first responsive design
- [x] Multi-step form flow:
  1. **Contact:** name, phone (required), email, address (optional)
  2. **Project:** service type, description + hint bullets, photos (optional, up to 5), timeline
  3. **Processing:** spinner with rotating messages
  4. **Results:** AI estimate range + confidence + assumptions + company contact info
- [x] Progress indicator dots
- [x] Photos: file picker (multi-select), preview pill with names, up to 5 images
- [x] On submission: create lead → run AI estimate sync → show results (or fallback "request received" if AI fails)

### Lead Form API Routes
- [x] `POST /api/leads/public` — create lead (partial or full), rate-limited (10/IP/hour, in-memory)
- [x] `PATCH /api/leads/public/[leadId]` — update contact info or project details, run AI on demand
- [x] `GET /api/leads/public/company/[companyId]` — company name + phone + service area for branding
- [x] Phone validated via `libphonenumber-js`, normalized to E.164 stored in DB
- [x] Email required, validated via regex + common typo detection (gmail.con etc.)
- [x] Partial lead save on contact step "Continue" — captures name/phone/email before project details
- [x] Back button re-patches contact info if edited after partial save
> Photo upload to Supabase deferred — photos sent as base64 to AI directly, no storage for now.
> Inngest `lead.created` event deferred — using sync flow for V1.

### Shareable Link & QR Code
- [x] Generate unique URL: `{APP_URL}/quote/{companyId}`
- [x] QR code generation via `qrcode` npm package (in onboarding step 3)
- [x] Downloadable QR as PNG

---

## 1.4 Painter Dashboard — Leads View

### Leads List Page
- [x] Create `/src/app/(authenticated)/dashboard/leads/page.tsx`
- [x] Table view: name, phone, email, service type, AI estimate, status badge, time ago
- [x] Status badge colors (new=blue, contacted=yellow, quoted=purple, scheduled=indigo, won=green, lost=gray)
- [x] "NEW" badge for leads under 24h old with status=new
- [x] Live search by name/phone/email (debounced 300ms, updates URL)
- [x] Filter by status (auto-updates URL on change)
- [x] Pagination (25 per page, next page link)
- [x] Click-to-call phone links, click-to-email links
- [x] Dashboard nav (Home, Leads) with company name + Clerk UserButton

### Lead Detail Page
- [x] Create `/src/app/(authenticated)/dashboard/leads/[id]/page.tsx`
- [x] Full contact info (phone click-to-call, email click-to-email, address)
- [x] Job details (service type, timeline, description)
- [x] AI estimate display with confidence badge + disclaimer
- [x] Status selector (click to change, auto-saves via PATCH)
- [x] Private notes editor (saves on button click)
- [x] Quoted amount input (saves on blur)
- [x] Photo gallery — thumbnails load inline, click opens full-size in new tab
- [ ] Follow-up history — deferred to V1.5

### Lead API Routes
- [x] `GET /api/leads` — list leads for authenticated company (search, filter, paginate)
- [x] `GET /api/leads/[id]` — lead detail (auth-gated, company ownership check)
- [x] `PATCH /api/leads/[id]` — update status, notes, quoted amount
- [x] `POST /api/leads` — manual lead creation (painter-side, email optional, source=manual, photos + optional AI estimate)
- [x] `DELETE /api/leads/[id]` — hard delete with ownership check
- [x] `/dashboard/leads/new` — manual lead creation form: contact, job details, photo upload (up to 5), optional AI estimate checkbox (disabled until description filled), private notes
- [x] Delete button on lead detail (inline confirm → delete → redirect)

---

## 1.5 AI Integration (Based on Phase 0 Results)

### Photo-to-Estimate
- [x] AI estimate runs synchronously on lead creation (public form + manual form)
- [x] Results stored in `leads` table (`ai_estimate_low`, `ai_estimate_high`, `ai_confidence`)
- [x] Displayed on lead detail page with "Ballpark only — verify on-site" disclaimer
- [x] Photos sent as base64 directly to GPT-4o (no Supabase storage needed for AI)
- [x] Graceful degradation — lead saved even if AI estimate fails
> Inngest async trigger deferred — sync is sufficient for V1.
> `lead_photos.ai_analysis` jsonb storage deferred — no Supabase yet.
> API cost tracking deferred — add when billing matters.

### Color Visualization
> Deferred to V1.5. Quick-add after MVP ships if lift feels low.

---

## 1.6 Dashboard Home & Analytics

### Dashboard Home Page
- [x] Redesign `/src/app/(authenticated)/dashboard/page.tsx`
- [x] KPI cards: leads this month, last 7 days, conversion rate (quoted→won), revenue won
- [x] Recent leads list (last 5, click-through to detail)
- [x] Quick actions: "+ Add lead", "View all leads"
> Share lead form link moved to Settings page. Notification bell deferred to V1.5.

### Analytics Page (Basic)
> Deferred to V1.5 — KPI cards on dashboard home are sufficient for MVP.

### Company Settings Page
- [x] Create `/src/app/(authenticated)/dashboard/settings/page.tsx`
- [x] Edit business info (name, owner, phones, service area, website)
- [x] Lead form link with ExternalLink + Copy icon buttons
- [x] QR code preview + Download PNG + Print PDF (`/api/qr` route, `pdf-lib`)

---

## 1.7 Notifications & Basic Follow-Up

### New Lead Notification
- [x] Install Resend SDK
- [x] `src/lib/resend.ts` — Resend client + FROM_EMAIL
- [x] `src/lib/email/email-client.ts` — emailClient wrapper with `EMAIL_ENABLED` flag (logs when disabled, sends when true)
- [x] `src/lib/email/notifications.ts` — sendNewLeadNotification + sendHomeownerConfirmation
- [x] Painter email: name, phone, email, service type, description, AI estimate, "View in dashboard" button
- [x] Fires on public form submission (PATCH with runEstimate + POST fallback)
- [x] Gated by `confirmationSentAt` to prevent double-sends
- [x] `EMAIL_ENABLED` env var — true locally for testing, true in Vercel prod
- [x] Minimal painter nudge on partial save (contact only) — name + dashboard link, no contact details to avoid typo confusion
- [x] Skip option on project step — homeowner can skip AI estimate and just submit contact info
- [x] "Request project details" email — painter sends homeowner a pre-filled quote form link from lead detail or table; hidden if lead already has description

### Homeowner Confirmation
- [x] Sends on same trigger as painter notification (full form submission)
- [x] Includes AI estimate range if generated, painter phone, "within 24 hours" message
- [x] Uses `Promise.allSettled` — email failure never breaks lead submission

> SMS notification to painter: deferred to V1.5 (Twilio)
> Multi-touch drip: deferred to V1.5
> Inngest: deferred — sync send is fine for V1

---

## 1.8 Marketing Landing Page

### Landing Page Content
- [x] Redesign `/src/app/page.tsx` for painting contractor audience
- [x] Hero section with interactive QuoteWidget demo
- [x] Features section (homeowner form, AI estimates, lead pipeline, manual entry)
- [x] How it works (3 steps)
- [x] Pricing section: $79/month, 14-day free trial
- [x] FAQ section
- [x] Social proof / testimonials section
- [x] Footer with legal links
- [x] Sora + Inter fonts via next/font/google
- [x] Scroll reveal animations
- [x] Updated metadata (title + description)

### Branding
- [x] Decide on product name — CraftDesk
- [x] Favicon + logo (all sizes: favicon.ico, favicon.svg, apple-touch-icon, og:image, icon-192, icon-512)

### SEO Basics
- [x] Proper meta tags on root layout (title, description, og:image, icons)
- [x] `robots.txt` and `sitemap.xml`
- [ ] Semantic HTML structure
- [ ] Fast page load (no heavy JS on landing page)

---

## 1.9 Stripe Billing — Single Tier

### Billing Configuration
- [x] Create Stripe product: "PainterApp Pro" at $79/month
- [x] Create Stripe price ID, add to env as `NEXT_PUBLIC_STRIPE_PRICE_ID`
- [x] 14-day free trial (card required upfront)
- [x] Update checkout route to use new price ID
- [x] Billing page shows: current plan, trial status, next billing date
- [x] Stripe customer portal for self-service management
- [x] Webhook handlers: checkout.session.completed, subscription.updated, subscription.deleted, invoice.payment_failed

### Access Control
- [x] Subscription banner on all dashboard pages (trial countdown, expired, canceled, payment failed)
- [x] Add Lead button disabled with tooltip when no active subscription
- [x] /dashboard/leads/new blocked (disabled button, not redirect)
- [x] /quote/[companyId] shows "temporarily unavailable" when company not subscribed
- [x] POST /api/leads and POST /api/leads/public gated (403 if inactive)
- [x] Middleware: Stripe webhook + public leads routes added to allowlist

---

## 1.10 Infrastructure & Deployment

### Inngest Setup
- [x] Install Inngest: `npm install inngest`
- [x] Create `/src/lib/inngest/client.ts`
- [x] Create `/src/app/api/inngest/route.ts` — Inngest serve endpoint
- [x] Create functions:
  - `src/lib/inngest/functions/quote-expiration.ts` — daily, expires overdue quotes
  - `src/lib/inngest/functions/quote-nudge.ts` — daily, 48h follow-up nudge (painter + homeowner)
  - `src/lib/inngest/functions/contract-nudge.ts` — daily, 72h follow-up nudge (painter + homeowner)

### Deployment Checklist
- [x] All env vars configured in Vercel
- [x] Supabase production project created
- [x] Database schema pushed to production
- [x] Supabase storage buckets created in production
- [x] Stripe live mode keys
- [x] Clerk production instance
- [x] Inngest production keys
- [x] Resend production keys + verified domain
- [x] OpenAI API key with billing enabled
- [x] Custom domain configured (when ready)
- [x] Vercel deployment successful, smoke test passing

### V1 Launch Testing
- [x] End-to-end test: sign up → onboard → share link → homeowner submits form → painter sees lead
- [x] AI estimate test with real photos through production pipeline
- [x] Billing flow: trial → checkout → active subscription
- [ ] Mobile test: lead form works perfectly on iPhone + Android
- [x] Email notifications arriving
- [ ] Follow-up emails triggering on schedule
- [ ] Rate limiting working on public endpoints

---

# PHASE 2: V1.5 — TRACTION FEATURES

> **Goal:** Features that increase retention and differentiation. Build after V1 has 5-10 paying users.

## 2.1 Missed-Call Text-Back (Twilio)
- [ ] Twilio account setup + A2P 10DLC brand registration (10-15 day process)
- [ ] Purchase Twilio phone numbers (one per painter)
- [ ] Call forwarding setup: Twilio number → painter's cell
- [ ] Missed call detection → auto-SMS to caller with lead form link
  - "Hi! Thanks for calling [Business Name]. We're currently on a job. Get a quick quote here: [link]"
- [ ] SMS webhook handling for responses
- [ ] Twilio number management in company settings
- [ ] Add `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` to env
- [ ] Database: add `twilio_phone_number` to companies table
- [ ] Inngest function: `call.missed` → send text-back

## 2.2 SMS Notifications for Painters
- [ ] New lead SMS alert to painter (not just email)
- [ ] Quick-reply SMS: painter can text back status updates
- [ ] SMS opt-in/out for painter notifications

## 2.3 Embeddable Website Widget
- [ ] JavaScript snippet painters can add to their existing website
- [ ] Floating button → opens lead form in modal/slide-in
- [ ] Customizable button color/text
- [ ] Widget builder in dashboard settings
- [ ] CDN-hosted widget JS for fast loading
- [ ] CORS-enabled API for cross-origin form submission

## 2.4 Improved Color Visualization
- [ ] If OpenAI quality insufficient: migrate to Replicate (ControlNet SDXL + SAM)
- [ ] Multiple color options per photo (generate 3 variations)
- [ ] Shareable visualization link (painter sends to homeowner)
- [ ] Color visualization in public lead form (homeowner uploads photo → picks colors → wow factor)
- [ ] Popular paint brand color matching (Sherwin-Williams, Benjamin Moore presets)

## 2.5 Enhanced Estimate Builder
- [ ] Manual estimate calculator alongside AI estimates
- [ ] Room-by-room line items
- [ ] Customizable rates per surface type
- [ ] Material calculator (gallons needed based on sqft + coats)
- [ ] PDF estimate/proposal generation (branded with painter's logo)
- [ ] Send estimate to homeowner via email

---

# PHASE 3: V2 — FULL WORKFLOW PLATFORM

> **Goal:** Transform from lead capture tool into full business management platform. Build at ~50+ paying users / $3,500+ MRR.

## 3.1 Job Status Pipeline
- [ ] Drag-and-drop Kanban board for lead/job stages
- [ ] Stages: New → Contacted → Quoted → Scheduled → In Progress → Completed → Paid
- [ ] Custom stages (painter can rename/add)
- [ ] Stage change triggers (auto-email homeowner on status change)
- [ ] Pipeline analytics (conversion rates per stage)

## 3.2 Scheduling & Calendar
- [ ] Job calendar view (daily/weekly/monthly)
- [ ] Schedule jobs from lead detail page
- [ ] Customer self-schedule link (painter shares available slots)
- [ ] Google Calendar integration (2-way sync)
- [ ] Appointment confirmation emails/SMS
- [ ] Reschedule/cancel handling

## 3.3 Invoicing & Payments
- [ ] Invoice generation from lead/quote data
- [ ] Branded invoice PDF
- [ ] Stripe Connect for payment collection (painter receives payment, platform takes 0.5% fee)
- [ ] Online payment link sent to homeowner
- [ ] Payment status tracking
- [ ] Payment follow-up drip: day 3, day 7, day 14+ for unpaid invoices
- [ ] ACH and card support

## 3.4 Automated Review Requests
- [ ] Post-payment: auto-send review request to homeowner
- [ ] Google review link integration
- [ ] Yelp, Facebook review routing
- [ ] Rating-based routing (4-5 stars → Google, 1-3 → private feedback)
- [ ] Review tracking in dashboard

## 3.5 Multi-Tier Pricing
- [ ] Introduce pricing tiers when feature set warrants it:
  - **Starter ($49/mo):** Lead capture, basic dashboard, 10 AI estimates/mo
  - **Pro ($79/mo):** Everything + missed-call text-back, unlimited AI, color viz, follow-up automation
  - **Growth ($149/mo):** Everything + invoicing, payments, scheduling, analytics, priority support
- [ ] Stripe product/price management for multiple tiers
- [ ] Feature gating middleware based on subscription tier
- [ ] Upgrade/downgrade flows

---

# PHASE 4: V3 — SCALE & EXPAND

> **Goal:** Multi-user, multi-trade, analytics-heavy. Build at ~200+ customers / $10K+ MRR.

## 4.1 Post-Job Reporting
- [ ] Automated completion report sent to homeowner
- [ ] Before/after photo gallery
- [ ] Work summary and materials used
- [ ] Shareable report link (homeowner can share with neighbors)

## 4.2 Crew Management
- [ ] Multi-user accounts (owner + crew members)
- [ ] Role-based access (admin, estimator, painter)
- [ ] Job assignment to crew members
- [ ] Crew schedule view
- [ ] GPS check-in/check-out at job sites
- [ ] Time tracking per job

## 4.3 Advanced Analytics
- [ ] Job profitability reports (revenue vs. estimated labor/materials)
- [ ] Lead source ROI (which channels bring the best leads?)
- [ ] Seasonal trend analysis
- [ ] Revenue forecasting
- [ ] Customer lifetime value tracking
- [ ] Export to CSV/PDF

## 4.4 Inventory & Materials
- [ ] Paint inventory tracking
- [ ] Material cost per job
- [ ] Supplier price book
- [ ] Auto-generate supply lists for upcoming jobs
- [ ] Low-stock alerts

## 4.5 Multi-Trade Expansion
- [ ] Flooring contractor support (material types, waste factors, room-by-room dimensions)
- [ ] Exterior remodeling support (siding, windows, doors)
- [ ] Trade-specific estimate templates
- [ ] Trade-specific lead form fields
- [ ] Rebrand to "Visual Trades" or broader name

## 4.6 Mobile App (PWA or Native)
- [ ] Progressive Web App with offline support
- [ ] Push notifications for new leads
- [ ] Camera integration for job site photos
- [ ] Quick lead status updates from field
- [ ] If native needed: React Native / Expo

---

# TECHNICAL REFERENCE

## Environment Variables (Full List)

```
# App
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_ENABLE_AUTH=true

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
NEXT_PUBLIC_STRIPE_PRICE_ID=

# OpenAI
OPENAI_API_KEY=

# Inngest
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# Resend (Email)
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# Twilio (V1.5+)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Cron
CRON_SECRET=
```

## Key File Paths (Planned)

```
src/
├── app/
│   ├── page.tsx                          # Marketing landing page
│   ├── quote/[companyId]/page.tsx        # Public lead capture form
│   ├── (authenticated)/
│   │   ├── dashboard/
│   │   │   ├── page.tsx                  # Dashboard home
│   │   │   ├── leads/
│   │   │   │   ├── page.tsx              # Leads list
│   │   │   │   └── [id]/page.tsx         # Lead detail
│   │   │   ├── analytics/page.tsx        # Analytics
│   │   │   ├── settings/page.tsx         # Company settings
│   │   │   └── billing/page.tsx          # Billing (exists)
│   │   ├── onboarding/page.tsx           # Onboarding (exists, redesign)
│   │   └── tools/
│   │       ├── estimate-test/page.tsx    # Phase 0: AI estimate testing
│   │       └── color-test/page.tsx       # Phase 0: Color viz testing
│   └── api/
│       ├── leads/
│       │   ├── route.ts                  # CRUD leads (authed)
│       │   ├── [id]/route.ts             # Lead detail (authed)
│       │   └── public/route.ts           # Public lead submission
│       ├── ai/
│       │   ├── estimate/route.ts         # AI photo estimate
│       │   └── visualize/route.ts        # AI color visualization
│       ├── analytics/route.ts            # Analytics aggregation
│       ├── company/route.ts              # Company profile CRUD
│       ├── inngest/route.ts              # Inngest serve
│       ├── stripe/                       # (exists)
│       └── webhooks/                     # (exists)
├── lib/
│   ├── db/
│   │   ├── schema/
│   │   │   ├── companies.ts
│   │   │   ├── leads.ts
│   │   │   ├── lead-photos.ts
│   │   │   ├── visualizations.ts
│   │   │   └── follow-ups.ts
│   │   └── queries/
│   │       ├── companies.ts
│   │       ├── leads.ts
│   │       └── follow-ups.ts
│   ├── openai.ts                         # OpenAI client
│   ├── inngest/
│   │   ├── client.ts
│   │   └── functions/
│   │       ├── notify-new-lead.ts
│   │       ├── lead-follow-up.ts
│   │       └── generate-ai-estimate.ts
│   ├── storage.ts                        # Supabase storage helpers
│   └── resend.ts                         # Email client
└── components/
    ├── leads/
    │   ├── LeadTable.tsx
    │   ├── LeadCard.tsx
    │   ├── LeadStatusBadge.tsx
    │   └── LeadForm.tsx                  # Public form components
    ├── dashboard/
    │   ├── KpiCard.tsx
    │   └── ActivityFeed.tsx
    ├── ai/
    │   ├── EstimateDisplay.tsx
    │   ├── ColorVisualizer.tsx
    │   └── PhotoUpload.tsx
    └── ui/                               # Shadcn components
```

## Shadcn Components Needed

```bash
# Install all at once (run when starting Phase 1)
npx shadcn@latest add button card input label select textarea badge
npx shadcn@latest add table tabs dialog dropdown-menu
npx shadcn@latest add form separator avatar progress
npx shadcn@latest add tooltip popover command sheet
```

---

# DEVELOPMENT ORDER (Recommended)

1. **Phase 0** — AI Spike (0.1, 0.2, 0.3) → 2-3 days
2. **Phase 1.1** — Database schema → 1 day
3. **Phase 1.3** — Public lead capture form → 2-3 days (most critical surface)
4. **Phase 1.2** — Onboarding flow → 1 day
5. **Phase 1.4** — Leads dashboard → 2-3 days
6. **Phase 1.5** — AI integration (wire up from Phase 0) → 1 day
7. **Phase 1.7** — Notifications & follow-up → 1-2 days
8. **Phase 1.6** — Dashboard home & analytics → 1 day
9. **Phase 1.8** — Marketing landing page → 1 day
10. **Phase 1.9** — Stripe billing config → 0.5 day
11. **Phase 1.10** — Infrastructure & deployment → 1 day
12. **Launch V1 MVP** → beta test with 5-10 painters

Total V1 estimate: ~2-3 weeks of focused development

---
