import { describe, it, expect } from "vitest";
import { humanizeKey, getAnswerOptionLabel, formatIntakeAnswers, deriveServiceLabel, deriveReasonLine } from "./labels";
import type { VerticalQuestion } from "@/lib/db/schema/verticalConfigs";

describe("humanizeKey", () => {
  it("replaces underscores with spaces and title-cases each word", () => {
    expect(humanizeKey("service_type")).toBe("Service Type");
    expect(humanizeKey("time_since_issue")).toBe("Time Since Issue");
  });

  it("leaves a single word capitalized", () => {
    expect(humanizeKey("urgency")).toBe("Urgency");
  });
});

const QUESTIONS: VerticalQuestion[] = [
  { key: "service_type", label: "What do you need help with?", type: "single_select", options: [{ value: "ac_repair", label: "AC repair" }], required: true },
  { key: "urgency", label: "How urgent is this?", type: "single_select", options: [{ value: "emergency", label: "Emergency" }], required: true },
];

describe("getAnswerOptionLabel", () => {
  it("returns the matching option's label", () => {
    expect(getAnswerOptionLabel(QUESTIONS[0], "ac_repair")).toBe("AC repair");
  });

  it("falls back to the raw value when no option matches", () => {
    expect(getAnswerOptionLabel(QUESTIONS[0], "something_else")).toBe("something_else");
  });

  it("falls back to the raw value when the question is undefined", () => {
    expect(getAnswerOptionLabel(undefined, "ac_repair")).toBe("ac_repair");
  });
});

describe("formatIntakeAnswers", () => {
  it("returns an empty array for null/undefined answers", () => {
    expect(formatIntakeAnswers(QUESTIONS, null)).toEqual([]);
    expect(formatIntakeAnswers(QUESTIONS, undefined)).toEqual([]);
  });

  it("orders answers by the vertical's question order, not object key order", () => {
    const answers = { urgency: "emergency", service_type: "ac_repair" };
    const formatted = formatIntakeAnswers(QUESTIONS, answers);
    expect(formatted.map((f) => f.key)).toEqual(["service_type", "urgency"]);
  });

  it("resolves each answer to its human label, not the raw value", () => {
    const formatted = formatIntakeAnswers(QUESTIONS, { service_type: "ac_repair" });
    expect(formatted[0]).toEqual({ key: "service_type", label: "What do you need help with?", value: "AC repair" });
  });

  it("joins a multi_select (array) answer's labels with a comma", () => {
    const multiQ: VerticalQuestion[] = [
      { key: "extras", label: "Extras", type: "multi_select", options: [{ value: "a", label: "Alpha" }, { value: "b", label: "Beta" }], required: false },
    ];
    const formatted = formatIntakeAnswers(multiQ, { extras: ["a", "b"] });
    expect(formatted[0].value).toBe("Alpha, Beta");
  });

  it("puts answers for unknown keys last and humanizes their label", () => {
    const answers = { unknown_field: "x", service_type: "ac_repair" };
    const formatted = formatIntakeAnswers(QUESTIONS, answers);
    expect(formatted[formatted.length - 1].key).toBe("unknown_field");
    expect(formatted[formatted.length - 1].label).toBe("Unknown Field");
  });
});

describe("deriveServiceLabel", () => {
  it("returns null when verticalConfig or answers is missing", () => {
    expect(deriveServiceLabel(null, { service_type: "ac_repair" })).toBeNull();
    expect(deriveServiceLabel({ questions: QUESTIONS }, null)).toBeNull();
  });

  it("returns null when the primary question was never answered", () => {
    expect(deriveServiceLabel({ questions: QUESTIONS }, { urgency: "emergency" })).toBeNull();
  });

  it("resolves the primary (first) question's answer to its label", () => {
    expect(deriveServiceLabel({ questions: QUESTIONS }, { service_type: "ac_repair" })).toBe("AC repair");
  });

  it("ignores non-primary questions even if answered", () => {
    expect(deriveServiceLabel({ questions: QUESTIONS }, { urgency: "emergency", service_type: "ac_repair" })).toBe("AC repair");
  });
});

describe("deriveReasonLine", () => {
  it("returns null when there's nothing beyond the primary answer", () => {
    expect(deriveReasonLine({ questions: QUESTIONS }, { service_type: "ac_repair" })).toBeNull();
  });

  it("joins the next 1-2 answers (skipping the primary) with a middle dot", () => {
    const threeQ: VerticalQuestion[] = [
      ...QUESTIONS,
      { key: "time_since_issue", label: "When?", type: "single_select", options: [{ value: "today", label: "Today" }], required: true },
    ];
    const answers = { service_type: "ac_repair", urgency: "emergency", time_since_issue: "today" };
    expect(deriveReasonLine({ questions: threeQ }, answers)).toBe("Emergency · Today");
  });
});
