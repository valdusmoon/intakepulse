import { and, eq } from "drizzle-orm";
import { db } from "../index";
import { pricingRules, type NewPricingRule } from "../schema/pricingRules";

export async function getActivePricingRule(businessId: string, serviceCategory: string) {
  return (
    db.query.pricingRules.findFirst({
      where: and(
        eq(pricingRules.businessId, businessId),
        eq(pricingRules.serviceCategory, serviceCategory),
        eq(pricingRules.isActive, true)
      ),
    }) ?? null
  );
}

export async function getPricingRulesByBusiness(businessId: string) {
  return db.query.pricingRules.findMany({
    where: eq(pricingRules.businessId, businessId),
  });
}

export async function createPricingRule(data: NewPricingRule) {
  const result = await db.insert(pricingRules).values(data).returning();
  return result[0];
}

export async function updatePricingRule(
  id: string,
  data: Partial<Omit<NewPricingRule, "id" | "businessId" | "createdAt">>
) {
  const result = await db
    .update(pricingRules)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(pricingRules.id, id))
    .returning();
  return result[0];
}

export async function getPricingRuleById(id: string) {
  return db.query.pricingRules.findFirst({ where: eq(pricingRules.id, id) }) ?? null;
}

export async function deletePricingRule(id: string) {
  await db.delete(pricingRules).where(eq(pricingRules.id, id));
}
