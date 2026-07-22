# The Intake Capture Contract — normalizing all channels to the voice-AI standard

> **This document is the implementation spec under `docs/callverted-standard.md`** (the product
> constitution — identity, taxonomy, normalized question set, lifecycle). Where the two differ,
> the standard wins. Note: since Session 12, leads CAN be reclassified job↔message in-app
> (validated `leadType` PATCH + one-tap UI), and restoration's enrichment questions were removed —
> every vertical now has the identical 4-question set.

**Status:** IMPLEMENTED (Session 11) — see dev-plan.md Session 11 for verification state.
**Date:** 2026-07-22
**Decision context:** The AI voice flow is the product's reference standard. Human-answered call
capture and the web form (direct URL + widget — same code path) must store contacts the same way,
so every channel ends in the same three outcomes and the ranked list / funnel / leak metrics stay
trustworthy. Founder decisions locked in: web form gets a **backend-only** non-job valve (no UI
branch); future receptionist expansion is kept open **generically** (approved-answer Q&A direction)
but not designed for now; this work runs **before** Session 10 (dollarized leak), because the leak
number is only defensible on clean job classification.

---

## 1. The standard, as built (voice AI pipeline)

What the voice channel guarantees today — this is the contract the other channels adopt.

### 1.1 Three outcomes, exactly one per contact

| Outcome | Lead row | Scored | leadStatus | Notification | Audit trail |
|---|---|---|---|---|---|
| **Job** | yes — `leadType: 'job'` | yes (score → assess → `'qualified'`) | `qualified` | Lead-packet email + push (`qualifiedLead` / `pushNewLead` prefs) | calls row + transcript + summary |
| **Message** | yes — `leadType: 'message'` + `messageKind` | **never** (scores stay null) | stays `new` | Low-key message email + push (`messageNotification` / `pushNewLead` prefs) | calls row + transcript + summary |
| **Screened** | **no row at all** | — | — | none | calls row, `outcome: 'screened'` + `screenedReason` |

`messageKind` taxonomy (shared, canonical): `existing_customer | billing | callback | question | general`.

### 1.2 How voice decides (the part that stays voice-only)

Open-ended "what's going on?" → one forced `extract_intake` pass that BOTH fills every field the
caller already stated AND returns a required `contact_type` triage
(`job|message|wrong_number|solicitation|wants_human|unclear`). Code routes on it; **job signal
always wins** (any structured field found → job flow regardless of classification). Unclear gets
one clarification, then defaults to a general message. Screening is the one irreversible door, so
it is never taken when the utterance mentions a real service need. Every non-job terminal funnels
through one function (`markMessage`) — that centralization is deliberate and must be preserved
(see §6, receptionist seam).

### 1.3 What voice stores (the field-population contract)

On `leads` (via `captureLead`, `src/lib/voice/functions/actions.ts`):

| Field | Job | Message |
|---|---|---|
| `source` | `voice_overflow` (`voice_test` for tests) | same |
| `callStatus` | `missed` | same |
| `leadType` / `messageKind` | `job` / null | `message` / kind |
| `intakeStatus` | `deriveIntakeStatus()` — honest: `not_started` (short paths), `completed` (all visible *askable* questions answered; off-list counts via `serviceRequested`), `abandoned` (started, didn't finish) | usually `not_started` |
| `intakeAnswers` | vertical answers **+ `zip_code` folded in from session** | whatever was volunteered |
| `serviceRequested` | caller's own words, always kept (off-list = only service record) | if stated |
| `notes` | `reasonForCall` if any | **the message content** (caller's own words) |
| `callerName` | extracted (refusals never stored as names) | same |
| scores + `scoreTrace` | via `assessLead` (writes `aiAssessments` row, denormalizes scores, sets `leadStatus: 'qualified'`) | all null, no assessment row |

Scoring is called **with `ScoringContext`** `{ serviceRequested, signalText: reasonForCall }` —
this is what powers the emergency floor for off-list services and the critical-signal floor
("gas leak", "sewage backup" → priority ≥ 80).

On `calls` (via `endCall`): `outcome` (`ai_captured` / `abandoned` / `screened` — lead presence
decides), `screenedReason`, turn-by-turn `transcript` (what was *actually* spoken, barge-ins
included), PII-scrubbed `summary`, durations. Idempotency: `captureLeadOnce` promise guard.

---

## 2. Refinements to the standard itself (fix before cloning)

- **R1 — ScoringContext everywhere.** Only voice passes it today, so the critical-signal and
  off-list-emergency floors are structurally unreachable from the other channels. The contract:
  every `scoreLeadFromAnswers` call site passes `{ serviceRequested, signalText }` with the best
  free text that channel has (human: the transcript; web: the free-text answers/serviceRequested).
- **R2 — Custom service options at every seam.** The web submit route scores and quotes against
  raw `config.questions` while the form *rendered* `withCustomServiceOptions(...)` — a custom
  service answered on the form may score/quote inconsistently. Voice and human paths already apply
  it. Fix the submit route (`assessAndNotify` + `quoteForAnswers` call).
- **R3 — Shared message notification.** `notifyMessageCaptured` lives inside the voice actions
  file. Lift it to a shared helper (next to `sendLeadPacketEmail`) so the web valve can send the
  identical low-key alert instead of growing a second implementation.
- **R4 — Write the contract down as code.** A small shared type/constant module (outcome trio,
  messageKind enum already exists in `session.ts`) referenced by all three capture sites, so the
  taxonomy can't drift per-channel. Minimum: move `LeadType`/`MessageKind` out of the voice-only
  types file into `src/lib/leads/` and import everywhere.

---

## 3. Human-answered call parity (`voice_human`)

**Today:** binary. Any signal (job intent, urgency, callback, quote-ask, contact shared, or any
structured answer) → a **job** lead, always scored; no signal → no lead. There is no message tier,
so a billing-question call the team answered becomes a scored job in the queue. The irony: the
transcript extraction reuses `buildExtractIntakeTool`, whose schema *requires* `contact_type` —
the model returns the classification on every call and `validateExtraction` discards it.

**Target:** the full three-outcome contract, decided from the transcript.

- **H1 — Classification.** Extend the existing `record_call_signal` pass (it's the one whose
  prompt is written for two-party team-answered transcripts) to return:
  - `contact_kind: "job" | "message" | "junk" | "none"` (junk = wrong number / solicitation —
    the screened equivalent; none = social/uninformative, no opportunity)
  - `message_kind` (the shared 5-value enum) when `contact_kind = "message"`
  - `message_for_team` — the caller's ask in their own words. This, NOT `summary`, becomes
    `leads.notes` for messages: `summary` is deliberately PII-scrubbed, which is exactly wrong
    for a message the team must act on.
  - `service_requested` — the caller's own words for the service when stated (off-list capture
    parity; also feeds the emergency floor via ScoringContext).
  Keep reading `extract_intake` for the structured answers as today.
- **H2 — Precedence, mirroring voice ("job signal always wins"):** any structured intake answers
  OR `contact_kind: job` → **job**. Else `message` → message lead with kind. Else junk/none →
  **no lead row** (current behavior, now with junk made explicit). Note this deliberately
  *demotes* some of today's lead-creating signals: callback-requested or price-shopping with no
  job intent files as a message (kind `callback`/`question`), matching the voice taxonomy where
  price-shopping is explicitly not a job.
- **H3 — Message storage parity:** `leadType: 'message'`, `messageKind`, `notes = message_for_team`,
  scoring/assessment **skipped entirely** (today the human path scores unconditionally), leadStatus
  stays `new`.
- **H4 — ZIP fold-in:** `validateExtraction` already returns `zipCode`; the human path drops it.
  Fold into `intakeAnswers.zip_code` like voice does.
- **H5 — serviceRequested + ScoringContext:** persist `service_requested` on the lead; score jobs
  with `{ serviceRequested, signalText: transcript }` so "gas leak" said during a team call floors
  to 80+ exactly as it would on the AI line.
- **H6 — Honest intakeStatus:** replace `hasAnswers ? 'completed' : 'started'` (today "completed"
  means "any one answer") with the derive rule: all visible askable questions answered →
  `completed`; some → `started`; none → `not_started`. (`abandoned` doesn't apply — nobody hung up
  mid-intake; the team just didn't ask.)
- **H7 — Notifications: stay silent for BOTH jobs and messages** (deliberate deviation, founder
  decision — the operator was on the call). Storage parity, not alert parity.
- **H8 — Unchanged:** idempotency via `call.leadId`, audio deleted after transcription, one
  `recordingEnabled` toggle, `calls.outcome` stays `business_answered` (it describes who handled
  the call, not what it contained — junk/no-lead is auditable via the summary + absent leadId).

---

## 4. Web form parity (`direct_intake` + `website_widget` — one code path)

**Today:** every name+phone submission becomes a scored job with a full Qualified Lead alert.
There is no classification step at all. Non-jobs leak in through the "Something else" free-text
service option ("do you service my area?", "question about my invoice") and land in the ranked
queue as jobs.

**Target:** jobs by default — the channel self-selects, and the form stays pitched purely as job
intake (locked: **no visible message/question UI branch**). One backend safety valve:

- **W1 — The valve.** Only when the submission took the "Something else" path (i.e.
  `serviceRequested` is set and the structured primary answer is empty), run one cheap
  classification (gpt-4o-mini, forced tool call, same style as `classify_service`) over the
  free text: `service_request | non_job_message | unclear`.
  - `service_request` or `unclear` → **job** (unlike voice's default-to-message on unclear: a
    form submitter chose to fill a service-intake form, so the prior is heavily job; the valve
    only diverts *clearly* non-job text). Classifier failure/timeout → job (fail open — a
    misfiled job beats a lost one).
  - `non_job_message` → `leadType: 'message'` + `messageKind` (`question`/`billing`/`general`),
    `notes` = their free text, **skip scoring + assessment**, leadStatus stays `new`.
- **W2 — Message notification:** unlike human calls, nobody at the business saw a web submission —
  so valve messages DO alert, using the shared low-key message email + push from R3 (gated on
  `messageNotification` / `pushNewLead`, identical to voice messages).
- **W3 — Job path context:** pass `ScoringContext { serviceRequested, signalText: <free-text answers> }` (R1).
- **W4 — Re-submission upgrade rule:** submit dedupes by phone+business and updates the existing
  lead. If an existing **message** lead re-submits with a real structured service answer, upgrade
  `leadType` message → job (then score as usual). Never downgrade job → message on re-submit.
- **W5 — R2 fix here:** score/quote with `withCustomServiceOptions(...)` applied.
- Structured-path submissions (picked a real service from the list) skip the valve entirely —
  zero added latency or cost for the normal case.

---

## 5. What this makes true (the pitch)

"Many ways in. One ranked list out" becomes literally true: **every** channel resolves to the same
three outcomes, stored identically, so the ranked queue contains only real jobs, messages are tidy
and routed, and junk never pollutes the inbox. Downstream, Session 10's "slipped Hot leads → $"
figure inherits clean denominators on every channel — the number survives owner scrutiny. In the
sales narrative, the sort stays the differentiator against AI receptionists (they hand you *more*
undifferentiated messages; Callverted hands you *fewer, ranked, dollar-valued* callbacks), and
messages remain hygiene for the ranked list — never a headline feature.

## 6. Receptionist seam (design consideration only — build nothing now)

- **Classification stays separate from policy.** Every channel first decides *what the contact is*
  (job/message+kind/junk), then applies *what we do about it* (score+alert / record+route / drop).
  Keep those as two steps in the human/web ports too. Today the policy for `question` messages is
  "record and leave in the system"; a future receptionist mode changes only the policy step —
  answer from an owner-approved source, then still record — without touching classification.
- **The one insertion point already exists on voice:** all non-job terminals route through
  `markMessage`/`jumpToWrapUp`. A future "look up an approved answer before wrapping up" slots in
  there and nowhere else.
- **The approved-content pattern generalizes.** `pricingRules` is already "owner-approved wording,
  read verbatim, else defer to the team." A future `approvedAnswers` table (question category →
  approved wording) is the same shape; nothing in this plan hard-codes against it.
- **Do not** build the KB, booking, or answer-first call flow now.

## 7. Explicitly out of scope / preserved deviations

- **Existing-customer rule stays as-is (decided 2026-07-22):** a self-declared existing customer is
  always a message, never a scored job — including when they describe a new problem. Reviewed and
  accepted: nothing is lost (captured + owner alerted with their words, just unranked), the edge is
  rare in practice (problem-led openers still become jobs), and in the pitch it's the cleanest demo
  of "not every call is a job." The leak the product sells against is new-business-shaped; repeat
  customers call back, they don't dial competitors.
- **No customer-identity layer.** Separate lead records per contact; no person record, no contact
  history, no known-customer lookup — that's CRM drift and the positioning is "not a CRM."
  `callerPhone` is already on every lead and call row, so a future identity layer is a retroactive
  group-by, not a migration; nothing is foreclosed. The web path's phone+business dedupe is the
  full extent of identity handling.
- **PARKED idea — critical-signal alert escalation:** reuse the existing critical-signal regex to
  escalate the *notification* (not the classification) when a message's content contains a
  life-safety phrase — closes the "existing customer, gas smell, low-key alert" worst case with no
  identity system and no scoring change. Not in this pass.
- No form UI branch for messages (locked).
- Human-call capture stays notification-silent for jobs AND messages (locked).
- Audio-deletion policy, recording disclosure, and the `recordingEnabled` toggle: untouched.
- No new crons; the human-call work rides the existing event-triggered Inngest function.
- `calls.outcome` taxonomy unchanged.
- Session 10 (won/lost + leak metric) runs AFTER this lands.

## 8. Verification

- Extend `capture-human-call` tests: job precedence, message mapping (billing/callback/price-shop),
  junk/none → no row, ZIP fold-in, intakeStatus honesty, no scoring on messages.
- New tests for the web valve: structured path bypasses classifier; "Something else" + billing
  text → message + low-key alert; classifier failure → job; re-submit upgrade rule.
- Engine tests already cover the voice standard (`engine.test.ts` leadType suite) — they are the
  spec the new tests mirror.
- Manual E2E per channel against a dev business: one job, one message, one junk each; verify
  dashboard Type filter, priority queue exclusion, and notification matrix.

---

## 9. IMPLEMENTATION SPEC — file-by-file (execute in this order)

> Written to be executed step-by-step with no design decisions left open. Each step lists the
> file, whether it's NEW or EDIT, the exact change, and its acceptance check. Verified against
> the codebase 2026-07-22. Run `npm run typecheck` after each step; run `npm test` after steps
> 4, 6, and 8. Do not reorder — later steps import from earlier ones.

### Step 1 — NEW `src/lib/leads/lead-taxonomy.ts` (R4)

Create the shared taxonomy module:

```ts
/** Canonical contact taxonomy shared by every intake channel (voice AI, human-answered
 *  calls, web form). See docs/intake-capture-contract.md. */
export type LeadType = "job" | "message";
export type MessageKind = "existing_customer" | "billing" | "callback" | "question" | "general";
export const MESSAGE_KINDS: MessageKind[] = ["existing_customer", "billing", "callback", "question", "general"];
```

Then EDIT `src/lib/voice/types/session.ts`: delete its local `export type LeadType = ...` and
`export type MessageKind = ...` lines (lines 38–39; keep the doc comment above them) and replace
with a re-export so the one existing import site (`engine.ts` line 27, `import type { MessageKind }
from "../types/session"`) keeps working unchanged:

```ts
export type { LeadType, MessageKind } from "@/lib/leads/lead-taxonomy";
```

Optionally EDIT `engine.ts` `normalizeMessageKind` (line ~676) to use `MESSAGE_KINDS` from the new
module instead of its inline array. Acceptance: `npm run typecheck` clean; `engine.test.ts` still green.

### Step 2 — NEW `src/lib/leads/notify-message.ts` (R3)

Move `notifyMessageCaptured` out of `src/lib/voice/functions/actions.ts` (lines ~200–228),
decoupled from `FlowContext`:

```ts
import { sendMessageNotificationEmail } from "@/lib/email/notifications";
import { sendLeadPushNotification } from "@/lib/push/send";
import { buildMessagePushPayload } from "@/lib/push/payload";
import { logger } from "@/lib/logger";
import type { BusinessNotificationPreferences } from "@/lib/db/schema/businesses";

export async function notifyMessageCaptured(params: {
  business: { id: string; ownerEmail: string; ownerName: string; businessName: string;
              notificationPreferences: BusinessNotificationPreferences };
  leadId: string;
  callerName: string | null;
  callerPhone: string;
  messageKind: string | null;
  notes: string | null;
}): Promise<void>
```

Body: identical logic to the current voice version — email gated on
`notificationPreferences?.messageNotification !== false` with its own try/catch; push gated on
`notificationPreferences?.pushNewLead !== false` via `buildMessagePushPayload`. Never throws.

EDIT `src/lib/voice/functions/actions.ts`: delete the local `notifyMessageCaptured`, import the
new one, and adapt the one call site (line ~143) to:
`notifyMessageCaptured({ business, leadId: lead.id, callerName: session.conversationContext.callerName ?? null, callerPhone: session.callerPhone, messageKind, notes: session.conversationContext.reasonForCall ?? null })`
(`ctx.business` is `BusinessCallData`, which already has all required fields).
Acceptance: typecheck clean; `actions.test.ts` green (its message test asserts
`sendMessageNotificationEmail` is called — unchanged behavior).

### Step 3 — NEW `src/lib/leads/intake-status.ts` (H6)

```ts
import { getVisibleQuestions, type Answers } from "@/lib/verticals/filterAnswers";
import type { VerticalQuestion } from "@/lib/db/schema/verticalConfigs";

/** Channel-agnostic honest intake status: 'completed' only when every visible ASKABLE
 *  (non-voiceExtractOnly) question is answered — the primary question counts as answered
 *  via an off-list serviceRequested. Mirrors voice's deriveIntakeStatus semantics for
 *  contexts without a live session ('abandoned' doesn't apply — nobody hung up mid-intake). */
export function deriveIntakeStatusFromAnswers(
  questions: VerticalQuestion[],
  answers: Answers,
  serviceRequested: string | null
): "not_started" | "started" | "completed" {
  const hasAny = Object.keys(answers).length > 0 || !!serviceRequested;
  if (!hasAny) return "not_started";
  const primaryKey = questions[0]?.key;
  const visible = getVisibleQuestions(questions, answers);
  const askable = visible.filter((q) => !q.voiceExtractOnly);
  const answered = (q: VerticalQuestion) =>
    q.key in answers || (q.key === primaryKey && !!serviceRequested);
  return askable.every(answered) ? "completed" : "started";
}
```

NEW `src/lib/leads/intake-status.test.ts`: cases — empty → `not_started`; serviceRequested only
(primary is the only askable question) → `completed`; partial answers → `started`; all askable
answered with voiceExtractOnly fields missing → `completed`. Copy question fixtures from
`engine.test.ts`/`mockFlowContext.ts` style. Acceptance: `npm test` green.

### Step 4 — EDIT `src/lib/leads/extract-from-transcript.ts` (H1)

4a. Extend `TranscriptIntake`:

```ts
export type TranscriptContactKind = "job" | "message" | "junk" | "none";
export interface TranscriptIntake {
  extraction: ExtractionResult;
  signal: SignalFlags;
  contactKind: TranscriptContactKind;
  messageKind: MessageKind | null;      // import MessageKind from "@/lib/leads/lead-taxonomy"
  messageForTeam: string | null;
  serviceRequested: string | null;
  summary: string;
  callerName: string | null;
}
```

4b. Extend the `record_call_signal` tool's `parameters.properties` (KEEP all existing boolean
properties, `caller_name`, `summary`) and add `"contact_kind"` to `required`:

```ts
contact_kind: { type: "string", enum: ["job", "message", "junk", "none"], description:
  "What this team-answered call was. \"job\" = the caller wants work/service done or described a problem they have (even vaguely). " +
  "\"message\" = a non-job matter the team must act on: billing/invoice/payment, an existing customer about an ongoing job, a callback request, " +
  "a question (hours, service area, pricing, price-shopping WITHOUT a problem they actually have), a vendor or job applicant with a message. " +
  "\"junk\" = wrong number, misdial, or someone trying to SELL to the business (SEO, ads, staffing, etc). " +
  "\"none\" = no opportunity and nothing to act on (silence, pocket dial, pure chit-chat). Prefer \"message\" over \"none\" when in doubt." },
message_kind: { type: "string", enum: ["existing_customer", "billing", "callback", "question", "general"], description:
  "Only when contact_kind is \"message\": which kind." },
message_for_team: { type: "string", description:
  "Only when contact_kind is \"message\": the caller's ask in their own words, 1-2 sentences, INCLUDING any names/numbers/details the team needs to act. This is internal, not a public summary." },
service_requested: { type: "string", description:
  "The service/work the caller asked about, in their own words, if any was stated. Include even for messages (e.g. price-shopping)." },
```

Also update the signal system prompt (line ~115) to: `"You classify what a phone call a
home-service business's team just answered was (a job opportunity, a message for the team, junk,
or nothing), capture the message if any, and summarize it."`

4c. Parse the new fields after `signalArgs` (reuse the coercion style already there; import
`MESSAGE_KINDS` for validation):

```ts
const rawKind = signalArgs.contact_kind;
const contactKind: TranscriptContactKind =
  rawKind === "job" || rawKind === "message" || rawKind === "junk" || rawKind === "none" ? rawKind : "none";
const messageKind = typeof signalArgs.message_kind === "string" && (MESSAGE_KINDS as string[]).includes(signalArgs.message_kind)
  ? (signalArgs.message_kind as MessageKind) : null;
const messageForTeam = typeof signalArgs.message_for_team === "string" && signalArgs.message_for_team.trim()
  ? signalArgs.message_for_team.trim() : null;
const serviceRequested = typeof signalArgs.service_requested === "string" && signalArgs.service_requested.trim()
  ? signalArgs.service_requested.trim() : null;
```

4d. Both early-return/fallback paths (no transcript/no key at the top; the catch block) return
`contactKind: "none", messageKind: null, messageForTeam: null, serviceRequested: null` in addition
to the existing fields — preserving today's "analysis unavailable → no lead" behavior, EXCEPT the
catch path keeps whatever the intake extraction produced if it succeeded (structured answers still
force a job in Step 5). Acceptance: typecheck clean.

### Step 5 — EDIT `src/lib/leads/capture-human-call.ts` + `src/lib/leads/process-human-call.ts` (H2–H6)

5a. `captureHumanCallLead` gains a `transcriptText: string` param. EDIT `process-human-call.ts`
line ~66 to pass `transcriptText: transcript`.

5b. Replace the decision + creation logic with the three-outcome contract:

```ts
if (call.leadId) return { leadId: call.leadId };

const { extraction, signal, contactKind, messageKind, messageForTeam, serviceRequested } = intake;
const hasAnswers = Object.keys(extraction.answers).length > 0;

// Legacy fail-open: if classification is unusable ("none") but the old boolean signals fired,
// treat as a job — a misfiled job beats a lost one. (Model failure → contactKind "none".)
const legacySignal = signal.jobIntent || signal.urgency || signal.callbackRequested ||
  signal.quoteRequested || signal.contactCaptured;

// Job signal always wins (same rule as the voice engine).
const isJob = hasAnswers || contactKind === "job" || (contactKind === "none" && legacySignal);

if (isJob) {
  // ZIP fold-in — same key the voice and web paths write.
  const answers = extraction.zipCode
    ? { ...extraction.answers, zip_code: extraction.zipCode }
    : extraction.answers;
  const lead = await createLead({
    businessId: call.businessId,
    callerPhone: call.callerPhone,
    callerName: intake.callerName,
    source: "voice_human",
    callStatus: "answered",
    leadType: "job",
    intakeStatus: deriveIntakeStatusFromAnswers(verticalConfig.questions, answers, serviceRequested),
    intakeAnswers: answers,
    serviceRequested,
    smsConsent: false,
  });
  await updateCall(call.id, { leadId: lead.id });
  const scores = scoreLeadFromAnswers(answers, verticalConfig.scoringRules, verticalConfig.questions,
    verticalConfig.baseValueLow, { serviceRequested, signalText: transcriptText });
  await assessLead(lead.id, answers, scores, verticalConfig.aiPromptTemplate);
  logger.info("Human-answered call captured as job lead", { callId: call.id, leadId: lead.id });
  return { leadId: lead.id };
}

if (contactKind === "message") {
  const lead = await createLead({
    businessId: call.businessId,
    callerPhone: call.callerPhone,
    callerName: intake.callerName,
    source: "voice_human",
    callStatus: "answered",
    leadType: "message",
    messageKind: messageKind ?? "general",
    intakeStatus: "not_started",
    notes: messageForTeam ?? intake.summary,   // summary fallback is PII-scrubbed but better than nothing
    serviceRequested,
    smsConsent: false,
  });
  await updateCall(call.id, { leadId: lead.id });
  // NO scoring, NO assessment, NO notification (operator was on the call — locked decision).
  logger.info("Human-answered call captured as message", { callId: call.id, leadId: lead.id, messageKind });
  return { leadId: lead.id };
}

// junk / none — call stored (transcript + summary), no lead row.
logger.info("Human-answered call not captured as lead", { callId: call.id, contactKind });
return { leadId: null };
```

Imports to add: `deriveIntakeStatusFromAnswers` from `@/lib/leads/intake-status`. Update the
file's doc comment to describe the three-outcome contract.

5c. NEW `src/lib/leads/capture-human-call.test.ts` — follow the `vi.mock` pattern in
`src/lib/voice/functions/actions.test.ts` (mock `@/lib/db/queries/leads`, `@/lib/db/queries/calls`,
`@/lib/leads/assess`; use the real scoring). Cases:
- structured answers + contactKind "message" → JOB (job signal wins), scored, `zip_code` folded in when `extraction.zipCode` set
- no answers + contactKind "job" → job, `ScoringContext.signalText` = transcript (assert via `assessLead` mock receiving scores whose trace shows `critical_signal_floor` when transcript contains "gas leak")
- no answers + contactKind "message"/kind "billing" + messageForTeam → message lead created with `leadType: "message"`, `messageKind: "billing"`, `notes` = messageForTeam; `assessLead` NOT called; no email/push modules touched
- contactKind "junk" and "none" (no legacy signals) → `createLead` NOT called
- contactKind "none" + `signal.callbackRequested: true` → job (legacy fail-open)
- `call.leadId` already set → immediate return, nothing called
Acceptance: `npm test` green.

### Step 6 — NEW `src/lib/leads/web-intake.ts` (W1 valve + pure decision helpers)

```ts
import { openai } from "@/lib/openai";
import { logger } from "@/lib/logger";

export interface WebIntakeVerdict {
  classification: "service_request" | "non_job_message" | "unclear";
  messageKind: "question" | "billing" | "general";
}

/** Pure decision: the valve only runs on the "Something else" path (free-text service, no
 *  structured primary answer), and never on an existing JOB lead (downgrade forbidden). */
export function shouldRunValve(opts: {
  isNewLead: boolean;
  existingLeadType: string | null;   // null when the lead was just created
  hasStructuredPrimary: boolean;
  serviceRequested: string | null;
}): boolean {
  if (!opts.serviceRequested || opts.hasStructuredPrimary) return false;
  return opts.isNewLead || opts.existingLeadType === "message";
}

/** Pure decision: a message lead that re-submits with a real structured service answer is
 *  upgraded to a job. Never the reverse. */
export function shouldUpgradeToJob(existingLeadType: string, hasStructuredPrimary: boolean): boolean {
  return existingLeadType === "message" && hasStructuredPrimary;
}

const FAIL_OPEN: WebIntakeVerdict = { classification: "unclear", messageKind: "general" };

/** One cheap forced-tool classification of "Something else" free text. Fails OPEN to
 *  "unclear" (treated as a job downstream) — a misfiled job beats a lost one. */
export async function classifyWebIntake(freeText: string): Promise<WebIntakeVerdict> {
  if (!freeText.trim() || !process.env.OPENAI_API_KEY) return FAIL_OPEN;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        { role: "system", content:
          "Text submitted through a home-service business's website SERVICE-REQUEST form via the 'Something else' option. " +
          "Classify it. \"service_request\" = they want work/service done or describe a problem they have — ANY trade or service counts, " +
          "even one this business may not offer. \"non_job_message\" = clearly NOT requesting work: a billing/invoice/payment question, " +
          "a general question (hours, service area, warranty), a vendor pitch, a job application, or feedback. " +
          "\"unclear\" = cannot tell. Prefer \"unclear\" over \"non_job_message\" when in doubt." },
        { role: "user", content: freeText },
      ],
      tools: [{ type: "function", function: { name: "classify_web_intake", description: "Classify the submission.",
        parameters: { type: "object", properties: {
          classification: { type: "string", enum: ["service_request", "non_job_message", "unclear"] },
          message_kind: { type: "string", enum: ["question", "billing", "general"],
            description: "Only when classification is non_job_message." },
        }, required: ["classification"] } } }],
      tool_choice: { type: "function", function: { name: "classify_web_intake" } },
    });
    const call = completion.choices[0]?.message?.tool_calls?.[0];
    const args = call?.type === "function" ? JSON.parse(call.function.arguments || "{}") : {};
    const classification = ["service_request", "non_job_message", "unclear"].includes(args.classification)
      ? args.classification : "unclear";
    const messageKind = ["question", "billing", "general"].includes(args.message_kind) ? args.message_kind : "general";
    return { classification, messageKind };
  } catch (err) {
    logger.error("classifyWebIntake failed — failing open to job", { error: String(err) });
    return FAIL_OPEN;
  }
}
```

NEW `src/lib/leads/web-intake.test.ts` for the two PURE helpers only (no OpenAI mocking needed):
valve skipped when structured primary present / when serviceRequested absent / when existing lead
is a job; valve runs for new leads and existing message leads; upgrade only message→job.
Acceptance: `npm test` green.

### Step 7 — EDIT `src/app/api/intake/[businessId]/submit/route.ts` (W1–W5, R1, R2)

7a. **Custom options (W5/R2):** hoist the config load in `POST` to right after the business is
fetched, and derive once: `const questions = config ? withCustomServiceOptions(config.questions,
business.customServiceOptions) : []`. Use `questions` for the inline `generateReassurance` and
`quoteForAnswers` calls at the bottom (replacing `config.questions`). Import
`withCustomServiceOptions` from `@/lib/verticals/customOptions`.

7b. **Upgrade rule (W4):** in `POST`, compute
`const primaryKey = questions[0]?.key` and
`const hasStructuredPrimary = !!(primaryKey && answers?.[primaryKey])`.
In the update branch, when `shouldUpgradeToJob(lead.leadType, hasStructuredPrimary)` (import from
`@/lib/leads/web-intake`), spread `{ leadType: "job", messageKind: null }` into the `updateLead` payload.

7c. **Valve trigger:** capture `const wasNewLead = !lead` before the create/update block. After it:

```ts
const runValve = shouldRunValve({
  isNewLead: wasNewLead,
  existingLeadType: wasNewLead ? null : lead!.leadType,
  hasStructuredPrimary,
  serviceRequested: intakePayload.serviceRequested,
});
```

Change the deferred call to
`after(() => assessAndNotify(lead!.id, businessId, answers ?? {}, { runValve, serviceRequested: intakePayload.serviceRequested }))`.

7d. **`assessAndNotify` rewrite** — new signature
`assessAndNotify(leadId, businessId, answers, opts: { runValve: boolean; serviceRequested: string | null })`:
1. Load business + config as today; `const questions = withCustomServiceOptions(config.questions, business.customServiceOptions)`.
2. If `opts.runValve`: `const verdict = await classifyWebIntake(opts.serviceRequested!)`.
   - `non_job_message` → `await updateLead(leadId, { leadType: "message", messageKind: verdict.messageKind, notes: opts.serviceRequested })`;
     reload the lead; call the shared `notifyMessageCaptured({ business: {...}, leadId, callerName: lead.callerName, callerPhone: lead.callerPhone, messageKind: verdict.messageKind, notes: opts.serviceRequested })` (W2 — web messages DO alert); **return** (no scoring, no assessment, leadStatus stays 'new').
   - otherwise (`service_request`/`unclear`): if the lead's current `leadType` is `"message"` (an existing message lead resubmitting via Other-path), `await updateLead(leadId, { leadType: "job", messageKind: null })`; fall through to scoring.
3. Scoring (R1): `scoreLeadFromAnswers(answers, config.scoringRules, questions, config.baseValueLow, { serviceRequested: opts.serviceRequested, signalText: null })` (free-text answers are already scanned for critical signals inside the scorer). Use `questions` (custom options) here too.
4. Rest unchanged (assessLead → email + push, same gating).

Imports to add: `classifyWebIntake`, `shouldRunValve`, `shouldUpgradeToJob` from
`@/lib/leads/web-intake`; `notifyMessageCaptured` from `@/lib/leads/notify-message`;
`withCustomServiceOptions`. Acceptance: typecheck clean.

### Step 8 — Full verification (11.4)

1. `npm run typecheck` — zero errors.
2. `npx eslint src --max-warnings 0` (or `npm run lint`).
3. `npm test` — all suites green, including the untouched `engine.test.ts` leadType suite.
4. `npm run build` — clean.
5. Manual E2E (dev business): per channel, one job / one message / one junk-or-bypass:
   - Human path: feed `processHumanCall` a recorded test call (or unit-drive `captureHumanCallLead`) for a billing question → message lead, no score, NO notification; "gas leak" transcript → job with `critical_signal_floor` in scoreTrace.
   - Web: structured service pick → job, valve never invoked (no extra OpenAI call in logs); "Something else" + "question about my invoice" → message + low-key email/push; "Something else" + "need sprinkler winterization" → job.
   - Voice: unchanged — spot-check one job + one message call end-to-end.
   - Dashboard: Type filter shows the new messages; priority queue excludes them.

### Explicitly NOT in this implementation
No schema migrations (all columns exist). No changes to `engine.ts` routing, `endCall`,
notifications senders, the form UI, or `calls.outcome` values. No backfill of historical
`voice_human` leads (consciously skipped — low volume since 2026-07-18).
