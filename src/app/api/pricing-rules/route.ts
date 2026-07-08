import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getBusinessByClerkId } from "@/lib/db/queries/businesses";
import { getPricingRulesByBusiness, createPricingRule } from "@/lib/db/queries/pricingRules";
import type { PricingType } from "@/lib/db/schema/pricingRules";

const VALID_PRICING_TYPES: PricingType[] = ["fixed", "preliminary_range", "starting", "inspection_required"];

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await getBusinessByClerkId(userId);
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const rules = await getPricingRulesByBusiness(business.id);
  return NextResponse.json(rules);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await getBusinessByClerkId(userId);
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const body = await req.json();
  const { serviceCategory, pricingType, approvedCustomerMessage } = body;

  if (!serviceCategory || typeof serviceCategory !== "string") {
    return NextResponse.json({ error: "serviceCategory is required" }, { status: 400 });
  }
  if (!VALID_PRICING_TYPES.includes(pricingType)) {
    return NextResponse.json({ error: "Invalid pricingType" }, { status: 400 });
  }
  if (!approvedCustomerMessage || typeof approvedCustomerMessage !== "string") {
    return NextResponse.json({ error: "approvedCustomerMessage is required" }, { status: 400 });
  }

  const rule = await createPricingRule({
    businessId: business.id,
    vertical: business.vertical,
    serviceCategory,
    pricingType,
    minimumAmount: body.minimumAmount ?? null,
    maximumAmount: body.maximumAmount ?? null,
    fixedAmount: body.fixedAmount ?? null,
    startingAmount: body.startingAmount ?? null,
    approvedCustomerMessage,
    disclaimer: body.disclaimer ?? null,
    isActive: body.isActive ?? true,
  });

  return NextResponse.json(rule, { status: 201 });
}
