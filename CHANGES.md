# CraftCapture — Changes Log
**Tracking all updates made post AI review. Use this to know what to test.**

---

## Phase A — Critical Fixes

### ✅ A1 — Onboarding → Billing Gap
**Files changed:**
- `src/app/(authenticated)/onboarding/page.tsx`

**What changed:**
- Step 3: Removed "You're all set! 🎉" — replaced with "Account created! ✅"
- Step 3: Added amber warning box: "Your link isn't live yet — don't share it until you activate"
- Step 3: QR code shown at reduced opacity to reinforce it's not active yet
- Step 3: "Activate your quote link →" button now calls `POST /api/stripe/checkout` directly and redirects to Stripe — no more detour through `/dashboard/billing`
- Step 3: Button text changed to "Start free 14-day trial →"
- Step 2: Added "Use $1.75 default" one-click button next to the sqft rate field (only shows when field is empty)
- Removed unused `useRouter` import

**How to test:**
1. Create a new account
2. Complete onboarding steps 1 + 2
3. On step 3: confirm amber warning shows, QR looks inactive
4. Click "Start free 14-day trial →" — should go directly to Stripe checkout (not billing page)
5. Complete or cancel Stripe checkout
6. On step 2: confirm "Use $1.75 default" button appears and fills the field on click

---

### ✅ A2 — Email Required on Manual Leads
**Files changed:**
- `src/app/(authenticated)/dashboard/leads/new/_form.tsx`

**What changed:**
- Email field is now **required** — validation blocks submit if empty
- Error message: "Email is required to send quotes and contracts"
- Removed `(opt.)` label from email field
- Email field moved to its own full-width row (was cramped in a 2-col grid with address)
- Helper text under email: "Required to send quotes and contracts." (shown when no error)
- Address field moved to its own full-width row, still optional

**How to test:**
1. Go to `/dashboard/leads/new`
2. Fill in name and phone, leave email blank
3. Click "Add lead" — should show error "Email is required to send quotes and contracts"
4. Confirm email field is full-width and prominent
5. Fill in email and confirm form submits successfully

---

### ✅ A3 — Status Auto-Sync from Document Events
**Files changed:**
- `src/app/api/quotes/[id]/send/route.tsx` — already had sync, no change needed
- `src/app/api/quotes/[id]/respond/route.ts` — patched edge case
- `src/app/api/contracts/[id]/sign/route.ts` — patched edge case

**What was already in place:**
- Quote sent → lead advances to `quoted` (if `new` or `contacted`), `quotedAmount` synced from `total_cents`
- Quote accepted → lead advances to `quoted` (if `new` or `contacted`)
- Quote declined → lead advances to `lost`
- Contract signed → lead advances to `won`

**Edge cases patched:**
- Contract signed: no longer regresses `completed` → `won` (now skips if already `won` or `completed`)
- Quote declined: no longer flips `completed` or already-`lost` leads to `lost` (added both to exclusion list)

**How to test:**
1. Send a quote on a `new` lead → confirm lead auto-advances to `quoted`
2. Have homeowner accept quote → confirm lead stays `quoted` (or advances if behind)
3. Have homeowner decline quote → confirm lead moves to `lost`
4. Have homeowner sign contract → confirm lead moves to `won`
5. Edge case: set a lead to `completed`, then have a quote declined — confirm it stays `completed`

---

### ✅ A4 — Won vs. Completed Distinction
**Files changed:**
- `src/app/(authenticated)/dashboard/leads/[id]/page.tsx`

**What changed:**
- Clicking **Completed** status pill now shows a confirmation modal instead of immediately saving
- Modal shows: "Mark job as complete?" + "A review request email will be sent to [Name] automatically."
- If homeowner has no email: modal warns "No homeowner email on file — review request won't be sent."
- Modal has Cancel / "Yes, mark complete" (teal) buttons
- All other status pills still save instantly with no interruption
- Helper text added below status pills: "Won — contract signed. Completed — job physically done. Mark Completed to send the review request automatically."

**How to test:**
1. Open any lead detail page
2. Click any status pill other than Completed — should save instantly, no modal
3. Click Completed — modal should appear with correct homeowner name
4. Click Cancel — status should not change
5. Click "Yes, mark complete" — status should update to Completed
6. Check that review request email was sent (if Google Review URL is set in Settings)
7. Test on a lead with no homeowner email — modal should show the no-email warning

---

### ✅ A5 — Lead Detail Next Step Banner
**Files changed:**
- `src/app/(authenticated)/dashboard/leads/[id]/page.tsx`

**What changed:**
- Added `NextStepBanner` component between the page header and the 2-col layout
- Banner is context-aware — message changes based on lead status and schedule date
- No extra API calls — derived purely from lead state

**Banner states:**
| Status | Message | Color |
|---|---|---|
| `new` | "New lead — reach out to this homeowner." | Blue |
| `contacted` | "Ready to send a quote?" | Purple |
| `quoted` | "Quote sent — waiting on homeowner's response." | Purple |
| `won` + no schedule | "Contract signed — schedule the job." | Orange |
| `won`/`scheduled` + date passed | "Job date has passed — mark it Complete when done." | Teal |
| `won`/`scheduled` + future date | "Job scheduled — you're all set." | Green |
| `completed` / `lost` | No banner | — |

**How to test:**
1. Open a `new` lead — confirm blue banner shows
2. Change status to `contacted` — banner should update to purple
3. Send a quote — banner should update to "waiting on response"
4. Sign a contract — banner should update to "schedule the job" (orange) if no date set
5. Set a schedule date in the past — banner should show "Job date has passed" (teal)
6. Set a schedule date in the future — banner should show "Job scheduled" (green)
7. Mark as Completed — banner should disappear

---

## Phase B — Before Ad Spend

### ✅ B6 — Dashboard Zero State / Activation Checklist
**Files changed:**
- `src/app/(authenticated)/dashboard/page.tsx`
- `src/app/(authenticated)/dashboard/activation-checklist.tsx` *(new)*

**What changed:**
- New `ActivationChecklist` client component shown when painter has 0 leads
- Checklist has 5 items: Copy quote link, Add to Google Business Profile, Download QR code, Add Google Review URL, Send test lead
- "Add Google Review URL" auto-checks itself (teal checkmark + strikethrough) if `googleReviewUrl` is already set in Settings
- All other items have direct action links (copy button, external link, Settings links, open quote form)
- Shows item count badge (e.g. "1/5") in the card header
- KPI cards, Needs Attention, and Recent Leads sections are hidden until first lead arrives — no more empty zeroes on a blank dashboard
- Once first lead comes in, checklist disappears and normal dashboard view takes over

**How to test:**
1. Create a new account (or clear all leads from a test account)
2. Open `/dashboard` — should see "Get your first lead" checklist, no KPI cards
3. Click "Copy link" — link should copy to clipboard, button should flash "Copied!"
4. Click "Open quote form" — should open the public quote form in a new tab
5. Click "Add in Settings" (Google Review URL item) — should navigate to Settings
6. Set a Google Review URL in Settings, return to dashboard — that item should show as checked
7. Submit a test lead via the quote form
8. Refresh dashboard — checklist should be gone, KPI cards + Recent leads should appear

---

### ✅ B7 — Schedule + Confirmation = One Flow
**Files changed:**
- `src/app/(authenticated)/dashboard/leads/[id]/page.tsx`
- `src/app/(authenticated)/dashboard/schedule/schedule-calendar.tsx`

**What changed:**
- Confirmation email is now merged into the "Save schedule" action — no separate button
- "Send homeowner a confirmation email" checkbox appears when a date is set, checked by default
- Painter can uncheck to skip email; label shows "(no email on file)" if homeowner has no email
- Old separate "Send confirmation" button removed entirely
- Same checkbox added to the calendar slot modal, resets to checked after each save

**How to test:**
1. Open any lead, set a date — checkbox should appear checked by default
2. Click "Save schedule" — schedule saves + confirmation email fires
3. Repeat with box unchecked — schedule saves, no email
4. Test on a lead with no email — label shows "(no email on file)", save still works
5. Schedule from calendar page — same checkbox in the modal
6. Confirm old "Send confirmation" button is gone everywhere

---

### ✅ B8 — Widget Embed in Onboarding Step 3 + GBP Tip
**Files changed:**
- `src/app/(authenticated)/onboarding/page.tsx`

**What changed:**
- Two share option cards added side by side in step 3:
  - "Quote link" card: Copy link + Save QR buttons
  - "Website embed" card: copies the inline widget `<script>` snippet, links to Settings for full embed options
- Blue GBP tip callout added: "Quickest way to get your first lead" with a direct link to Google Business Profile and a one-line explanation of why it works
- Old single-row copy/download buttons replaced by the two-card layout

**How to test:**
1. Create a new account and complete onboarding steps 1 + 2
2. On step 3: confirm two share cards appear side by side
3. Click "Copy link" — link copies to clipboard
4. Click "Save QR" — QR image downloads
5. Click "Copy embed code" — copies the inline widget snippet (paste into a text editor to verify)
6. Confirm blue GBP tip shows with working link to Google Business
7. Confirm "More options in Settings →" text is visible under the embed card

---

### ✅ B9 — Better Painter Notification Emails
**Files changed:**
- `src/lib/email/notifications.ts`

**What changed:**

**New lead email:**
- Orange gradient accent bar at top
- Phone number as 28px tap-to-call hero with "Tap to call" label
- AI estimate in an orange highlight box (26px) — was buried in plain text
- Service/timeline/email/address on one compact secondary line
- Single orange "View Lead →" CTA (was dark "View lead in dashboard →")
- Personal footer: "Hi [Name] — this lead came in via your CraftCapture quote form"

**Quote responded email:**
- Green/red accent bar matching accept/decline outcome
- Outcome in a color-matched callout box with clear next action
- Phone as tap-to-call hero
- Single "View Lead →" CTA
- Cleaner subject: "Quote accepted ✓: Jane Smith"

**How to test:**
1. Submit a test lead via the quote form — check painter inbox for new lead email
2. Confirm phone is large, orange, and tappable
3. If AI estimate exists, confirm it shows in the orange highlight box
4. Accept/decline a quote — check painter notification (green/red bar, callout, tap-to-call)

---

- [ ] B10 — "Use default rate" button in onboarding ✅ (done as part of A1)
### ✅ B11 — Stale Lead Indicators on Leads List
**Files changed:**
- `src/app/(authenticated)/dashboard/leads/page.tsx`

**What changed:**
- Stale leads show a small amber dot + "Needs follow-up" label below their status pill
- The "Received" date also turns amber for stale leads
- Thresholds match the dashboard "Needs Attention" section:
  - `new` → stale after 2 days
  - `contacted` → stale after 2 days
  - `quoted` → stale after 5 days
  - `won` → stale after 3 days (job not scheduled yet)
- Terminal statuses (`completed`, `lost`, `scheduled`) never show stale indicators

**How to test:**
1. Create a test lead and set its `createdAt` to 3 days ago (or wait 2 days)
2. Open `/dashboard/leads` — lead should show amber dot + "Needs follow-up" under its status pill, and the received date should be amber
3. Advance it to `quoted`, update `updatedAt` to 6+ days ago — same indicators should appear
4. Mark it `completed` or `lost` — indicators should disappear
5. Mark it `scheduled` — no stale indicator

## Phase C — Landing Page Redesign
*(not yet started)*

- [ ] Take product screenshots
- [ ] Build bento grid feature section
- [ ] Update hero with painter-side visual + outcome headline
- [ ] Revise stats bar
- [ ] Social proof / testimonial structure

## Phase D — Polish

### ✅ D16 — Status Naming Clarification
Handled as part of **A4**. Helper text added below status pills on lead detail: "Won — contract signed. Completed — job physically done. Mark Completed to send the review request automatically."

---

### ✅ D17 — Kanban Drag-and-Drop
**Files changed:**
- `src/app/(authenticated)/dashboard/leads/leads-kanban.tsx`

**What changed:**
- Converted to a `"use client"` component with full HTML5 native drag-and-drop (no library)
- Dragging a card over a valid column highlights it with an orange ring
- Dropping a card on a column optimistically updates the lead's status in the UI, then PATCHes `/api/leads/${id}` — reverts if the request fails
- The **Completed** column is excluded from drop targets — a tooltip says "Open lead to mark complete" (consistent with A4's confirmation modal)
- Cards show `cursor-grab` / `active:cursor-grabbing`; dragged card fades to 40% opacity
- Navigation (click to open lead) preserved on `div` cards via `router.push`

**How to test:**
1. Go to `/dashboard/leads` and switch to Kanban view
2. Drag a card — column it's hovering over should highlight orange
3. Drop onto a valid column — card should move; confirm status updated in DB
4. Try dropping onto Completed — should not work, tooltip shows
5. Drop on the same column it came from — no-op
6. Kill the network and drag — card should revert after the API call fails

---

### ✅ D18 — Settings Sub-Navigation
**Files changed:**
- `src/app/(authenticated)/dashboard/settings/page.tsx`

**What changed:**
- Added 4-tab nav bar at the top of Settings: **Business | Notifications | Share & Widget | Staff**
- Active tab has an orange underline indicator
- Each settings section is only rendered when its tab is active — no content shift or scroll needed

**How to test:**
1. Go to `/dashboard/settings`
2. Confirm 4 tabs are visible
3. Click each tab — correct section should appear, others should hide
4. Refresh — should default to Business tab

---

### ✅ D19 — Help Section Discoverability
**Files changed:**
- `src/app/(authenticated)/dashboard/layout.tsx`
- `src/components/dashboard/new-user-banner.tsx` *(new)*

**What changed:**
- `HelpCircle` icon (lucide) added to nav bar, linking to `/dashboard/help`
- `NewUserBanner`: indigo banner shown for accounts < 7 days old — "New to CraftCapture? Read the setup guide →"
- Banner is dismissable (X button); dismissed state stored in `localStorage` so it doesn't reappear

**How to test:**
1. Confirm `?` icon is visible in nav and links to `/dashboard/help`
2. Create a new account (< 7 days old) — indigo banner should appear below nav
3. Dismiss banner — it should disappear and not reappear on refresh
4. On a > 7 day old account — banner should not appear

---

### ✅ D20 — Mobile Dashboard Improvements
**Files changed:**
- `src/app/(authenticated)/dashboard/leads/[id]/page.tsx`
- `src/app/(authenticated)/dashboard/leads/page.tsx`
- `src/app/(authenticated)/dashboard/page.tsx`

**What changed:**
- **Lead detail**: Right column (Contact info + Schedule) now renders first on mobile via CSS `order`, so the phone number is immediately visible and tappable without scrolling
- **Leads list table**: Service and Estimate columns hidden on mobile (`hidden sm:table-cell`) — Contact, Status, Received, and Actions remain visible
- **Dashboard recent leads**: Estimate and Received columns hidden on mobile; grid switches from 4-column to 2-column (Contact + Status) on small screens

**How to test:**
1. Open `/dashboard` on a narrow screen (< 640px) — recent leads should show only Contact + Status columns
2. Open `/dashboard/leads` on mobile — table should show Contact, Status, Received, Actions only
3. Open any lead detail on mobile — phone number should be immediately visible at the top, before Status and Job Details
4. On desktop (>= 1024px) — lead detail should show normal 2-column side-by-side layout unchanged
