import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { db } from "../index";
import { calls, type NewCall } from "../schema/calls";
import { leads } from "../schema/leads";

export async function createCall(data: NewCall) {
  const result = await db.insert(calls).values(data).returning();
  return result[0];
}

export async function getCallByLeadId(leadId: string) {
  const call = await db.query.calls.findFirst({
    where: eq(calls.leadId, leadId),
  });
  return call ?? null;
}

export async function getCallById(id: string) {
  const call = await db.query.calls.findFirst({
    where: eq(calls.id, id),
  });
  return call ?? null;
}

export async function getCallByTwilioSid(twilioCallSid: string) {
  const call = await db.query.calls.findFirst({
    where: eq(calls.twilioCallSid, twilioCallSid),
  });
  return call ?? null;
}

export async function updateCall(
  id: string,
  data: Partial<Omit<NewCall, "id" | "createdAt">>
) {
  const result = await db
    .update(calls)
    .set(data)
    .where(eq(calls.id, id))
    .returning();
  return result[0];
}

export async function getCallsByBusiness(
  businessId: string,
  opts: { outcome?: string; search?: string; limit?: number; offset?: number } = {}
) {
  const { outcome, search, limit = 25, offset = 0 } = opts;
  const filters = [eq(calls.businessId, businessId)];
  if (outcome) filters.push(eq(calls.outcome, outcome));
  if (search) filters.push(ilike(calls.callerPhone, `%${search}%`));

  const rows = await db
    .select({
      call: calls,
      leadId: leads.id,
      leadUrgencyScore: leads.urgencyScore,
      leadIntakeAnswers: leads.intakeAnswers,
    })
    .from(calls)
    .leftJoin(leads, eq(calls.leadId, leads.id))
    .where(and(...filters))
    .orderBy(desc(calls.createdAt))
    .limit(limit)
    .offset(offset);

  return rows.map((r) => ({ ...r.call, leadId: r.leadId, leadUrgencyScore: r.leadUrgencyScore, leadIntakeAnswers: r.leadIntakeAnswers }));
}

export async function getCallMetrics(businessId: string) {
  const [row] = await db
    .select({
      inboundTotal: sql<number>`count(*)`,
      answeredByTeam: sql<number>`count(*) filter (where ${calls.outcome} = 'business_answered')`,
      overflowCaptured: sql<number>`count(*) filter (where ${calls.outcome} = 'ai_captured')`,
      overflowStarted: sql<number>`count(*) filter (where ${calls.overflowStartedAt} is not null)`,
      leadCreated: sql<number>`count(*) filter (where ${calls.leadId} is not null)`,
      transferred: sql<number>`count(*) filter (where ${calls.outcome} = 'transferred')`,
    })
    .from(calls)
    .where(eq(calls.businessId, businessId));

  const n = (v: unknown) => Number(v ?? 0);
  const overflowStarted = n(row.overflowStarted);
  // A successful warm transfer resolves the call just as well as a captured
  // lead — a human is already handling the caller live — so it counts toward
  // completion too, even though it never creates a lead row.
  const resolved = n(row.leadCreated) + n(row.transferred);

  return {
    inboundTotal: n(row.inboundTotal),
    answeredByTeam: n(row.answeredByTeam),
    overflowCaptured: n(row.overflowCaptured),
    callerCompletionRate: overflowStarted > 0 ? Math.round((resolved / overflowStarted) * 100) : null,
  };
}
