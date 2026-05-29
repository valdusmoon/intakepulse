# CraftCapture — Product Documentation

> Written April 2026. Intended for product review, design critique, and AI model feedback.

---

## 0. How to Read This Doc / What We're Asking For

This document describes CraftCapture in full — product, data model, screens, API, and DB-level detail. Use it to give honest, specific feedback on:

- **Product gaps** — what's missing that painters will actually need before paying $79/month?
- **UX friction** — where will a non-tech painter get confused or give up?
- **Flow design** — is the lead → quote → contract → deposit sequence the right order? Too many steps?
- **Pricing and positioning** — is $79/month the right price for this persona? What's the risk of churn?
- **Data model issues** — anything that will break or be hard to extend (e.g. one quote per lead, no contract number, no invoice table)?
- **Missing emails or automations** — what should happen automatically that currently requires painter action?
- **Competitive blind spots** — what does Jobber, HouseCall Pro, or similar tools do that painters expect as table stakes?

Be direct. We'd rather hear "this won't work because X" than generic praise.

---

## 1. What We're Building

**CraftCapture** is a lead capture and job management platform for painting contractors. Target market: independent painting businesses and small crews (1–10 people) in the US.

The core problem: painters lose jobs because their lead intake is broken. Homeowners call, get voicemail, and move on. Or they find the painter on Google, can't figure out how to request a quote, and leave. CraftCapture gives every painter a shareable lead form link that homeowners fill out from their phone — and the painter gets an instant email notification with full contact info and an AI-generated ballpark estimate.

The secondary problem: once a lead comes in, the entire job workflow (quoting, contracting, collecting deposit, scheduling, invoicing) happens over text messages and spreadsheets. CraftCapture is building that workflow end-to-end.

**Pricing:** $79/month flat. 14-day free trial, card required.

**Current state:** Lead capture is live and sellable. Quote builder, contract signing, and email notifications are built and working. Payments, scheduling, invoicing, and review requests are next.

---

## 2. User Persona

**The Painter** — owner-operator of a small painting business. Not tech-savvy. Busy on job sites. Checks phone between coats. Sends quotes over text or never sends them at all. Loses track of which leads he called back. Doesn't have a CRM, doesn't want one. Needs something that works like a tool, not software.

**The Homeowner** — filling out the form from their phone, likely on a couch or in the room they want painted. Wants a fast response and a rough number. Not expecting an instant binding quote — just wants to know the painter is legitimate and will follow up.

---

## 3. User Journeys

### 3.1 Painter — Full Flow (Ideal State)

1. **Signs up** → enters business name, phone, service area → gets shareable lead form URL + QR code
2. **Shares link** → puts it in Google Business Profile bio, texts it to people, prints QR code for business card
3. **Gets a lead** → homeowner fills out form → painter receives email with name, phone, project details, AI estimate range
4. **Opens dashboard** → sees new lead with status "new" → calls homeowner → changes status to "contacted"
5. **Builds quote** → opens Quote Builder → selects line items (walls, ceilings, trim, prep) → sets prices → adds message → sends quote
6. **Homeowner receives email** → opens public quote link → sees itemized quote → clicks Accept
7. **Painter gets notified** → email says quote accepted with homeowner phone + email → painter opens Contract Editor
8. **Sends contract** → contract pre-filled from lead + company info → painter reviews/edits → clicks Send Contract
9. **Homeowner signs** → opens link → types name → clicks Sign → both parties get signed PDF by email
10. **Painter collects deposit** → currently offline (Venmo, check, Zelle) — no in-app payment yet
11. **Job happens** → painter marks lead as "won" — no scheduling or invoicing in app yet

### 3.2 Homeowner — Full Flow

1. **Finds link** → Google Business Profile, text from friend, QR code on a flyer
2. **Fills form on phone** → name, phone, email (optional), address, service type, description, up to 5 photos, timeline
3. **Sees AI estimate** → ballpark range with assumptions, painter's contact info — "we'll follow up within 24 hours"
4. **Receives confirmation email** → estimate range, painter phone number
5. **Receives quote email** → "Your quote from [Business Name] is ready" → link to public quote page
6. **Opens quote** → sees itemized line items, total, message from painter, deposit note → accepts or declines
7. **If accepted: receives contract email** → signing link
8. **Opens contract** → reads full text → types name → clicks Sign → receives signed PDF by email

### 3.3 Where the Flow Currently Breaks

- **After signing** — no deposit collection step. Painter has to reach out manually. This is the highest drop-off risk.
- **No scheduling** — after deposit, painter coordinates job date over text. Nothing in the app.
- **No invoice** — after the job, painter has to chase final payment manually.
- **One quote per lead** — if a homeowner wants revisions, painter has to edit the existing quote (no version history, no "resend revised quote" flow).
- **No lead follow-up automation** — if a lead goes cold, painter has to remember to follow up manually. No reminders, no drip.
- **Homeowner email is optional** — if not provided, painter can't send quote or contract. They have to go back and update the lead. No inline prompt to collect it.

---

## 4. Competitive Landscape

### What painters currently use instead:

| Tool | What it does | Why painters leave |
|---|---|---|
| **Jobber** | Full field service management (scheduling, invoicing, CRM, payments) | $49–$249/month, overwhelming for solo operators, steep learning curve |
| **HouseCall Pro** | Similar to Jobber — scheduling, dispatch, payments | Expensive, complex, built for larger teams |
| **Google Docs / Word** | Manual quote and contract creation | No tracking, no email, not professional |
| **Text messages** | Send quote as a photo of a paper | No paper trail, easy to ignore, looks unprofessional |
| **Nothing** | Many painters never send a formal quote | Jobs get lost, no contract, disputes happen |

### CraftCapture's positioning:

- Simpler than Jobber/HouseCall Pro — no dispatch, no scheduling calendar (yet), no mobile app
- More professional than text/paper — real PDFs, electronic signatures, public URLs
- AI differentiator — instant ballpark estimate from photos, something no competitor does at this price point
- Entry price ($79/month) is below Jobber's base plan but above "free" tools like Google Forms

### Table stakes painters expect (risk if missing):

- Mobile-friendly dashboard (currently not optimized)
- Ability to collect deposit in-app (not built)
- Job scheduling / calendar (not built)
- Invoice after job completion (not built)

---

## 5. Design Philosophy & Constraints

- **Painter is on a job site** — can't spend 10 minutes learning a new tool. Every screen needs to be operable in 60 seconds on a phone between tasks.
- **No jargon** — painters don't know what "CRM" means. Labels say "Leads" not "Contacts", "Quote" not "Proposal".
- **Defaults over configuration** — the contract template, default line items, and deposit note are pre-filled. Painter edits, not builds from scratch.
- **Email as the primary delivery mechanism** — no SMS (Twilio A2P registration is weeks-long). All homeowner communication goes through email. This is a risk: homeowners who don't provide email can't receive quotes or contracts.
- **No mobile app** — web only. Dashboard is not fully mobile-optimized. Lead form is.
- **One-painter accounts** — no team support, no sub-users, no role permissions. V1 is strictly solo operator.

---

## 6. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Turbopack) |
| Auth | Clerk |
| Database | Supabase PostgreSQL + Drizzle ORM |
| Payments | Stripe (subscription billing) |
| Email | Resend |
| AI | OpenAI GPT-4o vision |
| Storage | Supabase Storage |
| Deployment | Vercel |
| UI | Tailwind CSS v4 + Shadcn |

---

## 7. Data Model

### `companies`
One row per painter account. Created on onboarding completion.

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| clerk_user_id | text | Clerk auth ID, unique |
| business_name | text | Shown on lead form, PDFs, emails |
| owner_name | text | Personal name of the owner |
| owner_email | text | Login email — private, never shown to homeowners |
| owner_phone | text | Personal cell — private, never shown to homeowners |
| business_phone | text | Customer-facing phone, shown on PDFs and public pages |
| business_email | text | Customer-facing email, shown on PDFs and public pages |
| address, city, state, zip | text | Business address (optional) |
| service_area | text | Free text e.g. "Greater Austin area" |
| logo_url | text | Not yet implemented |
| website_url | text | Shown on PDFs and public pages if set |
| default_sqft_rate | decimal | Pre-fills sqft line items in quote builder |
| paint_tier | text | budget / standard / premium (affects AI estimate) |
| timezone | text | Default America/New_York |
| onboarding_completed | boolean | Gate for dashboard access |
| stripe_customer_id | text | Stripe billing |
| stripe_subscription_id | text | Stripe billing |
| subscription_status | text | active / trialing / canceled / past_due |
| trial_ends_at | timestamp | 14-day trial window |

---

### `leads`
One row per homeowner inquiry. Created when homeowner submits the public form, or when painter adds manually.

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| company_id | uuid | FK → companies |
| homeowner_name | text | Required |
| homeowner_email | text | Optional (required for quote send) |
| homeowner_phone | text | Required, stored E.164 |
| address | text | Full address string |
| city, state, zip | text | Optional |
| service_type | text | interior / exterior / both / other |
| description | text | Homeowner's project description |
| preferred_timeline | text | asap / within_2_weeks / within_month / flexible |
| status | text | new / contacted / quoted / scheduled / won / lost |
| ai_estimate_low | integer | Cents |
| ai_estimate_high | integer | Cents |
| ai_confidence | text | low / medium / high |
| ai_estimate_assumptions | text[] | Array of assumption strings shown in UI |
| ai_photo_summary | text | AI's description of photos |
| quoted_amount | integer | Cents — legacy manual field, being phased out |
| notes | text | Painter's private notes |
| source | text | widget / qr / direct_link / manual |
| confirmation_sent_at | timestamp | Prevents double-sending homeowner confirmation |
| created_at, updated_at | timestamp | |

---

### `lead_photos`
Photos uploaded by homeowner during lead form submission.

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| lead_id | uuid | FK → leads |
| photo_url | text | Supabase Storage public URL |
| photo_type | text | room / wall / exterior / damage / other |
| ai_analysis | jsonb | Stored AI vision response (nullable) |
| created_at | timestamp | |

---

### `quotes`
One quote per lead (V1 — multiple quotes per lead is V2).

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| company_id | uuid | FK → companies |
| lead_id | uuid | FK → leads (nullable) |
| quote_number | text | Sequential per company: CC-0001 |
| quote_type | text | interior / exterior / both / custom |
| status | text | draft / sent / accepted / declined / expired |
| issue_date | text | YYYY-MM-DD |
| valid_until | text | YYYY-MM-DD (default: issue + 30 days) |
| line_items | jsonb | Array of QuoteLineItemData (see below) |
| subtotal_cents | integer | Sum of line item totals |
| discount_type | text | flat / percent / null |
| discount_cents | integer | Flat amount or calculated percent discount |
| tax_rate_bps | integer | Basis points e.g. 875 = 8.75% |
| tax_cents | integer | Calculated tax amount |
| total_cents | integer | Final total after discount + tax |
| homeowner_message | text | Shown on PDF and public view |
| deposit_note | text | e.g. "50% deposit required to schedule" |
| internal_notes | text | Private, not shown to homeowner |
| public_token | text | Random hex, used for /q/[token] URL |
| sent_at | timestamp | When painter clicked Send Quote |
| viewed_at | timestamp | First time homeowner opened the public link |
| accepted_at | timestamp | When homeowner accepted |
| declined_at | timestamp | When homeowner declined |

**QuoteLineItemData (JSONB structure):**
```
id: string
sortOrder: number
name: string          // e.g. "Walls", "Prep Work"
description: string   // optional detail
quantity: string      // numeric string
unit: string          // sqft | lf | hr | flat | ea
unitPrice: string     // dollar string e.g. "1.50"
totalCents: number    // qty × unitPrice × 100
```

---

### `contracts`
One contract per lead. Linked to a quote optionally.

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| company_id | uuid | FK → companies |
| quote_id | uuid | FK → quotes (nullable) |
| lead_id | uuid | FK → leads (nullable) |
| status | text | draft / sent / signed / void |
| contract_body | text | Full contract text, edited by painter |
| signer_name | text | Typed name on signing |
| signer_email | text | Homeowner email at time of signing |
| signer_ip | text | IP address at time of signing |
| public_token | text | Random hex, used for /contract/[token] URL |
| sent_at | timestamp | When painter clicked Send Contract |
| viewed_at | timestamp | First time homeowner opened the link |
| signed_at | timestamp | When homeowner signed |

---

## 8. Screens & Functionality

---

### 8.1 Public Lead Form — `/quote/[companyId]`
**Who sees it:** Homeowners. Public, no auth. Linked from QR codes, Google Business Profile, painter's website, text messages.

**Purpose:** Capture homeowner contact info and project details. Run AI estimate. Create a lead in the DB.

**Layout:** Centered card `max-w-[480px]`, white bg, rounded-[18px], border. Full page gradient bg `from-[#F8FAFC] to-white`.

**Brand Header (always visible):**
- Dark navy gradient bg (`#0F1628 → #1E2A45`)
- Orange gradient logo badge ("P" letter)
- Business name (bold, white, Sora font)
- "Free estimate" subtitle (white/50)

**Progress bar:** Orange gradient, `h-1`, width animates as steps advance.

**Inactive state (subscription expired):**
- "Quote form temporarily unavailable"
- "{businessName} is not currently accepting online quote requests. Please contact them directly."

**Step flow:** Steps advance forward/back without page reload. Back button visible on all steps after first.

**Step: Service Type**
- Title: "What needs painting?"
- 4 tap options (large tap targets): Interior / Exterior / Both / Other — each with subtitle description
- Selected state: orange border, orange-50 bg

**Steps: Rooms, Home Size, Scope, Condition (Interior path)**
- Each is a single-question step with 4 tap options
- Rooms: 1–2 / 3–4 / 5+
- Home Size: Small / Medium / Large / Not sure
- Scope: Walls only / Walls + ceilings / Walls, ceilings, trim & doors / Not sure
- Condition: Good / Some prep needed / Significant prep needed / Not sure

**Steps: Stories, Condition (Exterior path)**
- Stories: 1 story / 2 stories / 3+ stories
- Condition: Good / Fair / Needs work / Not sure

**Step: Timeline**
- "When do you need it done?"
- ASAP / Within 2 weeks / Within a month / Flexible

**Step: Contact Info**
- Label: "Almost there" (uppercase gray)
- Title: "Your contact info"
- Fields with inline error states:
  - Full name (required)
  - Phone number (required, E.164 validated via `libphonenumber-js`)
  - Email (required, typo detection — gmail.con → gmail.com)
  - Property address (optional)
- Button: "See my estimate →" or "Submit request →" (orange, full-width)
- On submit: creates lead in DB (`source = widget`), painter gets contact notification email

**Step: Photos (optional)**
- "Add photos (optional)" with emoji header
- File picker — up to 5 photos, previewed as pills with filename
- "Submit with photos →" or "Skip — show my estimate now"

**Step: Processing**
- Spinner (w-12 h-12)
- Rotating messages from SPINNER_MESSAGES array, one every 2.2s
- Subtitle: "This takes about 10–20 seconds"
- Photos sent as base64 to GPT-4o

**Step: Results**
- Title: "Your estimate" (uppercase gray label)
- Estimate range: `$X,XXX – $Y,YYY` (text-[2.4rem], Sora font, extrabold)
- If both interior + exterior: breakdown by type
- Assumptions box (blue bg): "Based on" label + bulleted assumption list
- Company info card: logo badge, business name, service area
- "Request received" confirmation box
- Amber warning: "This is a preliminary ballpark estimate only. Your final price will be determined after an in-person assessment."
- Optional: PaintVisualizer component (AI color recoloring of uploaded photos)
- If AI fails: shows "Request received" state, no estimate, lead still saved

**Step: Other Results**
- "📋 Request received" — explains custom quote needed, company info card

**Key behaviors:**
- Lead created on contact step submit — captures contact before drop-off
- Rate limited: 10 submissions per IP per hour
- `viewedAt` not tracked on lead form

---

### 8.2 Onboarding — `/onboarding`
**Who sees it:** New painters after signing up. Gates dashboard access until complete.

**Layout:** Full screen centered, `max-w-md` card, white, rounded-2xl, shadow.

**Progress dots:** `h-1.5` rounded pills — active = w-6 orange, inactive = w-4 gray.

**Step 1: Business Info**
- Title: "Set up your account" / "Takes about 2 minutes."
- Fields:
  - Business name (placeholder "Austin Pro Painters")
  - Your name
  - Email address
  - Mobile number — note: "Used for SMS notifications — must be a mobile number, not a landline."
  - Service area (optional, placeholder "Greater Austin area")
- Button: "Continue →" — disabled until required fields filled

**Step 2: Rates**
- Title: "Your default rate"
- Fields:
  - Labor rate per sqft (optional, placeholder "1.75") — note: "Industry average $1.50–$3.50. Skip if unsure."
  - Paint quality: 3 pill buttons — Budget / Standard / Premium — with price ranges
- Buttons: "← Back" + "Finish setup →"

**Step 3: Ready**
- "🎉 You're all set!"
- QR code (w-40 h-40, rounded-xl)
- Lead form URL (monospace, break-all)
- "Copy link" button (shows "Copied!" on success)
- "Download QR" button
- CTA: "Activate your quote link →" (orange, full-width)
- Footer: "Start your 14-day free trial — no charge until the 14 days are up."

**On completion:** `onboarding_completed = true`. Welcome email to painter. Redirect to dashboard.

---

### 8.3 Dashboard Home — `/dashboard`
**Who sees it:** Authenticated painters.

**Layout:** Full width, `space-y-8`. Two-column grid (main + optional sidebar). Sora font for headings.

**Trial/Inactive CTA Banner** (if no active subscription):
- Orange gradient bg, Zap icon
- "Your quote link and lead capture are inactive"
- "Start free trial →" button

**Header:**
- Title: "Dashboard"
- Subtitle: "Welcome back, {firstName}"
- Buttons: "View all leads" (bordered) + "+ Add lead" (orange, hidden if inactive)

**KPI Cards:** `grid-cols-2 md:grid-cols-4`, each with colored top accent bar (h-[3px])
- **This Month** (orange bar) — lead count, "leads captured"
- **Last 7 Days** (gray bar) — lead count, "leads captured"
- **Conversion** (gray bar) — "quoted → won" %, green text if > 0, "—" if none
- **Revenue Won** (gray bar) — formatted dollar amount, orange if > 0, "—" if none

**Recent Leads table:** White card, rounded-[14px], border
- Header: "Recent leads" + "View all →" link
- Columns: Contact | Estimate | Status | Received
- Each row:
  - Name + "NEW" badge (blue pill, if < 24h old and status=new)
  - Phone (orange, `tel:` link)
  - Estimate range or "No estimate"
  - Status badge (color-coded)
  - Time ago (e.g., "2h ago")
  - Hover: `bg-[#FAFBFC]`
- Empty state: "No leads yet. Share your quote link to start capturing leads."

---

### 8.4 Leads List — `/dashboard/leads`
**Who sees it:** Authenticated painters.

**Layout:** Full width, `space-y-5`.

**Header:**
- Title: "Leads"
- Subtitle: "{count} result(s)"
- "+ Add lead" button (orange, or tooltip if inactive)

**Filter bar:**
- Search input (debounced 300ms, updates `?q=` URL param)
- Status filter dropdown (updates `?status=` URL param)
- "Clear" link (shown when any filter is active)

**Table columns:** Contact | Service | Estimate | Status | Received | Actions
- **Contact:** Name (semibold) + "NEW" badge, phone (`tel:`), email (`mailto:`)
- **Service:** Interior / Exterior / Interior + Exterior / Other
- **Estimate:** "$X,XXX–$Y,YYY" or "No estimate"
- **Status:** Color-coded badge — new=blue, contacted=yellow, quoted=purple, scheduled=indigo, won=green, lost=gray
- **Received:** Formatted time ago
- **Actions:** Row action menu (LeadRowActions component)

**Empty states:**
- With active filters: "No leads match your filters."
- No leads at all: "No leads yet. Share your quote link to get started."

**Pagination:** "Next page →" link shown when results hit page limit (25/page).

---

### 8.5 Lead Detail — `/dashboard/leads/[id]`
**Who sees it:** Authenticated painters.

**Layout:** `grid-cols-1 lg:grid-cols-[1fr_320px]` — left = main, right = 320px sidebar.

**Navigation:** "← All leads" link above header.

**Email banner** (shown only when `homeownerEmail` is null):
- Amber bg, non-dismissable, rendered between back link and header
- AlertTriangle icon + "No email on file" title + explanation text
- Inline email input + "Save" button
- On save: PATCHes `/api/leads/[id]` with `homeownerEmail`, dismisses itself
- Enter key submits

**Header:**
- Title: `{homeownerName}` (text-[1.4rem], Sora)
- Subtitle: "Received {formatted date}"
- Action buttons (right-aligned):
  - "Request project details" — visible only if lead has email and no description. Sends homeowner pre-filled form link.
  - "Quote" — link to quote builder (feature-flagged). Disabled (gray, unclickable `<span>`, tooltip "Add homeowner email first") when no email on file.
  - "Contract" — link to contract editor (feature-flagged). Same disabled behavior when no email.
  - "Delete" — shows inline "Are you sure?" confirmation on click → hard delete → redirect to leads list

**Left column — sections stacked with `space-y-5`:**

**Status Section** (white card, rounded-[14px], border):
- Title: "Status" (uppercase label)
- 6 pill buttons: New | Contacted | Quoted | Scheduled | Won | Lost
- Active state: orange bg, white text
- Inactive: gray border, gray text
- Click: immediate PATCH to `/api/leads/[id]`, shows "Current: {Status}" below
- No save button — auto-saves on click

**Job Details Section** (white card):
- Title: "Job Details"
- Service type label (Interior / Exterior / Interior + Exterior / Other)
- Timeline label (ASAP / Within 2 weeks / Within a month / Flexible)
- Description text (leading-relaxed)
- Hidden entirely if all fields null

**AI Estimate Section** (gradient card, `#FFF7ED → #FFFBF5`, shown only if estimate exists):
- "AI Estimate" orange badge (uppercase)
- "$X,XXX – $Y,YYY" (text-2xl, bold)
- Confidence badge: High (green) / Medium (yellow) / Low (red)
- Assumption bullets (text-sm, gray)
- Disclaimer: "Ballpark only — based on homeowner description. Verify on-site."

**Photo Assessment Section** (shown only if `aiPhotoSummary` exists):
- "Photo Assessment" title + "AI" badge
- Text block (leading-relaxed)

**Photos Section** (shown only if photos exist):
- Title: "Photos ({count})"
- `grid-cols-3 gap-2` thumbnail grid
- Each: clickable image → opens full-size in new tab

**Private Notes Section** (white card):
- Title: "Private Notes"
- 4-row textarea, placeholder "Add private notes about this lead..."
- "Save notes" button (white bg, border `#0F1628`)
- Success: shows "Saved!" for 2 seconds

**Right column (320px sidebar) — stacked:**

**Contact Section** (white card):
- Title: "Contact"
- Phone (orange, `tel:` link)
- Email (orange, `mailto:` link, optional)
- Address (gray, optional)

**Documents Section** (white card, shown only if quote or contract exists):
- Title: "Documents"
- Quote row (if exists): FileText icon + quote number (e.g., "CC-0042") + total amount + status badge. Clickable → navigates to quote page. Hover: orange border + orange-50/30 bg.
- Contract row (if exists): FileText icon + "Contract" + signer name if signed + status badge. Clickable → navigates to contract page.

---

### 8.6 New Lead (Manual) — `/dashboard/leads/new`
**Who sees it:** Authenticated painters.

**Purpose:** Add a lead from a phone call, referral, or in-person conversation.

**Fields:**
- Name (required), phone (required), email (optional), address (optional)
- Service type selector
- Description textarea (with hint bullets when empty)
- Timeline selector
- Up to 5 photos
- "Run AI estimate" checkbox — enabled only once description is filled
- Private notes textarea

**On save:** Creates lead with `source = manual`. Sends painter new-lead notification email.

---

### 8.7 Quote Builder — `/dashboard/leads/[id]/quote`
**Who sees it:** Authenticated painters. Feature-flagged (`NEXT_PUBLIC_FEATURE_QUOTES=true`).

**Layout (draft/sent state):** `grid-cols-1 xl:grid-cols-[1fr_420px]` — left editor, right sticky preview.

**Header:**
- Back link: "← {homeownerName}"
- Quote number badge: e.g., "CC-0042" or "New Quote"
- Status badge: draft / sent / accepted / declined
- Buttons (right):
  - "Save Draft" — gray border, shows "Saved" + checkmark on success
  - "PDF" — gray border link, shown only after first save
  - "Send Quote" / "Resend" / "Sent!" — orange, disabled while sending

**Error banner** (red bg, shown on send failure).

**Left Panel — Editor (white card):**

*Quote Type row:*
- 4 pill buttons: Interior | Exterior | Interior + Exterior | Custom
- Selecting Interior/Exterior/Both loads a default line item template
- Message shown: "Template loaded — edit line items as needed."

*Line Items Table:*
- Column headers: Description | Qty | Unit | Unit Price | Total | (delete)
- Each row:
  - Name input (no border, underline on hover)
  - Description input (optional, gray, text-sm)
  - Quantity (number input, min 0)
  - Unit dropdown: sqft / lf / hr / flat / ea
  - Unit price (number input, $ prefix)
  - Total: auto-calculated display, or "—"
  - Trash icon button (red on hover)
- "+ Add line item" button (orange text, below table)

*Totals:*
- Discount: "$ flat" or "% percent" toggle + value input
- Tax rate: number input with % suffix

*Quote Details:*
- Issue date (date input)
- Valid until (date input)
- Message to homeowner (3-row textarea)
- Deposit note (text input, optional)
- Internal notes (2-row textarea, gray — not shown to homeowner)

**Right Panel — Live Preview (sticky top-6, white card):**
- Header: "Quote Preview"
- Company name (bold)
- Business phone / email / website (optional, only if set)
- Quote number + issue/valid dates (right-aligned)
- "Prepared for" block: homeowner name, address, phone, email
- Line items: name, description, calculation detail, total (right-aligned)
- Totals: Subtotal | Discount | Tax | Total (bold, larger)
- Homeowner message (if present)
- Deposit note (orange bg pill, if present)
- Disabled "Accept Quote" button (opacity-60)
- Disabled "Decline" button
- "Preview only — buttons activate when sent" note

**Read-Only State (accepted or declined):**
- Status banner at top (green for accepted with timestamp, gray for declined with timestamp)
- Non-editable quote summary card showing: quote number, dates, total, all line items, message, deposit note
- "Download PDF" link
- No edit buttons visible

---

### 8.8 Public Quote View — `/q/[token]`
**Who sees it:** Homeowners. Public, no auth.

**Layout:** `min-h-screen bg-gray-50 py-8 px-4`, centered `max-w-2xl` card. White bg, rounded-2xl, border, shadow.

**Status banners (conditional, shown above card):**
- Accepted: green bg — "You accepted this quote" + formatted date
- Declined: gray bg — "You declined this quote" + formatted date
- Expired: amber bg — "This quote has expired. Contact us for an updated quote."

**Card — Header section:**
- Company name (lg font-bold)
- Business phone (optional)
- Business email (optional)
- Website (optional)
- "Quote" label (uppercase, right-aligned) + quote number
- Issue date + "Valid until" date

**Card — "Prepared for" section:**
- Homeowner name (bold)
- Address, phone, email (each optional)

**Card — Line Items section** (if items exist):
- Column headers: Description (1fr) | Total (80px)
- Each item: name (font-medium), description (optional, gray, text-xs), qty × unit price calculation detail, total (right-aligned, bold)

**Card — Totals:**
- Subtotal (gray)
- Discount (green, shows percent if applicable, hidden if 0)
- Tax (gray, shows rate, hidden if 0)
- Total (bold, larger font)

**Card — Message + Deposit Note:**
- Homeowner message (text-sm, gray, leading-relaxed)
- Deposit note (orange bg, orange border, orange text)

**Card — Actions** (shown only if status=sent and not expired/accepted/declined):
- "Accept Quote" (orange, full-width, lg font-semibold, py-3, rounded-xl)
- "Decline" (white bg, gray border, text-sm)
- Rendered via `QuoteRespondForm` client component

**QuoteRespondForm states:**
- `idle`: Accept + Decline buttons
- `declining`: textarea ("Reason for declining — optional") + Cancel + "Confirm Decline" buttons
- `loading`: buttons disabled
- `accepted`: CheckCircle icon (green), "Quote Accepted!" + "We'll be in touch shortly to collect your deposit and schedule the job."
- `declined`: XCircle icon (gray), "Quote Declined" + "Thank you for letting us know."
- `error`: red error text below buttons

**Footer:** "Powered by CraftCapture" (centered, text-xs, gray).

**First view behavior:** Updates `viewed_at` in DB (fire-and-forget, does not block render).

---

### 8.9 Contract Editor — `/dashboard/leads/[id]/contract`
**Who sees it:** Authenticated painters. Feature-flagged (`NEXT_PUBLIC_FEATURE_CONTRACTS=true`).

**Layout (draft state):** `grid-cols-1 xl:grid-cols-[1fr_380px]` — left editor, right sticky preview.

**Header:**
- Back link: "← {homeownerName}"
- "Contract" label
- Status badge: draft / sent / signed / void
- Buttons (right, draft only):
  - "Save Draft" — gray border, shows "Saved" + checkmark
  - "Send Contract" — orange

**Error banner** (red bg, shown on send failure).

**Left Panel — Editor (white card, draft only):**
- Title: "Contract Body"
- Description: "Edit the contract text below. The homeowner will see exactly this when they receive the signing link."
- Textarea: 36 rows, monospace font, resizable, orange focus ring

**Right Panel — Homeowner View Preview (sticky, draft only):**
- Header: "Homeowner View" (FileSignature icon)
- "Prepared for" block: homeowner name, address, phone, email
- "Contract Preview" label (text-[.65rem], uppercase, gray)
- `<pre>` of contract body (text-xs, whitespace-pre-wrap)
- Signature input box (disabled): label "Your full name", placeholder "Homeowner types here..."
- Disabled "Sign Contract" button (orange, opacity-40)
- "Preview only — activates when sent"

**Default template** (auto-generated on first load if no existing contract):
Sections: Date, Parties, Scope of Work, Payment Terms (50% deposit), Timeline, Materials, Change Orders, Warranty (1 year labor), Liability, Cancellation (48h notice). Pre-filled from lead + company data.

**Read-Only State (sent / signed / void):**
- Status badge in header
- "Resend" button (orange) if status=sent
- Green banner if signed: "Signed by {homeownerName}. A signed PDF was emailed to you."
- Contract body in `<pre>` (whitespace-pre-wrap, font-sans)
- Signature block at bottom (if signed):
  - "Electronic Signature" label (uppercase, gray)
  - Signer name (font-semibold)
  - Signed date + time (text-xs)
  - "Electronically signed — valid under the ESIGN Act" (text-xs, gray-300)

---

### 8.10 Public Contract Signing — `/contract/[token]`
**Who sees it:** Homeowners. Public, no auth.

**Layout:** `min-h-screen bg-gray-50 py-8 px-4`, centered `max-w-2xl`. White card, rounded-2xl, border, shadow.

**Status banners:**
- Signed: green bg — "Contract Signed" + signer name + date
- Void: gray bg — "This contract has been voided. Contact {businessName} for more information."

**Card — Header:**
- Company name (lg font-bold)
- Business phone, email (optional)
- "Service Agreement" label (uppercase, right-aligned)
- Contract creation date

**Card — "Prepared for" block:**
- Homeowner name (base font-semibold)
- Address, phone, email (optional)

**Card — Contract Body:**
- Full contract text as `<pre>` (text-sm, whitespace-pre-wrap, leading-relaxed, font-sans)

**Card — Signature section:**
- If already signed: signer name (sm, green-700) + date + "Electronically signed — valid under the ESIGN Act"
- If can sign (status=sent, not signed/void): renders `ContractSignForm` client component
- If cannot sign: disabled "Sign Contract" button

**ContractSignForm states:**
- `idle`:
  - Label: "Type your full name to sign"
  - Disclaimer: "By signing, you agree to the terms of this contract. This constitutes a legally binding electronic signature under the ESIGN Act." (text-xs, gray)
  - Text input (placeholder = homeowner name from lead, orange focus ring)
  - "Sign Contract" button (orange, full-width, py-3, disabled if name empty)
- `loading`: button shows "Signing..."
- `signed`: CheckCircle (green, w-10), "Contract Signed!" + "Thank you, {name}. A copy has been sent to the contractor. You're all set."
- `error`: red error text below button

**Footer:** "Powered by CraftCapture" (text-xs, gray, centered).

**First view behavior:** Updates `viewed_at` (fire-and-forget).

---

### 8.11 Settings — `/dashboard/settings`
**Who sees it:** Authenticated painters.

**Layout:** `max-w-xl mx-auto space-y-8`.

**Lead Form Link section:**
- Title: "Your lead form link"
- Lock icon if inactive
- Read-only input with full URL
- External link icon button + Copy button (shows "Copied!" on success)
- Orange warning if inactive: "Inactive — start your free trial to go live."

**QR Code section:**
- Title: "QR code"
- 256px QR image (opacity-25 if inactive, skeleton loader while generating)
- "Download PNG" + "Print PDF" buttons
- Warning if inactive

**Business Info form:**
- Business name (required)
- Owner name (required)
- Owner phone / personal cell (required, private — not shown to homeowners)
- **Customer-Facing Contact** subsection:
  - Business phone (optional) — shown on PDFs and public pages
  - Business email (optional) — shown on PDFs and public pages
- Service area (optional)
- Website URL (optional)

**Estimate Pricing section:**
- Labor rate ($/sqft, optional, placeholder "1.75")
- Paint quality: 3 pill buttons — Budget ($20–$35/gal) / Standard ($25–$55/gal) / Premium ($55–$85/gal)

**Submit:**
- "Save changes" button (dark bg)
- "Saved!" success text (green)
- Error text (red, conditional)

---

### Design System

**Colors:**
- Primary action: `#F97316` orange — buttons, links, accents, focus rings
- Page heading text: `#0F1628` dark navy (Sora font)
- Borders: `#E2E8F0` light, `#CBD5E1` medium
- Status badges: new=blue, contacted=yellow, quoted=purple, scheduled=indigo, won=green, lost=gray
- Errors: red-50 bg + red-200 border + red-700 text
- Success: green-50 bg + green-200 border + green-700 text

**Typography:**
- Headings/display: Sora font (text-[1.4rem] to text-[2.4rem], extrabold)
- Body: system sans (text-xs to text-base)

**Cards:** `bg-white rounded-[14px] border border-[#E2E8F0]` — used consistently across all dashboard panels.

**Interactive states:**
- Focus: `focus:ring-2 focus:ring-orange-400`
- Disabled: `opacity-40` to `opacity-60`
- Hover on rows: `hover:bg-[#FAFBFC]`
- Selected pill: orange border + orange-50 bg

---

## 9. Email Notifications

All emails sent via Resend. Controlled by `EMAIL_ENABLED` env var.

| Trigger | Recipients | Content |
|---|---|---|
| Homeowner starts lead form (contact step) | Painter | Name, dashboard link |
| Homeowner completes lead form | Painter | Full contact info, service type, description, AI estimate, dashboard link |
| Homeowner completes lead form | Homeowner | Confirmation, AI estimate range, painter phone, "within 24 hours" |
| Painter sends "Request Details" | Homeowner | Pre-filled form link |
| Painter completes onboarding | Painter | Welcome email, lead form link, next steps |
| New signup | Internal (NOTIFY_EMAIL) | Business name, owner info |
| Painter sends quote | Homeowner | Quote summary (total, valid until), "View & Accept" button, PDF attached |
| Homeowner accepts quote | Painter | "Accepted" notification, homeowner phone + email, dashboard link |
| Homeowner declines quote | Painter | "Declined" notification, optional reason, homeowner phone + email, dashboard link |
| Painter sends contract | Homeowner | "Review & Sign" button with signing link |
| Homeowner signs contract | Painter | "Signed" notification, homeowner phone + email, signed PDF attached, dashboard link |
| Homeowner signs contract | Homeowner | Confirmation, signed PDF attached, painter business phone |

---

## 10. Feature Flags

| Flag | Purpose |
|---|---|
| `NEXT_PUBLIC_FEATURE_QUOTES` | Shows Quote button on lead detail, enables quote builder |
| `NEXT_PUBLIC_FEATURE_CONTRACTS` | Shows Contract button on lead detail, enables contract editor |

Both default to `false` in production until ready to expose.

---

## 11. API Routes Summary

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | /api/leads/public | None (rate limited) | Homeowner submits lead form |
| PATCH | /api/leads/public/[leadId] | None | Update partial lead, run AI |
| GET | /api/leads/public/company/[companyId] | None | Fetch company branding for lead form |
| GET | /api/leads | Clerk | List leads (search, filter, paginate) |
| POST | /api/leads | Clerk | Manual lead creation |
| GET | /api/leads/[id] | Clerk | Lead detail |
| PATCH | /api/leads/[id] | Clerk | Update status, notes, quoted amount |
| DELETE | /api/leads/[id] | Clerk | Delete lead |
| GET | /api/leads/[id]/photos | Clerk | Lead photos |
| POST | /api/company | Clerk | Create company (onboarding) |
| GET | /api/company | Clerk | Get current company |
| PATCH | /api/company | Clerk | Update company settings |
| GET | /api/quotes | Clerk | List quotes (filter by leadId) |
| POST | /api/quotes | Clerk | Create quote |
| GET | /api/quotes/[id] | Clerk | Quote detail |
| PATCH | /api/quotes/[id] | Clerk | Update quote |
| DELETE | /api/quotes/[id] | Clerk | Delete quote |
| GET | /api/quotes/[id]/pdf | Clerk | Stream PDF download |
| POST | /api/quotes/[id]/send | Clerk | Send quote email to homeowner |
| POST | /api/quotes/[id]/respond | Token | Accept or decline quote (public) |
| GET | /api/contracts | Clerk | List contracts (filter by leadId) |
| POST | /api/contracts | Clerk | Create contract |
| GET | /api/contracts/[id] | Clerk | Contract detail |
| PATCH | /api/contracts/[id] | Clerk | Update contract |
| DELETE | /api/contracts/[id] | Clerk | Delete contract |
| POST | /api/contracts/[id]/send | Clerk | Send contract email to homeowner |
| POST | /api/contracts/[id]/sign | Token | Sign contract (public) |
| POST | /api/ai/estimate | Clerk | Run AI photo estimate |
| POST | /api/qr | Clerk | Generate QR code PDF |

---

## 12. DB Writes Per Endpoint

Exact columns written for each key operation.

---

### `POST /api/leads/public` — Homeowner submits lead form
**Table:** `leads`
| Column | Value |
|---|---|
| `company_id` | `body.companyId` |
| `homeowner_name` | `contact.name.trim()` |
| `homeowner_email` | normalized/validated email |
| `homeowner_phone` | normalized E.164 phone |
| `address` | `contact.address?.trim()` or null |
| `service_type` | `body.serviceType` or null |
| `description` | `body.description?.trim()` or null |
| `preferred_timeline` | `body.timeline` or null |

---

### `PATCH /api/leads/[id]` — Painter updates lead
**Table:** `leads`
| Column | Value |
|---|---|
| `status` | `body.status` — validated against: new / contacted / quoted / scheduled / won / lost |
| `notes` | `body.notes` |
| `quoted_amount` | `body.quotedAmount` |
| `homeowner_email` | `body.homeownerEmail` — server-side regex validated, trimmed |

Only fields present in request body are written.

---

### `POST /api/quotes` — Create quote
**Table:** `quotes`
| Column | Value |
|---|---|
| `company_id` | authenticated company ID |
| `lead_id` | `body.leadId` or null |
| `quote_number` | sequential per company: CC-0001, CC-0002… |
| `quote_type` | `body.quoteType` (default: `"interior"`) |
| `status` | hardcoded `"draft"` |
| `issue_date` | `body.issueDate` |
| `valid_until` | `body.validUntil` |
| `line_items` | recalculated from `body.lineItems` via `recalculateTotals()` |
| `subtotal_cents` | server-calculated: sum of line item totals |
| `discount_type` | `body.discountType` or null |
| `discount_cents` | `body.discountCents`, clamped to `[0, subtotal]` |
| `tax_rate_bps` | `body.taxRateBps` (default: `0`) |
| `tax_cents` | server-calculated: `(subtotal - discount) × taxRateBps / 10000` |
| `total_cents` | server-calculated: `subtotal - discount + tax` |
| `homeowner_message` | `body.homeownerMessage` or null |
| `deposit_note` | `body.depositNote` or null |
| `internal_notes` | `body.internalNotes` or null |
| `public_token` | random 32-char hex |

---

### `PATCH /api/quotes/[id]` — Update quote (draft edits)
**Table:** `quotes`

When `lineItems` is present in body, all totals are recalculated server-side via `recalculateTotals()` — client-sent `subtotalCents`, `taxCents`, `totalCents` are ignored. Non-total fields (`quoteType`, `homeownerMessage`, `depositNote`, `internalNotes`, `issueDate`, `validUntil`) are passed through directly.

---

### `POST /api/quotes/[id]/send` — Painter sends quote to homeowner
**Table:** `quotes`
| Column | Value |
|---|---|
| `status` | `"sent"` |
| `sent_at` | `new Date()` (server timestamp) |

**Table:** `leads` (fire-and-forget)
| Column | Value | Condition |
|---|---|---|
| `status` | `"quoted"` | Only if current status is `new` or `contacted` |
| `quoted_amount` | `quotes.total_cents` | Always — keeps revenue KPI in sync |

Side effects: generates PDF via `@react-pdf/renderer`, emails homeowner with PDF attached + `/q/[token]` link.

---

### `POST /api/quotes/[id]/respond` — Homeowner accepts or declines
**Auth:** Token-validated (public route — no Clerk)

**Table:** `quotes`

**If `action = "accept"`:**
| Column | Value |
|---|---|
| `status` | `"accepted"` |
| `accepted_at` | `new Date()` |

**If `action = "decline"`:**
| Column | Value |
|---|---|
| `status` | `"declined"` |
| `declined_at` | `new Date()` |

**Table:** `leads` (fire-and-forget, inside email block)
| Action | Lead status update | Condition |
|---|---|---|
| accept | `"quoted"` | Only if current status is `new` or `contacted` |
| decline | `"lost"` | Only if current status is not `won` or `scheduled` |

Side effects: emails painter notification with homeowner phone + email + optional decline reason.

Guards: returns 409 if already accepted/declined, 410 if expired (past `valid_until`).

---

### `POST /api/contracts` — Create contract
**Table:** `contracts`
| Column | Value |
|---|---|
| `company_id` | authenticated company ID |
| `lead_id` | `body.leadId` or null |
| `quote_id` | `body.quoteId` or null |
| `status` | hardcoded `"draft"` |
| `contract_body` | `body.contractBody` (default: `""`) |
| `public_token` | random 48-char hex (24 bytes) |

---

### `PATCH /api/contracts/[id]` — Update contract (draft edits)
**Table:** `contracts`

Passes body fields directly to `updateContract()`. Typically just `contractBody`.

---

### `POST /api/contracts/[id]/send` — Painter sends contract to homeowner
**Table:** `contracts`
| Column | Value |
|---|---|
| `status` | `"sent"` |
| `sent_at` | `new Date()` |

Guards: returns 422 if `contractBody` is empty, 422 if lead has no email on file.

Side effects: emails homeowner signing link at `/contract/[token]`.

---

### `POST /api/contracts/[id]/sign` — Homeowner signs contract
**Auth:** Token-validated (public route — no Clerk)

**Table:** `contracts`
| Column | Value |
|---|---|
| `status` | `"signed"` |
| `signer_name` | `body.signerName.trim()` |
| `signer_email` | lead's `homeowner_email` at time of signing |
| `signer_ip` | `x-forwarded-for` → `x-real-ip` → `"unknown"` |
| `signed_at` | `new Date()` |

**Table:** `leads` (fire-and-forget)
| Column | Value | Condition |
|---|---|---|
| `status` | `"won"` | Only if current status is not already `won` |

Side effects: generates signed PDF via `pdf-lib` (contract text word-wrapped + signature block), emails painter (PDF attached), emails homeowner (PDF attached confirmation).

Guards: returns 409 if already signed or voided.

---

### First view — quotes and contracts
Both `/q/[token]` (quote) and `/contract/[token]` (contract) update `viewed_at` on first open:
- **Table:** `quotes` or `contracts`
- **Column:** `viewed_at` — set to `new Date()` only if currently null (fire-and-forget, does not block page render)

---

## 13. V1 Failure Paths & Void Flow

### Design Decision
Back-out flows and document revisions are V1.5. The V1 workaround is a universal **Void** action on every active document. Voiding rewinds lead status one step and frees the painter to start fresh.

### Void Behavior

| Document voided | Lead status rewinds to |
|---|---|
| Quote (any status) | contacted |
| Contract (any status) | quoted |

### Failure Scenarios

| Scenario | Resolution |
|---|---|
| Homeowner ghosts after quote sent | Painter voids quote → lead → contacted → mark lost or retry |
| Homeowner declines quote | Decline response recorded → painter voids declined quote → creates new quote with revised pricing |
| Homeowner ghosts after contract sent | Painter voids contract → lead → quoted → reach out or mark lost |
| Contract signed but job falls through | Painter voids contract → voids quote → marks lead lost |

All failure paths use the same flow: **void the document → status rewinds → start over or bail.**

### Void UI
- "Void" button shown on any active document (quote or contract)
- Confirmation prompt: "This will cancel the [quote/contract] and let you create a new one. Continue?"
- On confirm: status set to `void`, lead status rewound, auto-note appended to lead notes field (e.g., "Quote CC-0042 voided on Apr 9.")
- The auto-note creates a breadcrumb trail without a formal audit log

### Not Yet Built
Void button and status-rewind logic are designed but not yet implemented in V1. Currently a painter must manually change the lead status and the document stays in its final state.

---

## 14. V1 Review — Prioritized Fix List

> Source: `CRAFTCAPTURE_V1_FEEDBACK.md`. Focused on what to fix/tighten before adding new features.

**One-sentence summary:** The product flow is right — lead → quote → contract → job is the correct sequence for painters. The work is making the pieces auto-sync (status, amounts), making each piece independently skippable, and closing the email gap so the happy path doesn't silently break. All tightening, no new scope.

---

### Priority 1 — Fix Before Selling

#### P1.1 Auto-sync lead status on document events ✅ Done

**Problem:** Lead status and document statuses are completely independent. Painters have to manually click the status pill after every action. KPI cards (conversion rate, revenue won) will be wrong for every painter who forgets.

**Fix implemented:** Automatic status transitions wired into 4 API routes:

| Event | Route | Lead status update |
|---|---|---|
| Quote sent | `POST /api/quotes/[id]/send` | `new`/`contacted` → `quoted` |
| Quote accepted | `POST /api/quotes/[id]/respond` | `new`/`contacted` → `quoted` |
| Quote declined | `POST /api/quotes/[id]/respond` | anything except `won`/`scheduled` → `lost` |
| Contract signed | `POST /api/contracts/[id]/sign` | anything except `won` → `won` |

Rules enforced: only advance forward, never backward. All lead updates are fire-and-forget — never block the primary response.

---

#### P1.2 Email gap — hard UI block ✅ Done

**Problem:** Email is optional on the lead form, but quote/contract delivery requires it. A painter who builds a 20-minute quote and clicks "Send" gets a 422.

**Fix implemented:**
- **`EmailBanner` component** — amber, non-dismissable, rendered above the page header whenever `homeownerEmail` is null. Contains an inline email input + Save button. PATCHes `/api/leads/[id]` with `homeownerEmail` and dismisses itself on success.
- **Quote/Contract buttons disabled** — when no email, both render as gray unclickable `<span>` elements with `title="Add homeowner email first"`. Become active `<Link>` elements the moment email is saved.
- **`PATCH /api/leads/[id]`** — updated to accept `homeownerEmail` with server-side regex validation.

---

#### P1.3 Resolve `quoted_amount` split-brain ✅ Done (as part of P1.1)

**Problem:** Revenue data split between `leads.quoted_amount` and `quotes.total_cents`.

**Fix implemented:** On quote send, `leads.quoted_amount` is automatically overwritten with `quotes.total_cents`. This happens on every send/resend, so it stays current if the painter edits and resends. KPI query (`SUM(quoted_amount) WHERE status = 'won'`) is now always accurate for quote-builder users.

---

#### P1.4 Server-side price recalculation ✅ Done

**Problem:** Quote totals passed from client written directly to DB. Frontend rounding bug could produce totals that don't match line items.

**Fix implemented:** `src/lib/quotes/recalculate.ts` — `recalculateTotals()` function used in both POST and PATCH:
- Re-derives each line item's `totalCents` from `parseFloat(quantity) × parseFloat(unitPrice) × 100`
- Sums to `subtotalCents`
- Clamps discount to `[0, subtotal]` — total can never go negative
- Recalculates `taxCents` from `taxRateBps` applied to `(subtotal - discount)`
- Derives final `totalCents`
- Client-sent `subtotalCents`, `taxCents`, `totalCents` are ignored entirely on POST; on PATCH, recalculation runs whenever `lineItems` is present in the body.

---

### Priority 2 — Fix Before It Hurts

#### P2.1 Soft deletes everywhere

**Problem:** Hard DELETE on leads, quotes, contracts. A painter who accidentally deletes a lead loses everything with no recovery.

**Fix:** Add `deleted_at` (nullable timestamp) to leads, quotes, contracts. On DELETE, set `deleted_at = now()`. Filter `WHERE deleted_at IS NULL` in all queries. Optional: toast with 10-second "Undo" on deletion.

---

#### P2.2 Quote expiration cron

**Problem:** Quote expiration only checked when homeowner opens the public link. Painter's dashboard shows stale "sent" status indefinitely for expired quotes.

**Fix:** Daily cron:
```sql
UPDATE quotes SET status = 'expired'
WHERE status = 'sent' AND valid_until < CURRENT_DATE;
```

---

#### P2.3 Void and re-quote flow

*(Also documented in Section 13 — V1 Failure Paths)*

**Problem:** If a homeowner asks for a price change, painter has no path. Can't edit a sent quote, can't create a second quote (one-per-lead V1 constraint), no void action exists.

**Fix:**
1. "Void Quote" button on quote page (visible when status = `sent` or `accepted`)
2. Voiding sets `quotes.status = 'voided'`, regresses `leads.status` back to `contacted`
3. "Quote" button on lead detail becomes active again
4. Painter creates a new quote — relax constraint to: one *active* (non-voided) quote per lead at a time

---

### Priority 3 — UI Tightening

#### P3.1 Make skip-ability obvious

- Add **"Mark as won"** quick-action on lead detail — inline form: amount (optional) + save. Writes `quoted_amount`, sets status to `won`. For painters who agree on price over the phone.
- Allow "Contract" button to work even with no quote. Contract template fills from lead data — no quote dependency needed.
- Don't label the flow as steps 1-2-3. Quote and Contract buttons should feel like tools available at any time, not a checklist.

#### P3.2 Lead detail page density

Page is already the densest screen (status, job details, AI estimate, photo assessment, photos, notes, sidebar contact + documents). Before adding scheduling/payments/invoicing:

Consider a **segmented layout** (not full tabs — just two buttons at top):
- **Overview** (default): status pills, contact sidebar, job details, AI estimate, notes
- **Documents**: quotes, contracts, invoices as vertical timeline with status badges

Only introduce this when the page actually needs relief — likely when deposit/invoice step lands.

---

### Schema Changes Implied by the Above

| Table | Change | Reason |
|---|---|---|
| `leads` | Add `deleted_at` (timestamp, nullable) | Soft delete |
| `leads` | Add `status_changed_at` (timestamp) | Audit trail |
| `quotes` | Add `deleted_at` (timestamp, nullable) | Soft delete |
| `quotes` | Add `voided` to allowed status values | Void/re-quote flow |
| `contracts` | Add `deleted_at` (timestamp, nullable) | Soft delete |

No new tables. No new relationships.

---

## 15. Known Gaps / Next Steps

- **Deposit collection** — no payment link after quote acceptance. Painter collects offline.
- **Scheduling** — no job date/calendar. Painter coordinates over phone.
- **Invoice** — no final payment request. Planned after Stripe Connect.
- **Stripe Connect** — required for in-app payments. Complex onboarding per painter.
- **Google Review request** — auto-send post-job. Simple Resend email with Google Business link.
- **Multiple quotes per lead** — V1 is one quote per lead. V2 would allow revisions.
- **Contract number** — contracts have no sequential number yet (quotes have CC-0001).
- **Quote/contract linked** — `quote_id` exists on contracts table but UI doesn't wire them together yet.
- **Logo upload** — field exists on companies table, upload UI not built.
- **Missed-call text-back** — Twilio A2P 10DLC registration required (10-15 day wait). High impact feature.
- **Embeddable widget** — JS snippet version of lead form for painter's own website.
- **Mobile optimization** — dashboard is not fully optimized for mobile. Lead form is.
