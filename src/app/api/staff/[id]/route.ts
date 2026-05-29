import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCompanyByClerkId } from "@/lib/db/queries/companies";
import { getStaffMember, updateStaff, deleteStaff } from "@/lib/db/queries/staff";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const company = await getCompanyByClerkId(userId);
  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const { id } = await params;
  const member = await getStaffMember(id, company.id);
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { name, email, phone, address } = await req.json();
  const updated = await updateStaff(id, {
    ...(name !== undefined ? { name: name.trim() } : {}),
    ...(email !== undefined ? { email: email?.trim() || null } : {}),
    ...(phone !== undefined ? { phone: phone?.trim() || null } : {}),
    ...(address !== undefined ? { address: address?.trim() || null } : {}),
  });

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
  const member = await getStaffMember(id, company.id);
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await deleteStaff(id);
  return NextResponse.json({ success: true });
}
