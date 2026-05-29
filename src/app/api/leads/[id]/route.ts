import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { randomBytes } from "crypto";
import { getCompanyByClerkId } from "@/lib/db/queries/companies";
import { getLeadById, updateLead, deleteLead } from "@/lib/db/queries/leads";
import { sendReviewRequestEmail } from "@/lib/email/notifications";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function GET(
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

  return NextResponse.json(lead);
}

export async function PATCH(
  req: NextRequest,
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

  const body = await req.json();
  const { status, notes, quotedAmount, homeownerEmail, scheduledAt, scheduledEndAt, scheduledNote, scheduledType, staffId } = body;

  const validStatuses = ["new", "contacted", "quoted", "scheduled", "won", "completed", "lost"];
  if (status && !validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  if (homeownerEmail !== undefined && typeof homeownerEmail === "string") {
    const trimmed = homeownerEmail.trim();
    if (trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }
  }

  const updates: Parameters<typeof updateLead>[1] = {};
  if (status !== undefined) updates.status = status;
  if (notes !== undefined) updates.notes = notes;
  if (quotedAmount !== undefined) updates.quotedAmount = quotedAmount;
  if (homeownerEmail !== undefined) updates.homeownerEmail = homeownerEmail.trim() || null;
  if (scheduledAt !== undefined) updates.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
  if (scheduledEndAt !== undefined) updates.scheduledEndAt = scheduledEndAt ? new Date(scheduledEndAt) : null;
  if (scheduledNote !== undefined) updates.scheduledNote = scheduledNote || null;
  if (scheduledType !== undefined) updates.scheduledType = scheduledType || null;
  if (staffId !== undefined) updates.staffId = staffId || null;

  const updated = await updateLead(id, updates);

  // Fire review request when marked completed — one-time, requires email + Google review URL
  if (status === "completed" && lead.status !== "completed") {
    const company = await getCompanyByClerkId(userId);
    if (
      company?.googleReviewUrl &&
      lead.homeownerEmail &&
      !lead.reviewRequestSentAt
    ) {
      const token = randomBytes(16).toString("hex");
      await updateLead(id, {
        reviewRequestToken: token,
        reviewRequestSentAt: new Date(),
      });
      sendReviewRequestEmail({
        homeownerName: lead.homeownerName,
        homeownerEmail: lead.homeownerEmail,
        businessName: company.businessName,
        reviewUrl: `${APP_URL}/review/${token}`,
      }).catch(() => {});
    }
  }

  return NextResponse.json(updated);
}

export async function DELETE(
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

  await deleteLead(id);
  return NextResponse.json({ success: true });
}
