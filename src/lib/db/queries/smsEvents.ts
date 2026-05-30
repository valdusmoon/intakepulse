import { and, desc, eq } from "drizzle-orm";
import { db } from "../index";
import { smsEvents, type NewSmsEvent } from "../schema/smsEvents";

export async function createSmsEvent(data: NewSmsEvent) {
  const result = await db.insert(smsEvents).values(data).returning();
  return result[0];
}

export async function getSmsEventsByLead(leadId: string) {
  return db
    .select()
    .from(smsEvents)
    .where(eq(smsEvents.leadId, leadId))
    .orderBy(desc(smsEvents.createdAt));
}

export async function updateSmsEventStatus(
  telnyxMessageId: string,
  status: string
) {
  await db
    .update(smsEvents)
    .set({ status })
    .where(eq(smsEvents.telnyxMessageId, telnyxMessageId));
}
