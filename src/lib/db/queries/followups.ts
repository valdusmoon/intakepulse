import { and, eq, isNull } from "drizzle-orm";
import { db } from "../index";
import { followups, type NewFollowup } from "../schema/followups";

export async function createFollowup(data: NewFollowup) {
  const result = await db.insert(followups).values(data).returning();
  return result[0];
}

export async function getPendingFollowup(leadId: string) {
  return db.query.followups.findFirst({
    where: and(
      eq(followups.leadId, leadId),
      isNull(followups.sentAt),
      isNull(followups.canceledAt),
    ),
  }) ?? null;
}

export async function getFollowupsByLead(leadId: string) {
  return db.select().from(followups).where(eq(followups.leadId, leadId));
}

export async function cancelFollowupsForLead(leadId: string, reason: string) {
  await db
    .update(followups)
    .set({ canceledAt: new Date(), cancelReason: reason })
    .where(and(eq(followups.leadId, leadId), isNull(followups.canceledAt)));
}

export async function markFollowupSent(id: string) {
  await db.update(followups).set({ sentAt: new Date() }).where(eq(followups.id, id));
}
