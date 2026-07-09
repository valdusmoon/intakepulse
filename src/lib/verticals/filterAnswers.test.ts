import { describe, it, expect } from "vitest";
import { getVisibleQuestions, filterAnswersToVisible } from "./filterAnswers";
import type { VerticalQuestion } from "@/lib/db/schema/verticalConfigs";

const QUESTIONS: VerticalQuestion[] = [
  { key: "service_type", label: "Service", type: "single_select", options: [{ value: "water", label: "Water" }, { value: "fire", label: "Fire" }], required: true },
  {
    key: "water_category",
    label: "Water category",
    type: "single_select",
    options: [{ value: "cat_1", label: "Clean" }],
    required: true,
    conditional: { key: "service_type", value: "water" },
  },
  { key: "urgency", label: "Urgency", type: "single_select", options: [], required: true },
];

describe("getVisibleQuestions", () => {
  it("includes every unconditional question regardless of answers", () => {
    const visible = getVisibleQuestions(QUESTIONS, {});
    expect(visible.map((q) => q.key)).toContain("service_type");
    expect(visible.map((q) => q.key)).toContain("urgency");
  });

  it("excludes a conditional question when its condition isn't met", () => {
    const visible = getVisibleQuestions(QUESTIONS, { service_type: "fire" });
    expect(visible.map((q) => q.key)).not.toContain("water_category");
  });

  it("includes a conditional question when its condition is met", () => {
    const visible = getVisibleQuestions(QUESTIONS, { service_type: "water" });
    expect(visible.map((q) => q.key)).toContain("water_category");
  });

  it("excludes a conditional question when the triggering answer is entirely absent", () => {
    const visible = getVisibleQuestions(QUESTIONS, {});
    expect(visible.map((q) => q.key)).not.toContain("water_category");
  });

  it("supports a multi_select (array) answer satisfying the condition", () => {
    const visible = getVisibleQuestions(QUESTIONS, { service_type: ["water", "fire"] });
    expect(visible.map((q) => q.key)).toContain("water_category");
  });
});

describe("filterAnswersToVisible", () => {
  it("strips an orphaned answer for a question that was never actually visible", () => {
    const answers = { service_type: "fire", water_category: "cat_1", urgency: "emergency" };
    const filtered = filterAnswersToVisible(QUESTIONS, answers);
    expect(filtered).not.toHaveProperty("water_category");
    expect(filtered.service_type).toBe("fire");
    expect(filtered.urgency).toBe("emergency");
  });

  it("keeps an answer for a conditional question that was actually shown", () => {
    const answers = { service_type: "water", water_category: "cat_1" };
    const filtered = filterAnswersToVisible(QUESTIONS, answers);
    expect(filtered.water_category).toBe("cat_1");
  });

  it("returns an empty object for empty input", () => {
    expect(filterAnswersToVisible(QUESTIONS, {})).toEqual({});
  });

  it("drops an answer entirely if its key doesn't match any question at all (not just conditional ones)", () => {
    // This is easy to trip over when writing scoring tests with a partial
    // question list — an answer for a key with no corresponding question is
    // silently excluded, same as an orphaned conditional answer would be.
    const answers = { service_type: "fire", totally_unknown_key: "x" };
    const filtered = filterAnswersToVisible(QUESTIONS, answers);
    expect(filtered).not.toHaveProperty("totally_unknown_key");
  });
});
