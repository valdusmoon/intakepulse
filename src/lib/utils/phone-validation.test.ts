import { describe, it, expect } from "vitest";
import { validateAndNormalizePhone, normalizePhone, isPhoneValid } from "./phone-validation";

describe("validateAndNormalizePhone", () => {
  it("rejects null/undefined/empty input", () => {
    expect(validateAndNormalizePhone(null).isValid).toBe(false);
    expect(validateAndNormalizePhone(undefined).isValid).toBe(false);
    expect(validateAndNormalizePhone("").isValid).toBe(false);
    expect(validateAndNormalizePhone("   ").isValid).toBe(false);
  });

  it("accepts a valid US number in national format and normalizes to E.164", () => {
    const result = validateAndNormalizePhone("(415) 867-5309");
    expect(result.isValid).toBe(true);
    expect(result.normalized).toBe("+14158675309");
    expect(result.country).toBe("US");
  });

  it("accepts a valid US number already in E.164 format", () => {
    const result = validateAndNormalizePhone("+14158675309");
    expect(result.isValid).toBe(true);
    expect(result.normalized).toBe("+14158675309");
  });

  it("rejects an obviously too-short number", () => {
    expect(validateAndNormalizePhone("12345").isValid).toBe(false);
  });

  it("rejects non-numeric garbage without throwing", () => {
    expect(() => validateAndNormalizePhone("not a phone number")).not.toThrow();
    expect(validateAndNormalizePhone("not a phone number").isValid).toBe(false);
  });

  it("trims surrounding whitespace before validating", () => {
    const result = validateAndNormalizePhone("  (415) 867-5309  ");
    expect(result.isValid).toBe(true);
    expect(result.normalized).toBe("+14158675309");
  });
});

describe("normalizePhone", () => {
  it("returns the E.164 string for a valid number", () => {
    expect(normalizePhone("(415) 867-5309")).toBe("+14158675309");
  });

  it("returns null for an invalid number instead of throwing", () => {
    expect(normalizePhone("invalid")).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone(null)).toBeNull();
  });
});

describe("isPhoneValid", () => {
  it("is true for a valid number, false for garbage/empty", () => {
    expect(isPhoneValid("(415) 867-5309")).toBe(true);
    expect(isPhoneValid("garbage")).toBe(false);
    expect(isPhoneValid("")).toBe(false);
    expect(isPhoneValid(null)).toBe(false);
  });
});
