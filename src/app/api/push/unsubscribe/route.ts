import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

import { deletePushSubscriptionByEndpoint } from "@/lib/db/queries/pushSubscriptions";

// Remove a browser's Web Push subscription (operator turned notifications off, or
// the browser rotated/expired the subscription). Body: { endpoint }.
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const endpoint: string | undefined = body?.endpoint;
  if (!endpoint) {
    return NextResponse.json({ error: "endpoint required" }, { status: 400 });
  }

  // Endpoints are globally unique; deleting by endpoint only affects this device.
  await deletePushSubscriptionByEndpoint(endpoint);
  return NextResponse.json({ ok: true });
}
