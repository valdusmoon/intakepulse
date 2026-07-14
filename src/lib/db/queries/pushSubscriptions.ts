import { eq } from "drizzle-orm";

import { db } from "../index";
import {
  pushSubscriptions,
  type NewPushSubscription,
} from "../schema/pushSubscriptions";

// Upsert by endpoint — a browser re-subscribing (same endpoint) must not create a
// duplicate row, and the p256dh/auth keys can rotate, so we refresh them. The
// endpoint may also move to a different business if the same device signs into a
// new account, so business_id/clerk_user_id are updated on conflict too.
export async function upsertPushSubscription(data: NewPushSubscription) {
  const result = await db
    .insert(pushSubscriptions)
    .values(data)
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: {
        businessId: data.businessId,
        clerkUserId: data.clerkUserId ?? null,
        p256dh: data.p256dh,
        auth: data.auth,
        userAgent: data.userAgent ?? null,
        updatedAt: new Date(),
      },
    })
    .returning();
  return result[0];
}

export async function getPushSubscriptionsForBusiness(businessId: string) {
  return db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.businessId, businessId));
}

export async function deletePushSubscriptionByEndpoint(endpoint: string) {
  await db
    .delete(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, endpoint));
}
