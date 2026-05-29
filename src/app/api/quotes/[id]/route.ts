import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getCompanyByClerkId } from "@/lib/db/queries/companies";
import { getQuoteById, updateQuote, deleteQuote } from "@/lib/db/queries/quotes";
import { recalculateTotals } from "@/lib/quotes/recalculate";

async function getAuthedQuote(userId: string, id: string) {
  const company = await getCompanyByClerkId(userId);
  if (!company) return { error: "Company not found", status: 404 };
  const quote = await getQuoteById(id);
  if (!quote) return { error: "Not found", status: 404 };
  if (quote.companyId !== company.id) return { error: "Forbidden", status: 403 };
  return { quote, company };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await getAuthedQuote(userId, id);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  return NextResponse.json(result.quote);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await getAuthedQuote(userId, id);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  const body = await req.json();
  const { lineItems, discountType, discountCents, taxRateBps, ...rest } = body;

  // If line items are present, recalculate all totals server-side
  const totals = lineItems !== undefined
    ? recalculateTotals(lineItems, discountType ?? null, discountCents ?? 0, taxRateBps ?? 0)
    : {};

  const updated = await updateQuote(id, { ...rest, ...totals });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await getAuthedQuote(userId, id);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  await deleteQuote(id);
  return NextResponse.json({ ok: true });
}
