# CraftCapture — Pre-Launch Gameplan
**Synthesized from ChatGPT + Claude AI review | April 2026**

Both AIs agreed on the core diagnosis: the product architecture is right, but there are specific gaps in workflow clarity, onboarding activation, and UX hierarchy that will cause churn before the painter sees value. This is a tightening exercise, not a feature-building exercise.

---

## The Six Must-Fix Items (Before Any Ad Spend)

These are the things both AIs flagged as highest churn risk. Fix these first.

### 1. Onboarding → Billing Gap (CRITICAL)
**Problem:** Step 3 says "You're all set!" and shows the QR code and link, but the quote form is NOT live yet. Painter shares their link, homeowner hits "temporarily unavailable," painter assumes the product is broken and cancels.

**Fix:**
- Do not use celebratory language until billing is activated
- Either: auto-start the trial at onboarding completion (no card required, card at end of 14 days), OR make step 3 explicitly say "One last step — activate your free trial to go live"
- Never let a painter leave onboarding holding a link that doesn't work

---

### 2. Email Required on Manual Leads (CRITICAL)
**Problem:** Painter creates a manual lead with no email, spends 20 minutes building a quote, hits Send, and gets a silent error. Makes the painter feel like the product is broken.

**Fix:**
- Make email required on the manual lead creation form, OR
- Force email capture inline before entering the quote/contract builder if none is on file
- Remove the `(optional)` label — painter email is not optional for any meaningful workflow

---

### 3. Status Auto-Sync from Document Events (CRITICAL)
**Problem:** Quote sent, contract signed — but lead status doesn't update automatically. KPI cards show $0 revenue and 0% conversion for painters who never manually click status pills. The dashboard looks like the product isn't working.

**Fix (wire these up):**
| Event | Auto-advance lead status to |
|---|---|
| Quote sent | `quoted` |
| Quote accepted | `quoted` (confirm it's at least here) |
| Contract signed | `won` |
| Quote declined | `lost` |

- Only advance forward, never regress via auto-sync
- Also backfill `quoted_amount` from `quotes.total_cents` when quote is sent, so Revenue Won is accurate

---

### 4. Won vs. Completed — Visible Distinction (CRITICAL)
**Problem:** "Won" means contract signed (auto-set). "Completed" means job physically done (painter sets manually, triggers review request). This distinction is invisible in the UI. Painters mark things Won thinking they're done, and review requests never fire. This is a silent failure.

**Fix:**
- Add helper text directly under the status pills: *"Mark Completed when the physical job is done — this sends the review request automatically."*
- Add a confirmation modal when painter clicks Completed: "Mark this job complete? This will send [Homeowner Name] a review request email."
- This one change probably doubles the review request send rate

---

### 5. Lead Detail — One Primary Next Action (HIGH)
**Problem:** The lead detail page has no hierarchy. Status pills, Quote button, Contract button, Delete button, Request Details, schedule sidebar, notes, photos — all competing equally. A painter on their phone between coats will close the tab.

**Fix:**
- Add a context-aware "Next step" banner at the top of the lead detail that changes based on state:
  | Lead state | Banner shows |
  |---|---|
  | `new` | "Ready to call? Mark as Contacted after you reach out." |
  | `contacted` | "Ready to quote? Start a quote from the button above." |
  | `quoted` — quote not viewed | "Quote sent — homeowner hasn't viewed it yet." |
  | `quoted` — quote accepted | "Quote accepted. Send a contract to lock in the job." |
  | `won` — no schedule | "Contract signed. Schedule the job." |
  | `scheduled` — date passed | "Job date has passed. Mark Complete to send the review request." |
- Move status section to the very top (currently buried below header actions)
- Make phone number the most visually prominent thing on a new lead (bigger, orange, tap-to-call)

---

### 6. Landing Page — Real Product Screenshots (HIGH)
**Problem:** The current landing page describes features in text cards. No screenshots of the actual product. Painters don't believe text claims. They want to see what they're buying.

**Fix:**
- Take 4–6 clean screenshots: lead dashboard (kanban), lead detail with estimate, quote builder, public quote view homeowner sees, contract signing page, review request email
- Put these in a bento grid feature section — each screenshot with a bold headline and 1-line description
- Above the fold: add a painter-side outcome screenshot (lead detail showing homeowner name, photos, estimate, status) alongside or instead of the QuoteWidget as the primary visual
- The QuoteWidget is great but it's homeowner-side proof. Painters need to see what they get, not what their customer experiences.

---

## Priority 2 — Fix Before It Hurts

These won't block launch but will cause pain in the first few weeks.

### 7. Dashboard Zero State — Activation Checklist
**Problem:** A brand new painter opens the dashboard and sees empty KPI cards and "No leads yet." No sense of progress, no next action.

**Fix:** Show an activation checklist for first-run painters (dismiss once first lead arrives):
- [ ] Copy your quote link
- [ ] Add it to your Google Business Profile
- [ ] Download and save your QR code
- [ ] Add your Google Review URL (to enable automatic review requests)
- [ ] Send yourself a test lead

Replace empty KPI cards with this checklist. Switch to normal dashboard view after first lead.

---

### 8. Completed Status Confirmation Modal
**Problem:** Status pills auto-PATCH with no guardrail. One bad click on "Completed" immediately sends a review request email to a homeowner. That's irreversible.

**Fix:**
- When painter clicks "Completed," show a confirmation:
  - "Mark [Name]'s job as complete?"
  - "A review request will be sent to [homeowner email]"
  - "Confirm" / "Cancel"
- No other status change needs confirmation — just Completed (and possibly Won)

---

### 9. Schedule + Confirmation = One Flow
**Problem:** Saving a schedule date and sending the homeowner a schedule confirmation email are two separate actions. Painters will set the date and forget the email.

**Fix:**
- When painter saves a schedule, default to sending the confirmation email in the same action
- If they don't want to send: an optional "Don't send email" checkbox
- Remove the separate "Send schedule confirmation" button

---

### 10. Widget Embed in Onboarding
**Problem:** The website widget embed is buried in Settings. It's CraftCapture's stickiest feature (if a painter embeds it on their site, canceling breaks their site form = real switching cost). But painters never discover it.

**Fix:**
- Add to onboarding step 3: two options side by side:
  - "Copy your quote link" (share anywhere)
  - "Get your website embed code" (add to your website)
- Also add Google Business Profile tip explicitly: "Add your quote link to your Google Business Profile to capture leads from people searching for painters near you"

---

### 11. Google Business Profile — Explicit in Onboarding + Landing Page
**Problem:** This is the biggest single acquisition channel for painting contractors and it's not mentioned in onboarding or the landing page.

**Fix:**
- Onboarding step 3: "Drop your link into your Google Business Profile → get your first lead within hours"
- Landing page: add this as a specific placement example with a screenshot or illustration of the GBP link placement
- Help docs: add a "Quick wins" section with GBP as step 1

---

### 12. Painter Notification Emails — Make Them Better
**Problem:** The new lead email is the most important touchpoint in the product — it's the first time a painter feels the value. If it's plain text, they'll miss it or dismiss it.

**Fix:**
- New lead email: homeowner name large at top, phone number as a prominent tap-to-call element, AI estimate range in big text, ONE CTA button "View Lead →"
- This email is the first impression of the product. Make it feel like a system that's working hard for them.

---

### 13. "Use Default Rate" Button in Onboarding
**Problem:** Onboarding step 2 asks for sqft rate with placeholder "1.75" but many painters won't know their rate. They'll either skip it (fine) or type a random number that makes every AI estimate wrong for them.

**Fix:**
- Add a "Use suggested default ($1.75/sqft)" one-click button that fills the field
- Painters who don't know their rate get a working estimate; painters who know theirs can override

---

### 14. Stale Lead Nudges — Make Them Visible
**Problem:** Quote nudge and contract nudge exist as Inngest cron jobs but painters have no in-product visibility into which leads need attention.

**Fix:**
- Add a small amber indicator on the leads list for: quote sent but not viewed in 48h, contract sent but not signed in 72h
- Don't build a notification center — just a dot on the row is enough
- Existing "Needs attention" section on dashboard home is good, expand it slightly to include these cases

---

### 15. Won Status — Add "Record Deposit" Action
**Problem:** After contract is signed, the real-world next step is collecting a deposit. Without a place to track this, painters handle it outside the app and the product becomes less central.

**Fix (minimal):**
- Add a simple "Record deposit received" checkbox + amount field on the lead detail after status is `won`
- Doesn't require Stripe Connect — just a recorded note
- Keeps the painter's workflow inside the product

---

## Priority 3 — UX Polish

Lower urgency but meaningful for retention and conversion.

### 16. Status Model — Clarify Naming
Both AIs flagged that "Won" doesn't match painter mental models (they think Won = job done and paid, not contract signed).

**Options (pick one):**
- Option A: Rename `won` → `Approved` or `Job Booked` (contract signed = job is booked)
- Option B: Add helper labels under each pill explaining what it means
- Option C: Keep Won but make it explicit in the Completed tooltip that Won ≠ job done

---

### 17. Kanban — Make It Actually Useful
Currently the kanban is visual-only — no drag and drop. It looks like a pipeline but acts like a list.

**Fix:**
- Add drag-and-drop to kanban cards to change status (saves via PATCH)
- This is the one feature that makes pipeline management feel real

---

### 18. Settings Page — Sub-navigation
The settings page is one long scroll. With all the sections (business info, share settings, Google review URL, notifications, staff, widget embed) it's getting long.

**Fix:**
- Add a simple tab or sticky sub-nav within settings: Business | Notifications | Share & Widget | Staff
- No redesign needed — just group the existing cards under tabs

---

### 19. Help Section — Make It Discoverable
**Fix:**
- Add a "?" icon button in the dashboard header linking to `/dashboard/help`
- First 7 days after signup: show a dismissable banner at the bottom of the dashboard: "New to CraftCapture? Read the setup guide →"

---

### 20. Mobile Dashboard
The dashboard collapses poorly on small screens. Painters are on phones.

**This is a bigger effort but needs to be on the roadmap.** Start with:
- Lead detail page: make the status pills and phone number the first visible elements on mobile
- Leads list: hide less important columns on mobile (estimate, service type) to reduce horizontal crowding
- Dashboard home: single-column KPI stacking that actually looks intentional

---

## Landing Page Redesign — Full Plan

This is its own project. See `landing-page-plan.md` for the competitor analysis. Summary of what needs to happen:

**Hero (above the fold):**
- Keep the QuoteWidget but don't let it be the primary visual
- Add painter-side outcome: a real screenshot of the lead detail or kanban showing organized leads with photos + estimates
- Headline: outcome-focused, not feature-focused. "Stop losing jobs to painters who respond faster" > "Stop chasing customers. Quote faster."
- Both AIs agreed: leading with homeowner demo before proving painter value is wrong

**Feature section:**
- Replace text cards with bento grid of real UI screenshots
- Six cards: lead capture result / quote builder / public quote view / contract signing / pipeline / review request

**Stats bar:**
- Remove generic stats. Add: "One booked job covers 35 months of CraftCapture"
- Move ROI framing from pricing section to stats bar

**Social proof:**
- If no real testimonials yet: prepare the section structure for real names to go in
- Don't use fake-looking city pills — either remove or replace with something credible

**Video:**
- Consider a 60-second muted autoplaying product demo video
- Show: homeowner fills form → AI estimate appears → painter gets notification → dashboard shows lead
- More convincing than any screenshot for non-tech buyers

**Demo CTA:**
- Make the Calendly demo option a visible secondary button in the hero, not a ghost link
- Capture painters who want to be shown rather than self-serve

---

## Implementation Order

### Phase A — Critical (do immediately, before sharing with new painters)
1. Fix onboarding → billing gap (no broken links after onboarding)
2. Make email required on manual lead form
3. Wire status auto-sync from document events
4. Won vs. Completed: add helper text + Completed confirmation modal
5. Lead detail: add context-aware "Next step" banner + move status to top

### Phase B — Before Ad Spend
6. Dashboard zero state → activation checklist
7. Schedule + confirmation = one flow
8. Widget embed in onboarding step 3 + GBP tip
9. Better painter notification emails
10. Use default rate button in onboarding
11. Stale lead indicators on leads list

### Phase C — Landing Page Redesign
12. Take product screenshots
13. Build bento grid feature section
14. Update hero with painter-side visual + outcome headline
15. Revise stats bar
16. Finalize social proof / testimonial structure

### Phase D — Polish
17. Status naming clarification
18. Kanban drag-and-drop
19. Settings sub-navigation
20. Help section discoverability
21. Mobile dashboard improvements

---

## What This Is NOT

Both AIs were explicit: this is not a feature-building exercise. No new features until Phase A and B are done. Every item above is a fix to something that already exists or a clarification of something already built. The risk of adding more before tightening what's here is: painters sign up, get confused, and churn before they see the value. The product loop is right. The activation and clarity layer is not yet good enough.

---

## One-Line Summary from Both AIs

**ChatGPT:** *"Treat activation and workflow clarity as the product now. Not new features."*

**Claude:** *"Fix the six must-fix items before ad spend — these are the difference between trials that convert and trials that churn in 17 hours."*
