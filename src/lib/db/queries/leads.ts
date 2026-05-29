import { and, desc, eq, ilike, isNotNull, isNull, notExists, or, sql, SQL } from "drizzle-orm";
import { db } from "../index";
import { leads, type NewLead } from "../schema/leads";
import { leadPhotos } from "../schema/lead-photos";
import { quotes } from "../schema/quotes";
import { contracts } from "../schema/contracts";
import { staff } from "../schema/staff";

export async function createLead(data: NewLead) {
  const result = await db.insert(leads).values(data).returning();
  return result[0];
}

export async function getLeadById(id: string) {
  const result = await db.select().from(leads).where(and(eq(leads.id, id), isNull(leads.deletedAt)));
  return result[0] ?? null;
}

export async function getLeadWithPhotos(id: string) {
  const lead = await getLeadById(id);
  if (!lead) return null;
  const photos = await db.select().from(leadPhotos).where(eq(leadPhotos.leadId, id));
  return { ...lead, photos };
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

export async function getLeadStats(companyId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 6);

  const [row] = await db
    .select({
      thisMonth: sql<number>`count(*) filter (where ${leads.createdAt} >= ${startOfMonth.toISOString()})`,
      thisWeek: sql<number>`count(*) filter (where ${leads.createdAt} >= ${startOfWeek.toISOString()})`,
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
    thisWeek: Number(row.thisWeek),
    revenueWon: Number(row.revenueWon),
    conversionRate,
  };
}

export async function deleteLead(id: string) {
  await db.update(leads).set({ deletedAt: new Date() }).where(eq(leads.id, id));
}

export async function getLeadsForPipeline(companyId: string) {
  return db
    .select({
      id:            leads.id,
      homeownerName: leads.homeownerName,
      address:       leads.address,
      serviceType:   leads.serviceType,
      quotedAmount:  leads.quotedAmount,
      status:        leads.status,
      createdAt:     leads.createdAt,
      updatedAt:     leads.updatedAt,
    })
    .from(leads)
    .where(and(eq(leads.companyId, companyId), isNull(leads.deletedAt)))
    .orderBy(desc(leads.createdAt));
}

export async function getLeadPipelineCounts(companyId: string) {
  const [row] = await db
    .select({
      new:       sql<number>`count(*) filter (where ${leads.status} = 'new')`,
      contacted: sql<number>`count(*) filter (where ${leads.status} = 'contacted')`,
      quoted:    sql<number>`count(*) filter (where ${leads.status} = 'quoted')`,
      scheduled: sql<number>`count(*) filter (where ${leads.status} = 'scheduled')`,
      won:       sql<number>`count(*) filter (where ${leads.status} = 'won')`,
      completed: sql<number>`count(*) filter (where ${leads.status} = 'completed')`,
      lost:      sql<number>`count(*) filter (where ${leads.status} = 'lost')`,
    })
    .from(leads)
    .where(and(eq(leads.companyId, companyId), isNull(leads.deletedAt)));

  return {
    new:       Number(row.new),
    contacted: Number(row.contacted),
    quoted:    Number(row.quoted),
    scheduled: Number(row.scheduled),
    won:       Number(row.won),
    completed: Number(row.completed),
    lost:      Number(row.lost),
    total:     Number(row.new) + Number(row.contacted) + Number(row.quoted) + Number(row.scheduled) + Number(row.won) + Number(row.completed) + Number(row.lost),
  };
}

export async function getScheduledLeads(companyId: string) {
  return db
    .select({
      id:            leads.id,
      homeownerName: leads.homeownerName,
      homeownerPhone: leads.homeownerPhone,
      address:       leads.address,
      city:          leads.city,
      serviceType:   leads.serviceType,
      scheduledAt:   leads.scheduledAt,
      scheduledEndAt: leads.scheduledEndAt,
      status:        leads.status,
      staffName:     staff.name,
      staffId:       leads.staffId,
    })
    .from(leads)
    .leftJoin(staff, eq(leads.staffId, staff.id))
    .where(and(eq(leads.companyId, companyId), isNull(leads.deletedAt), isNotNull(leads.scheduledAt)))
    .orderBy(leads.scheduledAt);
}

// Returns leads that are stale — joins quotes/contracts for accuracy
export async function getLeadsNeedingAttention(companyId: string) {
  const DAY = 24 * 60 * 60 * 1000;
  const cutoffNew      = new Date(Date.now() - 2 * DAY).toISOString();
  const cutoffQuoted   = new Date(Date.now() - 5 * DAY).toISOString();

  return db
    .select({
      id:            leads.id,
      homeownerName: leads.homeownerName,
      status:        leads.status,
      updatedAt:     leads.updatedAt,
      createdAt:     leads.createdAt,
    })
    .from(leads)
    .where(
      and(
        eq(leads.companyId, companyId),
        isNull(leads.deletedAt),
        or(
          // New: no contact attempt in 2+ days
          and(eq(leads.status, "new"), sql`${leads.createdAt} < ${cutoffNew}`),

          // Contacted: no quote created yet after 5+ days
          and(
            eq(leads.status, "contacted"),
            sql`${leads.createdAt} < ${cutoffNew}`,
            notExists(
              db.select({ _: sql`1` }).from(quotes)
                .where(and(eq(quotes.leadId, leads.id), isNull(quotes.deletedAt)))
            )
          ),

          // Quoted: quote sent but no response in 5+ days
          and(eq(leads.status, "quoted"), sql`${leads.updatedAt} < ${cutoffQuoted}`),

          // Scheduled: no signed contract yet
          and(
            eq(leads.status, "scheduled"),
            notExists(
              db.select({ _: sql`1` }).from(contracts)
                .where(and(eq(contracts.leadId, leads.id), isNull(contracts.deletedAt), sql`${contracts.signedAt} IS NOT NULL`))
            )
          ),
        )
      )
    )
    .orderBy(leads.updatedAt)
    .limit(8);
}
