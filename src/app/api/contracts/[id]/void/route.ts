import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCompanyByClerkId } from "@/lib/db/queries/companies";
import { getContractById, updateContract } from "@/lib/db/queries/contracts";
import { getLeadById, updateLead } from "@/lib/db/queries/leads";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const company = await getCompanyByClerkId(userId);
  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const contract = await getContractById(id);
  if (!contract || contract.companyId !== company.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!["sent", "signed"].includes(contract.status))
    return NextResponse.json({ error: "Only sent or signed contracts can be voided" }, { status: 400 });

  await updateContract(id, { status: "void" });

  // Rewind lead: won → quoted (fire-and-forget)
  if (contract.leadId) {
    getLeadById(contract.leadId).then((lead) => {
      if (lead && lead.status === "won") {
        updateLead(lead.id, { status: "quoted" }).catch(() => {});
      }
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
