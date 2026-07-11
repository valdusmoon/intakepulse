/**
 * Blog / resources content. Posts are structured blocks (not raw markdown) so
 * they render with no extra dependency and stay type-safe. Each post page emits
 * Article structured data. Dates are fixed ISO strings — static content, not
 * generated at build time.
 */

export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] };

export interface Post {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  date: string; // ISO
  readMinutes: number;
  excerpt: string;
  body: Block[];
}

export const POSTS: Post[] = [
  {
    slug: "what-a-missed-call-costs",
    title: "What a missed call actually costs a home-service business",
    metaTitle: "What a Missed Call Costs a Home-Service Business | Callverted",
    metaDescription:
      "Missed calls aren't lost minutes — they're lost jobs. Here's how to put a real dollar figure on the calls your team doesn't answer, and where they go.",
    date: "2026-07-11",
    readMinutes: 4,
    excerpt:
      "Missed calls aren't lost minutes — they're lost jobs, and the math is worse than most owners think. Here's how to size the number for your business.",
    body: [
      { type: "p", text: "Most home-service owners treat a missed call as a small annoyance — a voicemail to return later. The reality is that a missed call, especially an urgent one, is usually a job you've already lost by the time you see the notification." },
      { type: "h2", text: "The number is simple to estimate" },
      { type: "p", text: "Take three inputs: how many calls you miss in a month, your average job value, and the share of those callers who would have booked. Multiply them. A contractor missing six calls a month, at a $3,000 average job, where 30% would have booked, is leaving about $5,400 on the table every month — over $64,000 a year." },
      { type: "p", text: "That's a conservative pass. It ignores the referrals a happy customer would have sent, and the reviews they'd have left." },
      { type: "h2", text: "Where the call actually goes" },
      { type: "p", text: "A homeowner with a flooding basement or a dead furnace does not leave a voicemail and wait. They hang up and dial the next number on the results page. Research on lead response is blunt about this: the first business to respond wins the majority of the time, and the odds of even making contact collapse after the first few minutes." },
      { type: "ul", items: [
        "Emergencies cluster after hours and on weekends — exactly when your team is unreachable.",
        "The higher the urgency, the less patient the caller. A burst pipe won't wait on hold.",
        "The most valuable calls (replacements, restorations, remodels) arrive on the same missed-call list as the cheap ones.",
      ]},
      { type: "h2", text: "The fix isn't 'answer more calls'" },
      { type: "p", text: "You can't staff a phone 24/7, and you shouldn't have to. The goal is to make sure the calls your team can't take are still answered, qualified, and turned into a lead you can call back fast — while the customer is still yours to win. That's the entire premise behind live overflow answering." },
    ],
  },
  {
    slug: "after-hours-hvac-calls",
    title: "After-hours HVAC calls: why the first cold snap breaks your phone",
    metaTitle: "After-Hours HVAC Call Handling: The First Cold Snap | Callverted",
    metaDescription:
      "No-heat calls spike the moment temperatures drop — nights, weekends, all at once. Here's why HVAC companies lose the most valuable calls, and how to stop it.",
    date: "2026-07-11",
    readMinutes: 4,
    excerpt:
      "The first hard freeze turns your phone into a firehose at the worst possible hour. Here's why HVAC companies lose those calls and what to do about it.",
    body: [
      { type: "p", text: "Every HVAC owner knows the pattern: temperatures drop, and the phone doesn't stop — at 11 PM, on a Saturday, all at once. Furnaces fail under load, and a house full of people with no heat is the most urgent, least patient call you'll take all year." },
      { type: "h2", text: "The demand curve is against you" },
      { type: "p", text: "No-heat and no-cool calls don't arrive evenly. They spike with the weather, which means they arrive precisely when your techs are already on jobs, asleep, or off for the weekend. The calls you're least able to answer are the ones worth the most." },
      { type: "h2", text: "A no-heat homeowner won't leave a voicemail" },
      { type: "p", text: "Put yourself in their shoes: it's freezing, there are kids in the house, and it's the middle of the night. They are not going to leave a message and hope you call back in the morning. They're calling every HVAC company in the results until one picks up." },
      { type: "h2", text: "What good overflow handling looks like for HVAC" },
      { type: "ul", items: [
        "Answers live, 24/7, so the call never hits voicemail during a cold snap.",
        "Separates a no-heat emergency from a routine tune-up, and flags the urgent ones.",
        "Captures system age and occupancy — the details that tell you it's a replacement, not a $150 fix.",
        "Can warm-transfer a true emergency to your on-call tech instead of queuing it.",
      ]},
      { type: "p", text: "The win isn't answering every call yourself — it's making sure the ones your team can't take still become qualified leads, ranked so you call the $9,000 replacement back before the filter change." },
    ],
  },
  {
    slug: "text-back-vs-live-answering",
    title: "Missed-call text-back vs. live answering for emergencies",
    metaTitle: "Missed-Call Text-Back vs Live Answering for Emergencies | Callverted",
    metaDescription:
      "Text-back beats voicemail, but for urgent home-service calls it still puts the work on a panicking caller. Here's when live answering wins.",
    date: "2026-07-11",
    readMinutes: 3,
    excerpt:
      "Text-back is a real upgrade over voicemail — but for a flooding basement it still asks the customer to do the work. Here's where each one fits.",
    body: [
      { type: "p", text: "Missed-call text-back has earned its popularity. When a call goes unanswered, an automatic text goes out, and for slow-moving inquiries that's a genuine improvement over a silent voicemail box." },
      { type: "h2", text: "The catch: it depends on the caller" },
      { type: "p", text: "Text-back only works if the caller stops and replies. For a homeowner standing in a flooding basement or a house with no heat, that's a big ask. They're not going to switch to texting — they're going to call the next company while the water's still rising." },
      { type: "h2", text: "Live answering removes the dependency" },
      { type: "p", text: "Live overflow answering picks up the call itself, runs the intake, and hands you a qualified lead — no waiting on the customer to text back. For urgent trades, that difference is the whole ballgame." },
      { type: "ul", items: [
        "Text-back: good for estimate requests and non-urgent follow-up.",
        "Live answering: better for emergencies, where the caller won't wait or type.",
        "Both beat voicemail — but only one qualifies the job during the call.",
      ]},
      { type: "p", text: "If most of your money is in emergencies, the tool that answers before the caller gives up is the one that pays for itself." },
    ],
  },
  {
    slug: "how-fast-to-respond-to-a-lead",
    title: "How fast do you really need to respond to a service lead?",
    metaTitle: "How Fast to Respond to a Service Lead | Callverted",
    metaDescription:
      "The research on lead response speed is brutal: minutes matter, and the first responder usually wins. Here's what that means for home-service calls.",
    date: "2026-07-11",
    readMinutes: 3,
    excerpt:
      "The data on response speed is blunt: the first business to respond usually wins, and your odds fall off a cliff after the first few minutes.",
    body: [
      { type: "p", text: "There's a well-worn finding in lead-response research that every home-service owner should internalize: respond in the first five minutes and you're dramatically more likely to make contact than if you wait even half an hour. And the first company to respond wins the majority of the time." },
      { type: "h2", text: "Why speed beats almost everything else" },
      { type: "p", text: "A homeowner in an emergency is calling several businesses at once. Whoever answers first — and sounds capable — usually gets the job before the others even return the call. Being better on price or reviews rarely matters if you're second to respond." },
      { type: "h2", text: "The problem is the calls you can't take" },
      { type: "p", text: "You already respond fast to the calls you answer. The leak is the calls that come in while you're on a job, asleep, or closed. Those go to voicemail and, effectively, to your competitor." },
      { type: "h2", text: "Closing the gap" },
      { type: "p", text: "The practical fix is to guarantee a fast, capable answer on the calls your team can't take — one that qualifies the job and gets you a callback-ready lead within minutes, not hours. That's the window where the customer is still yours." },
    ],
  },
];

export function getPost(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug);
}
