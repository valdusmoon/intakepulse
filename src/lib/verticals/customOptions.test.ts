import { describe, it, expect } from "vitest";
import { slugifyServiceLabel, withCustomServiceOptions } from "./customOptions";
import type { VerticalQuestion } from "@/lib/db/schema/verticalConfigs";

describe("slugifyServiceLabel", () => {
  it("lowercases and joins words with underscores", () => {
    expect(slugifyServiceLabel("Duct Cleaning")).toBe("duct_cleaning");
  });

  it("strips punctuation and collapses repeated separators", () => {
    expect(slugifyServiceLabel("Duct Cleaning!!")).toBe("duct_cleaning");
    expect(slugifyServiceLabel("A/C   Repair")).toBe("a_c_repair");
  });

  it("trims leading/trailing separators", () => {
    expect(slugifyServiceLabel("  -Water Heater-  ")).toBe("water_heater");
  });

  it("caps length at 64 characters", () => {
    const long = "a".repeat(100);
    expect(slugifyServiceLabel(long).length).toBeLessThanOrEqual(64);
  });

  it("produces an empty string for input with no alphanumeric characters", () => {
    expect(slugifyServiceLabel("!!!")).toBe("");
  });
});

const QUESTIONS: VerticalQuestion[] = [
  {
    key: "service_type",
    label: "What do you need help with?",
    type: "single_select",
    options: [{ value: "ac_repair", label: "AC repair" }],
    required: true,
  },
  { key: "urgency", label: "Urgency", type: "single_select", options: [], required: true },
];

describe("withCustomServiceOptions", () => {
  it("returns the original questions unchanged when there are no custom options", () => {
    const result = withCustomServiceOptions(QUESTIONS, []);
    expect(result).toBe(QUESTIONS);
  });

  it("appends a new custom option to the primary (first) question only", () => {
    const result = withCustomServiceOptions(QUESTIONS, [{ value: "duct_cleaning", label: "Duct Cleaning" }]);
    expect(result[0].options).toEqual([
      { value: "ac_repair", label: "AC repair" },
      { value: "duct_cleaning", label: "Duct Cleaning" },
    ]);
    // Every other question must be untouched.
    expect(result[1]).toBe(QUESTIONS[1]);
  });

  it("does not duplicate a custom option whose value already exists on the primary question", () => {
    const result = withCustomServiceOptions(QUESTIONS, [{ value: "ac_repair", label: "AC repair (dup)" }]);
    expect(result[0].options).toHaveLength(1);
    expect(result[0].options?.[0]).toEqual({ value: "ac_repair", label: "AC repair" });
  });

  it("handles an empty questions array without throwing", () => {
    expect(withCustomServiceOptions([], [{ value: "x", label: "X" }])).toEqual([]);
  });

  it("does not mutate the original questions array", () => {
    const before = JSON.stringify(QUESTIONS);
    withCustomServiceOptions(QUESTIONS, [{ value: "new_thing", label: "New Thing" }]);
    expect(JSON.stringify(QUESTIONS)).toBe(before);
  });
});
