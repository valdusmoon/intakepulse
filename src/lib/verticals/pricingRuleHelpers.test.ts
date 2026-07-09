import { describe, it, expect } from "vitest";
import { labelForCategory, resolveServiceCategory, fmtDollars, buildApprovedMessage } from "./pricingRuleHelpers";

const SERVICE_OPTIONS = [
  { value: "water", label: "Water" },
  { value: "fire", label: "Fire or Smoke" },
];

describe("labelForCategory", () => {
  it("returns the matching option's label", () => {
    expect(labelForCategory(SERVICE_OPTIONS, "water")).toBe("Water");
  });

  it("falls back to the raw category when no option matches (e.g. an orphaned custom category)", () => {
    expect(labelForCategory(SERVICE_OPTIONS, "duct_cleaning")).toBe("duct_cleaning");
  });
});

describe("resolveServiceCategory", () => {
  it("matches an existing preset by label case-insensitively and returns its known value (not a re-slugified one)", () => {
    expect(resolveServiceCategory(SERVICE_OPTIONS, "water")).toBe("water");
    expect(resolveServiceCategory(SERVICE_OPTIONS, "WATER")).toBe("water");
    expect(resolveServiceCategory(SERVICE_OPTIONS, "  Water  ")).toBe("water");
  });

  it("mints a new slug for text that doesn't match any known option", () => {
    expect(resolveServiceCategory(SERVICE_OPTIONS, "Duct Cleaning")).toBe("duct_cleaning");
  });

  it("never accidentally slugifies down to an existing option's value for genuinely different text", () => {
    // "Fire Damage" is not the same as the preset "Fire or Smoke" — must not collide.
    expect(resolveServiceCategory(SERVICE_OPTIONS, "Fire Damage")).toBe("fire_damage");
  });
});

describe("fmtDollars", () => {
  it("formats cents as whole-dollar USD currency", () => {
    expect(fmtDollars(150000)).toBe("$1,500");
    expect(fmtDollars(500)).toBe("$5");
  });
});

describe("buildApprovedMessage", () => {
  it("preliminary_range: mentions both amounts when both are set", () => {
    const msg = buildApprovedMessage({ pricingType: "preliminary_range", minimumAmount: 15000, maximumAmount: 60000, fixedAmount: null, startingAmount: null });
    expect(msg).toContain("$150");
    expect(msg).toContain("$600");
  });

  it("preliminary_range: is empty until both amounts are set (never a half-formed sentence)", () => {
    expect(buildApprovedMessage({ pricingType: "preliminary_range", minimumAmount: 15000, maximumAmount: null, fixedAmount: null, startingAmount: null })).toBe("");
    expect(buildApprovedMessage({ pricingType: "preliminary_range", minimumAmount: null, maximumAmount: null, fixedAmount: null, startingAmount: null })).toBe("");
  });

  it("fixed: mentions the flat amount once set, empty otherwise", () => {
    expect(buildApprovedMessage({ pricingType: "fixed", minimumAmount: null, maximumAmount: null, fixedAmount: 25000, startingAmount: null })).toContain("$250");
    expect(buildApprovedMessage({ pricingType: "fixed", minimumAmount: null, maximumAmount: null, fixedAmount: null, startingAmount: null })).toBe("");
  });

  it("starting: mentions the starting amount once set, empty otherwise", () => {
    expect(buildApprovedMessage({ pricingType: "starting", minimumAmount: null, maximumAmount: null, fixedAmount: null, startingAmount: 500000 })).toContain("$5,000");
    expect(buildApprovedMessage({ pricingType: "starting", minimumAmount: null, maximumAmount: null, fixedAmount: null, startingAmount: null })).toBe("");
  });

  it("inspection_required: always returns a fixed message regardless of amount fields", () => {
    const msg = buildApprovedMessage({ pricingType: "inspection_required", minimumAmount: null, maximumAmount: null, fixedAmount: null, startingAmount: null });
    expect(msg.length).toBeGreaterThan(0);
    expect(msg).not.toMatch(/\$/); // no invented dollar figure for a category that's explicitly "we don't know"
  });
});
