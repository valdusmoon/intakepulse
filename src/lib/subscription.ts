import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { businesses } from "@/lib/db/schema/businesses";

export async function hasActiveSubscription(
  clerkUserId: string
): Promise<{ hasAccess: boolean; reason?: string; status?: string }> {
  const business = await db.query.businesses.findFirst({
    where: eq(businesses.clerkUserId, clerkUserId),
    columns: { subscriptionStatus: true, trialEndsAt: true, canceledAt: true, pastDueSince: true },
  });

  if (!business) return { hasAccess: false, reason: "Business not found" };

  const { subscriptionStatus, trialEndsAt, canceledAt, pastDueSince } = business;
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
    // Mirrors isBusinessSubscriptionActive: keep access through the retry window
    // so a failed card doesn't lock someone out of their own lead history.
    if (isBusinessSubscriptionActive({ subscriptionStatus, trialEndsAt, canceledAt, pastDueSince })) {
      return { hasAccess: true, status: "past_due_grace" };
    }
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
 * Real card on file = a real Stripe subscription (stripeSubscriptionId set by the
 * checkout webhook) that is currently active or in-trial. Requiring the id is the
 * seam that flips the whole app from mock to real: without it, the old mock path
 * (subscriptionStatus flipped to "trialing" with no Stripe record) no longer
 * counts as paid, so the live line only turns on for genuine checkouts.
 */
export function hasPaymentOnFile(business: {
  subscriptionStatus: string | null;
  trialEndsAt: Date | null;
  canceledAt: Date | null;
  stripeSubscriptionId: string | null;
  pastDueSince?: Date | null;
}): boolean {
  return !!business.stripeSubscriptionId && isBusinessSubscriptionActive(business);
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
  stripeSubscriptionId: string | null;
  twilioPhoneNumber: string | null;
  numberPublished: boolean;
}): SetupStage {
  if (!hasPaymentOnFile(business)) return "needs_payment";
  if (!business.twilioPhoneNumber) return "provisioning";
  if (!business.numberPublished) return "needs_publish";
  return "live";
}

/**
 * How long a business keeps answering calls after a payment fails.
 *
 * A failed invoice is usually an expired card or a bank's fraud hold, not a
 * customer who decided to leave, and Stripe keeps retrying for roughly two weeks
 * before giving up. Cutting service on the first failure would take a trades
 * business's published number off the air while the subscription is still
 * entirely recoverable, and their customers would hear a broken-sounding
 * "temporarily unavailable" message in the meantime. Seven days covers the usual
 * retry attempts and the dunning email, and caps the exposure at about a week of
 * service. Once Stripe exhausts retries it moves the subscription to 'unpaid',
 * which gets no grace at all.
 */
export const PAST_DUE_GRACE_DAYS = 7;
const PAST_DUE_GRACE_MS = PAST_DUE_GRACE_DAYS * 24 * 60 * 60 * 1000;

/**
 * The single rule for the grace clock, shared by every Stripe webhook branch that
 * writes a subscription status.
 *
 * Start it the first time we see past_due from ANY route, not just a failed
 * invoice: a dispute moves the subscription to past_due with no
 * invoice.payment_failed behind it, and Stripe is configured to leave a disputed
 * subscription past_due indefinitely. Without this the clock would stay null and
 * isBusinessSubscriptionActive's fail-open branch would serve that account free
 * forever. Never restamp a running clock, or Stripe's repeated retries would
 * extend the window every time. Any healthy status clears it.
 */
export function nextPastDueSince(
  status: string | null | undefined,
  current: Date | null | undefined,
  now: Date = new Date()
): Date | null {
  if (status !== "past_due") return null;
  return current ?? now;
}

export function isBusinessSubscriptionActive(business: {
  subscriptionStatus: string | null;
  trialEndsAt: Date | null;
  canceledAt: Date | null;
  pastDueSince?: Date | null;
}): boolean {
  const { subscriptionStatus, trialEndsAt, canceledAt, pastDueSince } = business;
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

  // Payment failed but Stripe is still retrying. Keep the line answering until
  // the grace window closes. A missing pastDueSince means the clock was never
  // started (a status written by some path other than the payment_failed hook),
  // so fail open rather than silently killing a paying customer's phone.
  if (subscriptionStatus === "past_due") {
    if (!pastDueSince) return true;
    return pastDueSince.getTime() + PAST_DUE_GRACE_MS > now.getTime();
  }

  return false;
}
