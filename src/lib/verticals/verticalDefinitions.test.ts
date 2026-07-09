import { describe, it, expect } from "vitest";
import { VERTICALS, UNIVERSAL_FOLLOWUP_QUESTIONS, buildAiPromptTemplate } from "./verticalDefinitions";
import { PRICING_TEMPLATES } from "./pricingTemplates";

describe("VERTICALS structural integrity", () => {
  it("has a unique, non-empty vertical key for every entry", () => {
    const keys = VERTICALS.map((v) => v.vertical);
    expect(new Set(keys).size).toBe(keys.length);
    for (const k of keys) expect(k.length).toBeGreaterThan(0);
  });

  for (const v of VERTICALS) {
    describe(v.vertical, () => {
      it("has exactly 4 questions (menu + 3 universal follow-ups)", () => {
        expect(v.questions).toHaveLength(4);
      });

      it("has the same 3 universal follow-up questions, in order, after the menu question", () => {
        expect(v.questions.slice(1)).toEqual(UNIVERSAL_FOLLOWUP_QUESTIONS);
      });

      it("has a menu (first) question with at least one option", () => {
        expect(v.questions[0].options?.length ?? 0).toBeGreaterThan(0);
      });

      it("has no duplicate option values on the menu question", () => {
        const values = v.questions[0].options?.map((o) => o.value) ?? [];
        expect(new Set(values).size).toBe(values.length);
      });

      it("has a positive baseValueLow", () => {
        expect(v.baseValueLow).toBeGreaterThan(0);
      });

      it("every scoringRule references a question key that actually exists", () => {
        const validKeys = new Set(v.questions.map((q) => q.key));
        for (const rule of v.scoringRules) {
          expect(validKeys.has(rule.answerKey), `scoringRule references unknown key "${rule.answerKey}"`).toBe(true);
        }
      });

      it("every scoringRule's answerValue is a real option for its question (when that question has options)", () => {
        const questionByKey = new Map(v.questions.map((q) => [q.key, q]));
        for (const rule of v.scoringRules) {
          const question = questionByKey.get(rule.answerKey);
          const validValues = question?.options?.map((o) => o.value) ?? [];
          if (validValues.length === 0) continue; // free-text questions have no closed option set
          expect(validValues.includes(rule.answerValue), `"${rule.answerKey}" has no option "${rule.answerValue}"`).toBe(true);
        }
      });

      it("has a non-empty industryLabel and produces a non-empty AI prompt template", () => {
        expect(v.industryLabel.length).toBeGreaterThan(0);
        expect(buildAiPromptTemplate(v.industryLabel).length).toBeGreaterThan(0);
      });

      it("every menu option has a matching starter pricing template entry, and vice versa", () => {
        const menuValues = new Set(v.questions[0].options?.map((o) => o.value) ?? []);
        const templateCategories = new Set((PRICING_TEMPLATES[v.vertical] ?? []).map((t) => t.serviceCategory));
        expect(templateCategories).toEqual(menuValues);
      });
    });
  }
});
