import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getBusinessByClerkId } from "@/lib/db/queries/businesses";
import { getLeadById, updateLead, deleteLead } from "@/lib/db/queries/leads";

async function getAuthorizedLead(userId: string, leadId: string) {
  const [business, lead] = await Promise.all([
    getBusinessByClerkId(userId),
    getLeadById(leadId),
  ]);
  if (!business) return { error: "Business not found", status: 404 };
  if (!lead) return { error: "Lead not found", status: 404 };
  if (lead.businessId !== business.id) return { error: "Forbidden", status: 403 };
  return { business, lead };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await getAuthorizedLead(userId, id);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  return NextResponse.json(result.lead);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await getAuthorizedLead(userId, id);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  const body = await req.json();
  const allowed = ["status", "notes", "callerName", "callerEmail", "convertedAt"] as const;
  const safeBody = Object.fromEntries(
    allowed.filter((k) => k in body).map((k) => [k, body[k]])
  );

  // Set convertedAt automatically when marking converted
  if (safeBody.status === "converted" && !safeBody.convertedAt) {
    safeBody.convertedAt = new Date();
  }

  const updated = await updateLead(id, safeBody);
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await getAuthorizedLead(userId, id);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  await deleteLead(id);
  return NextResponse.json({ success: true });
}
