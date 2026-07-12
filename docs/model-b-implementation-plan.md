# Model B + Real Infra Implementation Plan

Decided 2026-07-12. **Not started.** Start here next session with Phase 1.
Companion to `docs/monetization-and-conversion.md` (which holds the broader
conversion/lifecycle model and the "Simplification pass (2026-07-12)" note).

---

## The decision: Model B — "card to go live, not card to see the dashboard"

The trust bar for Callverted is high (a contractor is letting software answer real
customer calls), so the card ask comes AFTER they've configured and tested the
product, at the "Go live" moment — not mid-onboarding before they've seen value.
This also removes the fake mock-payment step that felt off.

**Setup mode (no card):** configure business, pick vertical, set forwarding number,
explore dashboard, run (capped) test calls, preview the example/lead packet.
**Live mode (card required):** real Twilio number provisioned, live call routing,
real lead capture, production notifications, 14-day trial begins.

Boundary: **no real Twilio number and no live call routing until a card is on file.**
Before card = no number purchased (just "your live number is provisioned when you
start your trial").

## Two deliberate simplifications vs the fuller proposal

1. **No big `activationStatus` state machine.** Derive the setup stage from columns
   we already have: `subscriptionStatus` (Stripe truth), `twilioPhoneNumber`
   (null = not provisioned), `numberPublished`, `isPaused`. Add a
   `getSetupStage(business)` helper. Only new columns worth adding:
   `twilioPhoneNumberSid` (idempotent provision + release) and `cancelAtPeriodEnd`.
2. **No draft business at signup.** Keep creating the business at the end of a
   SHORTENED config wizard (business + vertical + forwarding number). Stripe/Twilio
   attach later at go-live, when the business already exists. Invariant shifts from
   "business exists = onboarding done" to "business exists = configured, not yet live."

---

## Current architecture (starting point)

- **Business is created only at the end of onboarding** via a single atomic
  `POST /api/business` (`onboarding/_form.tsx:handleFinishOnboarding`), currently
  AFTER the mock payment (step 3) and mock number (step 4) steps. Hardcodes
  `subscriptionStatus: "trialing"`.
- **Onboarding steps today:** business details -> vertical -> payment (MOCK,
  `/api/onboarding/mock-subscribe` returns a 14-day `trialEndsAt`, no Stripe) ->
  number (MOCK, `/api/twilio/numbers/search` + `/purchase`, placeholder numbers) ->
  done. The payment step is a required click but collects no card (mock).
- **Dashboard** redirects to `/onboarding` if no business. Zero-state shows the
  activation checklist + tour + example lead (all gated on `totalLeads === 0`).
- **Gate:** `hasPaymentOnFile(business)` in `src/lib/subscription.ts` currently
  delegates to `isBusinessSubscriptionActive` (checks `subscriptionStatus` +
  `trialEndsAt` expiry). Voice route (`/api/twilio/voice`) gates on
  `hasPaymentOnFile` + number-exists (it looks the business up BY twilio number) +
  `!isPaused`. Dashboard `isVoiceLive` uses the same seam.
- **Existing Stripe scaffolding (real, just not wired into onboarding):**
  - `POST /api/stripe/checkout` — creates a customer + Checkout session, guards
    against double-subscribing, accepts a priceId matching the configured default.
  - `POST /api/stripe/webhook` — already handles `checkout.session.completed`,
    `customer.subscription.updated`, `customer.subscription.deleted`,
    `invoice.payment_failed` (fires `sendDunningEmail`), `invoice.payment_succeeded`
    (fires `sendReceiptEmail`). Looks businesses up by `stripeSubscriptionId` /
    `stripeCustomerId`.
  - Billing columns already on `businesses`: `stripeCustomerId` (unique),
    `stripeSubscriptionId` (unique), `stripePriceId`, `subscriptionStatus`,
    `trialEndsAt`, `currentPeriodStart`, `currentPeriodEnd`. (No `cancelAtPeriodEnd`,
    no `twilioPhoneNumberSid` yet.)
- **Twilio provisioning is mocked** (`/api/twilio/numbers/search` + `/purchase`
  return placeholders; no real line bought). Real Twilio creds not confirmed for
  this app.
- **Voice WSS** (`VOICE_STREAM_WSS_URL`) not deployed — the AI-answer leg can't run
  in prod even with a real number.

---

## Phased implementation

### Phase 1 — Onboarding -> "Setup mode" (pure app refactor, NO external creds) ✅ DONE (2026-07-12)
Shipped: config-only wizard (business -> vertical -> done), `getSetupStage()` in
`src/lib/subscription.ts`, Setup-mode dashboard (amber "Setup mode" pill + "Add
payment & go live" CTA in `ActivationChecklist`), and `mock-subscribe` repurposed
as the idempotent go-live stub that flips the existing business to `trialing`
(the single call Phase 2 replaces with real Stripe Checkout). Verified via
authenticated screenshots. Note: after the go-live stub the account sits in
`provisioning` (trialing, no real number) until Phase 3 provisions Twilio.
Original plan below.

- `onboarding/_form.tsx`: remove step 3 (mock payment) and step 4 (mock number).
  Wizard becomes **business details -> vertical -> forwarding number -> done**.
  `handleFinishOnboarding` creates the business with `subscriptionStatus: null`
  and NO `twilioPhoneNumber`.
- Delete/retire `Step3Payment` + `Step4Number` (keep the mock endpoints around
  until Phase 2/3 remove them, or delete now since unused).
- Dashboard renders **Setup mode** for a no-subscription business: activation
  checklist leads with "Test Callverted" and a primary **"Add payment & go live"**
  CTA. Add a small `getSetupStage(business)` helper for the copy.
- `hasPaymentOnFile` already returns false for a null subscription, so the live
  line stays off automatically — no gate change needed in Phase 1.
- The go-live CTA is stubbed in Phase 1 (or temporarily points at the existing
  mock) until Phase 2 wires real Stripe.
- This is the whole UX shift to Model B and needs zero credentials. **Start here.**

### Phase 2 — Real Stripe Checkout at "Go live" ✅ DONE (2026-07-12)
Shipped + verified end-to-end (real test checkout via `stripe listen`, test card
4242 → webhook → DB got `sub_…`/`cus_…`, `subscriptionStatus: trialing`, 14-day
trial):
- "Add payment & go live" CTA now calls `POST /api/stripe/checkout` and redirects
  to Stripe's hosted page; the webhook (`checkout.session.completed` +
  `customer.subscription.*` + `invoice.*`) is authoritative.
- Retired `/api/onboarding/mock-subscribe` (deleted).
- Tightened `hasPaymentOnFile` to require a real `stripeSubscriptionId` **and** an
  active/trialing status — the one seam that flips the whole app mock→real.
- **Env (interim):** reusing the shared CraftCapture **test** Stripe account/keys
  already in `.env.local`. Created a dedicated **Callverted product + $149/mo
  price** in that account: `price_1TsTYdCIwu8rvWRe4AFA3t6X` (prod
  `prod_UsE0dSXW8C4KUH`); `.env.local` `NEXT_PUBLIC_STRIPE_PRICE_ID` now points at
  it (uncommitted — local only). Account display name still reads "Craft Capture
  Sandbox" (account-level) — swap when we move to a dedicated Callverted Stripe
  account before launch, along with all keys.
- **Local webhook testing:** `stripe listen --api-key <sk_test> --forward-to
  localhost:3000/api/stripe/webhook` (CLI is logged into a different account, so
  pass `--api-key`); use the `whsec_` it prints as `STRIPE_WEBHOOK_SECRET` for the
  dev server. Test card 4242, and **uncheck "Save my information" (Link)** or the
  phone field blocks submit.

### Phase 3 — Real Twilio number: post-payment live area-code search ✅ DONE (2026-07-12)
Shipped + verified (live Twilio search returned real 737 Austin numbers in the
ChooseNumber UI; account is Full/can purchase). Column `twilioPhoneNumberSid`
added (migration 0025, local + prod). Real search/purchase/release helpers +
gated, idempotent routes. **`purchaseNumber` sets ONLY `voiceUrl` (POST)** to
match how our live numbers are configured — the no-answer/status callbacks are
set per-call in the TwiML (`<Dial action>`), not on the number.
- **KEY:** provisioning uses `env.APP_URL` for the voiceUrl, so it MUST run where
  that's the public app URL (prod = `https://www.callverted.com`), not localhost —
  a number bought locally gets a dead webhook.
- The account's one existing real number **+15075843649 is Blue Star's**, already
  pointing at `callverted.com/api/twilio/voice` (that's the working call test).
- Only the actual purchase click is unrun (deliberately — borrowed Twilio account,
  ~$1/mo, buy on the dedicated account at deploy). Buy/release helpers both exist.
- **Blue Star made genuinely live** for demos: real test Stripe sub
  (`sub_…`, trialing) + its existing real number → dashboard shows "Voice line
  live" + trial banner, coherent.

Original decision/plan below.

### Phase 3 (original decision) — post-payment live area-code search
Decision (2026-07-12): **no webhook-driven auto-provision, no pre-stored area
code.** Since a number can only be bought after the card is on file, provisioning
is a foreground dashboard step *after* checkout:
- New "Choose your number" dashboard surface (shown at `getSetupStage ===
  "provisioning"`): area-code input -> **real Twilio search** (`/api/twilio/
  numbers/search`) -> pick -> **buy** (`/api/twilio/numbers/purchase`) -> store
  `twilioPhoneNumber` + `twilioPhoneNumberSid`. Resurrect the old mock Step4Number
  UI against real Twilio. Nobody can be charged for a number they never picked.
- Replace the mock search/purchase with real Twilio (creds already in `.env.local`:
  `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN`). Guard purchase behind explicit
  confirm; real buys cost ~$1/mo, so during testing buy one and release it.
- Add column: `twilioPhoneNumberSid` (for release-on-cancel in Phase 5).
- Voice route already gates correctly once number + payment are real.
- Note: A2P/10DLC only matters if/when we SMS the owner the lead packet; voice needs
  no registration.

### Phase 4 — Deploy voice WSS runtime
- Stand up the production WebSocket endpoint, set `VOICE_STREAM_WSS_URL`. Owner infra.
- Test with the owner's own number before connecting customer accounts.

### Phase 5 — Billing lifecycle (core ✅ DONE 2026-07-12)
- ✅ **Release-on-cancel**: webhook `customer.subscription.deleted` (fires at period
  end, after the access window) releases the Twilio number via `releaseNumber(SID)`
  and clears it — stops the ~$1/mo leak. Failures caught + logged (number left
  attached, not lost). NOT live-tested (would release Blue Star's real number / cost
  on the borrowed acct) — exercise at deploy on the dedicated Twilio account.
- ✅ Cancel-at-period-end already works: cancel flows through the Stripe Customer
  Portal (`/api/stripe/portal`, configured at_period_end); webhook sets
  `canceledAt = periodEnd`, so `getBannerState`/`isBusinessSubscriptionActive`
  already render "canceled, access until X" and keep access until then. No separate
  `cancelAtPeriodEnd` column needed (derived from `canceledAt` in the future).
- ✅ Dunning + receipt emails already fire from the webhook.
- ⏸ STILL PARKED (product call, not blocked): re-enable `trialReminders` /
  `winbackEmails` crons, decide weekly-vs-monthly reporting. Left parked per the
  simplification pass (stay lean pre-traffic).
- 🔁 Optional hardening later: a periodic sweep to release numbers for long-canceled
  businesses whose release call failed (no retry today).

### The MVP milestone (definition of done for this whole effort)
Someone signs up -> configures -> tests -> clicks Go live -> enters card -> trial
starts -> real Twilio number provisioned -> configures forwarding -> goes live ->
a real caller reaches the line -> business does not answer -> Callverted takes over
-> caller gives useful info -> lead created -> owner gets the lead packet -> owner
calls back. Do NOT add more product surface until this works end to end.

---

## What the owner provides (the borrowed-env issue)

Env vars may currently be borrowed from another app; this app needs DEDICATED
accounts, test mode first. Agent can build all CODE against test keys; owner does
the account/dashboard setup (agent will give exact steps):
- **Stripe (test):** create a product + $149/mo recurring price -> price id;
  `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_STRIPE_PRICE_ID`,
  `STRIPE_WEBHOOK_SECRET`; register the webhook endpoint (Stripe CLI locally,
  dashboard for prod).
- **Twilio:** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` for this app.
- Also still-unset deploy vars from the simplification pass: `COMPANY_POSTAL_ADDRESS`
  (before real marketing), `ADMIN_CLERK_USER_IDS`, `NEXT_PUBLIC_ASSISTED_ONBOARDING_URL`,
  `FOUNDER_NAME`.

---

## Already done (context so we don't redo it)

- **Simplification pass (2026-07-12):** price is **$149/mo one plan** (updated
  everywhere); PARKED crons (unregistered in `src/app/api/inngest/route.ts`):
  `trialReminders`, `winbackEmails`, `monthlyRoiRecap`; activation nudges collapsed
  to a **single day-3** "publish your number" nudge; weekly report kept over monthly.
- **CAN-SPAM** done: `email_suppressions` table (migration 0024), unsubscribe
  tokens/route/footer/headers, `emailClient.sendMarketing`.
- **Activation UI** done + verified via screenshots: checklist, tour, example lead,
  go-live modal (correct publish-the-number model + traveling-pulse animation),
  save-flow.
- **Go-live model corrected**: Callverted number IS the published public number;
  Twilio rings the owner's real line first, AI on no-answer. Flag renamed
  `forwarding_confirmed` -> `number_published` (migration 0023).
- **Nudge decision:** card-aware branch DEFERRED into this Model B work — it only
  becomes relevant once cardless (setup-mode) businesses exist, which Phase 1
  creates. Current single day-3 nudge is correct until then.

## Housekeeping / loose ends
- Untracked dev helper scripts in `scripts/`: `test-conversion-emails.ts`,
  `screenshot-activation.mjs`, `screenshot-saveflow.mjs` (useful for Stripe/UI
  testing; not committed — keep or delete).
- Local dev DB was restored to its real state at end of 2026-07-12 session (20
  Blue Star Restoration leads visible, placeholder `stripeSubscriptionId` removed).
- `puppeteer-core` was installed with `--no-save` (not in package.json); reinstall
  `npm i --no-save puppeteer-core` if re-running the screenshot scripts.
- Branch: `feat/monetization-conversion`.
