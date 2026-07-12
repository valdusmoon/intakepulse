import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getBusinessByClerkId } from "@/lib/db/queries/businesses";
import { hasPaymentOnFile } from "@/lib/subscription";
import { searchAvailableNumbers } from "@/lib/twilio/client";
import { logger } from "@/lib/logger";

/**
 * Search Twilio for available local voice numbers in an area code.
 * Gated on payment on file — number selection only happens after checkout, since
 * a number can't be reserved without buying it (see the Model B "go live" flow).
 * Searching is free; only /purchase spends money.
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await getBusinessByClerkId(userId);
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });
  if (!hasPaymentOnFile(business)) {
    return NextResponse.json({ error: "Add a payment method before choosing a number." }, { status: 402 });
  }

  const body = await req.json().catch(() => ({}));
  const areaCode = String(body.areaCode ?? "").trim();
  if (!/^\d{3}$/.test(areaCode)) {
    return NextResponse.json({ error: "Enter a 3-digit area code." }, { status: 400 });
  }

  try {
    const numbers = await searchAvailableNumbers(areaCode, 5);
    if (numbers.length === 0) {
      return NextResponse.json({ numbers: [], message: `No numbers available in area code ${areaCode}. Try a nearby area code.` });
    }
    return NextResponse.json({ numbers });
  } catch (error) {
    logger.error("Twilio number search failed", { areaCode, error: String(error) });
    return NextResponse.json({ error: "Couldn't search for numbers right now. Please try again." }, { status: 502 });
  }
}
