import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { businesses } from "@/lib/db/schema/businesses";

export async function hasActiveSubscription(
  clerkUserId: string
): Promise<{ hasAccess: boolean; reason?: string; status?: string }> {
  const business = await db.query.businesses.findFirst({
    where: eq(businesses.clerkUserId, clerkUserId),
    columns: { subscriptionStatus: true, trialEndsAt: true, canceledAt: true },
  });

  if (!business) return { hasAccess: false, reason: "Business not found" };

  const { subscriptionStatus, trialEndsAt, canceledAt } = business;
  const now = new Date();

  if (!subscriptionStatus) {
    return { hasAccess: false, reason: "No subscription found. Start your 14-day free trial!", status: "none" };
  }

  if (subscriptionStatus === "active") {
    if (canceledAt && canceledAt < now) {
      return { hasAccess: false, reason: "Your subscription has ended. Please reactivate to continue.", status: "active_expired" };
    }
    return { hasAccess: true, status: "active" };
  }

  if (subscriptionStatus === "trialing") {
    if (!trialEndsAt) {
      return { hasAccess: false, reason: "Trial end date not set. Please contact support.", status: "trialing_invalid" };
    }
    const gracePeriod = 60 * 1000;
    if (trialEndsAt.getTime() + gracePeriod > now.getTime()) {
      return { hasAccess: true, status: "trialing" };
    }
    return { hasAccess: false, reason: "Your trial has ended. Please subscribe to continue.", status: "trialing_expired" };
  }

  if (subscriptionStatus === "canceled") {
    if (canceledAt && canceledAt > now) {
      return { hasAccess: true, status: "canceled_with_access" };
    }
    return { hasAccess: false, reason: "Your subscription has ended. Please reactivate to continue.", status: "canceled" };
  }

  if (subscriptionStatus === "past_due") {
    return { hasAccess: false, reason: "Your payment failed. Please update your payment method.", status: "past_due" };
  }

  if (subscriptionStatus === "unpaid") {
    return { hasAccess: false, reason: "Your subscription is unpaid. Please update your payment method.", status: "unpaid" };
  }

  if (subscriptionStatus === "incomplete" || subscriptionStatus === "incomplete_expired") {
    return { hasAccess: false, reason: "Please complete your subscription setup.", status: subscriptionStatus };
  }

  return { hasAccess: false, reason: "Invalid subscription status. Please contact support.", status: subscriptionStatus };
}

/**
 * The single gate for activating anything that costs money / represents real
 * usage — above all, the live inbound phone line. "Payment on file" is the
 * product's core commitment moment (see docs/monetization-and-conversion.md).
 *
 * Today (payment mocked) an active or in-trial subscription IS our proxy for a
 * card on file, so this delegates to isBusinessSubscriptionActive. When real
 * Stripe is wired, tighten this to ALSO require a real stripeSubscriptionId —
 * that one change flips the whole app from mock to real without touching call
 * sites. This is the seam.
 */
export function hasPaymentOnFile(business: {
  subscriptionStatus: string | null;
  trialEndsAt: Date | null;
  canceledAt: Date | null;
  // stripeSubscriptionId?: string | null; // <- require this once Stripe is live
}): boolean {
  return isBusinessSubscriptionActive(business);
}

export type SetupStage = "needs_payment" | "provisioning" | "needs_publish" | "live";

/**
 * Model B setup stage, derived entirely from columns we already have (no
 * dedicated activationStatus enum). Drives whether the dashboard shows "Setup
 * mode" (card not yet on file — the business exists and is configured, but the
 * live line is off) vs the live activation checklist.
 *
 *   needs_payment — no card on file. Explore/test only; primary CTA is "Add
 *                   payment & go live". Everything before the card is free.
 *   provisioning  — card on file but the real Twilio number isn't attached yet
 *                   (the Phase 3 provisioning job hasn't landed). Transient.
 *   needs_publish — number attached, owner hasn't yet published it as their
 *                   public business line (numberPublished still false).
 *   live          — published, payment on file, not paused.
 *
 * Note: a paused-but-otherwise-live business still reports "live" here (pausing
 * is a separate, reversible kill switch surfaced elsewhere), so this stays a
 * pure setup-progression signal.
 */
export function getSetupStage(business: {
  subscriptionStatus: string | null;
  trialEndsAt: Date | null;
  canceledAt: Date | null;
  twilioPhoneNumber: string | null;
  numberPublished: boolean;
}): SetupStage {
  if (!hasPaymentOnFile(business)) return "needs_payment";
  if (!business.twilioPhoneNumber) return "provisioning";
  if (!business.numberPublished) return "needs_publish";
  return "live";
}

export function isBusinessSubscriptionActive(business: {
  subscriptionStatus: string | null;
  trialEndsAt: Date | null;
  canceledAt: Date | null;
}): boolean {
  const { subscriptionStatus, trialEndsAt, canceledAt } = business;
  const now = new Date();
  const GRACE_MS = 60 * 1000;

  if (!subscriptionStatus) return false;

  if (subscriptionStatus === "active") {
    if (canceledAt && canceledAt < now) return false;
    return true;
  }

  if (subscriptionStatus === "trialing") {
    if (!trialEndsAt) return false;
    return trialEndsAt.getTime() + GRACE_MS > now.getTime();
  }

  if (subscriptionStatus === "canceled") {
    return !!(canceledAt && canceledAt > now);
  }

  return false;
}
