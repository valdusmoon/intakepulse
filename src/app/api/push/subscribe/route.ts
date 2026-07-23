import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

import { getBusinessByClerkId } from "@/lib/db/queries/businesses";
import {
  deletePushSubscriptionByEndpoint,
  upsertPushSubscription,
} from "@/lib/db/queries/pushSubscriptions";
import { logger } from "@/lib/logger";

// Register (or refresh) a browser's Web Push subscription so the operator gets
// lead alerts on this device. Body: the JSON of a PushSubscription
// (`subscription.toJSON()`) → { endpoint, keys: { p256dh, auth } }, plus an
// optional oldEndpoint when the browser rotated the subscription (sent by the
// service worker's pushsubscriptionchange handler) so the dead row gets removed.
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await getBusinessByClerkId(userId);
  if (!business) {
    return NextResponse.json({ error: "No business for user" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const sub = body?.subscription ?? body;
  const endpoint: string | undefined = sub?.endpoint;
  const p256dh: string | undefined = sub?.keys?.p256dh;
  const authKey: string | undefined = sub?.keys?.auth;

  if (!endpoint || !p256dh || !authKey) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  await upsertPushSubscription({
    businessId: business.id,
    clerkUserId: userId,
    endpoint,
    p256dh,
    auth: authKey,
    userAgent: req.headers.get("user-agent")?.slice(0, 255) ?? null,
  });

  const oldEndpoint: string | undefined = body?.oldEndpoint;
  const rotated = !!oldEndpoint && oldEndpoint !== endpoint;
  if (rotated) {
    await deletePushSubscriptionByEndpoint(oldEndpoint).catch(() => {});
  }

  logger.info("push: subscription registered", { businessId: business.id, rotated });
  return NextResponse.json({ ok: true });
}
