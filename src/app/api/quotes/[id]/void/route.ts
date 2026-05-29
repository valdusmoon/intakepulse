import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCompanyByClerkId } from "@/lib/db/queries/companies";
import { getQuoteById, updateQuote } from "@/lib/db/queries/quotes";
import { getLeadById, updateLead } from "@/lib/db/queries/leads";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const company = await getCompanyByClerkId(userId);
  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const quote = await getQuoteById(id);
  if (!quote || quote.companyId !== company.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!["sent", "accepted"].includes(quote.status))
    return NextResponse.json({ error: "Only sent or accepted quotes can be voided" }, { status: 400 });

  await updateQuote(id, { status: "voided" });

  // Rewind lead: quoted → contacted (fire-and-forget)
  if (quote.leadId) {
    getLeadById(quote.leadId).then((lead) => {
      if (lead && lead.status === "quoted") {
        updateLead(lead.id, { status: "contacted" }).catch(() => {});
      }
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
