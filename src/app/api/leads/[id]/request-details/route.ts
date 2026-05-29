import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCompanyByClerkId } from "@/lib/db/queries/companies";
import { getLeadById, updateLead } from "@/lib/db/queries/leads";
import { sendRequestDetailsEmail } from "@/lib/email/notifications";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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
    return NextResponse.json({ error: "Lead has no email address" }, { status: 400 });
  }

  const formUrl = `${APP_URL}/quote/${company.id}?leadId=${lead.id}`;

  await sendRequestDetailsEmail({
    homeownerEmail: lead.homeownerEmail,
    homeownerName: lead.homeownerName,
    businessName: company.businessName,
    formUrl,
  });

  // Advance to contacted if still on new
  if (lead.status === "new") {
    await updateLead(id, { status: "contacted" });
  }

  return NextResponse.json({ success: true });
}
