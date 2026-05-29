import { NextRequest, NextResponse } from "next/server";
import { getQuoteById, updateQuote } from "@/lib/db/queries/quotes";
import { getCompanyById } from "@/lib/db/queries/companies";
import { getLeadById, updateLead } from "@/lib/db/queries/leads";
import { sendQuoteRespondedNotification } from "@/lib/email/notifications";
import { sendSms, smsQuoteResponded } from "@/lib/sms";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { token, action, reason } = body as {
    token: string;
    action: "accept" | "decline";
    reason?: string;
  };

  if (!token || !action) {
    return NextResponse.json({ error: "Missing token or action" }, { status: 400 });
  }

  const quote = await getQuoteById(id);
  if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  if (quote.publicToken !== token) return NextResponse.json({ error: "Invalid token" }, { status: 403 });

  // Check if already responded
  if (quote.acceptedAt || quote.declinedAt) {
    return NextResponse.json({ error: "Already responded" }, { status: 409 });
  }

  // Check if expired
  const now = new Date();
  const expiry = new Date(`${quote.validUntil}T23:59:59`);
  if (now > expiry) {
    return NextResponse.json({ error: "Quote has expired" }, { status: 410 });
  }

  const updates =
    action === "accept"
      ? { status: "accepted" as const, acceptedAt: now }
      : { status: "declined" as const, declinedAt: now };

  const updated = await updateQuote(id, updates);

  // Notify painter + auto-sync lead status
  try {
    const company = await getCompanyById(quote.companyId);
    const lead = quote.leadId ? await getLeadById(quote.leadId) : null;
    if (company && lead) {
      const resolvedAction = action === "accept" ? "accepted" : "declined";
      await Promise.allSettled([
        company.notificationPreferences?.quoteResponded !== false
          ? sendQuoteRespondedNotification({
              painterEmail: company.ownerEmail,
              businessName: company.businessName,
              homeownerName: lead.homeownerName,
              homeownerPhone: lead.homeownerPhone,
              homeownerEmail: lead.homeownerEmail ?? null,
              quoteNumber: quote.quoteNumber,
              action: resolvedAction,
              reason: reason ?? null,
              leadId: lead.id,
            })
          : Promise.resolve(),
        company.notificationPreferences?.smsQuoteResponded !== false
          ? sendSms(company.ownerPhone, smsQuoteResponded(lead.homeownerName, resolvedAction))
          : Promise.resolve(),
      ]);

      // Auto-sync lead status — only advance, never regress
      if (action === "accept" && ["new", "contacted"].includes(lead.status)) {
        updateLead(lead.id, { status: "quoted" }).catch(() => {});
      } else if (action === "decline" && !["won", "scheduled", "completed", "lost"].includes(lead.status)) {
        updateLead(lead.id, { status: "lost" }).catch(() => {});
      }
    }
  } catch {
    // fire-and-forget — don't fail the response if email fails
  }

  return NextResponse.json(updated);
}
