import { describe, it, expect } from "vitest";
import { shouldRunValve, shouldUpgradeToJob } from "./web-intake";

describe("shouldRunValve", () => {
  it("never runs on a structured-service submission (the normal path costs nothing)", () => {
    expect(
      shouldRunValve({ isNewLead: true, existingLeadType: null, hasStructuredPrimary: true, serviceRequested: "also typed text" })
    ).toBe(false);
  });

  it("never runs without free-text serviceRequested", () => {
    expect(shouldRunValve({ isNewLead: true, existingLeadType: null, hasStructuredPrimary: false, serviceRequested: null })).toBe(false);
  });

  it("runs for a new lead on the 'Something else' path", () => {
    expect(
      shouldRunValve({ isNewLead: true, existingLeadType: null, hasStructuredPrimary: false, serviceRequested: "billing question" })
    ).toBe(true);
  });

  it("runs for an existing MESSAGE lead resubmitting via the Other path", () => {
    expect(
      shouldRunValve({ isNewLead: false, existingLeadType: "message", hasStructuredPrimary: false, serviceRequested: "need sprinklers" })
    ).toBe(true);
  });

  it("never runs against an existing JOB lead — downgrade is forbidden", () => {
    expect(
      shouldRunValve({ isNewLead: false, existingLeadType: "job", hasStructuredPrimary: false, serviceRequested: "invoice question" })
    ).toBe(false);
  });
});

describe("shouldUpgradeToJob", () => {
  it("upgrades a message lead that resubmits with a real structured service answer", () => {
    expect(shouldUpgradeToJob("message", true)).toBe(true);
  });

  it("does not upgrade without a structured answer", () => {
    expect(shouldUpgradeToJob("message", false)).toBe(false);
  });

  it("never touches a job lead (no downgrade path exists)", () => {
    expect(shouldUpgradeToJob("job", true)).toBe(false);
    expect(shouldUpgradeToJob("job", false)).toBe(false);
  });
});
