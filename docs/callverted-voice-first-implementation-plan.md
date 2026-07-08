# Callverted — Voice-First Overflow Receptionist: Implementation Plan

> **Plan of record (2026-07).** Step-by-step plan to pivot Callverted from Telnyx missed-call-SMS to a
> **Twilio + OpenAI Realtime voice overflow receptionist**, reusing the working voice pipeline from the
> sibling repo `../voice-agent` ("Answerify").
>
> **Host decision:** Voice WebSocket runs on **Vercel** (Fluid Compute, Node runtime,
> `experimental_upgradeWebSocket`) for now. **Railway is the later fallback** for calls that need to run
> past Vercel Hobby's **300s (5-min) hard per-connection cap**. Design conversations to wrap up by ~4:30.
>
> **Source of truth for reusable code:** `/home/nile/Documents/repos/voice-agent` (the `websocket-server/`
> folder + `src/app/api/twilio/voice/route.ts` + `src/lib/twilio/webhook.ts`).
>
> Execute phases in order. Each step lists **files**, **action**, and an **acceptance check**. Non-destructive:
> add columns, don't drop; keep Telnyx columns dormant rather than deleting data.

---

## Guiding constraints (read once)

- **Overflow-first, not answer-first.** Answerify answers immediately; Callverted must **ring the business
  line first** (`forwardingNumber`, `callTimeoutSeconds` already on `businesses`) and only hand off to the
  AI on no-answer/busy/failed. This Dial-first logic does **not** exist in Answerify — it is the one net-new
  telephony piece.
- **Vercel 5-min cap is real.** The Media Stream WS is force-closed at 300s on Hobby and Twilio will **not**
  resume it. Target call length is 90–180s; add a hard wrap-up prompt at ~4:30 (§Phase 5). Move the stream
  route to Railway later if long calls matter.
- **A single call = one WS connection pinned to one function instance** → per-call in-memory `SessionState`
  is fine. **No Redis needed for V1** (Redis is only for cross-instance/durable state, which we don't have
  within one call).
- **Never let the model invent pricing.** `get_price_range` returns a business-**approved** message from the
  `pricingRules` table, or a safe fallback. The model reads it; it never composes a price.
- **Keep the crown jewels verbatim:** the barge-in/interrupt logic in `openai-handler.service.ts`, the
  `realtime-client.ts` wrapper, VAD tuning in `constants.ts`, and the function-registry pattern in
  `handlers.ts`. Rewrite only the product-specific pieces (instructions + handler bodies).

---

## PHASE 0 — Prep & external setup (no code)

- [ ] **0.1 Twilio account**: create/confirm account, note `ACCOUNT_SID` + `AUTH_TOKEN`.
- [ ] **0.2 Buy one test number** (local, voice-capable). This becomes the business's Callverted number.
- [ ] **0.3 OpenAI Realtime access**: confirm `OPENAI_API_KEY` works for the Realtime API.
- [ ] **0.4 Decide the WS public URL**: on Vercel it is `wss://<app-domain>/api/twilio/stream`. (Railway later:
      `wss://<railway-host>`.) Store in env as `VOICE_STREAM_WSS_URL`.
- **Acceptance:** you can log into Twilio, have a number, and have the four secrets ready.

---

## PHASE 1 — Env, deps, Twilio utilities

- [ ] **1.1** `src/lib/env.ts` — add to `serverEnv`:
  - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `OPENAI_API_KEY`,
  - `OPENAI_REALTIME_MODEL` (default `gpt-4o-realtime-preview-2024-12-17`),
  - `VOICE_STREAM_WSS_URL`, `VOICE_STREAM_TOKEN_SECRET` (HMAC secret to authenticate the stream — see 3.3),
  - `SKIP_TWILIO_VALIDATION` (dev only), `EMERGENCY_DISABLE_CALLS`.
  - Leave `TELNYX_*` in place for now (dormant).
- [ ] **1.2** Install deps in the **root** app: `twilio`, `ws`, `@vercel/functions`, `@types/ws` (dev).
      (μ-law is passthrough — **no** `alawmulaw` needed.)
- [ ] **1.3** `src/lib/twilio/webhook.ts` — copy `validateTwilioSignature` + `shouldValidateWebhook` from
      `../voice-agent/src/lib/twilio/webhook.ts`. **Gotcha:** Twilio signs the **exact public URL** it called
      (incl. query) + sorted POST params. Behind Vercel, build the URL from `APP_URL` + path, not
      `request.url`, if they differ. Verify against a real Twilio test request.
- [ ] **1.4** `src/lib/twilio/client.ts` — thin REST helpers using the `twilio` SDK:
      `redirectCall(callSid, url)` (for live transfer), `hangupCall(callSid)`. Auth from env.
- **Acceptance:** `pnpm/npm run build` passes; `validateTwilioSignature` returns true on a signed sample.

---

## PHASE 2 — Schema changes (one additive Drizzle migration)

> All additive. Generate with drizzle-kit, review SQL, then push. Keep existing Telnyx columns.

- [ ] **2.1** `src/lib/db/schema/businesses.ts` — add:
  - `twilioPhoneNumber text` (the new inbound number; keep `telnyxPhoneNumber` dormant),
  - `overflowMode text default 'ring_then_ai'` (`'ring_then_ai' | 'ai_immediate'`),
  - `recordingEnabled boolean default false`, `recordingDisclosure text`,
  - `urgentTransferNumber text`, `greetingMessage text`, `aiInstructions text`,
  - `isPaused boolean default false`.
  - Reuse existing `forwardingNumber` (Dial target) and `callTimeoutSeconds` (ring window). `serviceArea`,
    `timezone`, `vertical`, `subscriptionStatus` already exist.
- [ ] **2.2** `src/lib/db/schema/calls.ts` — add:
  - `twilioCallSid text unique`, `overflowStartedAt timestamp`, `businessAnsweredAt timestamp`,
  - `outcome text` (`'in_progress' | 'business_answered' | 'ai_captured' | 'abandoned' | 'error'`),
  - `aiHandled boolean default false`, `recordingUrl text`, `summary text`.
  - Keep the existing Telnyx `telnyxCallControlId`/`telnyxCallLegId` columns (nullable, dormant).
- [ ] **2.3** New schema `src/lib/db/schema/pricingRules.ts`:
  - `id, businessId (fk), vertical, serviceCategory, pricingType` (`'fixed'|'preliminary_range'|'starting'|'inspection_required'`),
    `minimumAmount int (cents)`, `maximumAmount int`, `fixedAmount int`, `startingAmount int`,
    `approvedCustomerMessage text`, `disclaimer text`, `isActive boolean default true`, timestamps.
- [ ] **2.4** New schema `src/lib/db/schema/providerWebhookEvents.ts` (idempotency for status/recording callbacks):
  - `id, provider text, providerEventId text, eventType text, processedAt timestamp, payload jsonb`,
    **unique(provider, providerEventId)**.
- [ ] **2.5** Register new tables in `src/lib/db/schema/index.ts`. Run `drizzle-kit generate`, review, `push`.
- **Deferred (do NOT build in V1):** `voiceSessions`, `voiceAnswers`, `services`, `serviceQuestions`,
  `smsConsents`, `smsSuppressions`. For V1, capture Q&A into `leads.intakeAnswers` (JSONB, already exists)
  and the call `summary`. Note this in the migration comment.
- **Acceptance:** migration applies cleanly to the prod-shaped DB; `db` typechecks against new columns.

---

## PHASE 3 — Twilio voice webhook + overflow (Dial-first) on Next.js

- [ ] **3.1** `src/app/api/twilio/voice/route.ts` (`runtime = 'nodejs'`):
  - Parse `formData`, validate signature (skip if `SKIP_TWILIO_VALIDATION`).
  - Look up business by `To` (normalize E.164) via `businesses.twilioPhoneNumber`.
  - Guard: no business / `EMERGENCY_DISABLE_CALLS` / `isPaused` / subscription not in `['active','trialing']`
    → return polite error TwiML + `<Hangup/>` (copy `generateErrorTwiML` from Answerify).
  - Insert `calls` row: `twilioCallSid`, `callerPhone` (From), `calledNumber` (To), `status:'ringing'`,
    `outcome:'in_progress'`.
  - **Branch on `overflowMode`:**
    - `ring_then_ai` (default): return `<Dial timeout={callTimeoutSeconds} action="/api/twilio/voice/status" answerOnBridge="true"><Number>{forwardingNumber}</Number></Dial>`.
    - `ai_immediate`: skip straight to the `<Connect><Stream>` TwiML (see 3.2).
- [ ] **3.2** `src/app/api/twilio/voice/status/route.ts` (Dial action callback, `runtime='nodejs'`):
  - Validate signature. Read `DialCallStatus`.
  - If `completed`/`answered` → business took it: update call `outcome:'business_answered'`,
    `businessAnsweredAt=now`; return empty `<Response/>` (call already bridged/ended).
  - If `no-answer`/`busy`/`failed` → **overflow**: update call `overflowStartedAt=now`, `aiHandled=true`;
    return TwiML `<Connect><Stream url="{VOICE_STREAM_WSS_URL}?token={signed}"><Parameter name="callSid" value="{CallSid}"/></Stream></Connect>`.
- [ ] **3.3 Stream auth token:** because the `wss` upgrade is **not** Twilio-signature-verified, generate a
      short-lived HMAC token (`callSid + exp`, signed with `VOICE_STREAM_TOKEN_SECRET`) and pass it as a query
      param on the Stream URL. The stream route (Phase 4) verifies it before doing any DB work. Prevents anyone
      from opening your socket.
- [ ] **3.4** Recording disclosure is spoken by the **AI's first line** (in instructions), not `<Say>`. If
      `recordingEnabled`, also add `record="record-from-answer"` on the relevant verb and a
      `recordingStatusCallback` → store `recordingUrl` (idempotent via `providerWebhookEvents`).
- **Acceptance:** a real call to the Twilio number rings your `forwardingNumber`; if you don't answer within
  the timeout, Twilio requests the status callback and receives `<Connect><Stream>` TwiML (verify in Twilio
  console request logs even before the WS is built).

---

## PHASE 4 — Voice runtime: reusable lib + Vercel WS entrypoint

> Copy the transport-agnostic services into `src/lib/voice/`, then wire a Vercel WS route as the entry.
> Structure so a Railway standalone entry can import the **same** `src/lib/voice/**` later.

- [ ] **4.1** Create `src/lib/voice/` and copy **verbatim** (adapt imports/logger only):
  - `openai/realtime-client.ts`  ← Answerify `websocket-server/src/lib/openai/realtime-client.ts`
  - `openai-handler.service.ts`  ← same path (barge-in/interrupt logic UNCHANGED)
  - `types/session.ts`, `types/openai.ts`, `types/twilio.ts`
  - `config/constants.ts` — **change**: `MAX_CALL_DURATION` → `4.5 * 60 * 1000`; read model from
    `serverEnv.OPENAI_REALTIME_MODEL` instead of the hardcoded `OPENAI_CONFIG.MODEL`.
  - `lib/audio/conversions.ts` (if referenced).
  - Replace the Answerify `Logger`/DI container with Callverted's `src/lib/logger`.
- [ ] **4.2** `src/lib/voice/call-manager.ts` — adapt Answerify `call-manager.service.ts`:
  - `createSession(callSid, callerPhone)` — unchanged shape.
  - `loadBusiness(callSid)` — query Callverted `calls` → `businesses` (+ `pricingRules`, + `verticalConfigs`
    for the business's `vertical`) instead of `companies`/`services`.
  - `initializeOpenAI(business, session)` — same session.update config (μ-law in/out, server_vad, tools from
    `getFunctionSchemas()`), instructions from the rewritten builder (Phase 5).
  - `endCall(session, outcome)` — write `calls.summary`, `durationSeconds`, `outcome`; ensure the lead was
    created (it is created mid-call by `capture_lead`, Phase 6). Generate summary with `gpt-4o-mini` (keep
    Answerify's `generateSummary`, strip PII prompt as-is).
- [ ] **4.3** `src/app/api/twilio/stream/route.ts` — the Vercel WS entrypoint:
  - `export const runtime = 'nodejs'`, `export const maxDuration = 300`.
  - `export async function GET()` → `return experimental_upgradeWebSocket((ws, req) => { ... })` from
    `@vercel/functions`.
  - **Verify the token** (3.3) from the query string first; close 1008 if invalid.
  - Port the message loop from Answerify `index.ts`: wait for Twilio `start` → read `customParameters.callSid`
    → load call+business → init OpenAI client → `openaiHandler.setupEventHandlers(client, ws, session)` →
    `media` events pass μ-law straight to OpenAI → `stop`/`close` → `callManager.endCall`.
  - Keep the initial-silence + max-duration safety timers (from `constants.ts`).
  - **Session state is in-memory per connection** (no Redis).
- **Acceptance:** an unanswered test call connects the media stream; the AI greets the caller and you can hold
  a spoken back-and-forth with working barge-in. Call ends cleanly; `calls.summary` is written.

---

## PHASE 5 — Rewrite instruction builder (deterministic qualification tree)

- [ ] **5.1** `src/lib/voice/instruction-builder.ts` — **replace** Answerify's receptionist/booking prompt.
      Build from `business` + `verticalConfigs.questions` + `pricingRules`. Sections:
  - **Role:** "automated intake assistant for {businessName}. You answer ONLY because the team could not pick
    up. Be brief."
  - **Opening (say verbatim):** identify business + that you're automated + why you answered + recording
    disclosure if `recordingEnabled`. Then WAIT.
  - **Deterministic state order:** call reason → service category (from vertical) → urgency → ZIP /
    service-area → name → callback preference → (optional) approved price range → confirmation → done.
  - **One question at a time; map free speech to approved categories; ≤1 clarification per state.**
  - **Hard prohibitions:** no quotes/prices except via `get_price_range`; no appointment promises; no arrival
    times; no diagnosis/safety advice beyond approved scripts; never claim the job is accepted.
  - **Wrap-up guard (Vercel cap):** if the call approaches ~4:30, say "I'll save what we have and have the team
    call you back," call `capture_lead`, then `end_conversation`.
  - **Emergency branch per vertical:** read approved emergency language from `verticalConfigs`; if urgent and
    `urgentTransferNumber` set, offer `transfer_call`.
- **Acceptance:** prompt renders for a `restoration`/`plumbing` business with its real questions + pricing
  categories; no booking/calendar language remains.

---

## PHASE 6 — Rewrite function handlers (keep registry, swap bodies)

- [ ] **6.1** `src/lib/voice/functions/handlers.ts` — keep the `Map<string,{schema,handler}>` +
      `executeFunction` + `getFunctionSchemas` pattern. **Remove** calendar/booking/knowledge handlers.
      **Add:**
  - `set_call_reason({reason})`, `classify_service({category})`, `set_urgency({level})` — persist into the
    in-memory `session.conversationContext` (and later the lead).
  - `check_service_area({zip})` → compare to `business.serviceArea` (simple contains/list match for V1) →
    `{eligible: boolean}`.
  - `get_price_range({serviceCategory})` → query `pricingRules` (business + category, `isActive`). Return the
    stored `approvedCustomerMessage` (+ `pricingType`, amounts). If none → `{eligible:false, message:"The team
    will review the details before discussing pricing."}`. **Never** compute a price.
  - `capture_lead({name, serviceCategory, urgency, zip, callbackPreference, description})` →
    `createLead({...})` (or update the call's existing lead), set `intakeAnswers` JSONB + `urgencyScore`
    mapping + `status:'intake_completed'`, link `calls.leadId`, then fire
    `sendNewLeadNotification({ painterEmail: business.ownerEmail, painterName: business.ownerName,
    businessName, lead })` (existing email fn — rename param later; it's the notification hook).
  - `transfer_call({reason})` → `redirectCall(callSid, <twiml-to-dial-urgentTransferNumber>)` via
    `src/lib/twilio/client.ts`. Keep it as a special side-effecting handler (mirror Answerify's
    `handleSpecialFunctions`).
  - `end_conversation({})` → graceful WS close (reuse Answerify's END_CALL_DELAY pattern).
- [ ] **6.2** Register schemas so `getFunctionSchemas()` feeds `session.update.tools` in `call-manager`.
- **Acceptance:** during a test call the AI qualifies a job, reads an approved range for a configured
  category, and a `leads` row + owner email notification are produced before hangup.

---

## PHASE 7 — Retire Telnyx + SMS

- [ ] **7.1** Delete `src/app/api/telnyx/` (call + sms routes), `src/lib/telnyx/`, `src/lib/sms.ts`.
- [ ] **7.2** Remove/repurpose `src/lib/inngest/functions/followup-cron.ts`: SMS follow-ups are out. Either
      delete or convert to an **email** callback reminder to the business for un-actioned leads. Mark
      `smsEvents` table dormant (leave data).
- [ ] **7.3** Update onboarding/settings UI + `businesses` API that referenced `telnyxPhoneNumber` →
      `twilioPhoneNumber`, and expose the new fields (overflowMode, recording, urgentTransferNumber, greeting,
      aiInstructions). Grep: `telnyx`, `sendSms`, `smsMissedCall`, `SMS_FEATURE_ENABLED`.
- [ ] **7.4** Remove `TELNYX_*` and SMS env from `src/lib/env.ts` once nothing imports them.
- **Acceptance:** `npm run build` passes with zero Telnyx/SMS imports; grep for `telnyx` returns only dormant
  DB column names + this doc.

---

## PHASE 8 — Deploy config, wiring, and manual test

- [ ] **8.1** `vercel.json` (or `vercel.ts`): ensure Fluid Compute (default) + Node runtime; set
      `maxDuration: 300` for `app/api/twilio/stream/**` and small defaults elsewhere.
- [ ] **8.2** Set all env vars in Vercel (Preview + Prod). `VOICE_STREAM_WSS_URL` = `wss://<app-domain>/api/twilio/stream`.
- [ ] **8.3** In Twilio: point the number's **Voice webhook** to `https://<app-domain>/api/twilio/voice` (POST).
- [ ] **8.4** Seed one test business: `twilioPhoneNumber`, `forwardingNumber` (your cell), `vertical`,
      `serviceArea`, a couple of `pricingRules`, `subscriptionStatus='trialing'`, `overflowMode='ring_then_ai'`.
- [ ] **8.5** Manual test matrix (log outcomes):
  - Business answers within timeout → AI never engages; `outcome='business_answered'`.
  - No answer → AI overflow → routine job qualified → lead + email.
  - Urgent job → emergency language + optional transfer.
  - Unsupported/unclear service → graceful "team will follow up."
  - Caller hangs up mid-intake → partial lead + clean call end (no crash).
  - Call nears 4:30 → wrap-up fires before Vercel kills the socket.
- **Acceptance:** all six scenarios behave; no unhandled WS errors in logs.

---

## PHASE 9 — Explicitly deferred (not now)

- DTMF/keypad mixed-mode input and free-form voicemail fallback (spec §7) — speech-only for V1.
- Website quote-range widget reuse of the pricing/qualification engine (spec §14).
- `services` / `serviceQuestions` normalization, `voiceSessions` / `voiceAnswers` tables.
- Railway extraction of the stream runtime (only if calls must exceed ~5 min).
- Any SMS / A2P (see the deferred `telnyx-a2p-productionization-spec.md`).
- Revenue attribution dashboards beyond basic lead outcome tracking.

---

## Known risks / gotchas to watch during execution

1. `experimental_upgradeWebSocket` is **experimental** — pin `@vercel/functions`, and confirm outbound `ws`
   (Railway→OpenAI, here Vercel→OpenAI) works on the Node runtime. If it misbehaves, the same
   `src/lib/voice/**` runs unchanged on a Railway standalone entry (`server.listen`) — that's the escape hatch.
2. **Twilio signature URL mismatch** behind Vercel — build the signed URL from `APP_URL`, test with a real
   request before trusting it; keep `SKIP_TWILIO_VALIDATION` for local ngrok only.
3. **5-min hard cap** — the wrap-up prompt is load-bearing on Hobby. Upgrade to Pro (800s) or move to Railway
   before any use case needs longer calls.
4. **Stream auth** — the `wss` endpoint has no Twilio signature; the HMAC token (3.3) is the only thing
   stopping arbitrary sockets. Don't skip it in prod.
5. **μ-law passthrough** — do not transcode; Twilio and OpenAI both use `g711_ulaw` at 8kHz here.
6. **PII in logs** — carry over Answerify's redaction discipline; never log full transcripts/phone numbers in
   prod.

## File map (new/changed, quick reference)

```
src/lib/env.ts                                (+twilio/openai/stream env, −telnyx later)
src/lib/twilio/webhook.ts                     (new, copied)
src/lib/twilio/client.ts                      (new)
src/lib/db/schema/businesses.ts               (+overflow/recording/greeting cols)
src/lib/db/schema/calls.ts                    (+twilioCallSid/overflow cols)
src/lib/db/schema/pricingRules.ts             (new)
src/lib/db/schema/providerWebhookEvents.ts    (new)
src/lib/db/schema/index.ts                    (register new tables)
src/app/api/twilio/voice/route.ts             (new — Dial-first overflow)
src/app/api/twilio/voice/status/route.ts      (new — overflow decision)
src/app/api/twilio/stream/route.ts            (new — Vercel WS entry)
src/lib/voice/realtime-client.ts              (copied verbatim)
src/lib/voice/openai-handler.service.ts       (copied — barge-in intact)
src/lib/voice/call-manager.ts                 (adapted to businesses/leads)
src/lib/voice/instruction-builder.ts          (REWRITTEN — qualification tree)
src/lib/voice/functions/handlers.ts           (registry kept, bodies rewritten)
src/lib/voice/config/constants.ts             (copied — 4.5min cap, model from env)
src/lib/voice/types/*.ts                       (copied)
src/app/api/telnyx/**, src/lib/telnyx/**, src/lib/sms.ts   (DELETED)
src/lib/inngest/functions/followup-cron.ts    (deleted or → email reminder)
vercel.json                                   (maxDuration for stream route)
```
