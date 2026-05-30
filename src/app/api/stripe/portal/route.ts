import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { businesses } from "@/lib/db/schema/businesses";
import { createCustomerPortalSession } from "@/lib/stripe";

export async function POST(_req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [business] = await db.select().from(businesses).where(eq(businesses.clerkUserId, userId)).limit(1);
    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    if (!business.stripeCustomerId) {
      return NextResponse.json({ error: "No Stripe customer found" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const session = await createCustomerPortalSession({
      customerId: business.stripeCustomerId,
      returnUrl: `${appUrl}/dashboard/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe portal error:", error);
    return NextResponse.json({ error: "Failed to open billing portal" }, { status: 500 });
  }
}
