import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCompanyByClerkId } from "@/lib/db/queries/companies";
import { getLeadById } from "@/lib/db/queries/leads";
import { sendScheduleConfirmation } from "@/lib/email/notifications";
import { sendSms, smsScheduleConfirmed } from "@/lib/sms";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const company = await getCompanyByClerkId(userId);
  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const { id } = await params;
  const lead = await getLeadById(id);
  if (!lead || lead.companyId !== company.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!lead.homeownerEmail) {
    return NextResponse.json({ error: "No homeowner email on file" }, { status: 422 });
  }

  if (!lead.scheduledAt) {
    return NextResponse.json({ error: "No schedule date set" }, { status: 422 });
  }

  const dateStr = lead.scheduledAt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  await Promise.allSettled([
    sendScheduleConfirmation({
      homeownerName: lead.homeownerName,
      homeownerEmail: lead.homeownerEmail,
      businessName: company.businessName,
      businessPhone: company.businessPhone ?? null,
      scheduledAt: lead.scheduledAt,
      scheduledEndAt: lead.scheduledEndAt ?? null,
      address: lead.address,
    }),
    company.notificationPreferences?.smsSchedule !== false
      ? sendSms(company.ownerPhone, smsScheduleConfirmed(lead.homeownerName, dateStr))
      : Promise.resolve(),
  ]);

  return NextResponse.json({ success: true });
}
