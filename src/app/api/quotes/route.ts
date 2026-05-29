import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getCompanyByClerkId } from "@/lib/db/queries/companies";
import { createQuote, getNextQuoteNumber, getQuotesByCompany, getQuotesByLead } from "@/lib/db/queries/quotes";
import { randomBytes } from "crypto";
import { recalculateTotals } from "@/lib/quotes/recalculate";

function generateToken() {
  return randomBytes(16).toString("hex");
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const company = await getCompanyByClerkId(userId);
  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const leadId = req.nextUrl.searchParams.get("leadId");
  const data = leadId
    ? await getQuotesByLead(leadId)
    : await getQuotesByCompany(company.id);

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const company = await getCompanyByClerkId(userId);
  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const body = await req.json();
  const {
    leadId,
    quoteType,
    issueDate,
    validUntil,
    lineItems,
    discountType,
    discountCents,
    taxRateBps,
    homeownerMessage,
    depositNote,
    internalNotes,
  } = body;

  if (!issueDate || !validUntil) {
    return NextResponse.json({ error: "issueDate and validUntil are required" }, { status: 400 });
  }

  const totals = recalculateTotals(
    lineItems ?? [],
    discountType ?? null,
    discountCents ?? 0,
    taxRateBps ?? 0
  );

  const quoteNumber = await getNextQuoteNumber(company.id);

  const quote = await createQuote({
    companyId: company.id,
    leadId: leadId ?? null,
    quoteNumber,
    quoteType: quoteType ?? "interior",
    status: "draft",
    issueDate,
    validUntil,
    ...totals,
    homeownerMessage: homeownerMessage ?? null,
    depositNote: depositNote ?? null,
    internalNotes: internalNotes ?? null,
    publicToken: generateToken(),
  });

  return NextResponse.json(quote, { status: 201 });
}
