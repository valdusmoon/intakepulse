import { describe, it, expect } from "vitest";
import { deriveIntakeStatusFromAnswers } from "./intake-status";
import type { VerticalQuestion } from "@/lib/db/schema/verticalConfigs";

const QUESTIONS: VerticalQuestion[] = [
  { key: "service_type", label: "Service", type: "single_select", options: [{ value: "water", label: "Water" }], required: true },
  { key: "urgency", label: "Urgency", type: "single_select", options: [{ value: "emergency", label: "Emergency" }], required: true },
  // Conditional: only visible for water jobs.
  { key: "water_category", label: "Category", type: "single_select", options: [{ value: "cat_2", label: "Gray" }], required: false, conditional: { key: "service_type", value: "water" } },
  // Enrichment-only: captured if volunteered, never asked — must not block 'completed'.
  { key: "cause", label: "Cause", type: "text", required: false, voiceExtractOnly: true },
];

describe("deriveIntakeStatusFromAnswers", () => {
  it("is 'not_started' with no answers and no serviceRequested", () => {
    expect(deriveIntakeStatusFromAnswers(QUESTIONS, {}, null)).toBe("not_started");
  });

  it("is 'started' with partial answers", () => {
    expect(deriveIntakeStatusFromAnswers(QUESTIONS, { service_type: "water" }, null)).toBe("started");
  });

  it("is 'completed' when every visible askable question is answered — voiceExtractOnly fields never block it", () => {
    const answers = { service_type: "water", urgency: "emergency", water_category: "cat_2" };
    expect(deriveIntakeStatusFromAnswers(QUESTIONS, answers, null)).toBe("completed");
  });

  it("hides unmet conditionals: a non-water job completes without water_category", () => {
    const questions: VerticalQuestion[] = [
      { key: "service_type", label: "Service", type: "single_select", options: [{ value: "fire", label: "Fire" }, { value: "water", label: "Water" }], required: true },
      { key: "water_category", label: "Category", type: "single_select", options: [{ value: "cat_2", label: "Gray" }], required: false, conditional: { key: "service_type", value: "water" } },
    ];
    expect(deriveIntakeStatusFromAnswers(questions, { service_type: "fire" }, null)).toBe("completed");
  });

  it("counts an off-list serviceRequested as answering the primary question", () => {
    const questions: VerticalQuestion[] = [
      { key: "service_type", label: "Service", type: "single_select", options: [{ value: "water", label: "Water" }], required: true },
    ];
    expect(deriveIntakeStatusFromAnswers(questions, {}, "sprinkler winterization")).toBe("completed");
  });

  it("serviceRequested alone is 'started' when other askable questions remain", () => {
    expect(deriveIntakeStatusFromAnswers(QUESTIONS, {}, "sprinkler winterization")).toBe("started");
  });
});
