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
- Urgency score: {urgencyScore}/10
- Quality score: {qualityScore}/100
- Estimated job value: {estimatedValueLow} to {estimatedValueHigh} (cents)

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

export const UNIVERSAL_FOLLOWUP_SCORING_RULES: ScoringRule[] = [
  { answerKey: "urgency", answerValue: "emergency", urgencyBonus: 5, qualityBonus: 10 },
  { answerKey: "urgency", answerValue: "soon", urgencyBonus: 2, qualityBonus: 5 },
  { answerKey: "time_since_issue", answerValue: "today", urgencyBonus: 2, qualityBonus: 5 },
  { answerKey: "time_since_issue", answerValue: "this_week", urgencyBonus: 1, qualityBonus: 3 },
  { answerKey: "has_coverage", answerValue: "covered", qualityBonus: 20 },
  { answerKey: "has_coverage", answerValue: "out_of_pocket", qualityBonus: 8 },
  { answerKey: "has_coverage", answerValue: "not_sure", qualityBonus: 3 },
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

const restorationMenuScoringRules: ScoringRule[] = [
  { answerKey: "service_type", answerValue: "water", valueBonus: 200000 },
  { answerKey: "service_type", answerValue: "fire", urgencyBonus: 2, valueBonus: 300000, qualityBonus: 10 },
  { answerKey: "service_type", answerValue: "mold", qualityBonus: 5, valueBonus: 80000 },
];

// Enrichment fields — captured from the caller's own words if they mention them
// (via extract_intake) and fed to scoring, but never asked aloud on a voice call
// (voiceExtractOnly keeps calls short). The web intake form still renders them as
// optional. Bigger jobs (more rooms) score higher; cause is free-text context.
const restorationEnrichmentQuestions: VerticalQuestion[] = [
  { key: "cause", label: "What caused the damage?", type: "text", required: false, voiceExtractOnly: true },
  {
    key: "rooms_affected",
    label: "How many rooms are affected?",
    type: "single_select",
    options: [
      { value: "one", label: "One room" },
      { value: "two_three", label: "Two or three rooms" },
      { value: "four_plus", label: "Four or more rooms" },
    ],
    required: false,
    voiceExtractOnly: true,
  },
];

const restorationEnrichmentScoringRules: ScoringRule[] = [
  { answerKey: "rooms_affected", answerValue: "two_three", qualityBonus: 8, valueBonus: 100000 },
  { answerKey: "rooms_affected", answerValue: "four_plus", qualityBonus: 15, urgencyBonus: 3, valueBonus: 250000 },
];

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
  { answerKey: "service_type", answerValue: "ac_repair", valueBonus: 35000 },
  { answerKey: "service_type", answerValue: "heating_repair", valueBonus: 10000 },
  { answerKey: "service_type", answerValue: "thermostat", valueBonus: 10000 },
  { answerKey: "service_type", answerValue: "ac_replacement", valueBonus: 485000, qualityBonus: 10 },
  { answerKey: "service_type", answerValue: "furnace_replacement", valueBonus: 265000, qualityBonus: 10 },
  { answerKey: "service_type", answerValue: "ductwork", valueBonus: 235000, urgencyBonus: 1 },
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
  { answerKey: "service_type", answerValue: "drain_clog", valueBonus: 5000 },
  { answerKey: "service_type", answerValue: "leak_repair", valueBonus: 15000 },
  { answerKey: "service_type", answerValue: "fixture_repair", valueBonus: 10000 },
  { answerKey: "service_type", answerValue: "water_heater", valueBonus: 90000, qualityBonus: 10 },
  { answerKey: "service_type", answerValue: "sewer_line", valueBonus: 300000, urgencyBonus: 2, qualityBonus: 10 },
  { answerKey: "service_type", answerValue: "burst_pipe", urgencyBonus: 2, valueBonus: 50000 },
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
  { answerKey: "service_type", answerValue: "diagnostic", valueBonus: 7500 },
  { answerKey: "service_type", answerValue: "outlet_switch", valueBonus: 10000 },
  { answerKey: "service_type", answerValue: "emergency", urgencyBonus: 3, valueBonus: 30000 },
  { answerKey: "service_type", answerValue: "panel_upgrade", valueBonus: 150000, qualityBonus: 10 },
  { answerKey: "service_type", answerValue: "rewiring", valueBonus: 1000000, qualityBonus: 15, urgencyBonus: 1 },
  { answerKey: "service_type", answerValue: "ev_charger", valueBonus: 150000, qualityBonus: 8 },
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
  { answerKey: "service_type", answerValue: "addition", valueBonus: 635000, qualityBonus: 10 },
  { answerKey: "service_type", answerValue: "remodel", valueBonus: 435000, qualityBonus: 8 },
  { answerKey: "service_type", answerValue: "minor_repair", valueBonus: 15000 },
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
    questions: [...buildQuestions(restorationMenuQuestion), ...restorationEnrichmentQuestions],
    scoringRules: [...buildScoringRules(restorationMenuScoringRules), ...restorationEnrichmentScoringRules],
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
