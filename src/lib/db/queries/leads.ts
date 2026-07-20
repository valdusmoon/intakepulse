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
    // "job" | "message" — scope to a contact kind. Omit for the unified inbox.
    leadType?: string;
    priority?: "hot" | "warm" | "cool";
    search?: string;
    limit?: number;
    offset?: number;
  } = {}
) {
  const { leadStatus, source, leadType, priority, search, limit = 25, offset = 0 } = opts;

  const filters: SQL[] = [eq(leads.businessId, businessId), isNull(leads.deletedAt)];
  if (leadStatus) filters.push(eq(leads.leadStatus, leadStatus));
  if (source) filters.push(eq(leads.source, source));
  if (leadType) filters.push(eq(leads.leadType, leadType));
  // Tier thresholds mirror PRIORITY_TIERS in scoring.ts (Hot >= 65, Warm 40-64, Cool < 40).
  if (priority === "hot") filters.push(sql`${leads.priorityScore} >= 65`);
  if (priority === "warm") filters.push(sql`${leads.priorityScore} >= 40 and ${leads.priorityScore} < 65`);
  // Cool = genuinely scored-and-low. A null priorityScore is "Unscored" (a manual lead that
  // never ran assessment), a distinct state shown under "All", not folded into Cool — this
  // matches the tierMeta(null) -> "Unscored" badge so the filter and the badge agree.
  if (priority === "cool") filters.push(sql`${leads.priorityScore} < 40`);
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
  // Sidebar "new leads" badge = actionable scored jobs only. A non-job message is
  // leadStatus 'new' too, but it's not a lead to work, so it must not inflate this.
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(leads)
    .where(and(eq(leads.businessId, businessId), eq(leads.leadStatus, "new"), eq(leads.leadType, "job"), isNull(leads.deletedAt)));
  return Number(row.count);
}

export async function getNewMessagesCount(businessId: string) {
  // Unworked non-job messages (existing customer, billing, callback, questions) —
  // powers the dashboard "N new messages" indicator, kept separate from leads.
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(leads)
    .where(and(eq(leads.businessId, businessId), eq(leads.leadStatus, "new"), eq(leads.leadType, "message"), isNull(leads.deletedAt)));
  return Number(row.count);
}

export async function getLeadStatsForPeriod(businessId: string, since: Date) {
  const [row] = await db
    .select({
      total: sql<number>`count(*)`,
      // Job leads only — excludes non-job 'message' rows (existing customer,
      // billing, callback, questions). This is the count that should drive
      // "have they captured a real lead yet?" signals (e.g. activation).
      jobTotal: sql<number>`count(*) filter (where ${leads.leadType} = 'job')`,
      missedCalls: sql<number>`count(*) filter (where ${leads.source} = 'voice_overflow')`,
      intakeCompleted: sql<number>`count(*) filter (where ${leads.intakeStatus} = 'completed')`,
      // Denominator for the completion rate: only leads where intake actually ran. Manual,
      // email, and short-path voice-human leads legitimately stay 'not_started' and never
      // run Q&A, so counting them in the denominator understates the true completion rate.
      intakeEligible: sql<number>`count(*) filter (where ${leads.intakeStatus} <> 'not_started')`,
      converted: sql<number>`count(*) filter (where ${leads.leadStatus} = 'converted')`,
      estimatedRevenue: sql<number>`coalesce(sum((${leads.estimatedValueLow} + ${leads.estimatedValueHigh}) / 2) filter (where ${leads.leadStatus} in ('qualified', 'contacted', 'booked', 'estimate_sent', 'converted')), 0)`,
    })
    .from(leads)
    .where(and(eq(leads.businessId, businessId), sql`${leads.createdAt} >= ${since.toISOString()}`, isNull(leads.deletedAt)));

  const total = Number(row.total);
  const intakeCompleted = Number(row.intakeCompleted);
  const intakeEligible = Number(row.intakeEligible);
  return {
    total,
    jobTotal: Number(row.jobTotal),
    missedCalls: Number(row.missedCalls),
    converted: Number(row.converted),
    estimatedRevenue: Number(row.estimatedRevenue),
    intakeCompletionRate: intakeEligible > 0 ? Math.round((intakeCompleted / intakeEligible) * 100) : null,
  };
}

// Same shape as getLeadStatsForPeriod but bounded on both ends [since, until).
// Used by the monthly ROI recap to scope stats to a single calendar month.
export async function getLeadStatsBetween(businessId: string, since: Date, until: Date) {
  const [row] = await db
    .select({
      total: sql<number>`count(*)`,
      jobTotal: sql<number>`count(*) filter (where ${leads.leadType} = 'job')`,
      missedCalls: sql<number>`count(*) filter (where ${leads.source} = 'voice_overflow')`,
      intakeCompleted: sql<number>`count(*) filter (where ${leads.intakeStatus} = 'completed')`,
      // Denominator for the completion rate: only leads where intake actually ran. Manual,
      // email, and short-path voice-human leads legitimately stay 'not_started' and never
      // run Q&A, so counting them in the denominator understates the true completion rate.
      intakeEligible: sql<number>`count(*) filter (where ${leads.intakeStatus} <> 'not_started')`,
      converted: sql<number>`count(*) filter (where ${leads.leadStatus} = 'converted')`,
      estimatedRevenue: sql<number>`coalesce(sum((${leads.estimatedValueLow} + ${leads.estimatedValueHigh}) / 2) filter (where ${leads.leadStatus} in ('qualified', 'contacted', 'booked', 'estimate_sent', 'converted')), 0)`,
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
  const intakeEligible = Number(row.intakeEligible);
  return {
    total,
    jobTotal: Number(row.jobTotal),
    missedCalls: Number(row.missedCalls),
    converted: Number(row.converted),
    estimatedRevenue: Number(row.estimatedRevenue),
    intakeCompletionRate: intakeEligible > 0 ? Math.round((intakeCompleted / intakeEligible) * 100) : null,
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
      // Denominator for the completion rate: only leads where intake actually ran. Manual,
      // email, and short-path voice-human leads legitimately stay 'not_started' and never
      // run Q&A, so counting them in the denominator understates the true completion rate.
      intakeEligible: sql<number>`count(*) filter (where ${leads.intakeStatus} <> 'not_started')`,
      converted: sql<number>`count(*) filter (where ${leads.leadStatus} = 'converted')`,
      // Use midpoint of low/high range for a conservative pipeline estimate
      estimatedRevenue: sql<number>`coalesce(sum((${leads.estimatedValueLow} + ${leads.estimatedValueHigh}) / 2) filter (where ${leads.leadStatus} in ('qualified', 'contacted', 'booked', 'estimate_sent', 'converted')), 0)`,
    })
    .from(leads)
    .where(eq(leads.businessId, businessId));

  const total = Number(row.totalThisMonth);
  const intakeCompleted = Number(row.intakeCompleted);
  const intakeEligible = Number(row.intakeEligible);
  const intakeCompletionRate = intakeEligible > 0 ? Math.round((intakeCompleted / intakeEligible) * 100) : null;

  return {
    totalThisMonth: total,
    missedCallsThisMonth: Number(row.missedCallsThisMonth),
    converted: Number(row.converted),
    estimatedRevenue: Number(row.estimatedRevenue),
    intakeCompletionRate,
  };
}
