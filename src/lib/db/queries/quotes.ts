import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "../index";
import { quotes, type NewQuote } from "../schema/quotes";

// Generate next quote number for a company: CC-0001, CC-0002, ...
export async function getNextQuoteNumber(companyId: string): Promise<string> {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(quotes)
    .where(eq(quotes.companyId, companyId));
  const next = (result[0]?.count ?? 0) + 1;
  return `CC-${String(next).padStart(4, "0")}`;
}

export async function createQuote(data: NewQuote) {
  const result = await db.insert(quotes).values(data).returning();
  return result[0];
}

export async function getQuoteById(id: string) {
  const result = await db.select().from(quotes).where(and(eq(quotes.id, id), isNull(quotes.deletedAt)));
  return result[0] ?? null;
}

export async function getQuoteByToken(token: string) {
  const result = await db.select().from(quotes).where(and(eq(quotes.publicToken, token), isNull(quotes.deletedAt)));
  return result[0] ?? null;
}

export async function getQuotesByLead(leadId: string) {
  return db
    .select()
    .from(quotes)
    .where(and(eq(quotes.leadId, leadId), isNull(quotes.deletedAt)))
    .orderBy(desc(quotes.createdAt));
}

export async function getQuotesByCompany(companyId: string) {
  return db
    .select()
    .from(quotes)
    .where(and(eq(quotes.companyId, companyId), isNull(quotes.deletedAt)))
    .orderBy(desc(quotes.createdAt));
}

export async function updateQuote(
  id: string,
  data: Partial<Omit<NewQuote, "id" | "companyId" | "createdAt">>
) {
  const result = await db
    .update(quotes)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(quotes.id, id))
    .returning();
  return result[0] ?? null;
}

export async function deleteQuote(id: string) {
  await db.update(quotes).set({ deletedAt: new Date() }).where(eq(quotes.id, id));
}
