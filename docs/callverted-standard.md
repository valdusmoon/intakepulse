# The Callverted Standard

**The single answer to "how does Callverted treat X."** Every feature, prompt, schema, and copy
decision conforms to this document. Implementation detail lives in
`docs/intake-capture-contract.md`; this document is the constitution it implements.

---

## 1. Identity

**Callverted is a multi-source inbound place of record + insights + lead management + speed-to-lead
+ recovery tool for home-service trades.** It captures every inbound opportunity, sorts real jobs
from messages from junk, ranks who to call back first, and records how fast a human actually
responded.

The north-star pitch (verbatim — every claim in it must stay true of the product):

> "You already answer your phones — I'm not selling you an answering service, and honestly I'd be
> skeptical of one too. Here's the actual problem: the calls you take turn into money only if
> someone calls the right person back fast enough, and right now nobody can tell you which of last
> week's leads were worth chasing, how fast you got to them, or how many quietly went cold.
> Callverted captures every inbound — the calls you miss on a roof, the after-hours form fills,
> all of it — scores which are real jobs versus messages versus junk, and puts them in a ranked
> callback list so your team knows exactly who to call first. It records when a human picked up,
> so at the end of the month you can see how much inbound became jobs and how much slipped. The AI
> only listens and organizes — it never talks pricing or improvises with your customer. Code
> decides what happens, not a chatbot."
>
> Close: "Quick question — do you know how many inbound leads you got last month, and how many got
> a callback within ten minutes?"

**What Callverted is NOT (the guardrails):**
- **Not a CRM** — no person/customer records, no contact history threads, no dedupe-into-identity.
  One lead row per contact; `callerPhone` on every row is the future join key if this ever changes.
- **Not an answering service or AI receptionist** — the AI never answers arbitrary questions, never
  quotes unapproved pricing, never books appointments, never bridges calls to a human.
- **Not a chatbot** — deterministic intake with AI *perception*: the model only extracts,
  classifies, and summarizes; **code owns every state transition and every side effect.**
- Messages are hygiene for the ranked list, never a headline feature. The moment "we take messages"
  becomes a selling point, we're an answering service.

## 2. The taxonomy — three outcomes, exactly one per contact, every channel

| Outcome | Stored as | Scored | Alert | Where it lives |
|---|---|---|---|---|
| **Job** | lead row, `leadType: 'job'` | yes → priorityScore → Hot/Warm/Cool, `leadStatus: 'qualified'` | full lead-packet email + push | ranked callback queue + all metrics |
| **Message** | lead row, `leadType: 'message'` + `messageKind` | **never** (scores null, `leadStatus` stays `new`) | low-key "New message" email + push | inbox with kind badge; excluded from queue/funnel/revenue |
| **Junk** (screened) | **no lead row** | — | none | call record only (`outcome: 'screened'` + reason on voice) |

`messageKind` (the complete set): `existing_customer` · `billing` · `callback` · `question` · `general`.

**The boundary rule:** *describing a problem you actually have = job; asking about a service or
price without one = message (`question`).* A price-shopper is interest, not a scoreable job —
captured, alerted, one tap from promotion (§7), never ranked on fabricated numbers.

**Resolution biases (in priority order):** job signal always wins over any classification · never
screen a contact that mentions a real service need · when classification fails, fail OPEN toward
capture (a misfiled job beats a lost one) · unclear voice openers get ONE clarification, then
default to a general message — never a dead end.

## 3. The normalized question set — identical for every vertical, no exceptions

1. **Service** — the only per-vertical element (each trade has its own option menu + custom
   services). Asked open-ended on voice; an off-list answer is captured verbatim in
   `serviceRequested` (no quote, no re-ask).
2. **Urgency** — emergency / soon / flexible. The only follow-up asked aloud.
3. **When did this come up** — today / this week / longer. Extract-only (captured if volunteered).
4. **Coverage** — insurance-warranty-financing / out-of-pocket / not sure. Extract-only.
5. **ZIP** — dedicated bookend state on voice, contact step on the web form; stored as
   `intakeAnswers.zip_code` on every channel.

Adding a vertical = a new service menu + scoring bonuses. Zero new questions, zero code.

**The caller's NAME is extract-only on a job call — never asked** (2026-07-23). It changes no
decision the product makes: the callback goes to the caller ID, and ranking comes from urgency,
value, and quality. Meanwhile it's the one unconstrained field speech-to-text reliably mangles
(observed live: a name read back to the caller as "meal"), and a wrong name is worse than none,
both on the call and on the callback. It is captured when a caller introduces themselves, and the
confirmation only uses it when it's there. The **message path still asks** — knowing who left a
message is the whole point of one. The phone number is always captured automatically from caller
ID and is never asked for.

## 4. The storage contract (vertical-independent)

- **`leads`** — one row per captured contact. `source` says where it came from
  (`voice_overflow` / `voice_human` / `direct_intake` / `website_widget` / `manual`), `leadType` +
  `messageKind` say what it is, `intakeAnswers` (+ `zip_code`) holds the normalized Q&A,
  `serviceRequested` holds the caller's own service words, `notes` holds the message content or
  reason in the caller's words, scores + `scoreTrace` only on jobs. Two independent axes never
  conflated: `intakeStatus` (Q&A completion, system-derived) vs `leadStatus` (sales pipeline,
  owner-driven).
- **`calls`** — one row per phone call regardless of outcome: who handled it (`outcome`),
  turn-by-turn `transcript` (source of truth for what was said), PII-scrubbed `summary`, timings.
  Audio is transcribed then **deleted, never retained**.
- **`aiAssessments`** — one row per *job*: the reasoning text for already-computed scores. The
  model explains scores; it never sets them.

Full field-population tables: `docs/intake-capture-contract.md` §1.3.

## 5. The voice flow — one state machine, every vertical

Open "what's going on?" → one silent extract+triage pass (fills every field volunteered, classifies
the contact) → code routes: job → adaptively ask ONLY the still-missing normalized fields → ZIP →
approved price line (verbatim or nothing) → confirm → capture. Message → name + "what should I
pass along?" → capture. Junk → polite goodbye, no row.

**A job call asks exactly three things: what happened · where · how urgent.** Non-emergency calls
get one extra open beat at the end ("anything important I missed?") — the catch-all for whatever
the question set didn't anticipate; emergencies skip it and close immediately.

There is deliberately **no "when should we call you back?" question** (removed 2026-07-23). It only
ever fired when the caller had just said their timing was flexible, so it re-asked a question they
had already answered, and the team works the ranked queue rather than a stored preference. The
phone number is never asked for either — it comes from caller ID.

Invariants: the model speaks exact given lines or classifies into closed enums — nothing else ·
light retries (ZIP=2, else 1) then graceful degrade · **no call ever dead-ends to voicemail** ·
3-minute soft cap closes gracefully with whatever exists · every non-job terminal funnels through
one code path (`markMessage`), which is also the single seam where a future "answer from
owner-approved content, then still capture" step could slot in (generalizing the pricingRules
pattern) — classification stays separate from policy so that door stays open without building it.

## 6. The notification matrix

| Contact | Alert |
|---|---|
| Job (any unattended channel) | Full lead-packet email + push |
| Message (any unattended channel) | Low-key message email + push (`messageNotification` pref) |
| ANYTHING from a team-answered call | **Silent** — the operator was on the call |
| Junk | Nothing |

## 7. Lifecycle after capture

1. **Ranked queue** — jobs only, ordered by priorityScore (urgency-weighted, emergency ≥70 /
   critical-signal ≥80 floors); messages sit in the inbox with kind badges.
2. **Pipeline** — `leadStatus` (`new → qualified → contacted → booked → estimate_sent →
   converted/lost`) is owner-editable on EVERY lead, messages included. `contactedAt` stamps the
   first human touch — the speed-to-lead record the pitch promises.
3. **Reclassification** — any lead flips both directions, one tap, owner-driven: *Convert to job*
   (message → unscored job in the pipeline) / *File as message* (job → message). Scores are never
   fabricated on promotion. The web form also auto-upgrades a message lead that re-submits with a
   real service request.
4. **Insights** (Session 10 roadmap): one-tap Won/Lost/No-job resolution from notifications, and
   the dollarized leak — "X Hot leads slipped past N minutes, ~$Y" — which depends on this
   taxonomy staying clean on every channel.

## 8. The change rule

Any future feature must state which section of this document it amends. If it doesn't fit the
§1 identity line — or requires the AI to improvise with a customer — it's out of scope until this
document is deliberately revised first. (Recorded expansions kept deliberately open but unbuilt:
approved-answer Q&A via the §5 seam; critical-signal alert escalation on messages; Session 10.)
