import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getBusinessByClerkId, updateBusiness } from "@/lib/db/queries/businesses";

/**
 * MOCK go-live stub (Model B, Phase 1). Stands in for real Stripe Checkout at
 * the "Add payment & go live" moment on the dashboard. The business already
 * exists (created config-only during onboarding), so this flips it straight to
 * a 14-day trial instead of redirecting to Stripe — enough to exercise the
 * setup-mode → live transition (voice gating, activation checklist, banners)
 * before real card collection is wired up.
 *
 * PHASE 2 SWAP: replace the dashboard CTA's call to this route with
 * POST /api/stripe/checkout (already implemented) + redirect to the returned
 * Stripe URL; the webhook then sets subscriptionStatus authoritatively. Delete
 * this file at that point. It deliberately does NOT touch the real Stripe
 * checkout/portal/webhook handlers.
 */
const MOCK_TRIAL_DAYS = 14;

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await getBusinessByClerkId(userId);
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  // Idempotent: if they already have payment on file, don't reset the trial clock.
  if (business.subscriptionStatus) {
    return NextResponse.json({ trialEndsAt: business.trialEndsAt, mock: true, alreadyActive: true });
  }

  const trialEndsAt = new Date(Date.now() + MOCK_TRIAL_DAYS * 24 * 60 * 60 * 1000);
  const updated = await updateBusiness(business.id, {
    subscriptionStatus: "trialing",
    trialEndsAt,
  });
  return NextResponse.json({ trialEndsAt: updated.trialEndsAt, mock: true });
}
