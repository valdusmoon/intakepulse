import { eq } from "drizzle-orm";
import { db } from "../index";
import { businesses, type NewBusiness } from "../schema/businesses";

export async function getBusinessByClerkId(clerkUserId: string) {
  return db.query.businesses.findFirst({
    where: eq(businesses.clerkUserId, clerkUserId),
  }) ?? null;
}

export async function getBusinessById(id: string) {
  return db.query.businesses.findFirst({
    where: eq(businesses.id, id),
  }) ?? null;
}

export async function getBusinessByTelnyxNumber(telnyxPhoneNumber: string) {
  return db.query.businesses.findFirst({
    where: eq(businesses.telnyxPhoneNumber, telnyxPhoneNumber),
  }) ?? null;
}

export async function getBusinessByTwilioNumber(twilioPhoneNumber: string) {
  return db.query.businesses.findFirst({
    where: eq(businesses.twilioPhoneNumber, twilioPhoneNumber),
  }) ?? null;
}

export async function getAllBusinesses() {
  return db.select().from(businesses);
}

export async function createBusiness(data: NewBusiness) {
  const result = await db.insert(businesses).values(data).returning();
  return result[0];
}

export async function updateBusiness(
  id: string,
  data: Partial<Omit<NewBusiness, "id" | "clerkUserId" | "createdAt">>
) {
  const result = await db
    .update(businesses)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(businesses.id, id))
    .returning();
  return result[0];
}
