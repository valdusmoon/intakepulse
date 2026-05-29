import { eq } from "drizzle-orm";
import { db } from "../index";
import { leadPhotos, type NewLeadPhoto } from "../schema/lead-photos";

export async function createLeadPhoto(data: NewLeadPhoto) {
  const result = await db.insert(leadPhotos).values(data).returning();
  return result[0];
}

export async function getPhotosByLeadId(leadId: string) {
  return db.select().from(leadPhotos).where(eq(leadPhotos.leadId, leadId));
}

export async function updatePhotoAnalysis(id: string, aiAnalysis: unknown) {
  const result = await db
    .update(leadPhotos)
    .set({ aiAnalysis })
    .where(eq(leadPhotos.id, id))
    .returning();
  return result[0];
}

export async function getLeadPhotoById(id: string) {
  const result = await db.select().from(leadPhotos).where(eq(leadPhotos.id, id));
  return result[0] ?? null;
}

export async function deleteLeadPhoto(id: string) {
  await db.delete(leadPhotos).where(eq(leadPhotos.id, id));
}
