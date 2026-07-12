# Monetization & Conversion Plan

Reference doc for how Callverted acquires, activates, converts, and retains
customers. Written 2026-07-11. This is the agreed model and the phased build
that implements it. Update this doc as phases land.

## Build status (updated 2026-07-11 eve)

Phases 0–6 all implemented against the mock payment path; `npx tsc --noEmit`
and `next build` both pass. Deferred by decision: 1.4 (mid-wizard autosave) and
0.4 / the real-Stripe flip (section 5). Since the initial build, the go-live
modal was corrected to the real call flow (publish-the-number, not carrier
forwarding) and the activation flag renamed `forwarding_confirmed` ->
`number_published` (migration 0023). Deeper metrics rework shipped (90-day home
snapshot + range-aware Reports).

**DB migrations — all applied to BOTH local dev Postgres and Supabase prod:**
`0020_add_email_captures.sql`, `0021_lifecycle_email_tracking.sql`,
`0022_add_forwarding_confirmed.sql`, `0023_rename_forwarding_confirmed_to_number_published.sql`,
`0024_add_email_suppressions.sql`.

**Env vars:**
- `CRON_SECRET` (guards `/api/cron/daily`) — set in local `.env.local`.
- Still UNSET in the deploy environment: `ADMIN_CLERK_USER_IDS` (comma-separated
  Clerk ids for the `/admin` console; set locally to the test user only),
  `NEXT_PUBLIC_ASSISTED_ONBOARDING_URL` (Cal.com/Calendly link for the "Book a
  setup call" CTA — the CTA is hidden until it is set), and `FOUNDER_NAME`
  (personalizes the ROI-capture email signoff; falls back to "the Callverted team").
- CAN-SPAM (before enabling real marketing sends): `COMPANY_POSTAL_ADDRESS`
  (REQUIRED real mailing address — footer shows a loud placeholder until set),
  and optionally `UNSUBSCRIBE_TOKEN_SECRET` (falls back to `CRON_SECRET`),
  `COMPANY_NAME` (defaults "Callverted"), `UNSUBSCRIBE_MAILBOX` (defaults
  unsubscribe@callverted.com).

**TODO (scheduling):** Vercel cron will NOT be used. The trial/activation/
win-back/monthly scans already run as Inngest crons, but the `/api/cron/daily`
followups drain is still Vercel-cron-shaped. Move it to an Inngest scheduled
function that calls the same drain (getDueFollowups → send → markFollowupSent),
then drop the `crons` entry in `vercel.json`.

Note: the Drizzle `meta/_journal.json` is stale (pre-existing) so migrations
0007+ are hand-authored raw SQL by convention.

## Simplification pass (2026-07-12)

Deliberate early-stage trim: the machinery was broader than the funnel is proven,
so several automations are PARKED (code kept, cron unregistered in
`src/app/api/inngest/route.ts`, one-line to re-enable). Prove the core funnel with
real customers before turning them back on.

- **Price is now $149/mo, one plan** (was $79). Updated across landing, onboarding,
  legal (terms/refunds), and the help page. The real charge amount lives in the
  Stripe product and gets set at the real-Stripe flip.
- **Lifecycle emails, kept firing:** welcome (signup, transactional), a SINGLE
  activation nudge (day-3 "you're not live yet" — `activation-nudges.ts`
  collapsed from the 3-stage day1/3/7 series to one), the weekly report, the ROI
  capture email, and transactional dunning/receipt (dormant until Stripe).
- **PARKED (unregistered crons):** `trialReminders` (re-enable at the Stripe flip —
  only matters once real charges happen), `winbackEmails` (re-enable once there
  are churned customers), `monthlyRoiRecap` (redundant with the weekly report; keep
  one). Save-flow, admin, and the operator signup alert stay.
- **Not building yet** (confirmed): ROI capture drip, churn/risk alerts, card-gate
  rework, public demo.
- Guiding principle (per external review + owner): the bottleneck is proving a
  contractor can go live fast, capture a real missed call, and see enough value
  that $149/mo is obvious — not more lifecycle code.

---

## 1. The model

**Card up front, gated on live calls, with a free trust phase before the ask.**

Callverted's real cost (and real value) is answering live inbound calls. So the
one hard gate in the whole product is:

> **A payment method on file is required to activate the live phone line.**
> Everything before that is free proof.

The funnel has three zones:

```
FREE / NO ACCOUNT (build trust)       SIGNED UP, NO CARD          CARD ON FILE (trial or paid)
────────────────────────────────      ──────────────────────      ────────────────────────────
• Landing, ROI calc (email-gated)      • Dashboard (explore)        • LIVE voice line ✅
• Scripted call replay                 • Make TEST calls ✅          • Real inbound calls captured
• Interactive test-call demo           • See sample lead packet     • Lead packet emails
• Sample lead packet                   • Activation checklist       • Widget / intake link live
                                       • ❌ No real calls            • 14-day trial → $149/mo auto
```

Rationale: agencies and infra-style SMB tools give enough visible value to earn
trust, then take the card before switching anything on. A signed-up user with no
card can explore the dashboard and run **test calls** (their instant taste of
value, no real call volume required) but cannot receive real calls until a
payment method is on file.

### Trial decision: 14-day card-required trial ("reverse trial")

- Free, ungated demo surfaces build trust with **no account**.
- Sign up → onboard → **enter a card** (the commitment moment).
- Card on file **activates the live line**.
- 14 days free, **auto-converts to $149/mo on day 15** unless canceled. Cancel
  anytime in the trial window = never charged.

Why card-required trial over no-card trial or pay-now:
- Card-required trials convert far better to paid (industry ballpark 40–60% vs
  ~10–15% for no-card). The card *is* the qualifier — it filters tire-kickers
  without a sales demo, which is the self-serve goal.
- Lower friction than "pay $149 now" while capturing the same commitment.
- Auto-converts, so no manual chasing — critical for a solo founder.

**One-flag reversibility:** the trial is just `trialPeriodDays: 14` on the
Stripe subscription. Set it to `0` and the model becomes "pay now, cancel
anytime, 14-day money-back" with no other code changes. Committing to the trial
now costs nothing later.

### Sales-assisted exception

Self-serve is the default. For the occasional warm lead closed by phone, an
admin can extend a trial, apply a coupon, or comp an account. No separate flow.

---

## 2. Current state (2026-07-11)

- **Payment is MOCKED.** Onboarding's payment step calls
  `POST /api/onboarding/mock-subscribe`, which returns a `trialEndsAt` 14 days
  out and never touches Stripe or the DB. The real Stripe checkout
  (`/api/stripe/checkout`) exists but is only reachable from Settings → Billing,
  and the two paths are disconnected. A mock trial therefore never converts or
  expires in status — it stays `trialing` forever.
- **Subscription logic is duplicated and inconsistent.** The correct helpers in
  `src/lib/subscription.ts` (`hasActiveSubscription`, `isBusinessSubscriptionActive`)
  are **dead code**. The banner (`dashboard/layout.tsx:getBannerState`), the
  dashboard `isVoiceLive` check, and the voice route each re-implement their own
  version. The voice gate does **not** check `trialEndsAt` expiry.
- **First-run dashboard is a wall of zeros** — no activation checklist, nothing
  linking a new user to test-call or widget setup.
- **Only 4 emails send** (internal signup ping, one welcome, lead packet, weekly
  recap). A dozen lifecycle templates exist but are unwired; a `followups` table
  + query layer is scaffolded but the create/send path is dead; `vercel.json`
  declares a `/api/cron/daily` cron pointing at a route that doesn't exist.
- **No top-of-funnel email capture** anywhere. The ROI calculator computes a
  scary number and does nothing with it.
- **No churn mechanics** beyond a trial-countdown banner. Cancellation hands off
  straight to the Stripe portal; an `isPaused` flag exists but is never offered.

### Security note (why the current mock is safe to leave up)

With no ads/marketing, exposure is negligible: Clerk signup needs a real
verified email (bots don't complete it), `/api/demo` 404s for anonymous users,
test-call is behind Clerk auth, and real Twilio numbers aren't provisioned
(mock). The one real cost is bounded OpenAI usage on authenticated test calls.
The **structural** fix is the live-call gate (below) — build it now on the mock
so real calls can never route without passing payment, regardless of marketing.

---

## 3. Decisions locked for this build

- **Trial: IN.** 14-day, card-required, auto-convert. One flag flips it off later.
- **Gate line:** payment-on-file required to **activate the live phone line**.
  Signed-up-no-card users get full dashboard exploration + test calls, no real calls.
- **Stripe stays MOCKED for now** (testing phase). Build the whole gating
  architecture and the real-Stripe seam; leave the mock endpoint behind it.
- **Onboarding mid-wizard autosave is DEFERRED** (not in this build). The
  single-action finish and step reorder are in; progress persistence is later.

---

## 4. Phased implementation

Ordered by build sequence. Each phase is independently shippable. Items marked
**[mock-now]** are built against the mock and become real when Stripe flips;
**[real-stripe]** items are deferred until then.

### Phase 0 — Payment gate architecture (foundational)

The spine. Makes payment state single-sourced and makes card-on-file actually
gate live calls.

0.1 **Consolidate subscription logic onto `src/lib/subscription.ts`.** Add a
    `hasPaymentOnFile(business)` seam that today returns true for `active`/valid
    `trialing` and later also requires a real `stripeSubscriptionId`. Replace the
    inline re-implementations in `dashboard/layout.tsx` (`getBannerState`,
    `isVoiceLive`) and the voice route with these helpers.
0.2 **Fix the live-call gate.** `api/twilio/voice/route.ts` must use the shared
    helper and reject when the trial is expired (`trialEndsAt` check), not just
    on status membership.
0.3 **Real-Stripe seam documented in code.** Keep `/api/onboarding/mock-subscribe`
    but centralize the "activate trial" write so swapping to a real Checkout
    session + webhook create-path is a localized change. **[mock-now]**
0.4 *(Deferred)* Real Checkout session in onboarding + webhook `subscription.created`
    write-path + dunning status transitions. **[real-stripe]**

### Phase 1 — Onboarding restructure

1.1 **Reorder the wizard:** business info → vertical → **payment (card)** →
    number selection → done. Don't provision a (real, paid) number before a card
    exists. On mock, the payment step still calls mock-subscribe.
1.2 **Single-action finish** — remove the two-click "Start trial" then "Continue"
    footgun; one action completes onboarding.
1.3 **Trial copy:** "14 days free · no charge until [date] · cancel anytime."
1.4 *(Deferred — not this build)* Persist mid-wizard progress so drop-offs resume.

### Phase 2 — Activation (first-run experience)

2.1 **Activation checklist** replacing the wall-of-zeros for new accounts:
    1. Make your first test call → `/dashboard/test-call`
    2. Go live — forward your number / install widget / share intake link → `/dashboard/capture`
    3. Confirm your line is live
2.2 Checklist state is derived from real signals (has test call, has number
    live, first lead) and doubles as the trigger data for activation emails.

### Phase 3 — Lifecycle emails (wire the dormant plumbing)

Uses Resend + `emailClient.batchSend`, the Inngest cron pattern
(`weekly-report.ts`), the `followups` table, and the existing templates in
`src/lib/email/notifications.ts`.

3.1 **Implement `/api/cron/daily`** (declared in `vercel.json`, route missing).
    Drains `getDueFollowups → send → markFollowupSent`. Allowlisted already in
    middleware.
3.2 **Welcome → activation series** (day 1/3/7): nudge if still no card / no test
    call / no live line.
3.3 **Trial-ending emails** (day-10, day-13, expiry-day): daily Inngest cron reads
    `trialEndsAt`; lead with "here's what Callverted captured for you." Works on
    the mock (mock sets `trialEndsAt`). **[mock-now]**
3.4 **Receipt** on payment + **dunning** on `invoice.payment_failed` (webhook
    already fires; just no email). **[real-stripe]** for firing; template can be built now.
3.5 **Win-back** post-cancel/expiry (`sendFollowupEmail` template exists).
3.6 **Monthly ROI recap** ("you recovered $X in missed calls") — anti-churn value
    reinforcement.

### Phase 4 — Top-of-funnel capture

4.1 **Email-capture table + endpoint** (`emailCaptures` schema + `/api/capture`).
4.2 **Email-gate the ROI calculator result** — peak-intent moment, one input,
    drops the lead into a drip. Highest-leverage top-of-funnel move.
4.3 **Softer secondary CTA** site-wide ("Get the missed-call playbook" / "See a
    sample lead packet") for not-ready visitors.
4.4 **"No card to explore — card only when you go live"** messaging to lower
    signup hesitation (now true).

### Phase 5 — Churn prevention

5.1 **Cancellation save-flow** before the Stripe-portal handoff: reason picker →
    **"Pause instead?"** (uses the existing `isPaused` flag) or a retention offer.
5.2 **Win-back email** (shared with 3.5).
5.3 **Monthly ROI recap** (shared with 3.6) as the ongoing retention lever.

### Phase 6 — Sales assist (light)

6.1 **Admin: extend trial / apply coupon / comp account** for warm leads closed
    by phone. Keeps self-serve the default and sales the exception.

---

## 5. Going live with real Stripe (the flip)

When ready to take real money, in order:
1. Onboarding payment step: call `POST /api/stripe/checkout` (already built) and
   redirect to the returned Stripe URL instead of `mock-subscribe`.
2. Webhook: add the `checkout.session.completed` / `customer.subscription.created`
   write-path so the business gets `stripeCustomerId`, `stripeSubscriptionId`,
   `subscriptionStatus`, `trialEndsAt` from Stripe as the source of truth.
3. `hasPaymentOnFile` starts requiring a real `stripeSubscriptionId`.
4. Turn on the receipt + dunning emails (3.4).
5. Delete `/api/onboarding/mock-subscribe`.

Nothing else in the funnel changes — every other phase is written against the
shared subscription helpers, not the mock.

---

## 6. Key file map

| Concern | Path |
|---|---|
| Subscription helpers (source of truth) | `src/lib/subscription.ts` |
| Mock trial (temporary) | `src/app/api/onboarding/mock-subscribe/route.ts` |
| Real Stripe (deferred) | `src/app/api/stripe/{checkout,portal,webhook}/route.ts` |
| Business create (writes trial state) | `src/app/api/business/route.ts` |
| Onboarding wizard | `src/app/(authenticated)/onboarding/_form.tsx` |
| Trial banner + state | `src/components/dashboard/v2/SubscriptionBannerV2.tsx`, `dashboard/layout.tsx` |
| Live-call gate | `src/app/api/twilio/voice/route.ts` |
| First-run dashboard | `src/app/(authenticated)/dashboard/page.tsx` |
| Activation surfaces | `dashboard/test-call/page.tsx`, `dashboard/capture/page.tsx` |
| Email transport | `src/lib/resend.ts`, `src/lib/email/email-client.ts` |
| Email templates | `src/lib/email/notifications.ts` |
| Follow-up scheduling | `src/lib/db/schema/followups.ts`, `src/lib/db/queries/followups.ts` |
| Inngest | `src/lib/inngest/client.ts`, `src/lib/inngest/functions/*` |
| Daily cron (to build) | `src/app/api/cron/daily/route.ts` (declared in `vercel.json`) |
| Landing / ROI calc | `src/app/page.tsx`, `src/components/marketing/MissedCallCalculator.tsx` |

---

## 7. Round-2 decisions (2026-07-11 evening)

Refinements agreed after reviewing the shipped build. These are the next work
block (alongside the tomorrow Inngest migration).

### 7a. Metrics rework (customer-facing lead funnel)

The lead-conversion metrics are only as honest as the owner's status hygiene,
and they have internal inconsistencies. Tightening pass:

- **Unify "captured."** Dashboard "captured opportunity value" counts
  `qualified`-or-beyond; the Reports funnel counts *every* lead (incl. `new`,
  `lost`). Pick ONE definition of captured and use it in both surfaces.
- **`contactedAt` is manual + lagged.** It is stamped only when the owner moves a
  lead to `contacted`+ (`api/leads/[id]/route.ts:57-65`); there is no "call"
  button and no call detection. So "average callback time" = time until they
  *log* the status, which over-states reality and excludes never-logged leads.
  Decision: relabel it "time to first update" (or de-emphasize it), and add a
  one-line "based on when you update leads" caption to any status-derived metric.
- **Time-box the home snapshot.** The dashboard "Conversion snapshot" is all-time
  and never reflects a slow recent month; give it the same range control Reports has.
- **Align funnel stages** (dashboard shows `booked`; Reports funnel omits it).
- Lean on auto-captured signals (calls, intake completions) for anything that
  needs to be trustworthy; treat human-status metrics as directional.

### 7b. Our SaaS funnel — deliberately LIGHT

Volume will be low, so full funnel analytics (visitor→trial→paid dashboards,
web-analytics tool) are **out of scope for now**. Keep it to:
- **Signup visibility** — new accounts created (the `/admin` list already shows
  this; a simple count/recent-signups view is enough).
- **Operator notifications (important):**
  - **Signup alert** — already sends to `NOTIFY_EMAIL` on business create
    (`api/business/route.ts`). Verify it fires reliably; this is the priority one.
  - **Churn / risk alerts** — notify the operator when an account cancels, when a
    trial expires *without converting*, and on payment failure. The trial-expiry
    and cancel detection ride on the Inngest scans (tomorrow's batch); the
    payment-failure alert hooks the existing Stripe `invoice.payment_failed`
    handler (fires once real Stripe is live).

### 7c. Go-live onboarding (priority) + assisted onboarding  [DONE 2026-07-11]

CORRECTED MODEL (see §8 item 5): "going live" is NOT forwarding the owner's line
to us. The Callverted (Twilio) number IS the number the owner publishes as their
public business number; Twilio rings the owner's real line first and the AI only
answers on no-answer/busy. Publishing the number is the highest-leverage
retention lever — once their Google Business Profile / socials / website / ads
point at the Callverted number, they are effectively committed (their new
customer calls all flow through us). Make it smooth without friction that makes
them abandon.

- **Guided, skippable go-live step. [DONE]** The `ActivationChecklist.tsx` go-live
  modal shows the call-flow diagram, the number + "copy number", and a checklist
  of where to LIST it (GBP, Facebook, website, Yelp/YP/Angi). Explicit "I'll do
  this later" escape so it never blocks finishing.
- **GBP + socials are suggestions, not verified checkboxes. [DONE]** We can't
  verify external listing updates, so they're presented as guidance; the single
  owner-confirmed `number_published` flag is the honest "went live" signal.
- **Activation checklist "Get your line live" [DONE]** reflects the real action
  (publish the number) via the `number_published` boolean, not the auto-
  provisioned number.
- **"Book assisted onboarding" [DONE]** — low-key secondary Cal.com/Calendly link
  in the go-live modal ("Rather have us set it up? Book 15 min"), gated on
  `NEXT_PUBLIC_ASSISTED_ONBOARDING_URL` (hidden until set). Catches would-be
  abandoners without forcing a demo on confident self-servers.

---

## 8. Backlog (queued 2026-07-11 evening)

Decisions + not-yet-built items, from the conversion-mechanisms review.

**Decisions made:**
- **Founding pricing → reframe, don't discount.** "Founding" can signal "new/
  unproven" to a trades audience, and a price chop anchors low + attracts churn.
  Swap to a rate-lock framing: "$149/mo, lock this rate for life if you start now."
  Same urgency/lock-in, signals growth not beta. No discounting.
- **Pause = keep the number on file, service off** (owner's call). When paused we
  hold the Twilio number (~$1/mo) and the AI does not answer. Keep the current
  reject behavior, but improve the paused-call message + pause UX so the owner
  knows to point their calls back to their own line while paused (otherwise a
  forwarded caller hits a dead end). NOT switching to forward-to-their-line.

**Queued builds (roughly in priority order):**
0. **CAN-SPAM / email unsubscribe. [DONE 2026-07-11]** Design note: opt-out is a
   standalone `email_suppressions` table keyed by lowercased email (migration 0024,
   applied local + prod), NOT a column on `email_captures` as originally sketched,
   because marketing recipients span both prospects (`email_captures`) and signed-up
   owners (`businesses.owner_email`), so suppression must be address-keyed across
   both. Shipped: `signUnsubscribeToken` / `verifyUnsubscribeToken` (HMAC, non-
   expiring, in `src/lib/email/unsubscribe.ts`), a public `GET/POST /api/unsubscribe`
   route (GET = footer link + confirmation page, POST = RFC 8058 one-click), a
   marketing footer (unsubscribe link + physical address), and `List-Unsubscribe` +
   `List-Unsubscribe-Post` headers. Enforcement lives in the email client:
   `emailClient.sendMarketing` / `batchSendMarketing` consult the suppression list,
   inject the footer, and set the headers; the three COMMERCIAL senders
   (`sendMissedCallBreakdownEmail`, `sendWinbackEmail`, `sendMonthlyRoiRecapEmail`,
   plus the future ROI drip) now route through them. Transactional email (lead
   packet, receipt, dunning, trial-ending, welcome) still uses plain `send` and is
   exempt. **OWNER ACTION before enabling real marketing sends:** set
   `COMPANY_POSTAL_ADDRESS` (real mailing address; footer shows a loud placeholder
   until then), optionally `UNSUBSCRIBE_TOKEN_SECRET` (falls back to `CRON_SECRET`),
   `COMPANY_NAME`, and `UNSUBSCRIBE_MAILBOX`.
1. **ROI capture drip (2-3 emails).** The single capture email is now proper
   (personal, brand-blue, email-safe "your math" visual, `FOUNDER_NAME` signoff).
   Next: a short nurture after it (day 0 breakdown -> day 2 "first responder wins"
   proof -> day 5 "start your trial" w/ soft deadline), and gate a real 1-page ROI
   report PDF for stronger reciprocity. Rides on the Inngest/drip plumbing.
2. **Card-up-front gate sequence (rework).** The payment step "feels off." Revisit
   as its own sequence: decide Model A (card during onboarding) vs Model B (let
   them into the app, gate the card at go-live). Note: Model B is double-edged —
   free roaming can reduce urgency to pay. Tie to the real-Stripe flip.
3. **Guided first-run walkthrough. [DONE 2026-07-11]** `DashboardTour.tsx` — a
   custom (no new deps) 4-step coach-mark tour over the zero-state dashboard:
   spotlight cutout, anchored popover (flips/clamps to viewport), step dots +
   counter, Back/Next/Got it, Esc/arrow keys, auto-shows once, remembers dismissal
   in `localStorage` (`cv_dashboard_tour_done`), with a subtle "Take the tour"
   reopen pill. Plus `ExampleLead.tsx` — a single clearly-labeled synthetic sample
   lead in the Priority queue (dashed/muted, "Example" pill, non-navigating, inline
   explainer) rendered only while `totalLeads === 0`. Both gated behind the
   existing zero-state condition in `dashboard/page.tsx`.
4. **Twilio number lifecycle.** Numbers are a recurring ~$1/mo charge and Twilio
   never auto-releases them. Build: provision the real number only AFTER payment;
   **release on cancel with a grace period** (hold through the access-until window
   / a few days so win-back keeps the number, then release). A2P 10DLC only needed
   if we send SMS.
5. **Richer go-live modal. [DONE 2026-07-11]** IMPORTANT call-flow correction: there
   is NO carrier-code forwarding from the owner's line to us. The Callverted (Twilio)
   number IS the number the owner publishes as their public business number; on an
   inbound call Twilio rings the owner's real line (`forwardingNumber`, captured at
   onboarding as ownerPhone) FIRST and the AI only answers on no-answer/busy (see
   `src/app/api/twilio/voice/route.ts`, overflowMode `ring_then_ai`). So "go live"
   = publish the number, not dial *71. `ActivationChecklist.tsx` go-live modal now
   shows a 4-node flow diagram (caller dials your Callverted number -> it rings your
   line first -> no answer, AI qualifies -> you get a ready lead), the number with a
   "copy number" button, and a checklist of where to LIST it (Google Business
   Profile, Facebook, website, Yelp/YP/Angi) plus a reassurance that their old
   number still reaches them directly. Confirm button = "I've listed my number"
   (persists `numberPublished`; the column was renamed from `forwarding_confirmed`
   in migration 0023 to match the real action). NOTE: an earlier build of this modal
   shipped a wrong carrier-forwarding picker (*71 codes); it was replaced same day.
6. **Deeper metrics rework. [DONE 2026-07-11]** Home Conversion snapshot is now
   time-boxed to the last 90 days: `getHomeMetrics` returns `snapshotWindowDays` +
   `snapshotCaptured/Contacted/Booked/Converted` (createdAt within window) and the
   all-time `contactedOrBeyond/bookedOrBeyond/convertedCount` fields were removed.
   Snapshot bars relabeled "Leads -> contacted" with a "Last 90 days, from the
   statuses you set on leads" caption. Reports `getReportsFunnel` /
   `getChannelPerformance` now honor the range selector (they ignored `days`
   before), the funnel first step reads "Leads" (was "Captured"), the dropoff label
   reads "leads to qualified", and both cards note "last {days} days". Remaining
   (not blocking): a single shared "captured" definition helper across the two
   surfaces if they drift further.
