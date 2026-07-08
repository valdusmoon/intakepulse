import { Webhook } from "svix";
import { headers } from "next/headers";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { createBusiness, getBusinessByClerkId } from "@/lib/db/queries/businesses";

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CLERK_WEBHOOK_SECRET not configured" }, { status: 500 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const payload = await req.text();
  const wh = new Webhook(secret);

  let evt: WebhookEvent;
  try {
    evt = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  if (evt.type === "user.created") {
    const { id, email_addresses, first_name, last_name } = evt.data;
    const email = email_addresses[0]?.email_address ?? "";
    const fullName = [first_name, last_name].filter(Boolean).join(" ") || "Owner";

    // Idempotency check — webhook may fire more than once
    const existing = await getBusinessByClerkId(id);
    if (!existing) {
      await createBusiness({
        clerkUserId: id,
        businessName: email.split("@")[0] || "My Business",
        ownerName: fullName,
        ownerEmail: email,
        ownerPhone: null,
        onboardingCompleted: false,
      });
    }
  }

  return NextResponse.json({ received: true });
}
