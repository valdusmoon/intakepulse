import { describe, it, expect } from "vitest";
import { PRICING_TEMPLATES } from "./pricingTemplates";

describe("PRICING_TEMPLATES structural integrity", () => {
  for (const [vertical, rules] of Object.entries(PRICING_TEMPLATES)) {
    describe(vertical, () => {
      it("has at least one starter pricing rule", () => {
        expect(rules.length).toBeGreaterThan(0);
      });

      it("has no duplicate serviceCategory values", () => {
        const categories = rules.map((r) => r.serviceCategory);
        expect(new Set(categories).size).toBe(categories.length);
      });

      for (const rule of rules) {
        describe(`"${rule.serviceCategory}" (${rule.pricingType})`, () => {
          it("has a non-empty serviceCategory and approvedCustomerMessage", () => {
            expect(rule.serviceCategory.length).toBeGreaterThan(0);
            expect(rule.approvedCustomerMessage.length).toBeGreaterThan(0);
          });

          it("has the amount fields its pricingType requires, and none it doesn't", () => {
            switch (rule.pricingType) {
              case "preliminary_range":
                expect(rule.minimumAmount, "minimumAmount required for preliminary_range").not.toBeNull();
                expect(rule.maximumAmount, "maximumAmount required for preliminary_range").not.toBeNull();
                expect(rule.minimumAmount).not.toBeUndefined();
                expect(rule.maximumAmount).not.toBeUndefined();
                expect(rule.fixedAmount ?? null).toBeNull();
                expect(rule.startingAmount ?? null).toBeNull();
                break;
              case "fixed":
                expect(rule.fixedAmount, "fixedAmount required for fixed").not.toBeNull();
                expect(rule.fixedAmount).not.toBeUndefined();
                expect(rule.minimumAmount ?? null).toBeNull();
                expect(rule.maximumAmount ?? null).toBeNull();
                expect(rule.startingAmount ?? null).toBeNull();
                break;
              case "starting":
                expect(rule.startingAmount, "startingAmount required for starting").not.toBeNull();
                expect(rule.startingAmount).not.toBeUndefined();
                expect(rule.minimumAmount ?? null).toBeNull();
                expect(rule.maximumAmount ?? null).toBeNull();
                expect(rule.fixedAmount ?? null).toBeNull();
                break;
              case "inspection_required":
                expect(rule.minimumAmount ?? null).toBeNull();
                expect(rule.maximumAmount ?? null).toBeNull();
                expect(rule.fixedAmount ?? null).toBeNull();
                expect(rule.startingAmount ?? null).toBeNull();
                break;
            }
          });

          if (rule.pricingType === "preliminary_range") {
            it("has minimumAmount strictly less than maximumAmount", () => {
              expect(rule.minimumAmount!).toBeLessThan(rule.maximumAmount!);
            });
          }

          it("has every amount field as a positive integer number of cents (whole cents, no fractions)", () => {
            for (const amount of [rule.minimumAmount, rule.maximumAmount, rule.fixedAmount, rule.startingAmount]) {
              if (amount == null) continue;
              expect(amount).toBeGreaterThan(0);
              expect(Number.isInteger(amount)).toBe(true);
            }
          });

          it("mentions a dollar figure in the caller-facing message whenever it isn't inspection_required", () => {
            if (rule.pricingType === "inspection_required") return;
            expect(rule.approvedCustomerMessage).toMatch(/\$[\d,]+/);
          });
        });
      }
    });
  }
});
