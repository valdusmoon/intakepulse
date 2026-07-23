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
    a: "Yes. Every trade gets its own service menu, and a caller who needs something not on that menu has their own words captured verbatim rather than being forced into a category. The rest of the intake is deliberately the same everywhere: what happened, how urgent it is, where, plus when it started and how it's being paid for when the caller volunteers them. See the industry pages for HVAC, plumbing, restoration, electrical, and general contracting.",
  },
  {
    q: "Will the AI invent prices?",
    a: "No. Caller-facing pricing or value guidance only comes from rules you approve. If no approved rule exists, Callverted simply says your team will review the details before quoting.",
  },
  {
    q: "What happens if the caller wants a person?",
    a: "It takes their name and what they need, files it as a callback message, and alerts you by push and email so someone can get back to them fast. It never bridges the call to a person, because a transfer that rings out is worse than a message that lands.",
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
    a: "A callback-ready lead: the caller's number from caller ID, what they need, how urgent it is, their ZIP, an estimated job value, a priority score that ranks it against everything else waiting, a short summary, and the full transcript.",
  },
  {
    q: "How do I find out about a new lead?",
    a: "Instantly. Whether it comes from a phone call, your intake link, or the website widget, Callverted sends a push notification to your phone and an email with the scored lead. It's waiting in your dashboard with the full transcript.",
  },
  {
    q: "Do you record my calls?",
    a: "Every call Callverted handles becomes a written transcript in your dashboard, so you can read exactly what the caller said and how the job was qualified. You can also switch on recording for the calls your own team answers, so those get transcribed and scored too. Either way the audio is only used to create the transcript and is then deleted, so there are no recordings to store or manage.",
  },
];
