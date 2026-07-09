import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

/**
 * MOCK — temporary stand-in for real payment collection during onboarding.
 * Returns a trialEndsAt date instead of going through Stripe Checkout, so the
 * rest of the app (voice webhook gating, billing banner, dashboard access)
 * can be tested end-to-end before the real card-collection flow is wired up.
 *
 * Doesn't touch the businesses table — onboarding doesn't create a business
 * row until every step is submitted in one atomic call at the end, so there's
 * nothing to attach this to yet. The onboarding form holds this trialEndsAt
 * in state and includes it in that final submit instead.
 *
 * Deliberately does NOT touch /api/stripe/checkout, /api/stripe/portal, or the
 * webhook handler — those are the real flow and are left exactly as they are.
 * To go live: swap the onboarding "Payment" step's button handler to call
 * POST /api/stripe/checkout (already implemented) and redirect to the
 * returned Stripe URL instead of calling this route, then delete this file.
 */
const MOCK_TRIAL_DAYS = 14;

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const trialEndsAt = new Date(Date.now() + MOCK_TRIAL_DAYS * 24 * 60 * 60 * 1000);
  return NextResponse.json({ trialEndsAt, mock: true });
}
