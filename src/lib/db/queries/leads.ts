import { and, desc, eq, ilike, isNull, or, sql, SQL } from "drizzle-orm";
import { db } from "../index";
import { leads, type NewLead } from "../schema/leads";

// Queries will be fully replaced in Session 1 with IntakePulse-specific logic.
// Stripped to remove references to deleted tables (lead-photos, quotes, contracts, staff).

export async function createLead(data: NewLead) {
  const result = await db.insert(leads).values(data).returning();
  return result[0];
}

export async function getLeadById(id: string) {
  const result = await db.select().from(leads).where(and(eq(leads.id, id), isNull(leads.deletedAt)));
  return result[0] ?? null;
}

export async function getLeadsByCompany(
  companyId: string,
  opts: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}
) {
  const { status, search, limit = 25, offset = 0 } = opts;

  const filters: SQL[] = [eq(leads.companyId, companyId), isNull(leads.deletedAt)];
  if (status) filters.push(eq(leads.status, status));
  if (search) {
    filters.push(
      or(
        ilike(leads.homeownerName, `%${search}%`),
        ilike(leads.homeownerEmail, `%${search}%`),
        ilike(leads.homeownerPhone, `%${search}%`)
      )!
    );
  }

  return db
    .select()
    .from(leads)
    .where(and(...filters))
    .orderBy(desc(leads.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function updateLead(
  id: string,
  data: Partial<Omit<NewLead, "id" | "companyId" | "createdAt">>
) {
  const result = await db
    .update(leads)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(leads.id, id))
    .returning();
  return result[0];
}

export async function deleteLead(id: string) {
  await db.update(leads).set({ deletedAt: new Date() }).where(eq(leads.id, id));
}

export async function getLeadStats(companyId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [row] = await db
    .select({
      thisMonth: sql<number>`count(*) filter (where ${leads.createdAt} >= ${startOfMonth.toISOString()})`,
      won: sql<number>`count(*) filter (where ${leads.status} in ('won', 'completed'))`,
      quotedOrWon: sql<number>`count(*) filter (where ${leads.status} in ('quoted', 'won', 'completed'))`,
      revenueWon: sql<number>`coalesce(sum(${leads.quotedAmount}) filter (where ${leads.status} in ('won', 'completed')), 0)`,
    })
    .from(leads)
    .where(eq(leads.companyId, companyId));

  const conversionRate =
    row.quotedOrWon > 0 ? Math.round((row.won / row.quotedOrWon) * 100) : null;

  return {
    thisMonth: Number(row.thisMonth),
    revenueWon: Number(row.revenueWon),
    conversionRate,
  };
}
