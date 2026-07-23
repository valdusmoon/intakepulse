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
  /** Header/social image at /public/blog/<slug>.jpg (1200x630). Generated once
   *  by scripts/gen-blog-images.ts; see imagePrompt for the generation prompt. */
  image: string;
  imageAlt: string;
  /** Prompt used to generate `image`. Kept with the post so regenerating is
   *  reproducible and new posts follow the same visual language. */
  imagePrompt: string;
  body: Block[];
}

/** Shared visual language so every header reads as one bright, cohesive set,
 *  not four random AI images. Appended to each post's imagePrompt. Anchored on
 *  the brand blue but deliberately multi-color so it stays reasonably compatible
 *  if the site theme is later reskinned. Style: glossy 3D-render marketing art
 *  (Stripe / Linear vibe) on a luminous background — bright and high-pop, never
 *  dim or desaturated. */
export const IMAGE_STYLE =
  "Modern glossy 3D-render illustration, slightly isometric, clean and premium like Stripe or Linear marketing art. Bright, vibrant, high-contrast, luminous. Background is a smooth airy gradient from brand blue (#2454d8) through periwinkle to soft lavender-white — never dark, never muddy. Tactile rounded clay/plastic materials, objects floating with soft realistic shadows and a gentle glow. Color palette anchored on brand blue and #5b8cff, with punchy accent pops of warm amber, coral, teal, and green. Centered composition with clear negative space, wide banner crop. No text, no words, no letters, no numbers on any screen or surface, no logos, no watermarks, no realistic UI screenshots.";

export const POSTS: Post[] = [
  {
    slug: "what-a-missed-call-costs",
    title: "What a missed call actually costs a home-service business",
    metaTitle: "What a Missed Call Costs a Home-Service Business | Callverted",
    metaDescription:
      "Missed calls aren't lost minutes. They're lost jobs. Here's how to put a real dollar figure on the calls your team doesn't answer, and where they go.",
    date: "2026-07-11",
    readMinutes: 4,
    excerpt:
      "Missed calls aren't lost minutes. They're lost jobs, and the math is worse than most owners think. Here's how to size the number for your business.",
    image: "/blog/what-a-missed-call-costs.jpg",
    imageAlt: "A glossy 3D smartphone with a missed-call badge and gold coins drifting away from it.",
    imagePrompt: "A glossy 3D smartphone floating at a slight tilt, a bright red missed-call badge glowing on its corner, shiny gold coins and small value chips drifting up and away from the phone, a soft downward arrow suggesting money slipping away.",
    body: [
      { type: "p", text: "Most home-service owners treat a missed call as a small annoyance, a voicemail to return later. The reality is that a missed call, especially an urgent one, is usually a job you've already lost by the time you see the notification." },
      { type: "h2", text: "The number is simple to estimate" },
      { type: "p", text: "Take three inputs: how many calls you miss in a month, your average job value, and the share of those callers who would have booked. Multiply them. A contractor missing six calls a month, at a $3,000 average job, where 30% would have booked, is leaving about $5,400 on the table every month, over $64,000 a year." },
      { type: "p", text: "That's a conservative pass. It ignores the referrals a happy customer would have sent, and the reviews they'd have left." },
      { type: "h2", text: "Where the call actually goes" },
      { type: "p", text: "A homeowner with a flooding basement or a dead furnace does not leave a voicemail and wait. They hang up and dial the next number on the results page. Research on lead response is blunt about this: the first business to respond wins the majority of the time, and the odds of even making contact collapse after the first few minutes." },
      { type: "ul", items: [
        "Emergencies cluster after hours and on weekends, exactly when your team is unreachable.",
        "The higher the urgency, the less patient the caller. A burst pipe won't wait on hold.",
        "The most valuable calls (replacements, restorations, remodels) arrive on the same missed-call list as the cheap ones.",
      ]},
      { type: "h2", text: "The fix isn't 'answer more calls'" },
      { type: "p", text: "You can't staff a phone 24/7, and you shouldn't have to. The goal is to make sure the calls your team can't take are still answered, qualified, and turned into a lead you can call back fast, while the customer is still yours to win. That's the entire premise behind live overflow answering." },
    ],
  },
  {
    slug: "after-hours-hvac-calls",
    title: "After-hours HVAC calls: why the first cold snap breaks your phone",
    metaTitle: "After-Hours HVAC Call Handling: The First Cold Snap | Callverted",
    metaDescription:
      "No-heat calls spike the moment temperatures drop: nights, weekends, all at once. Here's why HVAC companies lose the most valuable calls, and how to stop it.",
    date: "2026-07-11",
    readMinutes: 4,
    excerpt:
      "The first hard freeze turns your phone into a firehose at the worst possible hour. Here's why HVAC companies lose those calls and what to do about it.",
    image: "/blog/after-hours-hvac-calls.jpg",
    imageAlt: "A glossy 3D house with a glowing warm window beside a snowflake, thermometer, and a ringing phone.",
    imagePrompt: "A cute glossy 3D house floating on a small platform, one window glowing warm amber, a bright blue snowflake and a coral thermometer icon floating beside it, and a small phone with a glowing ring-notification, conveying an urgent no-heat call rendered in a cheerful, bright way.",
    body: [
      { type: "p", text: "Every HVAC owner knows the pattern: temperatures drop, and the phone doesn't stop: at 11 PM, on a Saturday, all at once. Furnaces fail under load, and a house full of people with no heat is the most urgent, least patient call you'll take all year." },
      { type: "h2", text: "The demand curve is against you" },
      { type: "p", text: "No-heat and no-cool calls don't arrive evenly. They spike with the weather, which means they arrive precisely when your techs are already on jobs, asleep, or off for the weekend. The calls you're least able to answer are the ones worth the most." },
      { type: "h2", text: "A no-heat homeowner won't leave a voicemail" },
      { type: "p", text: "Put yourself in their shoes: it's freezing, there are kids in the house, and it's the middle of the night. They are not going to leave a message and hope you call back in the morning. They're calling every HVAC company in the results until one picks up." },
      { type: "h2", text: "What good overflow handling looks like for HVAC" },
      { type: "ul", items: [
        "Answers live, 24/7, so the call never hits voicemail during a cold snap.",
        "Separates a no-heat emergency from a routine tune-up, and flags the urgent ones.",
        "Captures system age and occupancy, the details that tell you it's a replacement, not a $150 fix.",
        "Flags a true emergency and alerts your on-call tech instead of queuing it.",
      ]},
      { type: "p", text: "The win isn't answering every call yourself. It's making sure the ones your team can't take still become qualified leads, ranked so you call the $9,000 replacement back before the filter change." },
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
      "Text-back is a real upgrade over voicemail, but for a flooding basement it still asks the customer to do the work. Here's where each one fits.",
    image: "/blog/text-back-vs-live-answering.jpg",
    imageAlt: "A glossy 3D speech bubble with a text icon beside a phone showing a live-call waveform.",
    imagePrompt: "Two glossy 3D objects floating side by side with a small glowing divider between them: on the left a coral chat speech-bubble with a simple SMS/text glyph, on the right a blue smartphone with a bright teal live-call sound-wave arc, comparing text-back versus live answering.",
    body: [
      { type: "p", text: "Missed-call text-back has earned its popularity. When a call goes unanswered, an automatic text goes out, and for slow-moving inquiries that's a genuine improvement over a silent voicemail box." },
      { type: "h2", text: "The catch: it depends on the caller" },
      { type: "p", text: "Text-back only works if the caller stops and replies. For a homeowner standing in a flooding basement or a house with no heat, that's a big ask. They're not going to switch to texting. They're going to call the next company while the water's still rising." },
      { type: "h2", text: "Live answering removes the dependency" },
      { type: "p", text: "Live overflow answering picks up the call itself, runs the intake, and hands you a qualified lead, with no waiting on the customer to text back. For urgent trades, that difference is the whole ballgame." },
      { type: "ul", items: [
        "Text-back: good for estimate requests and non-urgent follow-up.",
        "Live answering: better for emergencies, where the caller won't wait or type.",
        "Both beat voicemail, but only one qualifies the job during the call.",
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
    image: "/blog/how-fast-to-respond-to-a-lead.jpg",
    imageAlt: "A glossy 3D smartphone racing past a stopwatch with motion streaks and a lightning bolt.",
    imagePrompt: "A glossy 3D smartphone tilted forward in motion beside a bright stopwatch, with amber and teal motion streaks and a small glowing lightning bolt, conveying speed and a fast response.",
    body: [
      { type: "p", text: "There's a well-worn finding in lead-response research that every home-service owner should internalize: respond in the first five minutes and you're dramatically more likely to make contact than if you wait even half an hour. And the first company to respond wins the majority of the time." },
      { type: "h2", text: "Why speed beats almost everything else" },
      { type: "p", text: "A homeowner in an emergency is calling several businesses at once. Whoever answers first, and sounds capable, usually gets the job before the others even return the call. Being better on price or reviews rarely matters if you're second to respond." },
      { type: "h2", text: "The problem is the calls you can't take" },
      { type: "p", text: "You already respond fast to the calls you answer. The leak is the calls that come in while you're on a job, asleep, or closed. Those go to voicemail and, effectively, to your competitor." },
      { type: "h2", text: "Closing the gap" },
      { type: "p", text: "The practical fix is to guarantee a fast, capable answer on the calls your team can't take, one that qualifies the job and gets you a callback-ready lead within minutes, not hours. That's the window where the customer is still yours." },
    ],
  },
  {
    slug: "which-lead-to-call-back-first",
    title: "Which lead do you call back first?",
    metaTitle: "Which Lead Do You Call Back First? | Callverted",
    metaDescription:
      "Come off a job to a stack of missed calls and the order you return them in decides which job you win. A simple triage guide for home-service teams.",
    date: "2026-07-13",
    readMinutes: 4,
    excerpt:
      "Come off a job to five missed calls and the instinct is to work them oldest-first. That's the wrong order, and it quietly costs you the best job in the stack.",
    image: "/blog/which-lead-to-call-back-first.jpg",
    imageAlt: "Glossy 3D lead cards sorting themselves into a ranked priority order, the top card glowing brightest.",
    imagePrompt: "A glossy 3D stack of rounded lead cards floating and sorting themselves into a ranked vertical order, the top card larger and glowing brightest with a small upward priority arrow and a subtle warm urgency spark, the lower cards calmer and cooler-toned, conveying triage and prioritization.",
    body: [
      { type: "p", text: "Come off a four-hour job and you've got five missed calls and three web leads waiting. The instinct is to work the list top to bottom, oldest first. That's the wrong order, and on a busy day it quietly costs you the best job in the stack." },
      { type: "h2", text: "Return order beats return effort" },
      { type: "p", text: "You won't reach everyone, and the ones you reach won't all book. So the only question that really matters is which call you make first. Get the order right and you win the job that was about to dial someone else. Get it wrong and you burn your first callback on a tire-kicker while a $6,000 restoration walks." },
      { type: "h2", text: "Three signals decide the order" },
      { type: "p", text: "Every lead can be ranked on three things, and you can read all three from a good intake instead of guessing from a name and a number." },
      { type: "ul", items: [
        "Urgency: is this happening right now? A flooding basement or a no-heat call at 20 degrees won't wait. A 'sometime next month' quote will.",
        "Intent: how ready are they to hire? 'My water heater just burst' is a buyer. 'Just getting a few prices' is a maybe.",
        "Fit and value: is it the kind of job you want, in your service area, at a size worth the drive? A full remediation outranks a $120 service call.",
      ]},
      { type: "h2", text: "Rank on all three, not just one" },
      { type: "p", text: "The trap is sorting on a single signal. The most urgent call isn't always the most valuable, and the biggest job isn't always ready to book. Weigh urgency, intent, and value together and a clear order falls out: high-urgency, high-intent, high-value calls first; low-everything last." },
      { type: "h2", text: "Do the triage before you pick up the phone" },
      { type: "p", text: "The reason most teams call back in the wrong order is that there's nothing to sort on until they've already spent the call. The fix is to capture what happened on the way in, the issue, how urgent it is, whether it fits, and a rough value, so the list arrives pre-sorted. Then your first callback is always the one most likely to turn into a booked job." },
    ],
  },
  {
    slug: "emergency-plumbing-after-hours",
    title: "The 2 a.m. burst pipe: why emergency plumbing goes to whoever answers",
    metaTitle: "Emergency Plumbing Calls After Hours: Who Wins the Job | Callverted",
    metaDescription:
      "A burst pipe or backed-up sewer doesn't wait until morning. Here's why after-hours plumbing calls go to whoever picks up, and how to be that company.",
    date: "2026-07-14",
    readMinutes: 4,
    excerpt:
      "A burst pipe at 2 a.m. is the most valuable, least patient call a plumber takes. It goes to whoever answers, not whoever's cheapest. Here's how to be that company.",
    image: "/blog/emergency-plumbing-after-hours.jpg",
    imageAlt: "A glossy 3D burst pipe with a water droplet and a brightly ringing phone floating beside it.",
    imagePrompt: "A glossy 3D chrome pipe with a single bright teal water droplet bursting from a small crack, floating beside a blue smartphone with a glowing ring-notification and a small coral urgency spark, conveying an after-hours plumbing emergency in a cheerful, bright, premium way.",
    body: [
      { type: "p", text: "Ask any plumber which calls pay the bills and it's not the dripping faucet at 10 a.m. It's the burst supply line, the backed-up sewer, the water heater that let go and is running down the hallway, and those calls almost never arrive during business hours." },
      { type: "h2", text: "Water damage compounds by the minute" },
      { type: "p", text: "A no-heat call is urgent. A water call is urgent and getting worse every minute it isn't answered. The homeowner knows it: they can see the damage spreading. That's exactly why they won't sit through your voicemail greeting: they'll hang up mid-message and dial the next plumber while they're still holding a towel against the leak." },
      { type: "h2", text: "The job goes to whoever picks up, not whoever's best" },
      { type: "p", text: "At 2 a.m. nobody is comparing reviews or getting three quotes. The first plumber who answers, sounds like they can help, and can say when they'll arrive wins the job. Being cheaper or more experienced than the shop down the road doesn't matter if that shop answered and you didn't." },
      { type: "h2", text: "What good after-hours coverage looks like for plumbing" },
      { type: "ul", items: [
        "Answers live, 24/7, so a midnight water call never lands in voicemail.",
        "Tells a true emergency (burst line, sewage backup, no water) from a routine ask, and flags it.",
        "Captures the details that size the job: what's leaking, how long it's been going, shutoff status, and whether it's one fixture or the whole house.",
        "Flags a genuine emergency and alerts your on-call tech instead of parking it until morning.",
      ]},
      { type: "p", text: "You can't answer the phone yourself at 2 a.m., and you shouldn't have to. The goal is simpler: make sure the water calls your team can't take are still answered, qualified, and handed back as a ranked lead, while the customer is still bailing water and still yours to win." },
    ],
  },
  {
    slug: "water-damage-restoration-leads",
    title: "Water damage restoration: the job is won in the first hour",
    metaTitle: "Water Damage Restoration Leads: Won in the First Hour | Callverted",
    metaDescription:
      "Restoration jobs are the highest-ticket emergency work in the trades, and they're awarded on the first call. Here's why a missed restoration call is rarely recoverable.",
    date: "2026-07-15",
    readMinutes: 4,
    excerpt:
      "Restoration is the highest-ticket emergency work in the trades, and the job is usually awarded before you've heard the voicemail. Here's why that call is rarely recoverable.",
    image: "/blog/water-damage-restoration-leads.jpg",
    imageAlt: "A glossy 3D water droplet and air-mover drying fan beside an amber clock and a phone showing a green checkmark.",
    imagePrompt: "A glossy 3D scene: a large tactile teal water droplet floating beside a small rounded blue air-mover drying fan, a bright amber clock face with its hand sweeping, and a periwinkle smartphone with a glowing ring-notification, conveying a race against the clock to dry water damage, rendered cheerfully and premium.",
    body: [
      { type: "p", text: "Restoration is unusual in the trades: a single water loss can be worth more than a month of ordinary service work, the customer is at their most panicked, and the decision about who gets the job is often made in the first ten minutes. Not after three quotes. Not after a review comparison. On the first call that gets answered." },
      { type: "h2", text: "The drying clock starts before you do" },
      { type: "p", text: "Standard industry guidance, the EPA's included, is to dry and clean water-damaged materials within roughly 24 to 48 hours, because mold can begin growing in that window. Homeowners increasingly know this, and insurers certainly do. The clock doesn't start when you return the call in the morning. It started when the supply line let go." },
      { type: "p", text: "That's why a restoration voicemail is worth so much less than a restoration call. Every hour of delay makes the loss worse, the scope harder to defend, and the homeowner more certain that they should be calling somebody else." },
      { type: "h2", text: "Your leads arrive from three directions at once" },
      { type: "p", text: "Unlike most trades, restoration work doesn't come from one predictable channel. It arrives from panicked homeowners who found you on a search, from plumbers and HVAC techs handing off a job they've just stopped the water on, and from adjusters and property managers working a claim. What those three have in common is that none of them wait. The plumber referring you has your competitor's number in the same contact list." },
      { type: "ul", items: [
        "Losses cluster at the worst hours: overnight freezes, weekend storms, holiday vacancies.",
        "The biggest jobs, whole-floor losses and category-three water, are the ones least likely to arrive at 10 a.m. on a Tuesday.",
        "A referral partner who gets voicemail twice stops referring. That's not one lost job, it's a lost channel.",
      ]},
      { type: "h2", text: "What good call handling looks like for restoration" },
      { type: "p", text: "The bar is higher than just picking up. A restoration call has to be sized while it's happening, because the answers change whether you roll a truck tonight and what you put on it." },
      { type: "ul", items: [
        "Answers live, 24/7, since that's when losses actually happen.",
        "Captures what scopes the job: water source, how long it's been standing, how many rooms and floors are affected, whether it's clean water or sewage, and whether the source is stopped.",
        "Asks whether it's an insurance claim and who the carrier is, so the paperwork starts on the right foot.",
        "Separates a genuine emergency from a request for an estimate next week, and flags it accordingly.",
        "Flags a real loss and alerts your on-call lead instead of holding it until morning.",
      ]},
      { type: "p", text: "None of that requires you to personally answer the phone at 3 a.m. It requires that the calls your team can't take are still answered, still qualified, and handed back as a ranked lead with the scope already captured, while the water is still spreading and the job is still yours to win." },
    ],
  },
  {
    slug: "emergency-electrician-after-hours",
    title: "No power at 9 p.m.: why electrical emergencies go to whoever answers",
    metaTitle: "Emergency Electrician Calls After Hours: Who Wins the Job | Callverted",
    metaDescription:
      "A burning smell, a dead panel, half the house dark: electrical emergencies feel dangerous and won't wait for a callback. Here's why they go to whoever answers.",
    date: "2026-07-21",
    readMinutes: 4,
    excerpt:
      "A burning smell or a dead panel at 9 p.m. is the most urgent, least patient call an electrician takes. It goes to whoever answers, not whoever's cheapest. Here's how to be that company.",
    image: "/blog/emergency-electrician-after-hours.jpg",
    imageAlt: "A glossy 3D electrical panel with a warning spark beside a darkened house and a brightly ringing phone.",
    imagePrompt: "A glossy 3D breaker/electrical panel floating at a slight tilt with a small bright amber warning spark and a coral warning triangle beside it, a cute mostly-dark 3D house with one faintly glowing window nearby, and a blue smartphone with a glowing ring-notification, conveying an after-hours electrical emergency in a cheerful, bright, premium way.",
    body: [
      { type: "p", text: "Ask any electrician which calls matter most and it isn't the outlet swap booked a week out. It's the burning smell behind a panel, the breaker that won't reset, the half of the house that just went dark, and those calls rarely wait for business hours." },
      { type: "h2", text: "An electrical emergency feels dangerous, and that changes the caller" },
      { type: "p", text: "A leaking pipe is a mess. A hot panel or a scorched outlet is scary. The homeowner isn't just inconvenienced, they're worried the house could catch fire, and a frightened caller does not sit through a voicemail greeting. They hang up and dial the next electrician while they're still standing in the dark deciding whether to flip the main." },
      { type: "h2", text: "The urgent calls arrive off the clock" },
      { type: "p", text: "Electrical emergencies don't spread out politely across the workday. Panels trip under load when the AC or heat is running hardest, storms knock out power overnight, and the extension-cord-and-space-heater failures land on the coldest evenings. The calls worth the most are the ones most likely to come in after your team has gone home." },
      { type: "h2", text: "The job goes to whoever picks up, not whoever's best" },
      { type: "p", text: "At 9 p.m. with a burning smell in the wall, nobody is comparing reviews or collecting three quotes. The first electrician who answers, sounds like they can help, and can say when they'll arrive wins the job. Being more experienced or better priced than the shop across town doesn't matter if that shop answered and you didn't." },
      { type: "h2", text: "What good after-hours coverage looks like for electrical" },
      { type: "ul", items: [
        "Answers live, 24/7, so a late-night no-power call never lands in voicemail.",
        "Tells a true emergency (burning smell, sparking, a dead panel, exposed or arcing wiring) from a routine ask, and flags it.",
        "Captures the details that size and triage the job: what's happening, whether it's one circuit or the whole house, whether there's smoke, heat, or a burning smell, and the age of the panel.",
        "Flags a genuine hazard and alerts your on-call electrician instead of parking it until morning.",
      ]},
      { type: "p", text: "You can't answer the phone yourself at 9 p.m., and you shouldn't have to. The goal is simpler: make sure the electrical calls your team can't take are still answered, qualified, and handed back as a ranked lead with the hazard already flagged, while the customer is still standing in the dark and still yours to win." },
    ],
  },
  {
    slug: "calls-you-answer-are-leaking-too",
    title: "The calls you answer are leaking too",
    metaTitle: "The Calls You Answer Are Leaking Too | Callverted",
    metaDescription:
      "Missed calls get all the attention. The quieter leak is the call your tech answered on a roof, promised Thursday, and never wrote down. Here's how to find it and close it.",
    date: "2026-07-23",
    readMinutes: 5,
    excerpt:
      "Every article about phone leakage assumes the phone rang out. The quieter loss is the call somebody picked up, promised something on, and never wrote down.",
    image: "/blog/calls-you-answer-are-leaking-too.jpg",
    imageAlt: "A glossy 3D phone whose call waveform dissolves into drifting particles on one side and firms into a solid lead card on the other.",
    imagePrompt: "A glossy 3D smartphone floating at a slight tilt mid-call, a bright teal sound-wave arc coming out of it: on the left the wave breaks apart into small drifting particles that fade away, on the right the same wave condenses into a solid rounded periwinkle card with a small green checkmark, conveying a spoken conversation either evaporating or being captured as a record.",
    body: [
      { type: "p", text: "It's 3:40 on a Friday and a tech is on a roof with the phone pinned to his shoulder. A homeowner describes a stain spreading across the kitchen ceiling. He says what any good tech says: yeah, that sounds like flashing, we can probably get out Thursday, I'll have the office call you. Then he hangs up and goes back to work." },
      { type: "p", text: "Nothing about that call was handled badly. It was answered on the first ring by someone who knew what he was talking about. And unless something happens in the next few hours, that job is gone, because nobody wrote a word of it down." },
      { type: "h2", text: "Answered is not the same as captured" },
      { type: "p", text: "Almost everything written about leaking phones assumes the failure is a call that rang out. Missed calls are easy to talk about because they leave evidence: a call log, a voicemail, a number you can point at. The call your team actually took leaves nothing at all except a memory in the head of whoever took it, and that person is already driving to the next job." },
      { type: "p", text: "Ask an owner how many calls the team answered last week and what came of them. Most can't say, and it isn't a discipline problem. There's simply nowhere the answer lives." },
      { type: "h2", text: "The three ways an answered call disappears" },
      { type: "ul", items: [
        "The verbal promise nobody logs. 'We can come Thursday' is a commitment made on behalf of your company by someone who won't be the one keeping it.",
        "The handoff that never happens. 'I'll have the office call you back' only becomes a lead if somebody actually tells the office.",
        "The detail that got compressed. The tech heard 'upstairs bathroom, dripping into the ceiling since Tuesday.' What reaches the schedule, if anything does, is 'leak, call back.'",
      ]},
      { type: "p", text: "None of these look like a lost job at the time. They look like a call that went fine." },
      { type: "h2", text: "Why it costs more than a missed call" },
      { type: "p", text: "A missed call is at least a fair fight. The homeowner dials the next company on the list and one of you wins. An answered call that evaporates is worse, because the customer stops shopping. They believe they hired you. They wait for the Thursday that never comes, and by the time they work out that nobody's coming, they aren't just calling someone else. They're telling people about you." },
      { type: "p", text: "The arithmetic is the same shape as the missed-call math, with a worse ending. A shop that answers forty calls a week and loses track of two of them is dropping roughly eight jobs a month it had already won. At a $3,000 average job, that's a truck payment and then some. Not all eight would have closed, but they were far closer to closed than any missed call ever gets." },
      { type: "h2", text: "Run this test on your own week" },
      { type: "p", text: "You don't need software to find out whether this is happening to you. Pick five calls your team answered in the last seven days, any five, and walk each one through four questions." },
      { type: "ul", items: [
        "Is there a record of this call anywhere outside one person's head?",
        "Does that record say what the caller actually needed, not just that they called?",
        "Does it say what was promised, and by when?",
        "Does it say who was supposed to follow up, and whether they did?",
      ]},
      { type: "p", text: "Owners who run this usually find the same pattern. Calls that turned into booked work have a record, because booking one forces you to write something down. Everything else vanishes: the quotes, the maybes, the 'call me after the holidays,' the second-opinion shopper who was one good callback away from signing. That's precisely the population your follow-up was supposed to work." },
      { type: "h2", text: "Why 'write it down' never fixes it" },
      { type: "p", text: "Every owner has already tried this. You've asked the crew to text the office, log it in the app, leave a note. It works for a week and then stops, and the reason isn't laziness. The moment of the call is the worst possible moment to do paperwork. The person answering is on a ladder, under a house, in traffic, or standing in somebody's kitchen with a customer watching. Any system that depends on them doing a second task while doing the first will fail on the busiest days, which are the days with the most calls in them." },
      { type: "p", text: "So the capture has to happen without the answerer doing anything at all." },
      { type: "h2", text: "What that looks like when it's built right" },
      { type: "p", text: "The idea is simple: the conversation itself becomes the record. Your tech keeps doing the only thing you want him doing, which is talking to the customer and then hanging up. Everything else happens behind him." },
      { type: "ul", items: [
        "Nothing is recorded silently. A spoken notice plays before the conversation starts, and if that notice isn't set, no recording happens at all.",
        "The audio is transcribed and then deleted. You keep a written record of what was discussed. You don't accumulate a library of recordings of your customers, which is a liability nobody wants and a promise you shouldn't have to manage.",
        "The transcript turns into a lead in the same list as everything else. One ledger for answered calls, missed calls, and web forms is the entire point. A lead that only exists in a separate 'recordings' tab is a lead you'll never work.",
        "A real service request gets sorted, ranked, and given a value estimate like any other job. A supplier calling back or an existing customer asking about an invoice is filed as a message, not scored and ranked as an opportunity, because pretending everything is a lead is how a lead list becomes noise.",
        "If your tech quoted a number on that call, that's the number attached to the job. A price your own person said out loud beats any estimate a system would have guessed.",
        "No alert fires for a call your team answered. Somebody was already on it. Pinging them about a conversation they just had is how people learn to ignore alerts entirely.",
      ]},
      { type: "h2", text: "The three questions you should be able to answer" },
      { type: "p", text: "Forget recordings and dashboards for a second. The bar is this: for any call from last week, you should be able to say what the caller wanted, what your company promised them, and whether anyone followed up, without phoning the person who took it. Every one of those answers that lives only in a tech's memory is a job sitting on a fault line." },
      { type: "p", text: "Missed calls are the leak everyone talks about because they're the leak you can see. Start counting the answered ones and the number usually gets bigger, not smaller. The good news is that these are customers who already chose you. Getting them back doesn't take better marketing. It takes a record." },
    ],
  },
];

export function getPost(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug);
}
