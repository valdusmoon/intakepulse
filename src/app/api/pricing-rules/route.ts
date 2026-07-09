import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getBusinessByClerkId, updateBusiness } from "@/lib/db/queries/businesses";
import { getPricingRulesByBusiness, createPricingRule } from "@/lib/db/queries/pricingRules";
import { getVerticalConfig } from "@/lib/db/queries/verticalConfigs";
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
  const { serviceCategory, serviceLabel, pricingType, approvedCustomerMessage } = body;

  if (!serviceCategory || typeof serviceCategory !== "string") {
    return NextResponse.json({ error: "serviceCategory is required" }, { status: 400 });
  }
  if (!VALID_PRICING_TYPES.includes(pricingType)) {
    return NextResponse.json({ error: "Invalid pricingType" }, { status: 400 });
  }
  if (!approvedCustomerMessage || typeof approvedCustomerMessage !== "string") {
    return NextResponse.json({ error: "approvedCustomerMessage is required" }, { status: 400 });
  }

  // If this category isn't part of the vertical's preset menu or the
  // business's own custom list yet, register it now — otherwise the caller
  // could never actually be offered/classified into it on a real call.
  const verticalConfig = await getVerticalConfig(business.vertical);
  const knownValues = new Set([
    ...(verticalConfig?.questions[0]?.options ?? []).map((o) => o.value),
    ...business.customServiceOptions.map((o) => o.value),
  ]);
  if (!knownValues.has(serviceCategory)) {
    const label = typeof serviceLabel === "string" && serviceLabel.trim() ? serviceLabel.trim() : serviceCategory;
    await updateBusiness(business.id, {
      customServiceOptions: [...business.customServiceOptions, { value: serviceCategory, label }],
    });
  }

  // Two active rules for the same category would make getActivePricingRule's
  // choice between them arbitrary — the AI could quote different callers
  // different prices for the same service depending on query order.
  const isActive = body.isActive ?? true;
  if (isActive) {
    const existingRules = await getPricingRulesByBusiness(business.id);
    const duplicate = existingRules.find((r) => r.serviceCategory === serviceCategory && r.isActive);
    if (duplicate) {
      const label = typeof serviceLabel === "string" && serviceLabel.trim() ? serviceLabel.trim() : serviceCategory;
      return NextResponse.json(
        { error: `An active pricing rule for "${label}" already exists — edit that one instead of adding a new one.` },
        { status: 409 }
      );
    }
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
