import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getBusinessByClerkId, updateBusiness } from "@/lib/db/queries/businesses";
import { getPricingRuleById, getPricingRulesByBusiness, updatePricingRule, deletePricingRule } from "@/lib/db/queries/pricingRules";
import { getVerticalConfig } from "@/lib/db/queries/verticalConfigs";

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

  if (typeof safeBody.serviceCategory === "string") {
    const { business } = result;
    const verticalConfig = await getVerticalConfig(business.vertical);
    const knownValues = new Set([
      ...(verticalConfig?.questions[0]?.options ?? []).map((o) => o.value),
      ...business.customServiceOptions.map((o) => o.value),
    ]);
    if (!knownValues.has(safeBody.serviceCategory)) {
      const label = typeof body.serviceLabel === "string" && body.serviceLabel.trim() ? body.serviceLabel.trim() : safeBody.serviceCategory;
      await updateBusiness(business.id, {
        customServiceOptions: [...business.customServiceOptions, { value: safeBody.serviceCategory, label }],
      });
    }
  }

  // Only re-check when this edit could newly create a collision — changing
  // the category, or reactivating a rule, are the two ways that happens.
  if ("serviceCategory" in safeBody || "isActive" in safeBody) {
    const { rule } = result;
    const effectiveCategory = safeBody.serviceCategory ?? rule.serviceCategory;
    const effectiveActive = safeBody.isActive ?? rule.isActive;
    if (effectiveActive) {
      const existingRules = await getPricingRulesByBusiness(rule.businessId);
      const duplicate = existingRules.find((r) => r.id !== id && r.serviceCategory === effectiveCategory && r.isActive);
      if (duplicate) {
        const label = typeof body.serviceLabel === "string" && body.serviceLabel.trim() ? body.serviceLabel.trim() : effectiveCategory;
        return NextResponse.json(
          { error: `An active pricing rule for "${label}" already exists — edit that one instead.` },
          { status: 409 }
        );
      }
    }
  }

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
