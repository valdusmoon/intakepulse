import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getBusinessByClerkId } from "@/lib/db/queries/businesses";
import { createLead, getLeadsByBusiness } from "@/lib/db/queries/leads";
import { validateAndNormalizePhone } from "@/lib/utils/phone-validation";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await getBusinessByClerkId(userId);
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const limit = Math.min(Number(searchParams.get("limit") ?? 25), 100);
  const offset = Number(searchParams.get("offset") ?? 0);

  const leads = await getLeadsByBusiness(business.id, { status, search, limit, offset });
  return NextResponse.json(leads);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await getBusinessByClerkId(userId);
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const body = await req.json();
  const { callerName, callerPhone, notes } = body;

  if (!callerPhone) return NextResponse.json({ error: "Phone is required" }, { status: 400 });

  const phoneResult = validateAndNormalizePhone(callerPhone);
  if (!phoneResult.isValid) return NextResponse.json({ error: phoneResult.error }, { status: 422 });

  const lead = await createLead({
    businessId: business.id,
    callerName: callerName?.trim() || null,
    callerPhone: phoneResult.normalized!,
    source: "manual",
    status: "sms_sent",
    notes: notes?.trim() || null,
  });

  return NextResponse.json(lead, { status: 201 });
}
