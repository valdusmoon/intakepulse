import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getCompanyByClerkId, getCompanyById } from "@/lib/db/queries/companies";
import { getQuoteById } from "@/lib/db/queries/quotes";
import { getLeadById } from "@/lib/db/queries/leads";
import { QuotePDF } from "@/components/quotes/QuotePDF";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const authedCompany = await getCompanyByClerkId(userId);
  if (!authedCompany) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const { id } = await params;
  const quote = await getQuoteById(id);
  if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  if (quote.companyId !== authedCompany.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const company = await getCompanyById(quote.companyId);
  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  // Fetch lead for homeowner details if linked
  const lead = quote.leadId ? await getLeadById(quote.leadId) : null;

  const buffer = await renderToBuffer(
    <QuotePDF
      quote={quote}
      company={company}
      homeownerName={lead?.homeownerName ?? "Homeowner"}
      homeownerPhone={lead?.homeownerPhone ?? null}
      homeownerEmail={lead?.homeownerEmail ?? null}
      homeownerAddress={lead?.address ?? null}
    />
  );

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${quote.quoteNumber}.pdf"`,
    },
  });
}
