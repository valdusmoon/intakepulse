import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { businesses } from "@/lib/db/schema/businesses";
import { createStripeCustomer, createSubscriptionCheckout } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const defaultPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;
    if (!defaultPriceId) {
      return NextResponse.json({ error: "NEXT_PUBLIC_STRIPE_PRICE_ID is not configured" }, { status: 500 });
    }

    // Accept optional priceId from body — must match the configured default (future: allow list)
    let requestedPriceId = defaultPriceId;
    try {
      const body = await req.json();
      if (body.priceId && body.priceId !== defaultPriceId) {
        return NextResponse.json({ error: "Invalid price" }, { status: 400 });
      }
      if (body.priceId) requestedPriceId = body.priceId;
    } catch {
      // No body or invalid JSON — use default price
    }

    const [business] = await db.select().from(businesses).where(eq(businesses.clerkUserId, userId)).limit(1);
    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    const activeStatuses = ["active", "trialing"];
    if (business.stripeSubscriptionId && activeStatuses.includes(business.subscriptionStatus ?? "")) {
      return NextResponse.json({ error: "You already have an active subscription" }, { status: 400 });
    }

    let stripeCustomerId = business.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await createStripeCustomer({
        businessId: business.id,
        name: business.businessName,
        email: business.ownerEmail,
      });
      stripeCustomerId = customer.id;
      // Save customer ID before creating the session to avoid orphan customers on partial failure
      await db.update(businesses).set({ stripeCustomerId }).where(eq(businesses.id, business.id));
    }

    // Only give trial if they've never had a subscription before
    const hadPreviousSubscription = !!business.stripeSubscriptionId || business.subscriptionStatus === "canceled";

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const session = await createSubscriptionCheckout({
      customerId: stripeCustomerId,
      priceId: requestedPriceId,
      businessId: business.id,
      trialPeriodDays: hadPreviousSubscription ? 0 : 14,
      successUrl: `${appUrl}/dashboard?checkout_success=true`,
      cancelUrl: `${appUrl}/dashboard/billing?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
