import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getBusinessByClerkId } from "@/lib/db/queries/businesses";
import { createLead, getLeadsByBusiness } from "@/lib/db/queries/leads";
import { createSmsEvent } from "@/lib/db/queries/smsEvents";
import { createFollowup } from "@/lib/db/queries/followups";
import { validateAndNormalizePhone } from "@/lib/utils/phone-validation";
import { sendSms, smsMissedCallRecovery } from "@/lib/sms";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.callverted.com";

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
  const { callerName, callerPhone, callerEmail, notes, source, sendIntakeSms } = body;

  if (!callerPhone) return NextResponse.json({ error: "Phone is required" }, { status: 400 });

  const phoneResult = validateAndNormalizePhone(callerPhone);
  if (!phoneResult.isValid) return NextResponse.json({ error: phoneResult.error }, { status: 422 });

  const validSources = ["manual", "email", "embed"] as const;
  const leadSource = validSources.includes(source) ? source : "manual";

  const lead = await createLead({
    businessId: business.id,
    callerName: callerName?.trim() || null,
    callerPhone: phoneResult.normalized!,
    callerEmail: callerEmail?.trim() || null,
    source: leadSource,
    status: "sms_sent",
    notes: notes?.trim() || null,
  });

  // Optionally send intake link via SMS immediately
  if (sendIntakeSms && business.telnyxPhoneNumber) {
    const intakeUrl = `${APP_URL}/intake/${business.id}?lead=${lead.id}&source=manual`;
    const smsBody = smsMissedCallRecovery(business.businessName, intakeUrl);
    const messageId = await sendSms(business.telnyxPhoneNumber, lead.callerPhone, smsBody);

    void createSmsEvent({
      businessId: business.id,
      leadId: lead.id,
      direction: "outbound",
      fromPhone: business.telnyxPhoneNumber,
      toPhone: lead.callerPhone,
      body: smsBody,
      telnyxMessageId: messageId ?? undefined,
      status: "sent",
    });

    const scheduledAt = new Date(Date.now() + 3 * 60 * 60 * 1000);
    void createFollowup({ leadId: lead.id, businessId: business.id, sequence: 1, scheduledAt });
  }

  return NextResponse.json(lead, { status: 201 });
}
