import { and, asc, desc, eq, ilike, isNull, or, sql, SQL } from "drizzle-orm";
import { db } from "../index";
import { leads, type NewLead } from "../schema/leads";

export async function createLead(data: NewLead) {
  const result = await db.insert(leads).values(data).returning();
  return result[0];
}

export async function getLeadById(id: string) {
  const lead = await db.query.leads.findFirst({
    where: and(eq(leads.id, id), isNull(leads.deletedAt)),
  });
  return lead ?? null;
}

export async function getLeadByPhoneAndBusiness(callerPhone: string, businessId: string) {
  const lead = await db.query.leads.findFirst({
    where: and(
      eq(leads.callerPhone, callerPhone),
      eq(leads.businessId, businessId),
      isNull(leads.deletedAt),
    ),
    orderBy: asc(leads.createdAt),
  });
  return lead ?? null;
}

export async function getLeadsByBusiness(
  businessId: string,
  opts: {
    leadStatus?: string;
    source?: string;
    priority?: "urgent" | "call_today" | "routine";
    search?: string;
    limit?: number;
    offset?: number;
  } = {}
) {
  const { leadStatus, source, priority, search, limit = 25, offset = 0 } = opts;

  const filters: SQL[] = [eq(leads.businessId, businessId), isNull(leads.deletedAt)];
  if (leadStatus) filters.push(eq(leads.leadStatus, leadStatus));
  if (source) filters.push(eq(leads.source, source));
  if (priority === "urgent") filters.push(sql`${leads.urgencyScore} >= 7`);
  if (priority === "call_today") filters.push(sql`${leads.urgencyScore} >= 4 and ${leads.urgencyScore} < 7`);
  if (priority === "routine") filters.push(sql`(${leads.urgencyScore} < 4 or ${leads.urgencyScore} is null)`);
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

export async function getNewLeadsCount(businessId: string) {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(leads)
    .where(and(eq(leads.businessId, businessId), eq(leads.leadStatus, "new"), isNull(leads.deletedAt)));
  return Number(row.count);
}

export async function getLeadStatsForPeriod(businessId: string, since: Date) {
  const [row] = await db
    .select({
      total: sql<number>`count(*)`,
      missedCalls: sql<number>`count(*) filter (where ${leads.source} = 'voice_overflow')`,
      intakeCompleted: sql<number>`count(*) filter (where ${leads.intakeStatus} = 'completed')`,
      converted: sql<number>`count(*) filter (where ${leads.leadStatus} = 'converted')`,
      estimatedRevenue: sql<number>`coalesce(sum((${leads.estimatedValueLow} + ${leads.estimatedValueHigh}) / 2) filter (where ${leads.leadStatus} in ('qualified', 'converted')), 0)`,
    })
    .from(leads)
    .where(and(eq(leads.businessId, businessId), sql`${leads.createdAt} >= ${since.toISOString()}`, isNull(leads.deletedAt)));

  const total = Number(row.total);
  const intakeCompleted = Number(row.intakeCompleted);
  return {
    total,
    missedCalls: Number(row.missedCalls),
    converted: Number(row.converted),
    estimatedRevenue: Number(row.estimatedRevenue),
    intakeCompletionRate: total > 0 ? Math.round((intakeCompleted / total) * 100) : null,
  };
}

// Same shape as getLeadStatsForPeriod but bounded on both ends [since, until).
// Used by the monthly ROI recap to scope stats to a single calendar month.
export async function getLeadStatsBetween(businessId: string, since: Date, until: Date) {
  const [row] = await db
    .select({
      total: sql<number>`count(*)`,
      missedCalls: sql<number>`count(*) filter (where ${leads.source} = 'voice_overflow')`,
      intakeCompleted: sql<number>`count(*) filter (where ${leads.intakeStatus} = 'completed')`,
      converted: sql<number>`count(*) filter (where ${leads.leadStatus} = 'converted')`,
      estimatedRevenue: sql<number>`coalesce(sum((${leads.estimatedValueLow} + ${leads.estimatedValueHigh}) / 2) filter (where ${leads.leadStatus} in ('qualified', 'converted')), 0)`,
    })
    .from(leads)
    .where(
      and(
        eq(leads.businessId, businessId),
        sql`${leads.createdAt} >= ${since.toISOString()}`,
        sql`${leads.createdAt} < ${until.toISOString()}`,
        isNull(leads.deletedAt),
      )
    );

  const total = Number(row.total);
  const intakeCompleted = Number(row.intakeCompleted);
  return {
    total,
    missedCalls: Number(row.missedCalls),
    converted: Number(row.converted),
    estimatedRevenue: Number(row.estimatedRevenue),
    intakeCompletionRate: total > 0 ? Math.round((intakeCompleted / total) * 100) : null,
  };
}

export async function getLeadStats(businessId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [row] = await db
    .select({
      totalThisMonth: sql<number>`count(*) filter (where ${leads.createdAt} >= ${startOfMonth.toISOString()})`,
      missedCallsThisMonth: sql<number>`count(*) filter (where ${leads.createdAt} >= ${startOfMonth.toISOString()} and ${leads.source} = 'voice_overflow')`,
      intakeCompleted: sql<number>`count(*) filter (where ${leads.intakeStatus} = 'completed')`,
      converted: sql<number>`count(*) filter (where ${leads.leadStatus} = 'converted')`,
      // Use midpoint of low/high range for a conservative pipeline estimate
      estimatedRevenue: sql<number>`coalesce(sum((${leads.estimatedValueLow} + ${leads.estimatedValueHigh}) / 2) filter (where ${leads.leadStatus} in ('qualified', 'converted')), 0)`,
    })
    .from(leads)
    .where(eq(leads.businessId, businessId));

  const total = Number(row.totalThisMonth);
  const intakeCompleted = Number(row.intakeCompleted);
  const intakeCompletionRate = total > 0 ? Math.round((intakeCompleted / total) * 100) : null;

  return {
    totalThisMonth: total,
    missedCallsThisMonth: Number(row.missedCallsThisMonth),
    converted: Number(row.converted),
    estimatedRevenue: Number(row.estimatedRevenue),
    intakeCompletionRate,
  };
}
