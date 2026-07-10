import { describe, it, expect } from "vitest";
import { validateExtraction } from "./extraction";
import type { VerticalQuestion } from "@/lib/db/schema/verticalConfigs";

const QUESTIONS: VerticalQuestion[] = [
  { key: "service_type", label: "What type of damage?", type: "single_select", options: [{ value: "water", label: "Water" }, { value: "fire", label: "Fire or Smoke" }, { value: "mold", label: "Mold" }], required: true },
  { key: "urgency", label: "How urgent?", type: "single_select", options: [{ value: "emergency", label: "Emergency" }, { value: "soon", label: "Soon" }, { value: "flexible", label: "Flexible" }], required: true },
  { key: "time_since_issue", label: "When did it start?", type: "text", options: [], required: false },
];

describe("validateExtraction", () => {
  it("merges valid customer_type, zip, and option answers from one pass", () => {
    const out = validateExtraction(QUESTIONS, {
      customer_type: "new",
      zip_code: "07030",
      service_type: "water",
      urgency: "emergency",
      time_since_issue: "this morning",
    });
    expect(out.isNewCustomer).toBe(true);
    expect(out.zipCode).toBe("07030");
    expect(out.answers).toEqual({ service_type: "water", urgency: "emergency", time_since_issue: "this morning" });
  });

  it("leaves isNewCustomer undefined when customer_type is unclear or absent", () => {
    expect(validateExtraction(QUESTIONS, { customer_type: "unclear" }).isNewCustomer).toBeUndefined();
    expect(validateExtraction(QUESTIONS, {}).isNewCustomer).toBeUndefined();
  });

  it("maps existing customer_type to isNewCustomer=false", () => {
    expect(validateExtraction(QUESTIONS, { customer_type: "existing" }).isNewCustomer).toBe(false);
  });

  it("drops an invalid enum value the model may have hallucinated", () => {
    const out = validateExtraction(QUESTIONS, { service_type: "earthquake" });
    expect(out.answers.service_type).toBeUndefined();
  });

  it("drops an 'unclear' or empty field value", () => {
    const out = validateExtraction(QUESTIONS, { service_type: "unclear", urgency: "" });
    expect(out.answers).toEqual({});
  });

  it("rejects a malformed ZIP but keeps everything else", () => {
    const out = validateExtraction(QUESTIONS, { zip_code: "123", service_type: "fire" });
    expect(out.zipCode).toBeUndefined();
    expect(out.answers.service_type).toBe("fire");
  });

  it("normalizes a ZIP with stray non-digits", () => {
    expect(validateExtraction(QUESTIONS, { zip_code: "0 7 0 3 0" }).zipCode).toBe("07030");
  });

  it("accepts a free-text answer for a question with no options", () => {
    expect(validateExtraction(QUESTIONS, { time_since_issue: "two days ago" }).answers.time_since_issue).toBe("two days ago");
  });

  it("ignores unknown keys not in the vertical config", () => {
    const out = validateExtraction(QUESTIONS, { rooms_affected: "3", cause: "dishwasher" });
    expect(out.answers).toEqual({});
  });
});
