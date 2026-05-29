"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Check, Send, FileSignature, Ban } from "lucide-react";

interface Lead {
  id: string;
  homeownerName: string;
  homeownerEmail: string | null;
  homeownerPhone: string;
  address: string | null;
  serviceType: string | null;
}

interface Company {
  businessName: string;
  ownerName: string;
  ownerPhone: string;
  businessPhone: string | null;
  businessEmail: string | null;
}

interface QuoteLineItem {
  id: string;
  name: string;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  totalCents: number;
}

interface Quote {
  id: string;
  quoteNumber: string;
  status: string;
  lineItems: QuoteLineItem[];
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  depositNote: string | null;
}

function fmtMoney(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const UNIT_LABELS: Record<string, string> = {
  sqft: "sq ft", lf: "lin ft", hr: "hr", flat: "flat", ea: "ea",
};

function defaultTemplate(lead: Lead, company: Company, quote?: Quote | null): string {
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const serviceLabel =
    lead.serviceType === "exterior" ? "exterior painting"
    : lead.serviceType === "both" ? "interior and exterior painting"
    : "interior painting";

  // Scope of work — line items from quote or generic description
  let scopeLines = `${company.businessName} agrees to perform ${serviceLabel} services at the above address`;
  if (quote) {
    scopeLines += ` per Quote ${quote.quoteNumber}`;
    const itemLines = quote.lineItems
      .filter((item) => item.name)
      .map((item) => {
        const qty = parseFloat(item.quantity);
        const unit = UNIT_LABELS[item.unit] ?? item.unit;
        const hasQty = qty > 0 && item.unit !== "flat";
        const detail = hasQty ? ` (${item.quantity} ${unit})` : "";
        const desc = item.description ? ` — ${item.description}` : "";
        const total = item.totalCents > 0 ? `  ${fmtMoney(item.totalCents)}` : "";
        return `  • ${item.name}${detail}${desc}${total}`;
      });
    if (itemLines.length > 0) {
      scopeLines += `:\n\n${itemLines.join("\n")}`;
    }
  } else {
    scopeLines += ". All work will be completed in a professional and workmanlike manner using quality materials.";
  }

  // Project total
  let totalSection = "";
  if (quote) {
    totalSection = `\nPROJECT TOTAL\n\n`;
    if (quote.subtotalCents !== quote.totalCents) {
      totalSection += `Subtotal: ${fmtMoney(quote.subtotalCents)}\n`;
      if (quote.discountCents > 0) totalSection += `Discount: -${fmtMoney(quote.discountCents)}\n`;
      if (quote.taxCents > 0) totalSection += `Tax: ${fmtMoney(quote.taxCents)}\n`;
    }
    totalSection += `Total: ${fmtMoney(quote.totalCents)}\n`;
  }

  // Payment terms
  let paymentTerms: string;
  if (quote?.depositNote) {
    paymentTerms = `${quote.depositNote} The remaining balance is due upon completion of the project. Payments may be made by cash, check, or electronic transfer.`;
  } else if (quote) {
    const deposit = Math.round(quote.totalCents / 2);
    const remaining = quote.totalCents - deposit;
    paymentTerms = `A deposit of ${fmtMoney(deposit)} (50% of the project total) is due before work begins. The remaining balance of ${fmtMoney(remaining)} is due upon completion of the project. Payments may be made by cash, check, or electronic transfer.`;
  } else {
    paymentTerms = `A deposit of 50% of the total project cost is due before work begins. The remaining balance is due upon completion of the project. Payments may be made by cash, check, or electronic transfer.`;
  }

  return `SERVICE AGREEMENT

Date: ${today}

PARTIES

Contractor: ${company.businessName}
${company.businessPhone ? `Phone: ${company.businessPhone}` : ""}
${company.businessEmail ? `Email: ${company.businessEmail}` : ""}

Client: ${lead.homeownerName}
${lead.address ? `Address: ${lead.address}` : ""}
${lead.homeownerPhone ? `Phone: ${lead.homeownerPhone}` : ""}
${lead.homeownerEmail ? `Email: ${lead.homeownerEmail}` : ""}

SCOPE OF WORK

${scopeLines}
${totalSection}
PAYMENT TERMS

${paymentTerms}

TIMELINE

Work will be scheduled upon receipt of the deposit. ${company.businessName} will provide a start date at that time. The project is estimated to take [X] days to complete, weather permitting.

MATERIALS

All paint and materials will be provided by ${company.businessName} unless otherwise agreed in writing. Client may request specific paint brands or colors at no additional charge unless premium pricing applies.

CHANGE ORDERS

Any changes to the agreed scope of work must be approved in writing by both parties before additional work begins. Change orders may affect the total project cost and timeline.

WARRANTY

${company.businessName} warrants all labor for a period of one (1) year from the date of project completion. This warranty covers workmanship defects and does not cover damage caused by weather, accidents, or normal wear and tear.

LIABILITY

${company.businessName} carries general liability insurance. The contractor is not responsible for pre-existing damage, structural issues, or damage caused by conditions outside of our control.

CANCELLATION

Either party may cancel this agreement with 48 hours written notice prior to the scheduled start date. The deposit is non-refundable if the client cancels within 48 hours of the start date.

By signing below, both parties agree to the terms and conditions of this agreement.`;
}

export default function ContractPage() {
  const params = useParams();
  const leadId = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  const [contractId, setContractId] = useState<string | null>(null);
  const [contractBody, setContractBody] = useState("");
  const [contractStatus, setContractStatus] = useState("draft");
  const [signerName, setSignerName] = useState<string | null>(null);
  const [signedAt, setSignedAt] = useState<string | null>(null);
  const [wasVoided, setWasVoided] = useState(false);

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [sendStatus, setSendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [sendError, setSendError] = useState<string | null>(null);
  const [voidStatus, setVoidStatus] = useState<"idle" | "voiding" | "error">("idle");
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/leads/${leadId}`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/company`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/contracts?leadId=${leadId}`).then((r) => r.ok ? r.json() : []),
      fetch(`/api/quotes?leadId=${leadId}`).then((r) => r.ok ? r.json() : []),
    ]).then(([leadData, companyData, contractsData, quotesData]) => {
      if (leadData) setLead(leadData);
      if (companyData) setCompany(companyData);

      const existing = Array.isArray(contractsData)
        ? contractsData.find((c: { status: string }) => c.status !== "void") ?? null
        : null;
      const latestVoided = !existing && Array.isArray(contractsData) && contractsData[0]?.status === "void";
      if (latestVoided) setWasVoided(true);

      if (existing) {
        setContractId(existing.id);
        setContractBody(existing.contractBody);
        setContractStatus(existing.status);
        setSignerName(existing.signerName ?? null);
        setSignedAt(existing.signedAt ?? null);
      } else if (leadData && companyData) {
        // Use accepted/sent quote to populate template, fall back to most recent non-voided
        const activeQuote = Array.isArray(quotesData)
          ? (quotesData.find((q: Quote) => q.status === "accepted") ?? quotesData.find((q: Quote) => q.status !== "voided") ?? null)
          : null;
        setContractBody(defaultTemplate(leadData, companyData, activeQuote));
      }

      setLoading(false);
    });
  }, [leadId]);

  async function handleSave() {
    setSaveStatus("saving");
    try {
      if (contractId) {
        await fetch(`/api/contracts/${contractId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contractBody }),
        });
      } else {
        const res = await fetch("/api/contracts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId, contractBody }),
        });
        const data = await res.json();
        setContractId(data.id);
        setContractStatus(data.status);
      }
      setSaveStatus("saved");
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => setSaveStatus("idle"), 2500);
    } catch {
      setSaveStatus("idle");
    }
  }

  async function handleSend() {
    setSendStatus("sending");
    setSendError(null);

    let currentId = contractId;
    try {
      if (!currentId) {
        const res = await fetch("/api/contracts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId, contractBody }),
        });
        const data = await res.json();
        currentId = data.id;
        setContractId(data.id);
        setContractStatus(data.status);
      } else {
        await fetch(`/api/contracts/${currentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contractBody }),
        });
      }
    } catch {
      setSendStatus("error");
      setSendError("Failed to save contract. Please try again.");
      return;
    }

    const res = await fetch(`/api/contracts/${currentId}/send`, { method: "POST" });
    if (!res.ok) {
      const data = await res.json();
      setSendStatus("error");
      setSendError(data.error ?? "Failed to send contract.");
      return;
    }

    setContractStatus("sent");
    setSendStatus("sent");
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => setSendStatus("idle"), 4000);
  }

  async function handleVoid() {
    if (!contractId) return;
    if (!confirm("Void this contract? The homeowner's signing link will no longer work. You can create a new contract after.")) return;
    setVoidStatus("voiding");
    const res = await fetch(`/api/contracts/${contractId}/void`, { method: "POST" });
    if (!res.ok) {
      setVoidStatus("error");
      return;
    }
    // Reset to blank editor
    setWasVoided(true);
    setContractId(null);
    setContractStatus("draft");
    setSignerName(null);
    setSignedAt(null);
    setVoidStatus("idle");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 rounded-full animate-spin" style={{ border: "2px solid #e5e7eb", borderTopColor: "#f97316" }} />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-20 text-gray-400 text-sm">
        Lead not found.{" "}
        <Link href="/dashboard/leads" className="underline text-gray-600">Back to leads</Link>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    draft:  "bg-gray-100 text-gray-500",
    sent:   "bg-blue-50 text-blue-600",
    signed: "bg-green-50 text-green-700",
    void:   "bg-red-50 text-red-500",
  };

  const isDraft = contractStatus === "draft";

  // ── Read-only view (sent / signed / void) ────────────────────────────────────
  if (!isDraft) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href={`/dashboard/leads/${leadId}`} className="text-sm text-gray-400 hover:text-gray-700 shrink-0">
              ← {lead.homeownerName}
            </Link>
            <span className="text-gray-200">/</span>
            <span className="text-sm font-semibold text-gray-700">Contract</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${statusColors[contractStatus] ?? "bg-gray-100 text-gray-500"}`}>
              {contractStatus}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {(contractStatus === "sent" || contractStatus === "signed") && (
              <button
                onClick={handleVoid}
                disabled={voidStatus === "voiding"}
                className="flex items-center gap-1.5 text-sm text-red-400 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <Ban className="w-3.5 h-3.5" />
                Void
              </button>
            )}
            {contractStatus === "sent" && (
              <button
                onClick={handleSend}
                disabled={sendStatus === "sending"}
                className="flex items-center gap-1.5 text-sm bg-orange-500 text-white px-4 py-1.5 rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50"
              >
                {sendStatus === "sending" ? "Sending..." : sendStatus === "sent" ? <><Check className="w-3.5 h-3.5" /> Sent!</> : <><Send className="w-3.5 h-3.5" /> Resend</>}
              </button>
            )}
          </div>
        </div>

        {contractStatus === "signed" && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-green-700">
            <FileSignature className="w-4 h-4 shrink-0" />
            Signed by {lead.homeownerName}. A signed PDF was emailed to you.
          </div>
        )}

        {sendStatus === "error" && sendError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{sendError}</div>
        )}
        {voidStatus === "error" && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">Failed to void contract. Please try again.</div>
        )}

        <div className="bg-white rounded-[14px] border border-[#E2E8F0] overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <p className="text-[.85rem] font-bold text-[#0F1628] uppercase tracking-wide">Contract</p>
            <p className="text-xs text-gray-400">Sent to {lead.homeownerEmail ?? lead.homeownerName}</p>
          </div>
          <div className="px-6 py-6">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-sans">{contractBody}</pre>
          </div>
          {signerName && signedAt && (
            <div className="px-6 py-5 border-t border-gray-100 bg-gray-50">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Electronic Signature</p>
              <p className="text-sm font-semibold text-gray-800">{signerName}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Signed on{" "}
                {new Date(signedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                {" at "}
                {new Date(signedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </p>
              <p className="text-xs text-gray-300 mt-1">Electronically signed — valid under the ESIGN Act</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Draft editor view ────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/dashboard/leads/${leadId}`}
            className="text-sm text-gray-400 hover:text-gray-700 shrink-0"
          >
            ← {lead.homeownerName}
          </Link>
          <span className="text-gray-200">/</span>
          <span className="text-sm font-semibold text-gray-700">Contract</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${statusColors[contractStatus]}`}>
            {contractStatus}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleSave}
            disabled={saveStatus === "saving"}
            className="flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {saveStatus === "saved" && <Check className="w-3.5 h-3.5 text-green-500" />}
            {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved" : "Save Draft"}
          </button>
          <button
            onClick={handleSend}
            disabled={sendStatus === "sending"}
            className="flex items-center gap-1.5 text-sm bg-orange-500 text-white px-4 py-1.5 rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50"
          >
            {sendStatus === "sending" ? "Sending..." : sendStatus === "sent" ? <><Check className="w-3.5 h-3.5" /> Sent!</> : <><Send className="w-3.5 h-3.5" /> Send Contract</>}
          </button>
        </div>
      </div>

      {wasVoided && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 flex items-center gap-2">
          <Ban className="w-4 h-4 shrink-0" />
          The previous contract was voided. Create a new contract below.
        </div>
      )}

      {sendStatus === "error" && sendError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {sendError}
        </div>
      )}

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5 items-start">

        {/* LEFT: Editor */}
        <div className="bg-white rounded-[14px] border border-[#E2E8F0] overflow-hidden">
          <div className="px-5 pt-5 pb-3 border-b border-gray-50">
            <p className="text-[.85rem] font-bold text-[#0F1628] uppercase tracking-wide">Contract Body</p>
            <p className="text-xs text-gray-400 mt-1">Edit the contract text below. The homeowner will see exactly this when they receive the signing link.</p>
          </div>
          <div className="p-5">
            <textarea
              value={contractBody}
              onChange={(e) => setContractBody(e.target.value)}
              rows={36}
              className="w-full text-sm text-gray-700 font-mono leading-relaxed border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-y"
            />
          </div>
        </div>

        {/* RIGHT: Preview */}
        <div className="xl:sticky xl:top-6">
          <div className="bg-white rounded-[14px] border border-[#E2E8F0] overflow-hidden">
            <div className="bg-slate-50 border-b border-[#E2E8F0] px-5 py-3 flex items-center gap-2">
              <FileSignature className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Homeowner View</span>
            </div>
            <div className="px-5 py-5 space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Prepared for</p>
                <p className="text-sm font-semibold text-gray-800">{lead.homeownerName}</p>
                {lead.address && <p className="text-xs text-gray-500">{lead.address}</p>}
                {lead.homeownerPhone && <p className="text-xs text-gray-500">{lead.homeownerPhone}</p>}
                {lead.homeownerEmail && <p className="text-xs text-gray-500">{lead.homeownerEmail}</p>}
              </div>
              <div className="border-t border-gray-100 pt-4">
                <p className="text-[.65rem] font-semibold text-gray-300 uppercase tracking-wide mb-2">Contract Preview</p>
                <pre className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed font-sans">
                  {contractBody || <span className="text-gray-300 italic">No contract body yet</span>}
                </pre>
              </div>
              <div className="border-t border-gray-100 pt-4 space-y-2">
                <div className="border border-gray-200 rounded-xl px-3 py-2">
                  <p className="text-xs text-gray-400 mb-1">Your full name</p>
                  <p className="text-sm text-gray-300 italic">Homeowner types here...</p>
                </div>
                <button disabled className="w-full bg-orange-500 text-white text-sm font-semibold py-2.5 rounded-xl opacity-40 cursor-not-allowed">
                  Sign Contract
                </button>
                <p className="text-center text-[.65rem] text-gray-300">Preview only — activates when sent</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
