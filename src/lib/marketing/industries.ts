/**
 * Per-trade marketing content for the /industries/[slug] SEO pages. Hand-authored
 * (not a name-swapped template) so each page has genuinely trade-specific
 * substance — the scenario, the questions Callverted asks, the value range, and
 * the FAQs all differ by trade, which is what keeps Google from treating them as
 * thin doorway pages. `vertical` matches the keys in verticalDefinitions.ts.
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
  // The everyday pain this trade feels around missed calls.
  painPoints: string[];
  // A believable emergency call for this trade + what Callverted captures.
  scenario: {
    time: string;
    caller: string;
    captured: { label: string; value: string }[];
  };
  // What the AI actually asks on a call for this trade (kept faithful to the
  // real intake flow in verticalDefinitions.ts).
  asks: string[];
  valueRange: string; // typical job-value range shown on the lead
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
      "Stop losing no-heat and no-cool emergencies to voicemail. Callverted answers the HVAC calls your techs miss, qualifies the job, and sends a callback-ready lead in minutes.",
    h1: "The no-heat call you missed just went to the next HVAC company.",
    heroSub:
      "When a furnace dies at 2 AM or an AC quits in a heat wave, homeowners call the next number the second they hit voicemail. Callverted answers the calls your techs can't, qualifies the job, and texts you a ranked lead before the caller gives up.",
    painPoints: [
      "Emergency HVAC calls spike exactly when your team is on a job or asleep: nights, weekends, the first cold snap.",
      "A no-heat homeowner with kids at home won't leave a voicemail; they dial down the list until someone picks up.",
      "Every missed after-hours call is a $300 repair or a $9,000 system replacement handed to a competitor.",
    ],
    scenario: {
      time: "2:47 AM · February",
      caller: "Our furnace just died and it's freezing in here. We've got kids in the house.",
      captured: [
        { label: "Service", value: "Heating: no heat" },
        { label: "Urgency", value: "Emergency" },
        { label: "Occupancy", value: "Kids at home" },
        { label: "System age", value: "~10 years" },
        { label: "Est. value", value: "$1.8k–$9k" },
      ],
    },
    asks: [
      "What do you need help with? Callers answer in their own words, and Callverted recognizes the job, whether it's no cooling, no heat, a replacement, ductwork, or a thermostat.",
      "How urgent is it: an emergency, soon, or whenever's convenient?",
      "When it started, if the caller brings it up.",
      "A home warranty, financing, or out of pocket, if it comes up.",
      "ZIP code and the best callback number.",
    ],
    valueRange: "$150 service call to $9,000+ system replacement",
    faqs: [
      {
        q: "Does Callverted replace my HVAC answering service?",
        a: "It can. Callverted answers live, runs a real intake, and scores the lead, where a traditional answering service just takes a message. Your techs still get the first ring; Callverted only steps in when the call would have gone to voicemail.",
      },
      {
        q: "Can it tell an emergency no-heat call from a routine tune-up?",
        a: "Yes. It asks urgency and service type up front, tags true emergencies, and alerts your on-call tech right away, so a frozen-pipe risk doesn't sit in a queue behind a filter change.",
      },
      {
        q: "Will it quote HVAC prices to my customers?",
        a: "Only ranges you approve. If you haven't set a range for that job type, it tells the caller your team will confirm pricing. It never invents a number.",
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
      "Burst pipes and sewage backups don't wait for business hours. Callverted answers the plumbing calls you miss, qualifies the emergency, and sends a callback-ready lead fast.",
    h1: "The burst-pipe call you missed is flooding someone else's schedule.",
    heroSub:
      "A flooding basement is the most urgent call a homeowner ever makes, and the least patient. Callverted answers the plumbing calls your crew can't, separates the true emergencies from the drips, and gets you the lead while the water's still running.",
    painPoints: [
      "Plumbing emergencies are 100% unscheduled. A burst pipe at midnight is a job you either catch in five minutes or lose entirely.",
      "Water damage compounds by the minute, so the caller will not wait on hold or leave a message.",
      "A missed burst-pipe or sewer-line call is a four-figure job gone, plus the restoration referral that would've followed.",
    ],
    scenario: {
      time: "11:20 PM · Sunday",
      caller: "My basement is flooding from a burst pipe under the kitchen. It's spreading fast.",
      captured: [
        { label: "Service", value: "Burst pipe / emergency" },
        { label: "Urgency", value: "Emergency" },
        { label: "Water spreading", value: "Yes, active" },
        { label: "Rooms affected", value: "2+" },
        { label: "Est. value", value: "$400–$4k+" },
      ],
    },
    asks: [
      "What do you need help with? Callers answer in their own words, and Callverted recognizes the job, whether it's a clog, a leak, a water heater, a burst pipe, or a sewer line.",
      "How urgent is it right now?",
      "When it started, if the caller brings it up.",
      "Insurance, a warranty, or out of pocket, if it comes up.",
      "ZIP code and the best callback number.",
    ],
    valueRange: "$150 drain clear to $4,000+ sewer or burst-pipe repair",
    faqs: [
      {
        q: "Can Callverted handle after-hours plumbing emergencies?",
        a: "That's the point. It answers 24/7, flags a burst pipe or sewer backup as an emergency, and alerts your on-call plumber immediately, so the most valuable calls never hit voicemail.",
      },
      {
        q: "How is this different from a missed-call text-back?",
        a: "A text-back asks a panicking homeowner with a flooding basement to stop and reply to a text. Callverted answers the call live, runs the intake, and hands you a scored lead, with no waiting on the caller to text you back.",
      },
      {
        q: "Does it pass along enough detail to dispatch?",
        a: "Yes: service type, urgency, whether water is actively spreading, rooms affected, ZIP, and callback number, plus a full transcript, so whoever calls back already knows the job.",
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
      "Water, fire, and mold jobs are won by the first company to answer. Callverted picks up the restoration calls you miss, qualifies the damage, and sends a ranked lead in minutes.",
    h1: "In restoration, the job goes to whoever answers first.",
    heroSub:
      "Water and fire damage are emergencies measured in minutes, and the homeowner is calling every company on the search results. Callverted answers the restoration calls your crew can't, captures the damage type, urgency, and location, and gets you the lead before the next franchise does.",
    painPoints: [
      "Restoration is a first-responder business. The company that answers first usually wins the whole job.",
      "Insured losses are high-value, and a homeowner in crisis has no patience for voicemail.",
      "One missed water-damage call is a five-figure mitigation-plus-rebuild job routed straight to a competitor.",
    ],
    scenario: {
      time: "6:10 AM · Weekday",
      caller: "There's water everywhere from a burst dishwasher line. It's already in three rooms.",
      captured: [
        { label: "Service", value: "Water damage" },
        { label: "Urgency", value: "Emergency" },
        { label: "Started", value: "Today" },
        { label: "ZIP", value: "33618" },
        { label: "Est. value", value: "$4.5k–$9k+" },
      ],
    },
    asks: [
      "What do you need help with? Callers answer in their own words, and Callverted recognizes the job, whether it's water, fire or smoke, or mold damage.",
      "How urgent is it?",
      "When the damage started, if the caller mentions it.",
      "Insurance or out of pocket, if it comes up.",
      "ZIP code and the best callback number.",
    ],
    valueRange: "$1,500 mitigation to $9,000+ full restoration",
    faqs: [
      {
        q: "Why does answer speed matter so much in restoration?",
        a: "Homeowners in a water or fire emergency call multiple companies at once and hire the first that answers and sounds capable. Every minute in voicemail is a minute a competitor is booking the job.",
      },
      {
        q: "Does Callverted capture insurance details?",
        a: "It asks whether the loss is covered by insurance and notes it on the lead, along with when the damage started and where the job is, so your estimator can prep the claim conversation before calling back.",
      },
      {
        q: "How fast does a true emergency reach my on-call crew?",
        a: "Instantly. Callverted flags an active water loss as an emergency and alerts your on-call crew right away by text and push, so it reaches a human fast instead of waiting for a callback.",
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
      "No power and sparking-panel calls are urgent and high-value. Callverted answers the electrical calls you miss, qualifies the job, and sends a callback-ready lead fast.",
    h1: "The no-power call you missed didn't wait for a callback.",
    heroSub:
      "A dead panel or a sparking outlet is a safety emergency, and homeowners treat it that way. They call until someone answers. Callverted picks up the electrical calls your crew can't, flags the true emergencies, and sends you a scored lead in minutes.",
    painPoints: [
      "No-power and sparking calls are safety emergencies. The homeowner will not sit in voicemail.",
      "Electrical work ranges from a $200 outlet to a $4,000 panel upgrade or EV-charger install; missing the call misses the whole spread.",
      "After-hours and storm-season calls cluster exactly when your electricians are unreachable.",
    ],
    scenario: {
      time: "9:40 PM · Storm night",
      caller: "Half the house lost power and there's a burning smell near the panel.",
      captured: [
        { label: "Service", value: "No power / sparking (emergency)" },
        { label: "Urgency", value: "Emergency" },
        { label: "Safety flag", value: "Burning smell" },
        { label: "Scope", value: "Panel-related" },
        { label: "Est. value", value: "$200–$4k+" },
      ],
    },
    asks: [
      "What do you need help with? Callers answer in their own words, and Callverted recognizes the job, whether it's an outlet or switch, a panel upgrade, an EV charger, rewiring, or no power.",
      "How urgent is it?",
      "When it started, if the caller brings it up.",
      "A warranty, financing, or out of pocket, if it comes up.",
      "ZIP code and the best callback number.",
    ],
    valueRange: "$200 diagnostic to $4,000+ panel or rewiring job",
    faqs: [
      {
        q: "Can Callverted flag an electrical safety emergency?",
        a: "Yes. It asks urgency and service type, tags no-power and sparking-panel calls as emergencies, and alerts your on-call electrician so a fire-risk call reaches a human right away.",
      },
      {
        q: "Does it handle both service calls and big installs?",
        a: "It qualifies either kind (a quick outlet fix, a panel upgrade, or an EV-charger install) and puts the estimated value on the lead so you know which callbacks are worth prioritizing.",
      },
      {
        q: "Will it give the customer a price?",
        a: "Only a range you've approved for that job type. Otherwise it says your team will confirm pricing. It never invents a quote.",
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
      "Estimate requests and project calls slip through when you're on site. Callverted answers the calls you miss, qualifies the project, and sends a ranked lead so you call the best ones back first.",
    h1: "The remodel lead you missed on a jobsite booked with someone else.",
    heroSub:
      "You're on a ladder, not at your desk, so estimate requests and project calls hit voicemail all day. Callverted answers the calls you can't, sizes up the project, and sends you a ranked lead so the six-figure remodel doesn't get lost behind a handyman call.",
    painPoints: [
      "Contractors miss calls all day because the work is on a jobsite, not at a phone.",
      "A remodel or addition inquiry is worth far more than a small repair, but they arrive on the same missed-call list.",
      "Homeowners requesting estimates call several contractors; the first to respond usually gets the walkthrough.",
    ],
    scenario: {
      time: "1:15 PM · Weekday",
      caller: "We're looking to remodel our kitchen and add a bathroom, trying to get a few estimates.",
      captured: [
        { label: "Project", value: "Renovation / remodel" },
        { label: "Scope", value: "Kitchen + bath addition" },
        { label: "Timeline", value: "Gathering estimates" },
        { label: "Intent", value: "High" },
        { label: "Est. value", value: "$15k+" },
      ],
    },
    asks: [
      "What do you need help with? Callers answer in their own words, and Callverted recognizes the job, whether it's a small repair, a remodel, or a room addition or structural work.",
      "How soon are you looking to start?",
      "Financing or out of pocket, if it comes up.",
      "ZIP code and the best callback number.",
    ],
    valueRange: "$500 handyman job to $50,000+ remodel or addition",
    faqs: [
      {
        q: "Does Callverted work for project estimates, not just emergencies?",
        a: "Yes. It sizes the project (repair vs. remodel vs. addition) and ranks the lead by value and intent, so a large remodel inquiry surfaces above a small repair instead of getting buried.",
      },
      {
        q: "Can it filter tire-kickers from real projects?",
        a: "It captures scope, timeline, and intent, and scores the lead, so you can see which callbacks are worth a same-day walkthrough and which can wait.",
      },
      {
        q: "What does the business get after the call?",
        a: "A lead with the project type, scope, timeline, estimated value, ZIP, callback number, and a full transcript, enough to prep before you call back.",
      },
    ],
    related: ["restoration", "electrical", "plumbing"],
  },
];

export function getIndustry(slug: string): Industry | undefined {
  return INDUSTRIES.find((i) => i.slug === slug);
}
