import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getBusinessByClerkId } from "@/lib/db/queries/businesses";
import { getPricingRuleById, updatePricingRule, deletePricingRule } from "@/lib/db/queries/pricingRules";

async function getAuthorizedRule(userId: string, ruleId: string) {
  const [business, rule] = await Promise.all([getBusinessByClerkId(userId), getPricingRuleById(ruleId)]);
  if (!business) return { error: "Business not found", status: 404 } as const;
  if (!rule) return { error: "Pricing rule not found", status: 404 } as const;
  if (rule.businessId !== business.id) return { error: "Forbidden", status: 403 } as const;
  return { business, rule };
}

const ALLOWED = [
  "serviceCategory",
  "pricingType",
  "minimumAmount",
  "maximumAmount",
  "fixedAmount",
  "startingAmount",
  "approvedCustomerMessage",
  "disclaimer",
  "isActive",
] as const;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await getAuthorizedRule(userId, id);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  const body = await req.json();
  const safeBody = Object.fromEntries(ALLOWED.filter((k) => k in body).map((k) => [k, body[k]]));

  const updated = await updatePricingRule(id, safeBody);
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await getAuthorizedRule(userId, id);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  await deletePricingRule(id);
  return NextResponse.json({ success: true });
}
