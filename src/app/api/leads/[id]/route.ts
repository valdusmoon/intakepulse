import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getBusinessByClerkId } from "@/lib/db/queries/businesses";
import { getLeadById, updateLead, deleteLead } from "@/lib/db/queries/leads";
import { MESSAGE_KINDS } from "@/lib/leads/lead-taxonomy";

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
  // intakeStatus is deliberately not PATCHable here — it's system-derived from
  // the actual Q&A progress, not something a business owner manually toggles.
  const allowed = ["leadStatus", "notes", "callerName", "callerEmail", "convertedAt", "confirmedValue", "leadType", "messageKind"] as const;
  const safeBody = Object.fromEntries(
    allowed.filter((k) => k in body).map((k) => [k, body[k]])
  );

  const existing = result.lead;

  // Reclassification (docs/callverted-standard.md §7): the owner can flip a lead's
  // TYPE both directions — promote a message that turned into a real job, or file a
  // mis-classified job as a message. Scores are never touched either way: a promoted
  // message is an honest unscored job, and every queue/metric already guards on
  // leadType, so reporting adjusts automatically.
  if ("leadType" in safeBody) {
    if (safeBody.leadType !== "job" && safeBody.leadType !== "message") {
      return NextResponse.json({ error: "leadType must be 'job' or 'message'" }, { status: 422 });
    }
    if (safeBody.leadType === "job") {
      safeBody.messageKind = null;
    } else if (!MESSAGE_KINDS.includes(safeBody.messageKind)) {
      safeBody.messageKind = "general";
    }
  } else if ("messageKind" in safeBody) {
    // Standalone kind change is only meaningful on a lead that IS a message.
    if (existing.leadType !== "message" || !MESSAGE_KINDS.includes(safeBody.messageKind)) {
      return NextResponse.json({ error: "Invalid messageKind for this lead" }, { status: 422 });
    }
  }

  // Set convertedAt automatically when marking converted
  if (safeBody.leadStatus === "converted" && !safeBody.convertedAt) {
    safeBody.convertedAt = new Date();
  }

  // Stamp contactedAt the first time leadStatus reaches 'contacted' or beyond —
  // powers the "average callback time" metric. Never overwritten once set.
  const CONTACTED_OR_BEYOND = ["contacted", "booked", "estimate_sent", "converted"];
  if (
    typeof safeBody.leadStatus === "string" &&
    CONTACTED_OR_BEYOND.includes(safeBody.leadStatus) &&
    !existing.contactedAt
  ) {
    safeBody.contactedAt = new Date();
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
