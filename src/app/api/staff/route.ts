import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCompanyByClerkId } from "@/lib/db/queries/companies";
import { getStaffByCompany, createStaff } from "@/lib/db/queries/staff";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const company = await getCompanyByClerkId(userId);
  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const members = await getStaffByCompany(company.id);
  return NextResponse.json(members);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const company = await getCompanyByClerkId(userId);
  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const { name, email, phone, address } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const member = await createStaff({
    companyId: company.id,
    name: name.trim(),
    email: email?.trim() || null,
    phone: phone?.trim() || null,
    address: address?.trim() || null,
  });

  return NextResponse.json(member, { status: 201 });
}
