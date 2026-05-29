import { and, eq, isNull } from "drizzle-orm";
import { db } from "../index";
import { staff, type NewStaff } from "../schema/staff";

export async function getStaffByCompany(companyId: string) {
  return db
    .select()
    .from(staff)
    .where(and(eq(staff.companyId, companyId), isNull(staff.deletedAt)))
    .orderBy(staff.name);
}

export async function getStaffMember(id: string, companyId: string) {
  const result = await db
    .select()
    .from(staff)
    .where(and(eq(staff.id, id), eq(staff.companyId, companyId), isNull(staff.deletedAt)));
  return result[0] ?? null;
}

export async function createStaff(data: NewStaff) {
  const result = await db.insert(staff).values(data).returning();
  return result[0];
}

export async function updateStaff(
  id: string,
  data: Partial<Omit<NewStaff, "id" | "companyId" | "createdAt">>
) {
  const result = await db
    .update(staff)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(staff.id, id))
    .returning();
  return result[0];
}

export async function deleteStaff(id: string) {
  await db.update(staff).set({ deletedAt: new Date() }).where(eq(staff.id, id));
}
