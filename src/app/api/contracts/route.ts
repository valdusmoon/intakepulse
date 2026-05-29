import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getCompanyByClerkId } from "@/lib/db/queries/companies";
import { createContract, getContractsByLead, getContractsByCompany } from "@/lib/db/queries/contracts";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const company = await getCompanyByClerkId(userId);
  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get("leadId");

  const result = leadId
    ? await getContractsByLead(leadId)
    : await getContractsByCompany(company.id);

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const company = await getCompanyByClerkId(userId);
  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const body = await req.json();

  const contract = await createContract({
    companyId: company.id,
    leadId: body.leadId ?? null,
    quoteId: body.quoteId ?? null,
    status: "draft",
    contractBody: body.contractBody ?? "",
    publicToken: randomBytes(24).toString("hex"),
  });

  return NextResponse.json(contract, { status: 201 });
}
