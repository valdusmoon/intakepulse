import { db } from "../index";
import { emailCaptures, type NewEmailCapture } from "../schema/emailCaptures";

export async function createEmailCapture(data: NewEmailCapture) {
  const result = await db.insert(emailCaptures).values(data).returning();
  return result[0];
}
