import { eq } from "drizzle-orm";
import { db } from "../index";
import { calls, type NewCall } from "../schema/calls";

export async function createCall(data: NewCall) {
  const result = await db.insert(calls).values(data).returning();
  return result[0];
}

export async function getCallByControlId(telnyxCallControlId: string) {
  return db.query.calls.findFirst({
    where: eq(calls.telnyxCallControlId, telnyxCallControlId),
  }) ?? null;
}

export async function getCallByLeadId(leadId: string) {
  return db.query.calls.findFirst({
    where: eq(calls.leadId, leadId),
  }) ?? null;
}

export async function getCallByLegId(telnyxCallLegId: string) {
  return db.query.calls.findFirst({
    where: eq(calls.telnyxCallLegId, telnyxCallLegId),
  }) ?? null;
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
