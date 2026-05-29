import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "../index";
import { contracts, type NewContract } from "../schema/contracts";

export async function createContract(data: NewContract) {
  const result = await db.insert(contracts).values(data).returning();
  return result[0];
}

export async function getContractById(id: string) {
  const result = await db.select().from(contracts).where(and(eq(contracts.id, id), isNull(contracts.deletedAt)));
  return result[0] ?? null;
}

export async function getContractByToken(token: string) {
  const result = await db.select().from(contracts).where(and(eq(contracts.publicToken, token), isNull(contracts.deletedAt)));
  return result[0] ?? null;
}

export async function getContractsByLead(leadId: string) {
  return db
    .select()
    .from(contracts)
    .where(and(eq(contracts.leadId, leadId), isNull(contracts.deletedAt)))
    .orderBy(desc(contracts.createdAt));
}

export async function getContractsByCompany(companyId: string) {
  return db
    .select()
    .from(contracts)
    .where(and(eq(contracts.companyId, companyId), isNull(contracts.deletedAt)))
    .orderBy(desc(contracts.createdAt));
}

export async function updateContract(
  id: string,
  data: Partial<Omit<NewContract, "id" | "companyId" | "createdAt">>
) {
  const result = await db
    .update(contracts)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(contracts.id, id))
    .returning();
  return result[0] ?? null;
}

export async function deleteContract(id: string) {
  await db.update(contracts).set({ deletedAt: new Date() }).where(eq(contracts.id, id));
}
