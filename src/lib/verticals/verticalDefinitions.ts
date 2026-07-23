import type { VerticalQuestion, ScoringRule } from "@/lib/db/schema/verticalConfigs";

export interface VerticalDefinition {
  vertical: string;
  displayName: string;
  questions: VerticalQuestion[];
  scoringRules: ScoringRule[];
  industryLabel: string;
  // Floor for estimatedValueLow (cents) — sized to each vertical's cheapest
  // realistic call, not restoration's $1,500 floor (see scoring.ts).
  baseValueLow: number;
}

// ─── Shared AI prompt template builder ─────────────────────────────────────────
//
// Every vertical's reasoning prompt has the same shape — only the industry
// framing changes. The scores are always computed by the deterministic engine
// first; this prompt only ever explains them in plain English, never sets them.

export function buildAiPromptTemplate(industryLabel: string): string {
  return `You are an expert ${industryLabel} industry consultant helping a ${industryLabel} company understand an inbound lead.

The lead scoring engine has already computed objective scores based on the intake answers:
- Urgency score: {urgencyScore}/10 — time sensitivity only
- Quality score: {qualityScore}/100 — how COMPLETE and qualified the captured information is (service identified, location, urgency answered, coverage, contact identity). It does NOT measure urgency or job size; a 65 means a solid phone capture, 80+ means fully qualified.
- Estimated job value: {estimatedValueLow} to {estimatedValueHigh} (cents) — from the business's own configured prices when this service is priced, otherwise an industry benchmark

Your job is to write the plain-English explanation for WHY these scores are what they are, using the intake answers below. Do NOT change the scores — they are already computed. Write as if you are briefing the ${industryLabel} company owner at 2am on their phone.

Intake answers:
{intakeAnswers}

Respond with a JSON object with exactly these fields:
{
  "urgencyReasoning": "1-2 sentences explaining the urgency score in plain English. Reference specific answers.",
  "qualityReasoning": "1-2 sentences explaining the quality score. Reference specific signals from the answers.",
  "recommendedActions": ["array", "of", "3-5", "specific", "next", "actions", "for", "the", "owner"]
}

Be specific and actionable. This owner is deciding in the next 60 seconds whether to call back immediately or wait until morning.`;
}

// ─── Universal follow-up questions ──────────────────────────────────────────────
//
// Every vertical shares the same three follow-ups: urgency, recency, coverage.
// On a VOICE call only urgency is asked (it drives lead priority + callback
// routing); recency and coverage are voiceExtractOnly — captured if the caller
// volunteers them in their description, never asked aloud, to keep calls short.
// The web intake form still renders all three. Normalizing them (instead of
// bespoke per-vertical variants) keeps the schema simple; trade-specific nuance
// can come back later as opt-in extra questions.

export const URGENCY_QUESTION: VerticalQuestion = {
  key: "urgency",
  label: "How urgent is this?",
  type: "single_select",
  options: [
    { value: "emergency", label: "Emergency — need help right now" },
    { value: "soon", label: "Soon, but not an emergency" },
    { value: "flexible", label: "Whenever is convenient" },
  ],
  required: true,
};

export const TIME_SINCE_ISSUE_QUESTION: VerticalQuestion = {
  key: "time_since_issue",
  label: "When did this come up?",
  type: "single_select",
  options: [
    { value: "today", label: "Today" },
    { value: "this_week", label: "This week" },
    { value: "longer", label: "Longer ago" },
  ],
  required: true,
  voiceExtractOnly: true,
};

export const HAS_COVERAGE_QUESTION: VerticalQuestion = {
  key: "has_coverage",
  label: "Is this covered by insurance, a warranty, or financing, or would it be out of pocket?",
  type: "single_select",
  options: [
    { value: "covered", label: "Covered by insurance, warranty, or financing" },
    { value: "out_of_pocket", label: "Out of pocket" },
    { value: "not_sure", label: "Not sure" },
  ],
  required: true,
  voiceExtractOnly: true,
};

export const UNIVERSAL_FOLLOWUP_QUESTIONS: VerticalQuestion[] = [URGENCY_QUESTION, TIME_SINCE_ISSUE_QUESTION, HAS_COVERAGE_QUESTION];

// Urgency is the strongest signal we ALWAYS capture (voice asks it; the web form
// asks it). It drives the urgencyScore (and, via urgencyScore, most of the
// composite priorityScore that tiers the lead — see scoring.ts). As of
// priority_v2, rules score ONLY urgency: qualityScore is computed structurally by
// the engine from what was captured (service, ZIP, urgency answered, coverage,
// recency, identity), so quality can't become urgency-in-disguise and a perfect
// voice capture isn't penalized for questions voice never asks.
// Cap: URGENCY_CAP 15 (scoring.ts).
export const UNIVERSAL_FOLLOWUP_SCORING_RULES: ScoringRule[] = [
  { answerKey: "urgency", answerValue: "emergency", urgencyBonus: 13 },
  { answerKey: "urgency", answerValue: "soon", urgencyBonus: 6 },
  { answerKey: "time_since_issue", answerValue: "today", urgencyBonus: 2 },
  { answerKey: "time_since_issue", answerValue: "this_week", urgencyBonus: 1 },
];

/** Every vertical: [primary service question (asked open-ended on voice),
 *  ...the universal follow-ups]. voiceOpenAsk is set here so every vertical's
 *  service question is asked without a spoken menu and can capture an off-list
 *  service as free text. */
export function buildQuestions(menuQuestion: VerticalQuestion): VerticalQuestion[] {
  return [{ ...menuQuestion, voiceOpenAsk: true }, ...UNIVERSAL_FOLLOWUP_QUESTIONS];
}

/** Every vertical: [menu-specific value bonuses, ...the universal scoring rules]. */
export function buildScoringRules(menuScoringRules: ScoringRule[]): ScoringRule[] {
  return [...menuScoringRules, ...UNIVERSAL_FOLLOWUP_SCORING_RULES];
}

// ─── Restoration Vertical ─────────────────────────────────────────────────────

const restorationMenuQuestion: VerticalQuestion = {
  key: "service_type",
  label: "What type of damage?",
  type: "single_select",
  options: [
    { value: "water", label: "Water" },
    { value: "fire", label: "Fire or Smoke" },
    { value: "mold", label: "Mold" },
  ],
  required: true,
};

// Per-service benchmark value RANGES (cents) — priority_v2. These are industry
// ballparks, not quotes: a business's own pricing_rules always override them, and
// unpriced services get these scaled by the business's calibration factor
// (value-estimate.ts). Never spoken to a caller.
const restorationMenuScoringRules: ScoringRule[] = [
  { answerKey: "service_type", answerValue: "water", valueLowCents: 250000, valueHighCents: 800000 },
  { answerKey: "service_type", answerValue: "fire", urgencyBonus: 2, valueLowCents: 400000, valueHighCents: 1500000 },
  { answerKey: "service_type", answerValue: "mold", valueLowCents: 200000, valueHighCents: 600000 },
];

// NOTE (2026-07-22): restoration's former enrichment fields (cause, rooms_affected)
// were removed to keep every vertical on the identical normalized question set
// (docs/callverted-standard.md §3) — they were the only guess-prone extraction
// slots in the system. Historical leads that stored them still render via the
// humanizeKey fallback in labels.ts.

// ─── HVAC Vertical ──────────────────────────────────────────────────────────────

const hvacMenuQuestion: VerticalQuestion = {
  key: "service_type",
  label: "What do you need help with?",
  type: "single_select",
  options: [
    { value: "ac_repair", label: "AC not cooling / repair" },
    { value: "heating_repair", label: "Heat not working / repair" },
    { value: "ac_replacement", label: "New AC / replacement" },
    { value: "furnace_replacement", label: "New furnace / replacement" },
    { value: "ductwork", label: "Ductwork issue" },
    { value: "thermostat", label: "Thermostat" },
  ],
  required: true,
};

const hvacMenuScoringRules: ScoringRule[] = [
  { answerKey: "service_type", answerValue: "ac_repair", valueLowCents: 30000, valueHighCents: 90000 },
  { answerKey: "service_type", answerValue: "heating_repair", valueLowCents: 30000, valueHighCents: 90000 },
  { answerKey: "service_type", answerValue: "thermostat", valueLowCents: 15000, valueHighCents: 45000 },
  { answerKey: "service_type", answerValue: "ac_replacement", valueLowCents: 500000, valueHighCents: 1000000 },
  { answerKey: "service_type", answerValue: "furnace_replacement", valueLowCents: 350000, valueHighCents: 750000 },
  { answerKey: "service_type", answerValue: "ductwork", urgencyBonus: 1, valueLowCents: 150000, valueHighCents: 500000 },
];

// ─── Plumbing Vertical ──────────────────────────────────────────────────────────

const plumbingMenuQuestion: VerticalQuestion = {
  key: "service_type",
  label: "What do you need help with?",
  type: "single_select",
  options: [
    { value: "drain_clog", label: "Clogged drain" },
    { value: "leak_repair", label: "Leak repair" },
    { value: "water_heater", label: "Water heater" },
    { value: "fixture_repair", label: "Toilet or fixture repair/install" },
    { value: "burst_pipe", label: "Burst pipe / emergency" },
    { value: "sewer_line", label: "Sewer line issue" },
  ],
  required: true,
};

const plumbingMenuScoringRules: ScoringRule[] = [
  { answerKey: "service_type", answerValue: "drain_clog", valueLowCents: 15000, valueHighCents: 50000 },
  { answerKey: "service_type", answerValue: "leak_repair", valueLowCents: 25000, valueHighCents: 80000 },
  { answerKey: "service_type", answerValue: "fixture_repair", valueLowCents: 20000, valueHighCents: 60000 },
  { answerKey: "service_type", answerValue: "water_heater", valueLowCents: 120000, valueHighCents: 350000 },
  { answerKey: "service_type", answerValue: "sewer_line", urgencyBonus: 2, valueLowCents: 300000, valueHighCents: 1000000 },
  { answerKey: "service_type", answerValue: "burst_pipe", urgencyBonus: 2, valueLowCents: 100000, valueHighCents: 400000 },
];

// ─── Electrical Vertical ────────────────────────────────────────────────────────

const electricalMenuQuestion: VerticalQuestion = {
  key: "service_type",
  label: "What do you need help with?",
  type: "single_select",
  options: [
    { value: "diagnostic", label: "General diagnostic / not sure" },
    { value: "outlet_switch", label: "Outlet or switch issue" },
    { value: "panel_upgrade", label: "Panel upgrade" },
    { value: "ev_charger", label: "EV charger installation" },
    { value: "rewiring", label: "Rewiring" },
    { value: "emergency", label: "No power / sparking — emergency" },
  ],
  required: true,
};

const electricalMenuScoringRules: ScoringRule[] = [
  { answerKey: "service_type", answerValue: "diagnostic", valueLowCents: 15000, valueHighCents: 40000 },
  { answerKey: "service_type", answerValue: "outlet_switch", valueLowCents: 15000, valueHighCents: 50000 },
  { answerKey: "service_type", answerValue: "emergency", urgencyBonus: 3, valueLowCents: 30000, valueHighCents: 150000 },
  { answerKey: "service_type", answerValue: "panel_upgrade", valueLowCents: 180000, valueHighCents: 400000 },
  { answerKey: "service_type", answerValue: "rewiring", urgencyBonus: 1, valueLowCents: 400000, valueHighCents: 1200000 },
  { answerKey: "service_type", answerValue: "ev_charger", valueLowCents: 100000, valueHighCents: 250000 },
];

// ─── General Contracting Vertical ───────────────────────────────────────────────

const generalContractingMenuQuestion: VerticalQuestion = {
  key: "service_type",
  label: "What kind of project is this?",
  type: "single_select",
  options: [
    { value: "minor_repair", label: "Small repair / handyman job" },
    { value: "remodel", label: "Renovation or remodel" },
    { value: "addition", label: "Room addition / structural work" },
    { value: "general", label: "General / other" },
  ],
  required: true,
};

const generalContractingMenuScoringRules: ScoringRule[] = [
  { answerKey: "service_type", answerValue: "addition", valueLowCents: 1500000, valueHighCents: 6000000 },
  { answerKey: "service_type", answerValue: "remodel", valueLowCents: 500000, valueHighCents: 2500000 },
  { answerKey: "service_type", answerValue: "minor_repair", valueLowCents: 30000, valueHighCents: 120000 },
  { answerKey: "service_type", answerValue: "general", valueLowCents: 50000, valueHighCents: 200000 },
];

// ─── Other (generic fallback) Vertical ──────────────────────────────────────────
//
// Deliberately minimal — no trade-specific categories or numbers to invent.
// One catch-all service category so Settings still has something to configure.

const otherMenuQuestion: VerticalQuestion = {
  key: "service_type",
  label: "What do you need help with?",
  type: "single_select",
  options: [{ value: "general", label: "General service request" }],
  required: true,
};

const otherMenuScoringRules: ScoringRule[] = [];

// ─── All verticals ──────────────────────────────────────────────────────────────

export const VERTICALS: VerticalDefinition[] = [
  {
    vertical: "restoration",
    displayName: "Water / Fire / Mold Restoration",
    questions: buildQuestions(restorationMenuQuestion),
    scoringRules: buildScoringRules(restorationMenuScoringRules),
    industryLabel: "restoration",
    baseValueLow: 150000,
  },
  {
    vertical: "hvac",
    displayName: "HVAC",
    questions: buildQuestions(hvacMenuQuestion),
    scoringRules: buildScoringRules(hvacMenuScoringRules),
    industryLabel: "HVAC",
    baseValueLow: 15000,
  },
  {
    vertical: "plumbing",
    displayName: "Plumbing",
    questions: buildQuestions(plumbingMenuQuestion),
    scoringRules: buildScoringRules(plumbingMenuScoringRules),
    industryLabel: "plumbing",
    baseValueLow: 15000,
  },
  {
    vertical: "electrical",
    displayName: "Electrical",
    questions: buildQuestions(electricalMenuQuestion),
    scoringRules: buildScoringRules(electricalMenuScoringRules),
    industryLabel: "electrical",
    baseValueLow: 10000,
  },
  {
    vertical: "general_contracting",
    displayName: "General Contracting",
    questions: buildQuestions(generalContractingMenuQuestion),
    scoringRules: buildScoringRules(generalContractingMenuScoringRules),
    industryLabel: "general contracting",
    baseValueLow: 15000,
  },
  {
    vertical: "other",
    displayName: "Other",
    questions: buildQuestions(otherMenuQuestion),
    scoringRules: buildScoringRules(otherMenuScoringRules),
    industryLabel: "home services",
    baseValueLow: 15000,
  },
];
