import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getBusinessByClerkId, updateBusiness } from "@/lib/db/queries/businesses";
import { hasPaymentOnFile } from "@/lib/subscription";
import { purchaseNumber } from "@/lib/twilio/client";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

/**
 * Buy a real Twilio number for the business and point its Voice webhook at our
 * handler. This is the money-spending step, so it is:
 *  - gated on payment on file (no number without a card),
 *  - idempotent (if the business already has a number SID, return it — never
 *    double-buy; ~$1/mo each),
 * then stores the number + SID on the business (twilioPhoneNumber becomes the
 * live inbound line the voice route looks up).
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await getBusinessByClerkId(userId);
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });
  if (!hasPaymentOnFile(business)) {
    return NextResponse.json({ error: "Add a payment method before choosing a number." }, { status: 402 });
  }

  // Idempotent: already provisioned → return the existing number, don't buy again.
  if (business.twilioPhoneNumberSid && business.twilioPhoneNumber) {
    return NextResponse.json({ phoneNumber: business.twilioPhoneNumber, alreadyProvisioned: true });
  }

  const body = await req.json().catch(() => ({}));
  const phoneNumber = String(body.phoneNumber ?? "").trim();
  if (!/^\+1\d{10}$/.test(phoneNumber)) {
    return NextResponse.json({ error: "phoneNumber must be a valid +1 E.164 number" }, { status: 400 });
  }

  try {
    const appUrl = env.APP_URL;
    const { phoneNumber: bought, sid } = await purchaseNumber({
      phoneNumber,
      voiceUrl: `${appUrl}/api/twilio/voice`,
      statusCallbackUrl: `${appUrl}/api/twilio/voice/status`,
    });

    await updateBusiness(business.id, {
      twilioPhoneNumber: bought,
      twilioPhoneNumberSid: sid,
    });

    return NextResponse.json({ phoneNumber: bought });
  } catch (error) {
    logger.error("Twilio number purchase failed", { businessId: business.id, phoneNumber, error: String(error) });
    return NextResponse.json({ error: "Couldn't provision that number. It may have just been taken — try another." }, { status: 502 });
  }
}
