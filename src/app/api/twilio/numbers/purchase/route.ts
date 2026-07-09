import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

/**
 * MOCK — replace with a real Twilio purchase before launch:
 *   client.incomingPhoneNumbers.create({ phoneNumber, voiceUrl: `${APP_URL}/api/twilio/voice` })
 * Same request/response shape as the real flow will use, so the onboarding UI
 * doesn't need to change when this is swapped over — just the internals here.
 *
 * Doesn't touch the businesses table — onboarding doesn't create a business
 * row until every step is submitted in one atomic call at the end, so there's
 * nothing to attach this to yet. The chosen number is held in onboarding form
 * state and included in that final submit instead.
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const phoneNumber = String(body.phoneNumber ?? "").trim();
  if (!/^\+1\d{10}$/.test(phoneNumber)) {
    return NextResponse.json({ error: "phoneNumber must be a valid +1 E.164 number" }, { status: 400 });
  }

  return NextResponse.json({ phoneNumber, mock: true });
}
