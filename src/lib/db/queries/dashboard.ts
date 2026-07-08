import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "../index";
import { leads } from "../schema/leads";
import { calls } from "../schema/calls";

export async function getHomeMetrics(businessId: string) {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [row] = await db
    .select({
      capturedValueThisMonth: sql<number>`coalesce(sum((${leads.estimatedValueLow} + ${leads.estimatedValueHigh}) / 2) filter (where ${leads.createdAt} >= ${startOfThisMonth.toISOString()} and ${leads.leadStatus} in ('qualified','contacted','booked','estimate_sent','converted')), 0)`,
      capturedCountThisMonth: sql<number>`count(*) filter (where ${leads.createdAt} >= ${startOfThisMonth.toISOString()} and ${leads.leadStatus} in ('qualified','contacted','booked','estimate_sent','converted'))`,

      wonRevenueThisMonth: sql<number>`coalesce(sum(coalesce(${leads.confirmedValue}, (${leads.estimatedValueLow} + ${leads.estimatedValueHigh}) / 2)) filter (where ${leads.leadStatus} = 'converted' and ${leads.convertedAt} >= ${startOfThisMonth.toISOString()}), 0)`,
      wonRevenueLastMonth: sql<number>`coalesce(sum(coalesce(${leads.confirmedValue}, (${leads.estimatedValueLow} + ${leads.estimatedValueHigh}) / 2)) filter (where ${leads.leadStatus} = 'converted' and ${leads.convertedAt} >= ${startOfLastMonth.toISOString()} and ${leads.convertedAt} < ${startOfThisMonth.toISOString()}), 0)`,

      urgentAwaitingCallback: sql<number>`count(*) filter (where ${leads.leadStatus} = 'new' and ${leads.urgencyScore} >= 7)`,
      oldestUrgentWaitSeconds: sql<number>`coalesce(extract(epoch from (now() - min(${leads.createdAt}) filter (where ${leads.leadStatus} = 'new' and ${leads.urgencyScore} >= 7))), 0)`,

      avgCallbackSecondsThisMonth: sql<number | null>`avg(extract(epoch from (${leads.contactedAt} - ${leads.createdAt}))) filter (where ${leads.contactedAt} is not null and ${leads.contactedAt} >= ${startOfThisMonth.toISOString()})`,
      avgCallbackSecondsLastMonth: sql<number | null>`avg(extract(epoch from (${leads.contactedAt} - ${leads.createdAt}))) filter (where ${leads.contactedAt} is not null and ${leads.contactedAt} >= ${startOfLastMonth.toISOString()} and ${leads.contactedAt} < ${startOfThisMonth.toISOString()})`,

      totalLeads: sql<number>`count(*)`,
      contactedOrBeyond: sql<number>`count(*) filter (where ${leads.leadStatus} in ('contacted','booked','estimate_sent','converted'))`,
      bookedOrBeyond: sql<number>`count(*) filter (where ${leads.leadStatus} in ('booked','estimate_sent','converted'))`,
      convertedCount: sql<number>`count(*) filter (where ${leads.leadStatus} = 'converted')`,
    })
    .from(leads)
    .where(and(eq(leads.businessId, businessId), isNull(leads.deletedAt)));

  const n = (v: unknown) => Number(v ?? 0);
  const wonThisMonth = n(row.wonRevenueThisMonth);
  const wonLastMonth = n(row.wonRevenueLastMonth);
  const avgCallbackThisMonth = row.avgCallbackSecondsThisMonth != null ? n(row.avgCallbackSecondsThisMonth) : null;
  const avgCallbackLastMonth = row.avgCallbackSecondsLastMonth != null ? n(row.avgCallbackSecondsLastMonth) : null;

  return {
    capturedValueThisMonth: n(row.capturedValueThisMonth),
    capturedCountThisMonth: n(row.capturedCountThisMonth),
    wonRevenueThisMonth: wonThisMonth,
    wonRevenueTrendPct: wonLastMonth > 0 ? Math.round(((wonThisMonth - wonLastMonth) / wonLastMonth) * 100) : null,
    urgentAwaitingCallback: n(row.urgentAwaitingCallback),
    oldestUrgentWaitSeconds: n(row.oldestUrgentWaitSeconds),
    avgCallbackSeconds: avgCallbackThisMonth,
    avgCallbackTrendSeconds:
      avgCallbackThisMonth != null && avgCallbackLastMonth != null ? avgCallbackThisMonth - avgCallbackLastMonth : null,
    totalLeads: n(row.totalLeads),
    contactedOrBeyond: n(row.contactedOrBeyond),
    bookedOrBeyond: n(row.bookedOrBeyond),
    convertedCount: n(row.convertedCount),
  };
}

export async function getSourceBreakdown(businessId: string) {
  const rows = await db
    .select({ source: leads.source, count: sql<number>`count(*)` })
    .from(leads)
    .where(and(eq(leads.businessId, businessId), isNull(leads.deletedAt)))
    .groupBy(leads.source)
    .orderBy(desc(sql`count(*)`));

  const total = rows.reduce((sum, r) => sum + Number(r.count), 0);
  return rows.map((r) => ({
    source: r.source,
    count: Number(r.count),
    pct: total > 0 ? Math.round((Number(r.count) / total) * 100) : 0,
  }));
}

export async function getPriorityQueue(businessId: string, limit = 4) {
  return db
    .select()
    .from(leads)
    .where(and(eq(leads.businessId, businessId), eq(leads.leadStatus, "new"), isNull(leads.deletedAt)))
    .orderBy(desc(sql`coalesce(${leads.urgencyScore}, -1)`), leads.createdAt)
    .limit(limit);
}

export async function getRecentLeadsForActivity(businessId: string, limit = 5) {
  return db
    .select()
    .from(leads)
    .where(and(eq(leads.businessId, businessId), isNull(leads.deletedAt)))
    .orderBy(desc(leads.updatedAt))
    .limit(limit);
}

export async function getRecentCallsForActivity(businessId: string, limit = 5) {
  return db.select().from(calls).where(eq(calls.businessId, businessId)).orderBy(desc(calls.createdAt)).limit(limit);
}

export async function getReportsFunnel(businessId: string) {
  const [row] = await db
    .select({
      captured: sql<number>`count(*)`,
      qualified: sql<number>`count(*) filter (where ${leads.leadStatus} in ('qualified','contacted','booked','estimate_sent','converted'))`,
      contacted: sql<number>`count(*) filter (where ${leads.leadStatus} in ('contacted','booked','estimate_sent','converted'))`,
      won: sql<number>`count(*) filter (where ${leads.leadStatus} = 'converted')`,
    })
    .from(leads)
    .where(and(eq(leads.businessId, businessId), isNull(leads.deletedAt)));

  const n = (v: unknown) => Number(v ?? 0);
  return { captured: n(row.captured), qualified: n(row.qualified), contacted: n(row.contacted), won: n(row.won) };
}

export async function getChannelPerformance(businessId: string) {
  const rows = await db
    .select({
      source: leads.source,
      leadCount: sql<number>`count(*)`,
      wonCount: sql<number>`count(*) filter (where ${leads.leadStatus} = 'converted')`,
      revenue: sql<number>`coalesce(sum(coalesce(${leads.confirmedValue}, (${leads.estimatedValueLow} + ${leads.estimatedValueHigh}) / 2)) filter (where ${leads.leadStatus} = 'converted'), 0)`,
    })
    .from(leads)
    .where(and(eq(leads.businessId, businessId), isNull(leads.deletedAt)))
    .groupBy(leads.source)
    .orderBy(desc(sql`count(*)`));

  return rows.map((r) => ({ source: r.source, leadCount: Number(r.leadCount), wonCount: Number(r.wonCount), revenue: Number(r.revenue) }));
}

export async function getDailyCapturedVsWon(businessId: string, days = 14) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      day: sql<string>`to_char(${leads.createdAt}, 'YYYY-MM-DD')`,
      captured: sql<number>`count(*)`,
      won: sql<number>`count(*) filter (where ${leads.leadStatus} = 'converted')`,
    })
    .from(leads)
    .where(and(eq(leads.businessId, businessId), isNull(leads.deletedAt), sql`${leads.createdAt} >= ${since.toISOString()}`))
    .groupBy(sql`to_char(${leads.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${leads.createdAt}, 'YYYY-MM-DD')`);

  const byDay = new Map(rows.map((r) => [r.day, { captured: Number(r.captured), won: Number(r.won) }]));
  const series: { day: string; captured: number; won: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    series.push({ day: key, ...(byDay.get(key) ?? { captured: 0, won: 0 }) });
  }
  return series;
}
