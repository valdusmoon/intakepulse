# Callverted — complete product summary (July 2026)

A factual briefing on what the product does today, for working out the high-level pitch.
Everything below is built and live unless marked otherwise.

## What it is, in one paragraph

Callverted is inbound lead capture, sorting, and prioritization for high-ticket
home-service trades (restoration, HVAC, plumbing, electrical, and similar). It sits on the
business's phone line and website, captures every inbound opportunity through every
channel, separates real jobs from messages from junk, scores and ranks the jobs, and gives
the team one ranked callback list plus a record of how fast a human actually responded.
The buyer is the owner/operator of a small trades business (often 1–15 people) whose
leads are worth $1,000–$20,000+ each and who loses jobs to missed calls, undocumented
calls, and slow or wrongly-ordered callbacks.

## Stage (be honest with me about this in your advice)

Solo founder. Product is feature-complete for launch and deployed in production: real
payments (Stripe), real phone numbers (Twilio), real email domain, PWA push notifications,
legal pages, onboarding, billing. Pre-revenue: no paying customers yet, no testimonials,
no case studies. Currently in founder-led live testing on a demo business. The pitch this
document supports is for the first real customers.

## The four ways leads come in

1. **Missed / after-hours / overflow calls.** The business publishes one Callverted
   number. Every call rings the team's existing phones first (default ~15 seconds). Only
   if nobody answers does the AI voice agent pick up and run intake. The business can also
   choose AI-answers-immediately mode.
2. **Calls the team answers.** Optional: answered calls are recorded (with a spoken
   disclosure), transcribed, summarized, and turned into the same structured, scored lead
   — so the details stop living in an employee's memory. The audio is deleted after
   transcription; only the transcript is kept.
3. **Website widget.** A one-line script tag the business pastes on its site: floating
   button, inline form, or plain link. Same intake questions as the phone.
4. **Direct intake link.** A hosted intake form URL the business can share anywhere.

All four channels feed the identical pipeline. The internal mantra: many ways in, one
ranked list out.

## What happens to every contact: exactly one of three outcomes

- **Job** — someone describing a problem they actually have. Qualified, scored, ranked,
  full alert to the owner, lands in the callback queue and all revenue metrics.
- **Message** — a billing question, an existing customer, a callback request, a general
  question, a price-shopper with no current problem. Captured cleanly with a summary and
  the caller's name, low-key alert, never scored, never pollutes the job queue or the
  numbers.
- **Screened** — wrong numbers and solicitors. Logged on the call record, never becomes a
  lead, no alert.

The boundary rule: describing a problem you have = job; asking about a service or price
without one = message. Safety biases: a real job signal always wins over any other
classification; nothing that mentions a real service need is ever screened; when
classification is uncertain the system fails open toward capture. The owner can flip any
lead between job and message with one tap; scores are never fabricated on promotion.

Most competitors have no such distinction — everything becomes either a "lead" or a
voicemail. This three-way sort is a core differentiator.

## The AI voice agent (and what makes it different)

It is deliberately NOT a conversational AI receptionist. It is a rigid, code-driven
intake flow where the AI only does perception: it listens, extracts details, and
classifies. Code decides every step. Concretely:

- A job call asks exactly three things: what happened, where (ZIP), and how urgent.
  Anything the caller already volunteered is never re-asked; a caller who says "my water
  heater burst, I'm in 33618 and it's flooding" gets zero redundant questions.
- Extra details (timing, insurance coverage, caller name) are captured only when
  volunteered, never asked. The callback number comes from caller ID automatically.
- The AI never answers open questions, never quotes prices except owner-approved price
  lines repeated word for word, never books appointments, never improvises. If there is
  no approved answer, it says the team will follow up.
- Non-emergency calls get one open "anything important I missed?" beat; emergencies skip
  it and close fast.
- No call ever dead-ends to voicemail: failed answers degrade gracefully into a partial
  capture, and an unclear caller gets one clarification then becomes a message.
- Callers can interrupt it mid-sentence (barge-in), and it handles keypad input.
- From hangup to scored-and-ranked lead with a summary: under ~10 seconds, while the
  owner's phone buzzes with the alert.

## Scoring and ranking

Every job gets a 0–100 priority score blending urgency (50%), estimated job value (30%),
and lead quality (20%), with hard floors: a stated emergency scores at least 70, a
life-safety signal (burning smell, flooding, no power) at least 80. Scores map to
Hot / Warm / Cool tiers. Every score stores a full explanation trace; the AI writes a
reasoning summary but never sets the numbers. The estimated dollar value of each job
(a range, e.g. $1.8k–$3.2k) is attached to the lead.

## Speed-to-lead accountability

The system timestamps when a human first touched every lead. The dashboard shows average
callback time, how many urgent jobs are awaiting callback and how long the oldest has
waited, captured value this month, won revenue with trend, a conversion funnel
(captured → contacted → booked → won), and per-channel performance. Weekly email reports
summarize it. So the owner can answer: how many inbound leads did we get, how many were
real jobs, how fast did we call them back, how many did we win, and where did the rest
leak. (Next planned feature: a dollarized leak metric — "N hot leads waited more than X
minutes, roughly $Y at risk" — and one-tap Won/Lost resolution from the alert itself.)

## Alerts

Full lead-packet email + push notification (PWA, phone lock screen) the moment a job is
captured; a low-key alert for messages; silence for anything from a call the team
answered themselves (they were on the call); nothing for junk. All preference-gated.

## The operator surface

Dashboard (installable as a phone app): ranked priority queue ("call these first"),
leads inbox with type/priority/source filters and search, per-lead detail with full call
transcript, summary, score explanation, and pipeline status (new → qualified → contacted
→ booked → estimate sent → won/lost), calls log, reports, CSV exports of everything.
Settings: ring time and overflow mode, services and approved price lines per service,
service area, recording toggle, notification preferences, pause switch, billing.

## Setup and business model

About 30 minutes of setup, positioned as done-with-you: pick trade vertical (loads the
right question set and scoring), approve services/prices/questions, run test calls (test
mode works before paying), then add a card to go live and get a real number. $149/month
or $1,499/year flat, 14-day free trial, no per-call or per-lead fees, no contracts. The
economics: one recovered job typically covers many months of the product.

## What it deliberately is NOT (guardrails that define the category)

Not an answering service. Not an AI receptionist or chatbot. Not a scheduler. Not a CRM
(no contact histories; one lead row per opportunity). Not a knowledge-base bot. The AI
never improvises with a customer. "We take messages" is never the selling point; messages
are hygiene that keeps the ranked job list clean.

## The two existing pitch angles (react to these)

**Angle A — the spoken/sales pitch (current north star, written for a skeptical owner):**
leads with "you already answer your phones — I'm not selling you an answering service,"
then makes the problem accountability: nobody can tell you which of last week's leads
were worth chasing, how fast you got to them, or how many quietly went cold. Callverted
captures every inbound, sorts jobs from messages from junk, ranks the callback list, and
records when a human picked up. Ends with the hook question: "Do you know how many
inbound leads you got last month, and how many got a callback within ten minutes?"

**Angle B — the landing-page copy (current draft direction):** leads with "Stop losing
jobs." Capture every inbound opportunity from missed calls, answered calls, and website
inquiries; every one documented, qualified, and prioritized so your team knows exactly
who to call back first. Mental model: "Many ways in. One ranked list out."

The unresolved tension: Angle A sells visibility/accountability (know your numbers, speed
to lead) and disarms the answering-service objection first; Angle B sells loss-aversion
capture (never lose a job). A is conversational and works person-to-person; B is punchier
on a page. The open question is which single angle should lead everywhere, or how they
compose.
