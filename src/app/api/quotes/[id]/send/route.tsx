import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getCompanyByClerkId } from "@/lib/db/queries/companies";
import { getQuoteById, updateQuote } from "@/lib/db/queries/quotes";
import { getLeadById, updateLead } from "@/lib/db/queries/leads";
import { QuotePDF } from "@/components/quotes/QuotePDF";
import { sendQuoteEmail } from "@/lib/email/notifications";

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
  const quote = await getQuoteById(id);
  if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  if (quote.companyId !== company.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const lead = quote.leadId ? await getLeadById(quote.leadId) : null;

  if (!lead?.homeownerEmail) {
    return NextResponse.json(
      { error: "No homeowner email on file — add an email to the lead before sending." },
      { status: 422 }
    );
  }

  // Generate PDF
  const buffer = await renderToBuffer(
    <QuotePDF
      quote={quote}
      company={company}
      homeownerName={lead.homeownerName}
      homeownerPhone={lead.homeownerPhone}
      homeownerEmail={lead.homeownerEmail}
      homeownerAddress={lead.address ?? null}
    />
  );

  const publicUrl = `${APP_URL}/q/${quote.publicToken}`;

  // Send email to homeowner
  await sendQuoteEmail({
    homeownerEmail: lead.homeownerEmail,
    homeownerName: lead.homeownerName,
    businessName: company.businessName,
    quoteNumber: quote.quoteNumber,
    totalCents: quote.totalCents,
    validUntil: quote.validUntil,
    publicUrl,
    pdfBuffer: buffer as unknown as Buffer,
  });

  // Mark as sent
  const updated = await updateQuote(id, {
    status: "sent",
    sentAt: new Date(),
  });

  // Auto-sync lead status + quoted amount (fire-and-forget)
  if (lead && ["new", "contacted"].includes(lead.status)) {
    updateLead(lead.id, {
      status: "quoted",
      quotedAmount: quote.totalCents,
    }).catch(() => {});
  } else if (lead) {
    // Always keep quotedAmount in sync even if status is already ahead
    updateLead(lead.id, { quotedAmount: quote.totalCents }).catch(() => {});
  }

  return NextResponse.json(updated);
}
