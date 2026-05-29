import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getCompanyByClerkId } from "@/lib/db/queries/companies";
import { getContractById, updateContract, deleteContract } from "@/lib/db/queries/contracts";

async function getAuthedContract(userId: string, id: string) {
  const company = await getCompanyByClerkId(userId);
  if (!company) return { error: "Company not found", status: 404 };

  const contract = await getContractById(id);
  if (!contract) return { error: "Contract not found", status: 404 };
  if (contract.companyId !== company.id) return { error: "Forbidden", status: 403 };

  return { contract, company };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await getAuthedContract(userId, id);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  return NextResponse.json(result.contract);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await getAuthedContract(userId, id);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  const body = await req.json();
  const updated = await updateContract(id, body);
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await getAuthedContract(userId, id);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  await deleteContract(id);
  return new NextResponse(null, { status: 204 });
}
