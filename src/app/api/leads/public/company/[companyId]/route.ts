import { NextRequest, NextResponse } from "next/server";
import { getCompanyById } from "@/lib/db/queries/companies";
import { isCompanySubscriptionActive } from "@/lib/subscription";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params;

  const company = await getCompanyById(companyId);
  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  return NextResponse.json({
    businessName: company.businessName,
    ownerPhone: company.businessPhone ?? null,
    serviceArea: company.serviceArea,
    logoUrl: company.logoUrl,
    subscriptionActive: isCompanySubscriptionActive(company),
    laborRate: company.defaultSqftRate ? parseFloat(company.defaultSqftRate) : null,
    paintTier: company.paintTier ?? "standard",
  });
}
