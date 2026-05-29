import { notFound } from "next/navigation";
import { getQuoteByToken, updateQuote } from "@/lib/db/queries/quotes";
import { getCompanyById } from "@/lib/db/queries/companies";
import { getLeadById } from "@/lib/db/queries/leads";
import type { Quote } from "@/lib/db/schema/quotes";
import type { Company } from "@/lib/db/schema/companies";
import QuoteRespondForm from "./QuoteRespondForm";

function fmtDollars(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

function fmtDate(dateStr: string) {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
}

const UNIT_LABELS: Record<string, string> = {
  sqft: "sq ft", lf: "lin ft", hr: "hr", flat: "flat", ea: "ea",
};

function StatusBanner({ quote }: { quote: Quote }) {
  if (quote.acceptedAt) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 text-center">
        <p className="text-green-800 font-semibold text-sm">You accepted this quote</p>
        <p className="text-green-600 text-xs mt-0.5">
          {new Date(quote.acceptedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>
    );
  }
  if (quote.declinedAt) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 text-center">
        <p className="text-gray-700 font-semibold text-sm">You declined this quote</p>
        <p className="text-gray-500 text-xs mt-0.5">
          {new Date(quote.declinedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>
    );
  }
  const expired = new Date() > new Date(`${quote.validUntil}T23:59:59`);
  if (expired) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-center">
        <p className="text-amber-800 font-semibold text-sm">This quote has expired</p>
        <p className="text-amber-600 text-xs mt-0.5">Contact us to request an updated quote.</p>
      </div>
    );
  }
  return null;
}

export default async function PublicQuotePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const quote = await getQuoteByToken(token);
  if (!quote) notFound();

  const [company, lead] = await Promise.all([
    getCompanyById(quote.companyId),
    quote.leadId ? getLeadById(quote.leadId) : null,
  ]);

  if (!company) notFound();

  // Track first view (fire-and-forget)
  if (!quote.viewedAt) {
    updateQuote(quote.id, { viewedAt: new Date() }).catch(() => {});
  }

  const lineItems = quote.lineItems as Array<{
    id: string; name: string; description: string;
    quantity: string; unit: string; unitPrice: string; totalCents: number;
  }>;

  const homeownerName = lead?.homeownerName ?? "Homeowner";
  const isResolved = !!(quote.acceptedAt || quote.declinedAt);
  const isExpired = !isResolved && new Date() > new Date(`${quote.validUntil}T23:59:59`);
  const canRespond = !isResolved && !isExpired && quote.status === "sent";

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Status banner */}
        <StatusBanner quote={quote} />

        {/* Quote card */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">

          {/* Header */}
          <div className="px-4 sm:px-7 pt-7 pb-5 border-b border-gray-100">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-lg font-bold text-gray-900">{company.businessName}</p>
                {company.businessPhone && (
                  <p className="text-sm text-gray-500 mt-0.5">{company.businessPhone}</p>
                )}
                {company.businessEmail && (
                  <p className="text-sm text-gray-500">{company.businessEmail}</p>
                )}
                {company.websiteUrl && (
                  <p className="text-sm text-gray-500">{company.websiteUrl}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-[.6rem] font-bold text-gray-400 uppercase tracking-widest">Quote</p>
                <p className="text-sm font-bold text-gray-700">{quote.quoteNumber}</p>
                <p className="text-xs text-gray-400 mt-1">Issued {fmtDate(quote.issueDate)}</p>
                <p className="text-xs text-gray-400">Valid until {fmtDate(quote.validUntil)}</p>
              </div>
            </div>
          </div>

          {/* Prepared for */}
          <div className="px-4 sm:px-7 py-5 border-b border-gray-100">
            <p className="text-[.65rem] font-semibold text-gray-400 uppercase tracking-wide mb-1">Prepared for</p>
            <p className="text-base font-semibold text-gray-900">{homeownerName}</p>
            {lead?.address && <p className="text-sm text-gray-500 mt-0.5">{lead.address}</p>}
            {lead?.homeownerPhone && <p className="text-sm text-gray-500">{lead.homeownerPhone}</p>}
            {lead?.homeownerEmail && <p className="text-sm text-gray-500">{lead.homeownerEmail}</p>}
          </div>

          {/* Line items */}
          {lineItems.length > 0 && (
            <div className="px-4 sm:px-7 py-5 border-b border-gray-100">
              <div className="grid grid-cols-[1fr_80px] gap-2 text-[.65rem] font-semibold text-gray-400 uppercase tracking-wide pb-2 border-b border-gray-100 mb-1">
                <span>Description</span>
                <span className="text-right">Total</span>
              </div>
              <div className="divide-y divide-gray-50">
                {lineItems.map((item) => {
                  const qty = parseFloat(item.quantity) || 0;
                  const price = parseFloat(item.unitPrice) || 0;
                  const hasCalc = qty > 0 && price > 0 && item.unit !== "flat";
                  return (
                    <div key={item.id} className="grid grid-cols-[1fr_80px] gap-2 py-2.5">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                        )}
                        {hasCalc && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {item.quantity} {UNIT_LABELS[item.unit] ?? item.unit} × ${price.toFixed(2)}
                          </p>
                        )}
                      </div>
                      <div className="text-sm font-semibold text-gray-800 text-right self-start pt-0.5">
                        {item.totalCents > 0 ? fmtDollars(item.totalCents) : "—"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Totals */}
          <div className="px-4 sm:px-7 py-5 border-b border-gray-100">
            <div className="max-w-[220px] ml-auto space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>{fmtDollars(quote.subtotalCents)}</span>
              </div>
              {quote.discountCents > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>
                    Discount
                    {quote.discountType === "percent"
                      ? ` (${((quote.discountCents / quote.subtotalCents) * 100).toFixed(0)}%)`
                      : ""}
                  </span>
                  <span>− {fmtDollars(quote.discountCents)}</span>
                </div>
              )}
              {quote.taxCents > 0 && (
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Tax ({(quote.taxRateBps / 100).toFixed(2)}%)</span>
                  <span>{fmtDollars(quote.taxCents)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span className="text-base">Total</span>
                <span className="text-xl">{fmtDollars(quote.totalCents)}</span>
              </div>
            </div>
          </div>

          {/* Message + deposit */}
          {(quote.homeownerMessage || quote.depositNote) && (
            <div className="px-4 sm:px-7 py-5 border-b border-gray-100 space-y-3">
              {quote.homeownerMessage && (
                <p className="text-sm text-gray-500 leading-relaxed">{quote.homeownerMessage}</p>
              )}
              {quote.depositNote && (
                <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3">
                  <p className="text-sm text-orange-700">{quote.depositNote}</p>
                </div>
              )}
            </div>
          )}

          {/* Accept / Decline */}
          <div className="px-4 sm:px-7 py-6">
            {canRespond ? (
              <QuoteRespondForm quoteId={quote.id} token={token} />
            ) : (
              <div className="space-y-2">
                <button disabled className="w-full bg-orange-500 text-white text-sm font-semibold py-3 rounded-xl opacity-40 cursor-not-allowed">
                  Accept Quote
                </button>
                <button disabled className="w-full border border-gray-200 text-gray-400 text-sm py-2.5 rounded-xl cursor-not-allowed">
                  Decline
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 pb-4">Powered by CraftCapture</p>
      </div>
    </div>
  );
}
