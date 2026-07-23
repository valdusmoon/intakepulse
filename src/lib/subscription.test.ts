import { describe, it, expect, vi } from "vitest";

// subscription.ts imports the db client at module level for hasActiveSubscription;
// the pure predicates under test here never touch it.
vi.mock("@/lib/db", () => ({ db: {} }));

import {
  isBusinessSubscriptionActive,
  hasPaymentOnFile,
  PAST_DUE_GRACE_DAYS,
} from "./subscription";

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
const daysFromNow = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

const base = {
  subscriptionStatus: null as string | null,
  trialEndsAt: null as Date | null,
  canceledAt: null as Date | null,
  pastDueSince: null as Date | null,
};

describe("isBusinessSubscriptionActive", () => {
  it("is active for a healthy subscription", () => {
    expect(isBusinessSubscriptionActive({ ...base, subscriptionStatus: "active" })).toBe(true);
  });

  it("is inactive with no status at all", () => {
    expect(isBusinessSubscriptionActive(base)).toBe(false);
  });

  it("is active during a live trial and inactive once it expires", () => {
    expect(
      isBusinessSubscriptionActive({ ...base, subscriptionStatus: "trialing", trialEndsAt: daysFromNow(3) })
    ).toBe(true);
    expect(
      isBusinessSubscriptionActive({ ...base, subscriptionStatus: "trialing", trialEndsAt: daysAgo(1) })
    ).toBe(false);
  });

  it("keeps a canceled subscription alive until the period actually ends", () => {
    expect(
      isBusinessSubscriptionActive({ ...base, subscriptionStatus: "canceled", canceledAt: daysFromNow(5) })
    ).toBe(true);
    expect(
      isBusinessSubscriptionActive({ ...base, subscriptionStatus: "canceled", canceledAt: daysAgo(1) })
    ).toBe(false);
  });

  describe("past_due grace window", () => {
    it("keeps the line answering right after the first failed payment", () => {
      expect(
        isBusinessSubscriptionActive({
          ...base,
          subscriptionStatus: "past_due",
          pastDueSince: new Date(),
        })
      ).toBe(true);
    });

    it("still answers one day before the window closes", () => {
      expect(
        isBusinessSubscriptionActive({
          ...base,
          subscriptionStatus: "past_due",
          pastDueSince: daysAgo(PAST_DUE_GRACE_DAYS - 1),
        })
      ).toBe(true);
    });

    it("stops answering once the window has closed", () => {
      expect(
        isBusinessSubscriptionActive({
          ...base,
          subscriptionStatus: "past_due",
          pastDueSince: daysAgo(PAST_DUE_GRACE_DAYS + 1),
        })
      ).toBe(false);
    });

    it("fails open when the clock was never started", () => {
      // A past_due status written by some path other than the payment_failed
      // hook must not silently kill a paying customer's phone line.
      expect(
        isBusinessSubscriptionActive({ ...base, subscriptionStatus: "past_due", pastDueSince: null })
      ).toBe(true);
    });

    it("gives no grace to 'unpaid', which means Stripe exhausted its retries", () => {
      expect(
        isBusinessSubscriptionActive({
          ...base,
          subscriptionStatus: "unpaid",
          pastDueSince: new Date(),
        })
      ).toBe(false);
    });
  });
});

describe("hasPaymentOnFile", () => {
  it("requires a real Stripe subscription id, not just a status", () => {
    expect(
      hasPaymentOnFile({ ...base, subscriptionStatus: "active", stripeSubscriptionId: null })
    ).toBe(false);
    expect(
      hasPaymentOnFile({ ...base, subscriptionStatus: "active", stripeSubscriptionId: "sub_123" })
    ).toBe(true);
  });

  it("answers calls through the grace window and stops after it", () => {
    expect(
      hasPaymentOnFile({
        ...base,
        subscriptionStatus: "past_due",
        stripeSubscriptionId: "sub_123",
        pastDueSince: daysAgo(1),
      })
    ).toBe(true);
    expect(
      hasPaymentOnFile({
        ...base,
        subscriptionStatus: "past_due",
        stripeSubscriptionId: "sub_123",
        pastDueSince: daysAgo(PAST_DUE_GRACE_DAYS + 1),
      })
    ).toBe(false);
  });
});
