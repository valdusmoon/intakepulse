import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { getBusinessById, updateBusiness } from "@/lib/db/queries/businesses";

/**
 * POST /api/admin/businesses/:id/grant  (admin only)
 *
 * Sales-assist grants for warm leads closed by phone. Actions:
 *   { action: "extend_trial", days }  -> push trialEndsAt out, keep status trialing
 *   { action: "comp" }                -> mark the account active (free), clear cancel
 *   { action: "set_status", status, trialEndsAt? } -> explicit override
 *
 * Coupon/discount application is intentionally NOT here: coupons are a Stripe
 * concept and payment is currently mocked. Wire it once real Stripe is live
 * (Stripe subscription discount via the API). See docs/monetization-and-conversion.md.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const business = await getBusinessById(id);
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const action = body?.action as string | undefined;

  if (action === "extend_trial") {
    const days = Number(body?.days);
    if (!Number.isFinite(days) || days <= 0) {
      return NextResponse.json({ error: "days must be a positive number" }, { status: 422 });
    }
    // Extend from whichever is later: now, or the current trial end.
    const base = business.trialEndsAt && business.trialEndsAt > new Date() ? business.trialEndsAt : new Date();
    const trialEndsAt = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
    const updated = await updateBusiness(id, { subscriptionStatus: "trialing", trialEndsAt, canceledAt: null });
    return NextResponse.json(updated);
  }

  if (action === "comp") {
    const updated = await updateBusiness(id, { subscriptionStatus: "active", canceledAt: null });
    return NextResponse.json(updated);
  }

  if (action === "set_status") {
    const status = body?.status as string | undefined;
    if (!status) return NextResponse.json({ error: "status is required" }, { status: 422 });
    const trialEndsAt = body?.trialEndsAt ? new Date(body.trialEndsAt) : undefined;
    const updated = await updateBusiness(id, {
      subscriptionStatus: status,
      ...(trialEndsAt ? { trialEndsAt } : {}),
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
