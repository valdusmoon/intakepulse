/**
 * Per-trade marketing content for the /industries/[slug] SEO pages. Hand-authored
 * (not a name-swapped template) so each page has genuinely trade-specific
 * substance: the scenario, the questions Callverted asks, the value range, and
 * the FAQs all differ by trade, which is what keeps Google from treating them as
 * thin doorway pages. `vertical` matches the keys in verticalDefinitions.ts.
 *
 * ACCURACY RULES (docs/callverted-standard.md is the constitution here):
 *  - The product captures FIVE normalized fields on every channel and every
 *    trade: service, urgency, when it came up, coverage, ZIP. Plus the caller's
 *    own words for an off-list service, the number from caller ID, and the
 *    computed scores. Nothing else may appear in a `captured` block.
 *  - Only THREE things are asked aloud on a job call: what happened, where
 *    (ZIP), how urgent. Timing and coverage are extract-only. The caller's name
 *    is never asked on a job call and the phone number is never asked at all.
 *  - Every `valueRange` and every scenario "Est. value" is checked against the
 *    per-service valueLowCents/valueHighCents benchmarks in
 *    verticalDefinitions.ts; the scenario priority scores are computed with the
 *    real priority_v2 blend in scoring.ts (50% urgency / 30% value / 20%
 *    capture completeness, Hot >= 65, emergency and critical-signal band maps).
 *  - Owner alerts are push + email. Never SMS. The AI never bridges a call to a
 *    human, never books, and never speaks a price that isn't an approved line.
 */

export interface IndustryFaq {
  q: string;
  a: string;
}

export interface Industry {
  slug: string;
  vertical: string;
  name: string; // display name, e.g. "HVAC"
  navLabel: string; // short nav label
  metaTitle: string;
  metaDescription: string;
  h1: string;
  heroSub: string;
  // The everyday pain this trade feels around calls it can't take.
  painPoints: string[];
  // A believable call for this trade + what Callverted genuinely captures.
  // Fields are limited to the five normalized answers, ZIP, caller ID, and the
  // computed estimate/rank. No invented structured fields.
  scenario: {
    time: string;
    caller: string;
    captured: { label: string; value: string }[];
  };
  // What the AI actually asks on a call for this trade. Items 1-3 are the only
  // things asked aloud; the rest are captured only when volunteered.
  asks: string[];
  valueRange: string; // benchmark job-value range for the trade
  faqs: IndustryFaq[];
  related: string[]; // other slugs
}

export const INDUSTRIES: Industry[] = [
  {
    slug: "hvac",
    vertical: "hvac",
    name: "HVAC",
    navLabel: "HVAC",
    metaTitle: "AI Call Answering for HVAC Companies | Callverted",
    metaDescription:
      "No-heat calls don't wait for voicemail. Callverted answers the HVAC calls your techs can't take, qualifies the job, and sends a ranked lead to your phone and inbox.",
    h1: "The no-heat call you couldn't take just went to the next HVAC company.",
    heroSub:
      "When a furnace dies at 2 AM or an AC quits in a heat wave, homeowners call the next number the second they hit voicemail. Callverted answers the calls your techs can't, qualifies the job, and sends a ranked lead to your phone and inbox before the caller gives up.",
    painPoints: [
      "Emergency HVAC calls spike exactly when nobody can reach a phone: mid-install, up on a roof, asleep at 2 AM, or three deep on the first cold snap.",
      "A no-heat homeowner with kids in the house won't leave a voicemail. They dial down the list until someone picks up.",
      "That same call was either a $300 igniter or a $10,000 system replacement, and if it rings out you never find out which one you handed to a competitor.",
    ],
    scenario: {
      time: "2:47 AM · February",
      caller: "Our furnace just died and it's freezing in here. We've got kids in the house.",
      captured: [
        { label: "Service", value: "Heat not working / repair" },
        { label: "Urgency", value: "Emergency" },
        { label: "Came up", value: "Today" },
        { label: "ZIP", value: "60630" },
        { label: "Est. value", value: "$300–$900" },
        { label: "Priority", value: "Hot · 91" },
      ],
    },
    asks: [
      "“Briefly, what's going on?” Callers answer in their own words, and Callverted files the job against your menu: no cooling, no heat, a replacement, ductwork, or a thermostat. Anything off that list is kept in the caller's own words rather than forced into a category.",
      "How urgent it is: an emergency, soon, or whenever's convenient. Urgency is half the ranking, so this is the one follow-up worth a caller's patience.",
      "The ZIP code where the work is needed, spoken or keyed in on the phone.",
      "When it came up, captured only if the caller mentions it. Never asked.",
      "A home warranty, financing, or out of pocket, captured only if it comes up. Also never asked.",
    ],
    valueRange: "$150 thermostat call to a $10,000 system replacement",
    faqs: [
      {
        q: "Does Callverted replace my HVAC answering service?",
        a: "It does a different job. An answering service takes a message and reads it back to you. Callverted runs the intake, scores the job on urgency and value, and puts it in a ranked callback list. Your techs still get the first ring either way; the AI only picks up when the call would have rung out.",
      },
      {
        q: "Can it tell an emergency no-heat call from a routine tune-up?",
        a: "Yes. Urgency is asked out loud on every call, and a stated emergency with a clear service always lands in the Hot band. Emergencies then rank against each other inside that band on job value and how complete the capture was, so five urgent calls come back to you in an order instead of a five-way tie.",
      },
      {
        q: "Will it quote HVAC prices or book the appointment?",
        a: "It reads back only the price lines you approved in Settings, word for word. With no approved line for that job, it says your team will confirm pricing. It never books an appointment and never invents a number. The dollar estimate on the lead is for your ranking only and is never spoken to the caller.",
      },
      {
        q: "What if one of my techs answers first?",
        a: "Then it's a normal call and Callverted stays out of the way. If you switch on answered-call capture, that conversation is transcribed after a spoken disclosure and becomes a tracked lead with the same fields and scoring, and the audio is deleted once the transcript exists. No alert goes out, because your tech was already on the phone.",
      },
      {
        q: "What does it cost?",
        a: "$149 a month, or $1,499 a year, with a 14-day free trial. One plan, no per-lead fees and no per-minute billing. A single recovered replacement job is worth more than a year of it.",
      },
    ],
    related: ["plumbing", "electrical", "restoration"],
  },
  {
    slug: "plumbing",
    vertical: "plumbing",
    name: "Plumbing",
    navLabel: "Plumbing",
    metaTitle: "AI Call Answering for Plumbers | Callverted",
    metaDescription:
      "Burst pipes don't wait for business hours. Callverted answers the plumbing calls your crew can't take, separates true emergencies from drips, and sends a ranked lead.",
    h1: "The burst-pipe call you can't take is flooding someone else's schedule.",
    heroSub:
      "A flooding basement is the most urgent call a homeowner ever makes, and the least patient. Callverted answers the plumbing calls your crew can't, separates the true emergencies from the drips, and puts the lead on your phone while the water is still running.",
    painPoints: [
      "Plumbing emergencies are 100% unscheduled. A burst pipe at midnight is a job you either catch in minutes or lose entirely.",
      "Water damage compounds by the minute, so the caller won't hold and won't leave a message.",
      "Under a sink with both hands full is exactly when the four-figure sewer-line call comes in, along with the restoration referral that would have followed it.",
    ],
    scenario: {
      time: "11:20 PM · Sunday",
      caller: "My basement is flooding from a burst pipe under the kitchen. It's spreading fast.",
      captured: [
        { label: "Service", value: "Burst pipe / emergency" },
        { label: "Urgency", value: "Emergency" },
        { label: "ZIP", value: "30075" },
        { label: "Callback number", value: "From caller ID" },
        { label: "Est. value", value: "$1,000–$4,000" },
        { label: "Priority", value: "Hot · 93" },
      ],
    },
    asks: [
      "“Briefly, what's going on?” Callers answer in their own words, and Callverted files the job against your menu: a clog, a leak, a water heater, a fixture, a burst pipe, or a sewer line. An off-menu request is stored verbatim instead of being squeezed into the closest category.",
      "How urgent it is right now. A burst pipe and a sewer backup also carry their own urgency weight on top of what the caller says.",
      "The ZIP code where the work is needed, spoken or keyed in on the phone.",
      "When it started, captured only if the caller mentions it. Never asked.",
      "Insurance, a home warranty, or out of pocket, captured only if it comes up. Also never asked.",
    ],
    valueRange: "$150 drain clear to a $10,000 sewer line replacement",
    faqs: [
      {
        q: "Can Callverted handle after-hours plumbing emergencies?",
        a: "That's the point. It answers 24/7, treats a burst pipe or a sewer backup as the emergency it is, and the alert reaches you as a push notification on your phone plus a full lead email while the call is still wrapping up.",
      },
      {
        q: "How is this different from a missed-call text-back?",
        a: "A text-back asks a homeowner standing in a flooding basement to stop, read a text, and reply to it. Callverted answers the call live, runs the intake, and hands you a scored lead. Nothing depends on the caller doing anything else.",
      },
      {
        q: "What actually shows up on the lead?",
        a: "The service in your menu's words, or the caller's own words when it's off-menu. Urgency, ZIP, plus timing and how it's being paid for when the caller mentioned either. The number comes from caller ID, so nobody had to ask for it. Then the dollar estimate, the Hot/Warm/Cool rank, a short summary, and the full transcript.",
      },
      {
        q: "Half my calls are existing customers and price shoppers. Won't that clog the list?",
        a: "They don't reach the list. A caller describing a problem becomes a scored job in the ranked queue. Someone chasing an existing job, asking about a bill, or price shopping with no actual problem becomes a message with a badge: captured, alerted quietly, never scored. A wrong number or a sales pitch leaves no lead at all, just the call record.",
      },
      {
        q: "Do I have to change my number?",
        a: "No. Your line stays yours and your team keeps answering it. You publish a Callverted number that rings your phones first, and only the calls that ring out ever reach the AI.",
      },
    ],
    related: ["restoration", "hvac", "electrical"],
  },
  {
    slug: "restoration",
    vertical: "restoration",
    name: "Water, Fire & Mold Restoration",
    navLabel: "Restoration",
    metaTitle: "AI Call Answering for Restoration Companies | Callverted",
    metaDescription:
      "Water and fire jobs go to whoever answers first. Callverted picks up the restoration calls your crew can't take, captures the damage and location, and sends a ranked lead.",
    h1: "In restoration, the job goes to whoever answers first.",
    heroSub:
      "Water and fire damage are emergencies measured in minutes, and the homeowner is working down the search results. Callverted answers the restoration calls your crew can't, captures the damage type, urgency, and location, and has the lead on your estimator's phone before the next franchise calls back.",
    painPoints: [
      "Restoration is a first-responder business. The company that answers first usually wins the whole job.",
      "Insured losses are high-value, and a homeowner in crisis has no patience for voicemail.",
      "One water-damage call your crew couldn't take is the whole mitigation and rebuild routed to a competitor, and it never shows up on any report you look at.",
    ],
    scenario: {
      time: "6:10 AM · Weekday",
      caller: "There's water everywhere from a burst dishwasher line. It's already in three rooms, and I think our insurance covers it.",
      captured: [
        { label: "Damage type", value: "Water" },
        { label: "Urgency", value: "Emergency" },
        { label: "Coverage", value: "Insurance (volunteered)" },
        { label: "ZIP", value: "33618" },
        { label: "Est. value", value: "$2,500–$8,000" },
        { label: "Priority", value: "Hot · 95" },
      ],
    },
    asks: [
      "“Briefly, what's going on?” Callers describe the loss in their own words, and Callverted files it as water, fire or smoke, or mold. A loss that doesn't fit those three is kept verbatim rather than forced into one of them.",
      "How urgent it is. A stated emergency with a clear loss type goes straight into the Hot band.",
      "The ZIP code where the work is needed, spoken or keyed in on the phone.",
      "When the damage started, captured only if the caller mentions it. Never asked.",
      "Insurance or out of pocket, captured only if the caller raises it first. Callverted does not interrogate a homeowner in crisis about their policy.",
    ],
    valueRange: "$2,000 mold job to $15,000 fire and smoke restoration",
    faqs: [
      {
        q: "Why does answer speed matter so much in restoration?",
        a: "Homeowners in a water or fire emergency call several companies at once and hire the first one that answers and sounds capable. Every minute in voicemail is a minute a competitor spends booking the job.",
      },
      {
        q: "Does Callverted capture insurance details?",
        a: "It captures coverage when the caller volunteers it, and it lands on the lead when they do. It deliberately doesn't ask: coverage and timing are extract-only, so they're recorded if they come up in the caller's description and skipped if they don't. Your estimator gets the full transcript either way and can prep the claim conversation from that.",
      },
      {
        q: "How fast does a true emergency reach my on-call crew?",
        a: "The alert fires as the call is closing out, as a push notification on your phone and a lead-packet email with the scores and the details. There's no SMS thread to chase and no dashboard to sit watching. An active loss floors into the Hot band, so it's already at the top of the callback queue when you open it.",
      },
      {
        q: "What if the caller asks to speak to a person?",
        a: "Callverted never bridges the call to your crew. That's deliberate. It takes their name and what they need, files it as a callback message, and alerts you right away. A half-connected transfer at 3 AM is worse than a clean message someone actually returns.",
      },
      {
        q: "What if my estimator answers the call themselves?",
        a: "Then it's a normal conversation and the AI stays out of it. With answered-call capture switched on, that call is transcribed after a spoken disclosure and becomes a lead with the same fields and the same scoring, and the audio is deleted once the transcript exists. No alert, since your estimator was on the call.",
      },
    ],
    related: ["plumbing", "hvac", "general-contracting"],
  },
  {
    slug: "electrical",
    vertical: "electrical",
    name: "Electrical",
    navLabel: "Electrical",
    metaTitle: "AI Call Answering for Electricians | Callverted",
    metaDescription:
      "No-power and burning-smell calls are urgent and high value. Callverted answers the electrical calls your crew can't take, flags the emergencies, and sends a ranked lead.",
    h1: "The no-power call you couldn't take didn't wait for a callback.",
    heroSub:
      "A dead panel or a sparking outlet is a safety emergency, and homeowners treat it like one. They call until someone answers. Callverted picks up the electrical calls your crew can't, pushes the safety calls to the top of the list, and has a scored lead on your phone in minutes.",
    painPoints: [
      "No-power and sparking calls are safety emergencies. The homeowner won't sit in voicemail waiting for you.",
      "Electrical work runs from a $150 diagnostic to a $12,000 rewire, and a call that rings out tells you nothing about which one it was.",
      "Storm-season calls arrive in clusters, at night, when every electrician you have is already out or asleep.",
    ],
    scenario: {
      time: "9:40 PM · Storm night",
      caller: "Half the house lost power and there's a burning smell near the panel.",
      captured: [
        { label: "Service", value: "No power / sparking (emergency)" },
        { label: "Urgency", value: "Emergency" },
        { label: "Came up", value: "Today" },
        { label: "ZIP", value: "19125" },
        { label: "Est. value", value: "$300–$1,500" },
        { label: "Priority", value: "Hot · 94" },
      ],
    },
    asks: [
      "“Briefly, what's going on?” Callers answer in their own words, and Callverted files the job against your menu: an outlet or switch, a panel upgrade, an EV charger, rewiring, a general diagnostic, or no power. Off-menu work is captured as the caller said it.",
      "How urgent it is. Safety wording in the description, sparking or a burning smell, scores from a higher band still, so the fire risk outranks the other emergencies already in the queue.",
      "The ZIP code where the work is needed, spoken or keyed in on the phone.",
      "When it started, captured only if the caller mentions it. Never asked.",
      "A home warranty, financing, or out of pocket, captured only if it comes up. Also never asked.",
    ],
    valueRange: "$150 diagnostic to a $12,000 whole-home rewire",
    faqs: [
      {
        q: "Can Callverted flag an electrical safety emergency?",
        a: "Yes, on two levels. A stated emergency with a clear service lands in the Hot band. On top of that, explicit safety language such as sparking, a burning smell, or an electrical fire bands the lead higher still, so it ranks above the emergencies already sitting in the queue instead of tying with them.",
      },
      {
        q: "Does it handle both service calls and big installs?",
        a: "Both, and it tells them apart in dollars. A panel upgrade and an outlet repair carry very different estimates, and the estimate uses the prices you configured in Settings before it falls back to an industry benchmark. The number on the lead reflects your pricing, not a national average.",
      },
      {
        q: "Will it give the caller a price?",
        a: "Only a price line you approved for that service, read back word for word. Otherwise it says your team will confirm pricing. The value estimate that drives ranking is backend only, and the caller never hears it.",
      },
      {
        q: "Does it sound like a robot?",
        a: "It tells the caller it's an automated assistant before it asks anything, then asks three short questions and gets off the phone. It doesn't small-talk, doesn't improvise, and doesn't pretend to be your dispatcher. Someone smelling burning plastic wants a fast, competent handoff, not a chat.",
      },
      {
        q: "What if it doesn't understand the caller?",
        a: "It re-asks once (twice for a ZIP code), then moves on with what it has rather than looping. A call never dead-ends into voicemail: worst case you get a partial lead with the transcript and the caller's number, which still beats a missed call with nothing attached.",
      },
    ],
    related: ["hvac", "plumbing", "general-contracting"],
  },
  {
    slug: "general-contracting",
    vertical: "general_contracting",
    name: "General Contracting",
    navLabel: "General Contracting",
    metaTitle: "AI Call Answering for General Contractors | Callverted",
    metaDescription:
      "Estimate requests land while you're on a jobsite. Callverted answers the calls you can't take, sizes the project, and flags the big ones so they don't sit unnoticed.",
    h1: "The remodel lead that came in while you were on a ladder booked with someone else.",
    heroSub:
      "You're on a ladder, not at a desk, so estimate requests hit voicemail all day. Callverted answers the calls you can't, sizes up the project, and flags a $25,000 remodel as high value so it never sits unread under a punch-list repair.",
    painPoints: [
      "Contractors miss calls all day for the best possible reason: the work is on a jobsite, not at a phone.",
      "A remodel inquiry and a fence repair land on the same missed-call list with nothing to tell them apart.",
      "Homeowners collecting estimates call several contractors, and the first one to call back usually gets the walkthrough.",
    ],
    scenario: {
      time: "1:15 PM · Weekday",
      caller: "We're looking to remodel our kitchen and add a bathroom. Getting a few estimates, and we'd probably finance it.",
      captured: [
        { label: "Project", value: "Renovation or remodel" },
        { label: "Urgency", value: "Whenever is convenient" },
        { label: "Coverage", value: "Financing (volunteered)" },
        { label: "ZIP", value: "78704" },
        { label: "Est. value", value: "$5,000–$25,000" },
        { label: "Priority", value: "Warm · 42 · High value" },
      ],
    },
    asks: [
      "“Briefly, what's going on?” Callers describe the project in their own words, and Callverted files it as a small repair, a renovation or remodel, an addition or structural work, or general. A project that doesn't fit is stored exactly as the caller described it.",
      "How urgent it is: an emergency, soon, or whenever's convenient. Most project calls answer flexible, which is fine, because the ranking leans on project size for those.",
      "The ZIP code where the work is needed, spoken or keyed in on the phone.",
      "When they're hoping to start and whether they're financing, captured only if the caller brings either up. Neither is asked.",
      "On calls that aren't emergencies, one last open beat: “is there anything important I missed?” Whatever they add is captured for you to read, not answered by the AI.",
    ],
    valueRange: "$300 punch-list repair to a $60,000 addition",
    faqs: [
      {
        q: "Does Callverted work for project estimates, not just emergencies?",
        a: "Yes, and it ranks them honestly. A kitchen remodel with a flexible timeline isn't an emergency, so it won't read Hot. It gets a High value badge off the dollar estimate instead, which is the flag that keeps a $25,000 project from disappearing into a list of unnamed missed calls.",
      },
      {
        q: "Can it filter tire-kickers from real projects?",
        a: "It sorts rather than filters. Someone describing work they want done is a scored job in the ranked queue. Someone asking what you charge, with no project behind it, is filed as a message: captured and alerted, never scored, so your callback list isn't padded with price shoppers. Wrong numbers and sales calls leave no lead at all.",
      },
      {
        q: "What if the caller describes something my service list doesn't cover?",
        a: "It doesn't force it into a category. The description is stored in the caller's own words, and the value estimate for an off-list job is worked out by comparing it against the services you have priced, so an unusual job still arrives with a sensible number instead of a blank.",
      },
      {
        q: "What do I actually get after the call?",
        a: "Project type in your menu's words, or the caller's words when it's off-menu. Urgency, ZIP, plus timing and financing when they mentioned either. The number comes from caller ID, so nobody had to ask. Then the dollar estimate, the rank, a short summary, and the full transcript, which is enough to call back knowing what the job is.",
      },
      {
        q: "What does it cost?",
        a: "$149 a month, or $1,499 a year, with a 14-day free trial. One plan, no per-lead fees. A single recovered walkthrough that turns into a remodel is worth more than a year of it.",
      },
    ],
    related: ["restoration", "electrical", "plumbing"],
  },
];

export function getIndustry(slug: string): Industry | undefined {
  return INDUSTRIES.find((i) => i.slug === slug);
}
