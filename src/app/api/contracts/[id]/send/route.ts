import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getCompanyByClerkId } from "@/lib/db/queries/companies";
import { getContractById, updateContract } from "@/lib/db/queries/contracts";
import { getLeadById } from "@/lib/db/queries/leads";
import { sendContractEmail } from "@/lib/email/notifications";

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
  const contract = await getContractById(id);
  if (!contract) return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  if (contract.companyId !== company.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!contract.contractBody.trim()) {
    return NextResponse.json({ error: "Contract body is empty." }, { status: 422 });
  }

  const lead = contract.leadId ? await getLeadById(contract.leadId) : null;
  if (!lead?.homeownerEmail) {
    return NextResponse.json(
      { error: "No homeowner email on file — add an email to the lead before sending." },
      { status: 422 }
    );
  }

  const publicUrl = `${APP_URL}/contract/${contract.publicToken}`;

  await sendContractEmail({
    homeownerEmail: lead.homeownerEmail,
    homeownerName: lead.homeownerName,
    businessName: company.businessName,
    publicUrl,
  });

  const updated = await updateContract(id, {
    status: "sent",
    sentAt: new Date(),
  });

  return NextResponse.json(updated);
}
