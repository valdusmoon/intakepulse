import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getBusinessByClerkId } from "@/lib/db/queries/businesses";
import { getLeadById } from "@/lib/db/queries/leads";
import { cancelFollowupsForLead } from "@/lib/db/queries/followups";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [business, lead] = await Promise.all([
    getBusinessByClerkId(userId),
    getLeadById(id),
  ]);

  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  if (lead.businessId !== business.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await cancelFollowupsForLead(id, "manual_stop");
  return NextResponse.json({ success: true });
}
