import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ScoringRule, VerticalQuestion } from "@/lib/db/schema/verticalConfigs";
import type { PricingRuleLike } from "./value-estimate";

vi.mock("@/lib/openai", () => ({ openai: { chat: { completions: { create: vi.fn() } } } }));
import { openai } from "@/lib/openai";
import { maybeEstimateUnlistedValue } from "./estimate-unlisted-value";

const QUESTIONS: VerticalQuestion[] = [
  {
    key: "service_type",
    label: "Service",
    type: "single_select",
    options: [
      { value: "drain_clog", label: "Clogged drain" },
      { value: "water_heater", label: "Water heater" },
      { value: "custom_repipe", label: "Whole-home repipe" }, // custom option, no benchmark
    ],
    required: true,
  },
];
const RULES: ScoringRule[] = [
  { answerKey: "service_type", answerValue: "drain_clog", valueLowCents: 15000, valueHighCents: 50000 },
  { answerKey: "service_type", answerValue: "water_heater", valueLowCents: 120000, valueHighCents: 350000 },
];
const PRICED_WATER_HEATER: PricingRuleLike = {
  serviceCategory: "water_heater",
  pricingType: "preliminary_range",
  minimumAmount: 150000,
  maximumAmount: 400000,
  fixedAmount: null,
  startingAmount: null,
  isActive: true,
};

function mockModelAnswer(low: number, high: number) {
  vi.mocked(openai.chat.completions.create).mockResolvedValue({
    choices: [
      {
        message: {
          tool_calls: [
            {
              type: "function",
              function: {
                name: "estimate_job_value",
                arguments: JSON.stringify({ low_dollars: low, high_dollars: high, reasoning: "r" }),
              },
            },
          ],
        },
      },
    ],
  } as never);
}

beforeEach(() => {
  vi.mocked(openai.chat.completions.create).mockReset();
  process.env.OPENAI_API_KEY = "test-key";
});

describe("maybeEstimateUnlistedValue", () => {
  it("returns null (no API call) for a menu service with a benchmark", async () => {
    const r = await maybeEstimateUnlistedValue({
      questions: QUESTIONS, rules: RULES, answers: { service_type: "drain_clog" }, vertical: "plumbing",
    });
    expect(r).toBeNull();
    expect(openai.chat.completions.create).not.toHaveBeenCalled();
  });

  it("returns null (no API call) for a menu service the business priced", async () => {
    const r = await maybeEstimateUnlistedValue({
      questions: QUESTIONS,
      rules: [],
      answers: { service_type: "water_heater" },
      pricing: [PRICED_WATER_HEATER],
      vertical: "plumbing",
    });
    expect(r).toBeNull();
    expect(openai.chat.completions.create).not.toHaveBeenCalled();
  });

  it("estimates an off-list job relative to the anchor price list", async () => {
    mockModelAnswer(6000, 12000);
    const r = await maybeEstimateUnlistedValue({
      questions: QUESTIONS,
      rules: RULES,
      answers: {},
      serviceRequested: "full pipe gut and replace",
      pricing: [PRICED_WATER_HEATER],
      vertical: "plumbing",
    });
    expect(r).toEqual({ lowCents: 600000, highCents: 1200000 });
    // The prompt must carry the business's own price as an anchor, marked as theirs.
    const call = vi.mocked(openai.chat.completions.create).mock.calls[0][0] as { messages: { content: string }[] };
    const userMsg = call.messages[1].content;
    expect(userMsg).toContain("full pipe gut and replace");
    expect(userMsg).toContain("this business's own price");
  });

  it("estimates a CUSTOM menu option (no benchmark) from its label", async () => {
    mockModelAnswer(4000, 9000);
    const r = await maybeEstimateUnlistedValue({
      questions: QUESTIONS, rules: RULES, answers: { service_type: "custom_repipe" }, vertical: "plumbing",
    });
    expect(r).toEqual({ lowCents: 400000, highCents: 900000 });
    const call = vi.mocked(openai.chat.completions.create).mock.calls[0][0] as { messages: { content: string }[] };
    expect(call.messages[1].content).toContain("Whole-home repipe");
  });

  it("rejects an out-of-bounds answer instead of storing nonsense", async () => {
    mockModelAnswer(5, 10); // $5 — below the $50 sanity floor
    const r = await maybeEstimateUnlistedValue({
      questions: QUESTIONS, rules: RULES, answers: {}, serviceRequested: "repipe", vertical: "plumbing",
    });
    expect(r).toBeNull();
  });

  it("forces high ≥ low on an inverted answer", async () => {
    mockModelAnswer(8000, 2000);
    const r = await maybeEstimateUnlistedValue({
      questions: QUESTIONS, rules: RULES, answers: {}, serviceRequested: "repipe", vertical: "plumbing",
    });
    expect(r).toEqual({ lowCents: 800000, highCents: 800000 });
  });

  it("returns null when there are no anchors to judge against", async () => {
    const bareQuestions: VerticalQuestion[] = [
      { key: "service_type", label: "Service", type: "single_select", options: [{ value: "general", label: "General" }], required: true },
    ];
    const r = await maybeEstimateUnlistedValue({
      questions: bareQuestions, rules: [], answers: {}, serviceRequested: "something odd", vertical: "other",
    });
    expect(r).toBeNull();
    expect(openai.chat.completions.create).not.toHaveBeenCalled();
  });

  it("never throws on a model failure — falls back to null", async () => {
    vi.mocked(openai.chat.completions.create).mockRejectedValue(new Error("boom"));
    const r = await maybeEstimateUnlistedValue({
      questions: QUESTIONS, rules: RULES, answers: {}, serviceRequested: "repipe", vertical: "plumbing",
    });
    expect(r).toBeNull();
  });
});
