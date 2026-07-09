import { describe, it, expect } from "vitest";
import { validateAndNormalizeEmail, normalizeEmail, isEmailValid } from "./email-validation";

describe("validateAndNormalizeEmail", () => {
  it("rejects null/undefined/empty/blank input", () => {
    expect(validateAndNormalizeEmail(null).isValid).toBe(false);
    expect(validateAndNormalizeEmail(undefined).isValid).toBe(false);
    expect(validateAndNormalizeEmail("").isValid).toBe(false);
    expect(validateAndNormalizeEmail("   ").isValid).toBe(false);
  });

  it("accepts a well-formed email and normalizes it to lowercase, trimmed", () => {
    const result = validateAndNormalizeEmail("  Jordan.Blake@Example.COM  ");
    expect(result.isValid).toBe(true);
    expect(result.normalized).toBe("jordan.blake@example.com");
  });

  it("rejects malformed email addresses", () => {
    expect(validateAndNormalizeEmail("not-an-email").isValid).toBe(false);
    expect(validateAndNormalizeEmail("missing@domain").isValid).toBe(false);
    expect(validateAndNormalizeEmail("@nodomain.com").isValid).toBe(false);
    expect(validateAndNormalizeEmail("no-at-sign.com").isValid).toBe(false);
  });

  it("flags a common typo'd domain instead of silently accepting it", () => {
    const result = validateAndNormalizeEmail("jordan@gmial.com");
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("gmail.com");
  });

  it("suggests the correct local part alongside the corrected domain", () => {
    const result = validateAndNormalizeEmail("jordan.blake@gmail.con");
    expect(result.error).toBe("Did you mean jordan.blake@gmail.com?");
  });
});

describe("normalizeEmail", () => {
  it("returns the normalized address for valid input", () => {
    expect(normalizeEmail("Jordan@Example.com")).toBe("jordan@example.com");
  });

  it("returns null for invalid input instead of throwing", () => {
    expect(normalizeEmail("not-an-email")).toBeNull();
    expect(normalizeEmail(null)).toBeNull();
  });
});

describe("isEmailValid", () => {
  it("is true for a valid address, false for invalid/empty", () => {
    expect(isEmailValid("jordan@example.com")).toBe(true);
    expect(isEmailValid("not-an-email")).toBe(false);
    expect(isEmailValid("")).toBe(false);
    expect(isEmailValid(null)).toBe(false);
  });
});
