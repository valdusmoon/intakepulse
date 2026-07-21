/**
 * Content for the /compare/[slug] pages — high-intent "X vs Y" queries. Each maps
 * the alternative's weakness to what Callverted does instead. Hand-authored so
 * every page is substantive, not a swapped template.
 */

export interface Comparison {
  slug: string;
  alternative: string; // e.g. "Voicemail"
  metaTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  // Row-by-row contrast: the dimension, the alternative's behavior, ours.
  rows: { dimension: string; them: string; us: string }[];
  bottomLine: string;
  faqs: { q: string; a: string }[];
}

export const COMPARISONS: Comparison[] = [
  {
    slug: "voicemail",
    alternative: "Voicemail",
    metaTitle: "Callverted vs Voicemail for Missed Service Calls | Callverted",
    metaDescription:
      "Voicemail asks a panicking homeowner to do the work. Callverted answers live, qualifies the job, and hands you a scored lead. Here's the difference.",
    h1: "Callverted vs. voicemail",
    intro:
      "Voicemail is where emergency calls go to die. A homeowner with a flooding basement or a dead furnace isn't going to leave a message and wait. They'll hang up and dial the next company. Here's how live answering compares to a beep and a callback.",
    rows: [
      { dimension: "Answers the call", them: "No, the caller talks to a machine", us: "Yes, it answers live and runs a real intake" },
      { dimension: "Caller effort", them: "Caller must explain everything to a recording", us: "Guided questions, answered in ~40 seconds" },
      { dimension: "Qualification", them: "None", us: "Service type, urgency, value, service-area fit" },
      { dimension: "What you get", them: "A vague message, if they leave one", us: "A scored lead with summary and transcript" },
      { dimension: "Emergency handling", them: "Sits until you check messages", us: "Flags true emergencies and alerts your team instantly" },
      { dimension: "Hang-up rate", them: "Most callers hang up on voicemail", us: "The call is answered before they give up" },
    ],
    bottomLine:
      "Voicemail turns an emergency into a message you might return tomorrow. Callverted turns it into a qualified lead you can call back in minutes, while the customer is still yours to win.",
    faqs: [
      { q: "Isn't voicemail free?", a: "The recording is free; the missed jobs aren't. One recovered emergency call typically covers Callverted for the month several times over." },
      { q: "Can I still keep a voicemail box?", a: "Yes. Callverted only handles calls your team doesn't answer. Anything it can't complete still lands somewhere you control." },
    ],
  },
  {
    slug: "missed-call-text-back",
    alternative: "Missed-call text-back",
    metaTitle: "Callverted vs Missed-Call Text-Back | Callverted",
    metaDescription:
      "Missed-call text-back waits for a panicking caller to reply to a text. Callverted answers live and qualifies the job. Compare the two for home-service emergencies.",
    h1: "Callverted vs. missed-call text-back",
    intro:
      "Missed-call text-back is a real improvement over voicemail for simple follow-up. But for urgent home-service calls it still puts the work on the customer. It fires off a text and hopes a stressed homeowner stops to reply. Here's the contrast.",
    rows: [
      { dimension: "Who does the work", them: "The caller, who must read and reply to a text", us: "Callverted, which answers and asks the questions" },
      { dimension: "Speed to qualified", them: "Only as fast as the caller texts back", us: "Qualified during the call itself" },
      { dimension: "Emergency fit", them: "Weak; a flooding-basement caller won't stop to text", us: "Strong: live 24/7 answer with instant emergency alerts" },
      { dimension: "Detail captured", them: "Whatever the caller types, if anything", us: "Structured: service, urgency, value, ZIP, more" },
      { dimension: "Drop-off", them: "Many never reply to the text", us: "The call is handled before they move on" },
    ],
    bottomLine:
      "Text-back is fine for a slow-moving inquiry. For a no-heat night or a burst pipe, the customer won't text you back. They'll call the next company. Callverted answers before that happens.",
    faqs: [
      { q: "Can I use both?", a: "You can, but for urgent trades Callverted covers the same gap more completely, and doesn't depend on the caller replying." },
      { q: "Does Callverted also text the lead to me?", a: "Yes. You get an alert with the scored lead, plus it's in your dashboard with the full transcript." },
    ],
  },
  {
    slug: "answering-service",
    alternative: "Answering service",
    metaTitle: "Callverted vs a Traditional Answering Service | Callverted",
    metaDescription:
      "A human answering service takes a message. Callverted runs a real intake, scores the lead, and flags emergencies for an instant alert. Compare for home-service businesses.",
    h1: "Callverted vs. a traditional answering service",
    intro:
      "A human answering service will pick up, but most just take a message and pass it along, with no qualification and a per-minute bill that climbs with every call. Here's how an intake-focused AI compares.",
    rows: [
      { dimension: "Qualifies the job", them: "Usually not; just takes a message", us: "Yes: service type, urgency, value, area fit" },
      { dimension: "Consistency", them: "Varies by operator and script adherence", us: "Same rigid intake every time" },
      { dimension: "Cost model", them: "Per-minute, scales up with volume", us: "Flat monthly; spikes don't spike the bill" },
      { dimension: "After-call output", them: "A message", us: "A scored lead with summary and transcript" },
      { dimension: "Emergency routing", them: "Depends on the service", us: "Flags emergencies and alerts your on-call instantly" },
      { dimension: "Availability", them: "24/7 (at a cost)", us: "24/7" },
    ],
    bottomLine:
      "An answering service tells you someone called. Callverted tells you who, what they need, how urgent it is, and what it's worth, for a flat price that doesn't punish a busy month.",
    faqs: [
      { q: "Do I lose the human touch?", a: "Your team is still the human touch. Callverted only covers the calls you'd otherwise miss, and flags emergencies so a real person gets alerted right away." },
      { q: "Is it cheaper than an answering service?", a: "For most home-service businesses, yes, especially in busy months, since it's a flat rate instead of per-minute." },
    ],
  },
];

export function getComparison(slug: string): Comparison | undefined {
  return COMPARISONS.find((c) => c.slug === slug);
}
