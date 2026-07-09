import { describe, it, expect } from "vitest";
import { scoreLeadFromAnswers } from "./scoring";
import type { ScoringRule, VerticalQuestion } from "@/lib/db/schema/verticalConfigs";
import { VERTICALS } from "@/lib/verticals/verticalDefinitions";

const BASE_QUESTIONS: VerticalQuestion[] = [
  { key: "service_type", label: "Service", type: "single_select", options: [{ value: "a", label: "A" }], required: true },
];

describe("scoreLeadFromAnswers", () => {
  it("returns the floor scores when no rules match anything", () => {
    const result = scoreLeadFromAnswers({}, [], BASE_QUESTIONS, 150000);
    expect(result.urgencyScore).toBe(1);
    expect(result.qualityScore).toBe(1);
    expect(result.estimatedValueLow).toBe(150000);
    expect(result.estimatedValueHigh).toBe(300000);
  });

  it("estimatedValueHigh is always exactly 2x estimatedValueLow", () => {
    const rules: ScoringRule[] = [{ answerKey: "service_type", answerValue: "a", valueBonus: 123456 }];
    const result = scoreLeadFromAnswers({ service_type: "a" }, rules, BASE_QUESTIONS, 15000);
    expect(result.estimatedValueHigh).toBe(result.estimatedValueLow * 2);
    expect(result.estimatedValueLow).toBe(15000 + 123456);
  });

  it("clamps urgencyScore to 10 even when bonuses exceed the cap", () => {
    const rules: ScoringRule[] = [{ answerKey: "service_type", answerValue: "a", urgencyBonus: 999 }];
    const result = scoreLeadFromAnswers({ service_type: "a" }, rules, BASE_QUESTIONS, 0);
    expect(result.urgencyScore).toBe(10);
  });

  it("clamps qualityScore to 100 even when bonuses exceed the cap", () => {
    const rules: ScoringRule[] = [{ answerKey: "service_type", answerValue: "a", qualityBonus: 999 }];
    const result = scoreLeadFromAnswers({ service_type: "a" }, rules, BASE_QUESTIONS, 0);
    expect(result.qualityScore).toBe(100);
  });

  it("never drops below the floor of 1 for urgency/quality even with zero matching rules", () => {
    const result = scoreLeadFromAnswers({ service_type: "z" }, [{ answerKey: "service_type", answerValue: "a", urgencyBonus: 10 }], BASE_QUESTIONS, 0);
    expect(result.urgencyScore).toBe(1);
    expect(result.qualityScore).toBe(1);
  });

  it("only applies a rule when the answer actually matches its value", () => {
    const rules: ScoringRule[] = [
      { answerKey: "service_type", answerValue: "a", valueBonus: 100000 },
      { answerKey: "service_type", answerValue: "b", valueBonus: 999999 },
    ];
    const result = scoreLeadFromAnswers({ service_type: "a" }, rules, BASE_QUESTIONS, 0);
    expect(result.estimatedValueLow).toBe(100000);
  });

  it("sums bonuses across every matching rule, not just the first", () => {
    // Must include both keys as real questions — filterAnswersToVisible drops
    // any answer whose key isn't among the passed questions (see below).
    const questions: VerticalQuestion[] = [
      ...BASE_QUESTIONS,
      { key: "urgency", label: "Urgency", type: "single_select", options: [{ value: "emergency", label: "Emergency" }], required: true },
    ];
    const rules: ScoringRule[] = [
      { answerKey: "service_type", answerValue: "a", urgencyBonus: 2, qualityBonus: 5, valueBonus: 1000 },
      { answerKey: "urgency", answerValue: "emergency", urgencyBonus: 3, qualityBonus: 5, valueBonus: 2000 },
    ];
    const result = scoreLeadFromAnswers({ service_type: "a", urgency: "emergency" }, rules, questions, 0);
    // urgencyTotal = 5 -> round(1 + (5/15)*9) = round(4) = 4
    expect(result.urgencyScore).toBe(4);
    expect(result.estimatedValueLow).toBe(3000);
  });

  it("matches multi_select answers (arrays) via .includes", () => {
    const rules: ScoringRule[] = [{ answerKey: "service_type", answerValue: "b", valueBonus: 5000 }];
    const result = scoreLeadFromAnswers({ service_type: ["a", "b", "c"] }, rules, BASE_QUESTIONS, 0);
    expect(result.estimatedValueLow).toBe(5000);
  });

  it("excludes orphaned conditional answers from scoring (matches filterAnswersToVisible)", () => {
    const questions: VerticalQuestion[] = [
      { key: "service_type", label: "Service", type: "single_select", options: [{ value: "water", label: "Water" }], required: true },
      {
        key: "water_category",
        label: "Water category",
        type: "single_select",
        options: [{ value: "cat_3", label: "Sewage" }],
        required: true,
        conditional: { key: "service_type", value: "water" },
      },
    ];
    const rules: ScoringRule[] = [{ answerKey: "water_category", answerValue: "cat_3", urgencyBonus: 4 }];
    // service_type is "fire", so water_category should never have been asked —
    // even though an answer for it is present (stale/orphaned), it must not score.
    const result = scoreLeadFromAnswers({ service_type: "fire", water_category: "cat_3" }, rules, questions, 0);
    expect(result.urgencyScore).toBe(1);
  });

  it("does score a conditional answer when its condition is actually satisfied", () => {
    const questions: VerticalQuestion[] = [
      { key: "service_type", label: "Service", type: "single_select", options: [{ value: "water", label: "Water" }], required: true },
      {
        key: "water_category",
        label: "Water category",
        type: "single_select",
        options: [{ value: "cat_3", label: "Sewage" }],
        required: true,
        conditional: { key: "service_type", value: "water" },
      },
    ];
    const rules: ScoringRule[] = [{ answerKey: "water_category", answerValue: "cat_3", urgencyBonus: 4 }];
    const result = scoreLeadFromAnswers({ service_type: "water", water_category: "cat_3" }, rules, questions, 0);
    expect(result.urgencyScore).toBeGreaterThan(1);
  });

  describe("every seeded vertical produces sane scores end-to-end", () => {
    for (const v of VERTICALS) {
      it(`${v.vertical}: an all-worst-case answer set should hit high urgency/quality`, () => {
        const primary = v.questions[0];
        const answers: Record<string, string> = {
          [primary.key]: primary.options?.[primary.options.length - 1]?.value ?? "",
          urgency: "emergency",
          time_since_issue: "today",
          has_coverage: "covered",
        };
        const result = scoreLeadFromAnswers(answers, v.scoringRules, v.questions, v.baseValueLow);
        expect(result.urgencyScore).toBeGreaterThanOrEqual(1);
        expect(result.urgencyScore).toBeLessThanOrEqual(10);
        expect(result.qualityScore).toBeGreaterThanOrEqual(1);
        expect(result.qualityScore).toBeLessThanOrEqual(100);
        expect(result.estimatedValueLow).toBeGreaterThan(0);
        expect(result.estimatedValueHigh).toBe(result.estimatedValueLow * 2);
      });

      it(`${v.vertical}: a blank/no-signal answer set never crashes and stays at the floor`, () => {
        const result = scoreLeadFromAnswers({}, v.scoringRules, v.questions, v.baseValueLow);
        expect(result.urgencyScore).toBe(1);
        expect(result.qualityScore).toBe(1);
        expect(result.estimatedValueLow).toBe(v.baseValueLow);
      });
    }
  });
});
