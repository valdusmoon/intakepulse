import { eq } from "drizzle-orm";
import { db } from "../index";
import { companies, type NewCompany } from "../schema/companies";

export async function getCompanyByClerkId(clerkUserId: string) {
  const result = await db.select().from(companies).where(eq(companies.clerkUserId, clerkUserId));
  return result[0] ?? null;
}

export async function getCompanyById(id: string) {
  const result = await db.select().from(companies).where(eq(companies.id, id));
  return result[0] ?? null;
}

export async function createCompany(data: NewCompany) {
  const result = await db.insert(companies).values(data).returning();
  return result[0];
}

export async function updateCompany(
  id: string,
  data: Partial<Omit<NewCompany, "id" | "clerkUserId" | "createdAt">>
) {
  const result = await db
    .update(companies)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(companies.id, id))
    .returning();
  return result[0];
}
