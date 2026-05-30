import { and, desc, eq, ilike, isNull, or, sql, SQL } from "drizzle-orm";
import { db } from "../index";
import { leads, type NewLead } from "../schema/leads";

export async function createLead(data: NewLead) {
  const result = await db.insert(leads).values(data).returning();
  return result[0];
}

export async function getLeadById(id: string) {
  return db.query.leads.findFirst({
    where: and(eq(leads.id, id), isNull(leads.deletedAt)),
  }) ?? null;
}

export async function getLeadByPhoneAndBusiness(callerPhone: string, businessId: string) {
  return db.query.leads.findFirst({
    where: and(
      eq(leads.callerPhone, callerPhone),
      eq(leads.businessId, businessId),
      isNull(leads.deletedAt),
    ),
  }) ?? null;
}

export async function getLeadsByBusiness(
  businessId: string,
  opts: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}
) {
  const { status, search, limit = 25, offset = 0 } = opts;

  const filters: SQL[] = [eq(leads.businessId, businessId), isNull(leads.deletedAt)];
  if (status) filters.push(eq(leads.status, status));
  if (search) {
    filters.push(
      or(
        ilike(leads.callerName, `%${search}%`),
        ilike(leads.callerPhone, `%${search}%`),
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
  data: Partial<Omit<NewLead, "id" | "businessId" | "createdAt">>
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

export async function getLeadStats(businessId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [row] = await db
    .select({
      recoveredThisMonth: sql<number>`count(*) filter (where ${leads.createdAt} >= ${startOfMonth.toISOString()} and ${leads.source} = 'missed_call')`,
      intakeCompleted: sql<number>`count(*) filter (where ${leads.status} in ('intake_completed', 'qualified', 'converted'))`,
      totalThisMonth: sql<number>`count(*) filter (where ${leads.createdAt} >= ${startOfMonth.toISOString()})`,
      converted: sql<number>`count(*) filter (where ${leads.status} = 'converted')`,
      estimatedRevenue: sql<number>`coalesce(sum(${leads.estimatedValueHigh}) filter (where ${leads.status} = 'qualified' or ${leads.status} = 'converted'), 0)`,
    })
    .from(leads)
    .where(eq(leads.businessId, businessId));

  const intakeCompletionRate =
    row.recoveredThisMonth > 0
      ? Math.round((Number(row.intakeCompleted) / Number(row.recoveredThisMonth)) * 100)
      : null;

  return {
    recoveredThisMonth: Number(row.recoveredThisMonth),
    totalThisMonth: Number(row.totalThisMonth),
    converted: Number(row.converted),
    estimatedRevenue: Number(row.estimatedRevenue),
    intakeCompletionRate,
  };
}
