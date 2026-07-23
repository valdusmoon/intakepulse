# Callverted — Development Plan

**Product:** Callverted (formerly IntakePulse) — inbound lead recovery for home-service trades. Captures missed calls, answered calls, and website inquiries; sorts each into a scored job, a tidy message, or a screened non-lead; ranks who to call back first.
**Last Updated:** 2026-07-22
**Status:** The original V1 build plan (schema → auth/billing/onboarding → telephony → intake form → scoring → Inngest jobs → dashboard → landing/legal → deployment) is fully shipped and has since evolved well past what it originally specced. **Session 10 below is the only open work.**

---

## Shipped (V1 and beyond)

The original V1 plan was a CraftCapture (painting contractor app) → IntakePulse migration: Telnyx telephony, a single-field lead `status`, per-vertical rule-based scoring, restoration-only vertical. All of it was built, then the product moved substantially past that spec:

- Telephony moved from Telnyx to **Twilio** (voice intake + AI overflow, plus team-answered call capture/transcription)
- Lead status split into three independent axes — `intakeStatus` / `leadStatus` / `leadType` (job vs. message, with a "screened" non-lead outcome that creates no row at all)
- Scoring rewritten as a composite `priorityScore` (urgency/value/quality weighted, emergency floors, persisted `scoreTrace`) driving Hot/Warm/Cool tiers
- Dashboard, reports, notifications (email + web push), and settings all built out well beyond the original spec
- Legal pages, help page, and real Stripe pricing (Monthly $149 / Annual $1,499, 14-day trial) all live
- Real production deployment — Stripe, Twilio, Resend, Vercel, and a dedicated Clerk instance — all live since mid-July 2026
- The Telnyx A2P 10DLC registration track and the original file-path/env-var technical reference are obsolete and have been dropped from this document

For the current, code-verified functional map, see `memory/project-overview.md` — that's the maintained source of truth for what the product actually does today. This document no longer tracks that history as a checklist.

---

# SESSION 10: LEAD OUTCOME CAPTURE + LEAK VISIBILITY (2026-07-22)

> Founder-approved backlog from the "wow factor" review: build tickets 1 + 2 below. Ticket 3 (owner-side SLA nudge) is explicitly DEFERRED — see 10.4 — to avoid adding another cron to manage right now.
> **ORDERING: Session 11 (intake capture contract) runs FIRST** — the leak dollar figure is only defensible once job/message classification is clean on every channel.

## 10.1 Shared foundation — first-human-engagement signal
- [ ] Confirm `leads.contactedAt` (already in schema) is set on ANY transition off `leadStatus: 'new'`, not only the literal `'contacted'` value — a lead that jumps straight to `'booked'`/`'converted'` still needs an engagement timestamp
- [ ] Define "engaged" consistently for AI-handled/voice_overflow leads too — it's the first manual status change by the owner, not anything the AI itself does

## 10.2 Ticket 2 — Dollarize the leak
- [ ] Add a configurable "slipped" threshold to `businesses` (default 15 min) + a Settings control
- [ ] Extend `getLeadStatsBetween` (or add a sibling query) to compute, per period: count + summed `estimatedValueLow` of Hot leads where engagement is null-past-threshold or `(contactedAt - createdAt) > threshold`; leads with `estimatedValueLow IS NULL` (off-list/unmapped service) are counted separately and NEVER folded into the average — the headline number must stay defensible under scrutiny
- [ ] Dashboard home: hero "X Hot leads slipped past [threshold] — ~$Y in estimated value" widget (+ "N leads of unknown value" footnote)
- [ ] Surface the same figure in `weekly-report.ts` and/or `monthly-roi-recap.ts` (both already consume `getLeadStatsBetween`-shaped stats, so this is mostly an extension, not new plumbing)

## 10.3 Ticket 1 — One-tap won/lost/no-job resolution
- [ ] Signed, single-use, expiring resolution token — fork `src/lib/email/unsubscribe.ts`'s HMAC pattern (that one is intentionally non-expiring; this one needs an expiry + a consumed-flag so a link can't be replayed)
- [ ] Public resolve page (no login) + resolve API route; add to `middleware.ts` public routes
- [ ] Resolve actions: **Won** (`leadStatus: 'converted'`, capture `confirmedValue` prefilled from `estimatedValueLow`, editable) · **Lost** (`leadStatus: 'lost'`) · **No-job** (flip `leadType` from `'job'` to `'message'` — reuses the existing job/message exclusion from scoring/funnels/ROI, no new enum needed)
- [ ] Wire the resolve link into the existing lead-alert email and the "view lead" push notification
- [ ] `public/sw.js`: add a real `actions` array to `showNotification` + handle `event.action` in `notificationclick` to hit the resolve endpoint straight from the notification (iOS Safari's support for notification action buttons is inconsistent — the signed web link stays the reliable primary path; action buttons are a progressive enhancement on top)
- [ ] "Yesterday's unresolved leads" digest — dashboard widget + email section listing contacted-but-unresolved leads with inline Won/Lost/No-job actions

## 10.NOTE — Session 12 shipped the standard Session 10 builds on
> The "No-job" one-tap resolution (10.3) is now just a token-link shortcut to the SAME PATCH semantics Session 12 added (`leadType` flip, validated, scores untouched) — reuse `/api/leads/[id]` PATCH behavior, don't reinvent.

## 10.4 Deferred — Ticket 3: owner-side SLA nudge (NOT this pass)
> Parked on purpose — avoid another cron to manage for now. When picked back up, prefer an Inngest event-driven `step.sleep()` fired per Hot lead over a polling cron (fires exactly once, no scan window to miss, no new scheduled job to babysit).
- [ ] (parked) Escalation ping to the owner when a Hot lead sits unengaged past a configurable threshold (default 20 min), fire-once per lead, togglable in Settings

---

# SESSION 11: INTAKE CAPTURE CONTRACT — NORMALIZE ALL CHANNELS TO THE VOICE STANDARD (2026-07-22)

> **RUNS BEFORE SESSION 10.** The AI voice flow's three-outcome model (scored job / unscored message / screened-no-row) becomes the contract for every channel.
> **EXECUTION: follow `docs/intake-capture-contract.md` §9 "IMPLEMENTATION SPEC"** — it specifies every file change with exact code, in order, with acceptance checks per step. The checkboxes below map 1:1 to §9's steps; §§1–8 of the doc are the design rationale if context is needed. Do the steps IN ORDER (later steps import from earlier ones). Zero schema migrations required — every column already exists.
> Locked decisions: web form valve is backend-only (NO UI branch); human-call capture stays notification-silent for jobs AND messages; web valve messages DO alert; valve fails OPEN to job; never downgrade job → message.

- [x] **Step 1** — NEW `src/lib/leads/lead-taxonomy.ts` (shared `LeadType`/`MessageKind`/`MESSAGE_KINDS`); `src/lib/voice/types/session.ts` re-exports from it (§9 Step 1)
- [x] **Step 2** — NEW `src/lib/leads/notify-message.ts` (shared `notifyMessageCaptured`, decoupled from FlowContext); voice `actions.ts` deletes its local copy and imports it (§9 Step 2)
- [x] **Step 3** — NEW `src/lib/leads/intake-status.ts` (`deriveIntakeStatusFromAnswers`) + `intake-status.test.ts` (§9 Step 3)
- [x] **Step 4** — EDIT `src/lib/leads/extract-from-transcript.ts`: extend `record_call_signal` schema with `contact_kind`/`message_kind`/`message_for_team`/`service_requested`; extend `TranscriptIntake` + parsing + fallbacks (§9 Step 4; upgraded to `Promise.allSettled` so a failed signal pass can't discard successful field extraction)
- [x] **Step 5** — EDIT `src/lib/leads/capture-human-call.ts` (three-outcome precedence, message path with NO scoring/notification, ZIP fold-in, `serviceRequested`, ScoringContext with transcript, honest intakeStatus) + pass `transcriptText` from `process-human-call.ts`; NEW `capture-human-call.test.ts` (§9 Step 5)
- [x] **Step 6** — NEW `src/lib/leads/web-intake.ts` (`classifyWebIntake` gpt-4o-mini forced tool, fail-open; pure `shouldRunValve`/`shouldUpgradeToJob`) + `web-intake.test.ts` (§9 Step 6)
- [x] **Step 7** — EDIT `src/app/api/intake/[businessId]/submit/route.ts`: custom-service-options everywhere, upgrade rule, valve wiring, `assessAndNotify` rewrite (message path alerts via shared helper + returns before scoring; job path gets ScoringContext) (§9 Step 7)
- [x] **Step 8a** — Automated verification DONE 2026-07-22: `tsc --noEmit` clean · `npm test` 451/451 across 20 files (engine.test.ts untouched + green) · eslint 0 errors (warnings = pre-existing style baseline) · `npm run build` clean
- [x] **Step 8b(i)** — Live-model E2E DONE 2026-07-22 via `scripts/test-intake-contract.ts` (re-runnable, cleans up after itself): 30/30 passed against real gpt-4o/gpt-4o-mini + local dev DB — billing call→message(billing)+unscrubbed notes+unscored; emergency transcript→job with ZIP fold-in, critical_signal_floor, priority≥80, 'qualified'; price-shopper→message(question); solicitation→junk(no row); existing-customer→message(existing_customer); web invoice-text→non_job_message(billing); service-area question→non-job; off-list sprinkler request→service_request; gibberish→fails open
- [ ] **Step 8b(ii)** — One real phone call to a dev/prod number (exercises only UNCHANGED plumbing: Twilio audio → recording webhook → Inngest → Whisper, live since 2026-07-18) + eyeball the two new UI combos (message + "Team answered" chip, message + website source) — needs the founder's phone

---

# SESSION 12: THE CALLVERTED STANDARD — UNIVERSAL NORMALIZATION (2026-07-22)

> **The constitution: `docs/callverted-standard.md`** — identity + pitch north star (NOT a CRM / answering service), the job/message/junk taxonomy, the ONE normalized question set, storage contract, voice flow, notification matrix, post-capture lifecycle, and the change rule (future features must state which section they amend). `docs/intake-capture-contract.md` remains the implementation spec under it.

- [x] **A** — Wrote `docs/callverted-standard.md` (the single answer to "how does Callverted treat X")
- [x] **B1** — Full question normalization: deleted restoration's `cause`/`rooms_affected` enrichment questions + scoring rules from `verticalDefinitions.ts` — ALL six verticals now identical (service menu + urgency + time_since_issue + coverage + zip, exactly 4 questions each); re-seeded local DB (`✓ 4 questions` × 6); the only guess-prone extraction slots are gone; historical leads still render via labels.ts `humanizeKey` fallback; `scoring.test.ts` critical-signal case rewritten to the channel-realistic `signalText` path; `industries.ts` restoration copy (heroSub/scenario chips/asks/FAQ) reworded to universal fields so the page doesn't overclaim
- [x] **B2** — Two-way reclassification: PATCH `/api/leads/[id]` now accepts validated `leadType`/`messageKind` (job→message defaults kind 'general'; message→job forces kind null; scores untouched both ways — metrics/queues already guard on leadType); lead detail page gets "Convert to job" / "File as message" one-tap action (`_client.tsx` + page passes `leadType`)
- [x] **C** — Verification 2026-07-22: tsc clean · 451/451 tests · re-seed + live-model harness 30/30 on the normalized 4-question config · build clean (see below)
- [x] **Prod re-seed DONE 2026-07-22** — surgical UPDATE of the restoration row via Supabase MCP (questions + scoring_rules from the code as source of truth); verified: all 6 prod verticals now have the identical 4 question keys (service_type, urgency, time_since_issue, has_coverage), restoration 10 rules. Safe against currently-deployed code (config-driven; labels.ts humanizeKey fallback already live)
- [ ] **Manual UI check** — flip a dev message→job (appears in Type=Job filter, unscored, can be marked Won with $) and back; confirm an old restoration lead with `rooms_affected` stored still renders its answers

---

# SESSION 13: VOICE CALL SMOOTHNESS + DURABLE FINALIZATION (2026-07-22)

> Root-caused from the founder's first real prod AI call: (a) the AI can't be interrupted → feels rigid; (b) the call row stuck at "ringing" with no transcript/score — the post-WebSocket-close grace window on Vercel froze the inline GPT work mid-write (same failure class as the `void send()` email bug). Fixes: audio-layer barge-in + move ALL heavy post-call work to a durable Inngest job.

- [x] **Barge-in (audio layer only)** — `engine.handleBargeIn` (exported) reuses the DTMF interruption routine (clear Twilio buffer + cancel + truncate), wired to OpenAI `input_audio_buffer.speech_started` in `openai-handler.service.ts`. Guards: never in confirmation/create_lead/end states; only when audio is actually playing (classification-only turns can't be cancelled). State machine control flow untouched — "code decides" preserved. Side benefit: prevents the active-response collision when a caller talks over a prompt.
- [x] **Durable finalization** — `captureLead` slimmed to lead insert + call link ONLY (no more mid-call dead air between confirmation and goodbye); `endCall` slimmed to one fast updateCall (summary removed); stream-route cleanup = fast writes + one `call/voice.ended` Inngest event; NEW `src/lib/leads/finalize-voice-call.ts` (runner-agnostic, reads everything from DB, idempotent via priorityScore/summary checks) does scoring + assessment + notifications + summary; NEW Inngest fn `finalize-voice-call` registered in `/api/inngest`.
- [x] **Shared job alert** — NEW `src/lib/leads/notify-job.ts` (full lead-packet email + push, pref-gated, never throws); used by the voice finalizer AND the web submit route (single implementation, channels can't drift).
- [x] **Early-hangup messages no longer dropped** — cleanup now also captures a message-path call that gave a name or reason (previously lost: deriveIntakeStatus 'not_started' guard skipped them).
- [x] **Verification 2026-07-22** — tsc clean · 458/458 tests across 21 files (7 new finalizer tests incl. critical-signal floor from lead notes, idempotency, voice_test guard; captureLead tests updated to fast-persist contract) · eslint 0 errors · build clean
- [ ] **Deploy note** — after this deploys, RE-SYNC the Inngest app (PUT /api/inngest or via Inngest dashboard) so `finalize-voice-call` registers
- [x] **Live re-test #1 (2026-07-22)** — PARTIAL PASS: transcript (12 turns), status/ended_at/duration all persisted correctly (the old freeze bug is fixed), but 4 NEW issues found → fixed in commit d2d7cb9 below

## 13.2 Second round of fixes (commit d2d7cb9) — from the first real AI call's log/DB trail
- [x] **Spoken ZIP failed twice** — caller read "0 7 6 4 1" digit-by-digit; Whisper separates the tokens so `\b\d{5}\b` never matched, and the model fallback missed too. `tryExtractZipDeterministic` now stitches digit tokens + number words ("zero"/"oh"), still rejecting 6-digit mis-transcriptions. 7 regression tests.
- [x] **Keypad presses invisible in the transcript** — a call answered by keypress read as the AI talking to itself. DTMF now pushes a caller turn labelled with the option's meaning ("Emergency — need help right now (pressed 1)", "07641 (entered on keypad)").
- [x] **Goodbye clipped / abrupt** — connection closed on a 1.2s timer after OpenAI finished GENERATING while Twilio still had buffered audio. Now closes on Twilio echoing back a `goodbye-complete` mark (caller has actually heard it), timer raised to 8s as backstop only. Sign-off reworded to stop repeating the confirmation's callback promise.
- [x] **Finalization never reached Inngest** — root cause confirmed from logs: all DB writes in the WS-close path landed, the outbound `inngest.send` did not (frozen), so the lead stayed unscored with no summary. Now handed off from INSIDE the live call (`ctx.onFinalize` → `finishCall`), WS-close as fallback (idempotent via `session.finalizeSent`), plus NEW `<Stream statusCallback>` → `/api/twilio/stream/status` as the safety net for early hangups.
- [x] Verification: tsc clean · 465/465 tests · build clean · new route registered
- [ ] **Live re-test #2** — call again and confirm: spoken ZIP works first try; keypad presses appear in the transcript; goodbye plays fully and doesn't feel clipped; interrupting mid-sentence stops the AI; lead gets scored + call gets a summary within ~a minute (check `/dashboard/calls`)
