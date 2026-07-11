/**
 * Shared FAQ content — used by the on-page accordion on the landing page and the
 * standalone /faq page (which also emits FAQPage structured data). One source so
 * the two never drift.
 */

export interface Faq {
  q: string;
  a: string;
}

export const FAQS: Faq[] = [
  {
    q: "Is this just missed-call text-back?",
    a: "No. Text-back waits for the caller to reply to a text. Callverted answers the call live, asks the intake questions, and creates a scored lead packet — no dependency on a panicking caller texting you back.",
  },
  {
    q: "Does it replace my phone number?",
    a: "No. Your team gets the first chance to answer every call. Callverted only steps in when the call would otherwise be missed or routed to voicemail.",
  },
  {
    q: "Can it handle intake for my specific trade?",
    a: "Yes. The flow is built around the details that matter for your trade — job type, timing, materials, insurance, service area, and urgency. See the industry pages for HVAC, plumbing, restoration, electrical, and general contracting.",
  },
  {
    q: "Will the AI invent prices?",
    a: "No. Caller-facing pricing or value guidance only comes from rules you approve. If no approved rule exists, Callverted simply says your team will review the details before quoting.",
  },
  {
    q: "What happens if the caller wants a person?",
    a: "Callverted can capture the request, mark the lead accordingly, and optionally warm-transfer to a number you configure — so a true emergency reaches a human right away.",
  },
  {
    q: "How fast can we launch?",
    a: "About 30 minutes for basic setup: business profile, forwarding number, service area, intake flow, and a few test calls.",
  },
  {
    q: "Does Callverted work after hours and on weekends?",
    a: "Yes. It answers 24/7. Most missed emergency calls happen exactly when your team is on a job, asleep, or off for the weekend — that's the gap it's built to close.",
  },
  {
    q: "What do I actually receive after a call?",
    a: "A callback-ready lead: the caller's name and number, service type, urgency, estimated job value, a recommended callback window, a short summary, and the full transcript.",
  },
  {
    q: "Is the call recorded, and what about consent?",
    a: "Recording is optional per business and off by default. When it's on, Callverted reads a disclosure at the start of the call. You control the disclosure text in settings.",
  },
];
