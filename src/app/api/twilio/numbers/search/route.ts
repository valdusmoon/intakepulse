import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

/**
 * MOCK — replace with a real Twilio search before launch:
 *   client.availablePhoneNumbers("US").local.list({ areaCode, limit: 5 })
 * This route's request/response shape is the real one on purpose, so swapping
 * in the real Twilio call later means editing only this file — nothing in the
 * onboarding UI or the purchase route needs to change.
 */
function generateMockNumbers(areaCode: string, count: number): string[] {
  const numbers = new Set<string>();
  while (numbers.size < count) {
    // NANP: central office code (first 3 of the local 7 digits) can't start with 0 or 1.
    const exchange = String(Math.floor(200 + Math.random() * 800));
    const line = String(Math.floor(1000 + Math.random() * 9000));
    numbers.add(`+1${areaCode}${exchange}${line}`);
  }
  return Array.from(numbers);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const areaCode = String(body.areaCode ?? "").trim();
  if (!/^\d{3}$/.test(areaCode)) {
    return NextResponse.json({ error: "areaCode must be exactly 3 digits" }, { status: 400 });
  }

  const numbers = generateMockNumbers(areaCode, 5);
  return NextResponse.json({ numbers, mock: true });
}
