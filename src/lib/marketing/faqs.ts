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
    a: "No. Text-back waits for the caller to reply to a text. Callverted answers the call live, asks the intake questions, and creates a scored lead packet, with no dependency on a panicking caller texting you back.",
  },
  {
    q: "Does it replace my phone number?",
    a: "Your existing phones and team stay exactly as they are. You publish a new Callverted number for customers to call; it rings your team first and only hands off to the AI on calls that would otherwise be missed or go to voicemail.",
  },
  {
    q: "Can it handle intake for my specific trade?",
    a: "Yes. The flow is built around the details that matter for your trade: job type, timing, materials, insurance, service area, and urgency. See the industry pages for HVAC, plumbing, restoration, electrical, and general contracting.",
  },
  {
    q: "Will the AI invent prices?",
    a: "No. Caller-facing pricing or value guidance only comes from rules you approve. If no approved rule exists, Callverted simply says your team will review the details before quoting.",
  },
  {
    q: "What happens if the caller wants a person?",
    a: "Callverted can capture the request, mark the lead accordingly, and optionally warm-transfer to a number you configure, so a true emergency reaches a human right away.",
  },
  {
    q: "How fast can we launch?",
    a: "About 30 minutes for basic setup: business profile, forwarding number, service area, intake flow, and a few test calls.",
  },
  {
    q: "Does Callverted work after hours and on weekends?",
    a: "Yes. It answers 24/7. Most missed emergency calls happen exactly when your team is on a job, asleep, or off for the weekend. That's the gap it's built to close.",
  },
  {
    q: "What do I actually receive after a call?",
    a: "A callback-ready lead: the caller's name and number, service type, urgency, estimated job value, a recommended callback window, a short summary, and the full transcript.",
  },
  {
    q: "How do I find out about a new lead?",
    a: "Instantly. However the lead reaches you — a phone call, your intake link, or the website widget — Callverted sends a push notification to your phone and an email with the scored lead, and it's waiting in your dashboard with the full transcript.",
  },
  {
    q: "Do you record my calls?",
    a: "Every call Callverted handles is saved as a written transcript in your dashboard, so you can read exactly what the caller said and how the job was qualified — no audio recordings to store or manage.",
  },
];
