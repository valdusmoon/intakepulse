"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, FileText, Check, Download, Send, Ban } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type QuoteType = "interior" | "exterior" | "both" | "custom";
type Unit = "sqft" | "lf" | "hr" | "flat" | "ea";
type DiscountType = "flat" | "percent";

interface LineItem {
  id: string;
  name: string;
  description: string;
  quantity: string;
  unit: Unit;
  unitPrice: string;
  totalCents: number;
}

interface Lead {
  id: string;
  homeownerName: string;
  homeownerPhone: string;
  homeownerEmail: string | null;
  address: string | null;
  serviceType: string | null;
  aiEstimateLow: number | null;
  aiEstimateHigh: number | null;
}

interface Company {
  businessName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  businessPhone: string | null;
  businessEmail: string | null;
  websiteUrl: string | null;
  defaultSqftRate: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const UNIT_LABELS: Record<Unit, string> = {
  sqft: "sq ft",
  lf: "lin ft",
  hr: "hr",
  flat: "flat",
  ea: "ea",
};

const QUOTE_TYPE_TEMPLATES: Record<QuoteType, Omit<LineItem, "id" | "totalCents">[]> = {
  interior: [
    { name: "Walls", description: "", quantity: "", unit: "sqft", unitPrice: "" },
    { name: "Ceilings", description: "", quantity: "", unit: "sqft", unitPrice: "" },
    { name: "Trim & Doors", description: "", quantity: "", unit: "lf", unitPrice: "" },
    { name: "Prep Work", description: "Patching, sanding, taping", quantity: "1", unit: "flat", unitPrice: "" },
    { name: "Materials", description: "Paint, primer, supplies", quantity: "1", unit: "flat", unitPrice: "" },
  ],
  exterior: [
    { name: "Siding", description: "", quantity: "", unit: "sqft", unitPrice: "" },
    { name: "Fascia & Soffits", description: "", quantity: "", unit: "lf", unitPrice: "" },
    { name: "Trim", description: "", quantity: "", unit: "lf", unitPrice: "" },
    { name: "Shutters", description: "", quantity: "", unit: "ea", unitPrice: "" },
    { name: "Prep & Power Washing", description: "", quantity: "1", unit: "flat", unitPrice: "" },
    { name: "Materials", description: "Paint, primer, caulk, supplies", quantity: "1", unit: "flat", unitPrice: "" },
  ],
  both: [
    { name: "Interior Walls", description: "", quantity: "", unit: "sqft", unitPrice: "" },
    { name: "Interior Ceilings", description: "", quantity: "", unit: "sqft", unitPrice: "" },
    { name: "Interior Trim", description: "", quantity: "", unit: "lf", unitPrice: "" },
    { name: "Exterior Siding", description: "", quantity: "", unit: "sqft", unitPrice: "" },
    { name: "Exterior Trim & Fascia", description: "", quantity: "", unit: "lf", unitPrice: "" },
    { name: "Prep Work", description: "Patching, sanding, power washing, taping", quantity: "1", unit: "flat", unitPrice: "" },
    { name: "Materials", description: "Paint, primer, caulk, supplies", quantity: "1", unit: "flat", unitPrice: "" },
  ],
  custom: [],
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function makeItems(type: QuoteType): LineItem[] {
  return QUOTE_TYPE_TEMPLATES[type].map((t) => ({ ...t, id: uid(), totalCents: 0 }));
}

function parseDollars(s: string): number {
  const n = parseFloat(s.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

function formatDollars(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency", currency: "USD", maximumFractionDigits: 2,
  });
}

function calcItemTotal(item: LineItem): number {
  const qty = parseFloat(item.quantity) || 0;
  const price = parseDollars(item.unitPrice);
  return Math.round(qty * price * 100);
}

function addDays(date: Date, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[14px] border border-[#E2E8F0] px-5 py-5 space-y-4">
      <p className="text-[.85rem] font-bold text-[#0F1628] uppercase tracking-wide">{title}</p>
      {children}
    </div>
  );
}

function QuoteTypeButton({
  value, current, label, onChange,
}: {
  value: QuoteType; current: QuoteType; label: string;
  onChange: (v: QuoteType) => void;
}) {
  const active = value === current;
  return (
    <button
      onClick={() => onChange(value)}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
        active
          ? "bg-orange-500 text-white border-orange-500"
          : "border-gray-200 text-gray-500 hover:border-orange-300 hover:text-orange-500"
      }`}
    >
      {label}
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function QuotePage() {
  const params = useParams();
  const leadId = params.id as string;

  const today = new Date().toISOString().split("T")[0];

  // Lead + company data
  const [lead, setLead] = useState<Lead | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  // Existing quote id if we loaded one
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [quoteNumber, setQuoteNumber] = useState<string | null>(null);
  const [quoteStatus, setQuoteStatus] = useState<string>("draft");
  const [acceptedAt, setAcceptedAt] = useState<string | null>(null);
  const [declinedAt, setDeclinedAt] = useState<string | null>(null);
  const [wasVoided, setWasVoided] = useState(false);

  // Void state
  const [voidStatus, setVoidStatus] = useState<"idle" | "voiding" | "error">("idle");

  // Save state
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Send state
  const [sendStatus, setSendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [sendError, setSendError] = useState<string | null>(null);

  // Quote state
  const [quoteType, setQuoteType] = useState<QuoteType>("interior");
  const [items, setItems] = useState<LineItem[]>(makeItems("interior"));
  const [discountType, setDiscountType] = useState<DiscountType>("flat");
  const [discountValue, setDiscountValue] = useState("");
  const [taxRate, setTaxRate] = useState("");
  const [issueDate, setIssueDate] = useState(today);
  const [validUntil, setValidUntil] = useState(addDays(new Date(), 30));
  const [message, setMessage] = useState(
    "Thank you for the opportunity to provide this quote. Please don't hesitate to reach out with any questions."
  );
  const [depositNote, setDepositNote] = useState("50% deposit required to schedule.");
  const [internalNotes, setInternalNotes] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/leads/${leadId}`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/company`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/quotes?leadId=${leadId}`).then((r) => r.ok ? r.json() : []),
    ]).then(([leadData, companyData, quotesData]) => {
      if (leadData) {
        setLead(leadData);
        const st = leadData.serviceType;
        if (st === "exterior") setQuoteType("exterior");
        else if (st === "both") setQuoteType("both");
        else setQuoteType("interior");
      }
      if (companyData) setCompany(companyData);

      // Load most recent quote for this lead if it exists (skip voided ones)
      const existing = Array.isArray(quotesData) ? quotesData.find((q: { status: string }) => q.status !== "voided") ?? null : null;
      const latestVoided = !existing && Array.isArray(quotesData) && quotesData[0]?.status === "voided";
      if (latestVoided) setWasVoided(true);

      if (existing) {
        setQuoteId(existing.id);
        setQuoteNumber(existing.quoteNumber);
        setQuoteStatus(existing.status);
        setAcceptedAt(existing.acceptedAt ?? null);
        setDeclinedAt(existing.declinedAt ?? null);
        setQuoteType(existing.quoteType);
        setItems(existing.lineItems.map((li: LineItem) => ({ ...li })));
        setDiscountType(existing.discountType ?? "flat");
        setDiscountValue(existing.discountCents > 0
          ? existing.discountType === "percent"
            ? String(existing.discountCents / 100)
            : String(existing.discountCents / 100)
          : "");
        setTaxRate(existing.taxRateBps > 0 ? String(existing.taxRateBps / 100) : "");
        setIssueDate(existing.issueDate);
        setValidUntil(existing.validUntil);
        setMessage(existing.homeownerMessage ?? "");
        setDepositNote(existing.depositNote ?? "");
        setInternalNotes(existing.internalNotes ?? "");
      }

      setLoading(false);
    });
  }, [leadId]);

  // Pre-populate sqft rate when company loads (only for new quotes)
  useEffect(() => {
    if (!company?.defaultSqftRate || quoteId) return;
    setItems((prev) =>
      prev.map((item) =>
        item.unit === "sqft" && !item.unitPrice
          ? { ...item, unitPrice: company.defaultSqftRate! }
          : item
      )
    );
  }, [company, quoteId]);

  // ── Calculations ────────────────────────────────────────────────────────────

  const subtotalCents = items.reduce((sum, item) => sum + calcItemTotal(item), 0);

  const discountCents = (() => {
    const v = parseDollars(discountValue);
    if (!v) return 0;
    if (discountType === "percent") return Math.round(subtotalCents * (v / 100));
    return Math.round(v * 100);
  })();

  const afterDiscountCents = Math.max(0, subtotalCents - discountCents);

  const taxCents = (() => {
    const rate = parseFloat(taxRate) || 0;
    return Math.round(afterDiscountCents * (rate / 100));
  })();

  const totalCents = afterDiscountCents + taxCents;
  const taxRateBps = Math.round((parseFloat(taxRate) || 0) * 100);

  // ── Payload builder ─────────────────────────────────────────────────────────

  function buildPayload() {
    return {
      leadId,
      quoteType,
      issueDate,
      validUntil,
      lineItems: items.map((item, i) => ({
        ...item,
        sortOrder: i,
        totalCents: calcItemTotal(item),
      })),
      subtotalCents,
      discountType: discountValue && parseDollars(discountValue) > 0 ? discountType : null,
      discountCents,
      taxRateBps,
      taxCents,
      totalCents,
      homeownerMessage: message || null,
      depositNote: depositNote || null,
      internalNotes: internalNotes || null,
    };
  }

  // ── Save ────────────────────────────────────────────────────────────────────

  async function handleSave(status?: "draft" | "sent") {
    setSaveStatus("saving");
    try {
      const payload = { ...buildPayload(), ...(status ? { status } : {}) };
      if (quoteId) {
        await fetch(`/api/quotes/${quoteId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        const res = await fetch("/api/quotes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        setQuoteId(data.id);
        setQuoteNumber(data.quoteNumber);
      }
      setSaveStatus("saved");
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => setSaveStatus("idle"), 2500);
    } catch {
      setSaveStatus("idle");
    }
  }

  // ── Send ─────────────────────────────────────────────────────────────────────

  async function handleSend() {
    setSendStatus("sending");
    setSendError(null);

    // Save first to get a quoteId
    let currentQuoteId = quoteId;
    try {
      const payload = buildPayload();
      if (currentQuoteId) {
        await fetch(`/api/quotes/${currentQuoteId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        const res = await fetch("/api/quotes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        currentQuoteId = data.id;
        setQuoteId(data.id);
        setQuoteNumber(data.quoteNumber);
      }
    } catch {
      setSendStatus("error");
      setSendError("Failed to save quote. Please try again.");
      return;
    }

    // Send
    const res = await fetch(`/api/quotes/${currentQuoteId}/send`, { method: "POST" });
    if (!res.ok) {
      const data = await res.json();
      setSendStatus("error");
      setSendError(data.error ?? "Failed to send quote.");
      return;
    }

    setQuoteStatus("sent");
    setSendStatus("sent");
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => setSendStatus("idle"), 4000);
  }

  async function handleVoid() {
    if (!quoteId) return;
    if (!confirm("Void this quote? The homeowner's link will no longer work. You can create a new quote after.")) return;
    setVoidStatus("voiding");
    const res = await fetch(`/api/quotes/${quoteId}/void`, { method: "POST" });
    if (!res.ok) {
      setVoidStatus("error");
      return;
    }
    // Reset to blank editor so painter can re-quote
    setWasVoided(true);
    setQuoteId(null);
    setQuoteNumber(null);
    setQuoteStatus("draft");
    setAcceptedAt(null);
    setDeclinedAt(null);
    setVoidStatus("idle");
  }

  // ── Line item handlers ──────────────────────────────────────────────────────

  function handleTypeChange(type: QuoteType) {
    setQuoteType(type);
    setItems(makeItems(type));
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { id: uid(), name: "", description: "", quantity: "", unit: "flat", unitPrice: "", totalCents: 0 },
    ]);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function updateItem(id: string, field: keyof LineItem, value: string) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
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

  // ── Read-only view (accepted / declined) ─────────────────────────────────────
  if (quoteStatus === "accepted" || quoteStatus === "declined") {
    const respondedAt = acceptedAt ?? declinedAt;
    const accepted = quoteStatus === "accepted";
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href={`/dashboard/leads/${leadId}`} className="text-sm text-gray-400 hover:text-gray-700 shrink-0">
              ← {lead.homeownerName}
            </Link>
            <span className="text-gray-200">/</span>
            <span className="text-sm font-semibold text-gray-700">{quoteNumber ?? "Quote"}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${accepted ? "bg-green-50 text-green-700" : "bg-red-50 text-red-500"}`}>
              {quoteStatus}
            </span>
          </div>
          {accepted && (
            <button
              onClick={handleVoid}
              disabled={voidStatus === "voiding"}
              className="flex items-center gap-1.5 text-sm text-red-400 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 shrink-0"
            >
              <Ban className="w-3.5 h-3.5" />
              Void Quote
            </button>
          )}
        </div>

        <div className={`border rounded-xl px-4 py-3 flex items-center gap-2 text-sm ${accepted ? "bg-green-50 border-green-200 text-green-700" : "bg-gray-50 border-gray-200 text-gray-600"}`}>
          <Check className="w-4 h-4 shrink-0" />
          {accepted ? "Homeowner accepted this quote." : "Homeowner declined this quote."}
          {respondedAt && (
            <span className="ml-1 text-xs opacity-70">
              {new Date(respondedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              {" at "}
              {new Date(respondedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>

        <div className="bg-white rounded-[14px] border border-[#E2E8F0] overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-900">{quoteNumber}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Issued {issueDate ? new Date(`${issueDate}T12:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—"}
                {" · "}
                Valid until {validUntil ? new Date(`${validUntil}T12:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—"}
              </p>
            </div>
            <p className="text-xl font-bold text-gray-900">{formatDollars(totalCents)}</p>
          </div>

          <div className="px-6 py-5 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Line Items</p>
            <div className="divide-y divide-gray-50">
              {items.map((item) => {
                const total = calcItemTotal(item);
                return (
                  <div key={item.id} className="grid grid-cols-[1fr_80px] gap-2 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.name}</p>
                      {item.description && <p className="text-xs text-gray-400">{item.description}</p>}
                      {parseFloat(item.quantity) > 0 && parseDollars(item.unitPrice) > 0 && item.unit !== "flat" && (
                        <p className="text-xs text-gray-400">{item.quantity} {UNIT_LABELS[item.unit]} × ${parseDollars(item.unitPrice).toFixed(2)}</p>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-gray-700 text-right">{total > 0 ? formatDollars(total) : "—"}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="px-6 py-5 border-b border-gray-100">
            <div className="max-w-[200px] ml-auto space-y-1.5">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span><span>{formatDollars(subtotalCents)}</span>
              </div>
              {discountCents > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span><span>− {formatDollars(discountCents)}</span>
                </div>
              )}
              {taxCents > 0 && (
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Tax ({taxRate}%)</span><span>{formatDollars(taxCents)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total</span><span className="text-lg">{formatDollars(totalCents)}</span>
              </div>
            </div>
          </div>

          {(message || depositNote) && (
            <div className="px-6 py-5 space-y-3">
              {message && <p className="text-sm text-gray-500 leading-relaxed">{message}</p>}
              {depositNote && (
                <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3">
                  <p className="text-sm text-orange-700">{depositNote}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {quoteId && (
          <a
            href={`/api/quotes/${quoteId}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download PDF
          </a>
        )}
      </div>
    );
  }

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
          <span className="text-sm font-semibold text-gray-700">
            {quoteNumber ?? "New Quote"}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {quoteStatus === "sent" && (
            <button
              onClick={handleVoid}
              disabled={voidStatus === "voiding"}
              className="flex items-center gap-1.5 text-sm text-red-400 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <Ban className="w-3.5 h-3.5" />
              Void
            </button>
          )}
          <button
            onClick={() => handleSave("draft")}
            disabled={saveStatus === "saving"}
            className="flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {saveStatus === "saved" && <Check className="w-3.5 h-3.5 text-green-500" />}
            {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved" : "Save Draft"}
          </button>
          {quoteId && (
            <a
              href={`/api/quotes/${quoteId}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              PDF
            </a>
          )}
          <button
            onClick={handleSend}
            disabled={sendStatus === "sending" || quoteStatus === "accepted" || quoteStatus === "declined"}
            className="flex items-center gap-1.5 text-sm bg-orange-500 text-white px-4 py-1.5 rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sendStatus === "sending" ? (
              "Sending..."
            ) : sendStatus === "sent" ? (
              <><Check className="w-3.5 h-3.5" /> Sent!</>
            ) : (
              <><Send className="w-3.5 h-3.5" /> {quoteStatus === "sent" ? "Resend" : "Send Quote"}</>
            )}
          </button>
        </div>
      </div>

      {/* Voided notice */}
      {wasVoided && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 flex items-center gap-2">
          <Ban className="w-4 h-4 shrink-0" />
          The previous quote was voided. Create a new quote below.
        </div>
      )}

      {/* Send error / void error */}
      {sendStatus === "error" && sendError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {sendError}
        </div>
      )}
      {voidStatus === "error" && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          Failed to void quote. Please try again.
        </div>
      )}

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-5 items-start">

        {/* ── LEFT: Editor ──────────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Quote type */}
          <Section title="Quote Type">
            <div className="flex flex-wrap gap-2">
              <QuoteTypeButton value="interior" current={quoteType} label="Interior" onChange={handleTypeChange} />
              <QuoteTypeButton value="exterior" current={quoteType} label="Exterior" onChange={handleTypeChange} />
              <QuoteTypeButton value="both" current={quoteType} label="Interior + Exterior" onChange={handleTypeChange} />
              <QuoteTypeButton value="custom" current={quoteType} label="Custom" onChange={handleTypeChange} />
            </div>
            {quoteType !== "custom" && (
              <p className="text-xs text-gray-400">Template loaded — edit line items as needed.</p>
            )}
          </Section>

          {/* Line items */}
          <div className="bg-white rounded-[14px] border border-[#E2E8F0] overflow-hidden">
            <div className="px-5 pt-5 pb-3">
              <p className="text-[.85rem] font-bold text-[#0F1628] uppercase tracking-wide">Line Items</p>
            </div>

            <div className="hidden sm:grid grid-cols-[1fr_80px_90px_90px_80px_32px] gap-2 px-5 pb-2 text-[.7rem] font-semibold text-gray-400 uppercase tracking-wide">
              <span>Description</span>
              <span>Qty</span>
              <span>Unit</span>
              <span>Unit Price</span>
              <span className="text-right">Total</span>
              <span />
            </div>

            <div className="divide-y divide-gray-50">
              {items.map((item) => {
                const total = calcItemTotal(item);
                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-1 sm:grid-cols-[1fr_80px_90px_90px_80px_32px] gap-2 px-5 py-3 items-start"
                  >
                    <div className="space-y-1">
                      <input
                        value={item.name}
                        onChange={(e) => updateItem(item.id, "name", e.target.value)}
                        placeholder="Line item name"
                        className="w-full text-sm font-medium text-gray-800 border-0 border-b border-transparent hover:border-gray-200 focus:border-orange-400 focus:outline-none bg-transparent py-0.5 transition-colors"
                      />
                      <input
                        value={item.description}
                        onChange={(e) => updateItem(item.id, "description", e.target.value)}
                        placeholder="Description (optional)"
                        className="w-full text-xs text-gray-400 border-0 border-b border-transparent hover:border-gray-100 focus:border-orange-300 focus:outline-none bg-transparent py-0.5 transition-colors"
                      />
                    </div>

                    <input
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                      placeholder="0"
                      type="number"
                      min="0"
                      className="text-sm text-gray-700 text-right border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-400 w-full"
                    />

                    <select
                      value={item.unit}
                      onChange={(e) => updateItem(item.id, "unit", e.target.value)}
                      className="text-sm text-gray-600 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-400 w-full bg-white"
                    >
                      {(Object.keys(UNIT_LABELS) as Unit[]).map((u) => (
                        <option key={u} value={u}>{UNIT_LABELS[u]}</option>
                      ))}
                    </select>

                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                      <input
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, "unitPrice", e.target.value)}
                        placeholder="0.00"
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg pl-6 pr-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-400"
                      />
                    </div>

                    <div className="text-sm font-semibold text-gray-800 text-right py-1.5 hidden sm:block">
                      {total > 0 ? formatDollars(total) : "—"}
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 text-gray-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 self-center justify-self-end"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="px-5 py-3 border-t border-gray-50">
              <button
                onClick={addItem}
                className="flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-600 font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add line item
              </button>
            </div>
          </div>

          {/* Totals */}
          <Section title="Totals">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-500 w-24 shrink-0">Discount</label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                  className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-400 bg-white"
                >
                  <option value="flat">$ flat</option>
                  <option value="percent">% percent</option>
                </select>
                <div className="relative flex-1">
                  {discountType === "flat" && (
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  )}
                  <input
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder="0"
                    type="number"
                    min="0"
                    className={`w-full text-sm border border-gray-200 rounded-lg py-1.5 pr-2 focus:outline-none focus:ring-1 focus:ring-orange-400 ${discountType === "flat" ? "pl-6" : "pl-3"}`}
                  />
                  {discountType === "percent" && (
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-500 w-24 shrink-0">Tax rate</label>
                <div className="relative flex-1">
                  <input
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    placeholder="0"
                    type="number"
                    min="0"
                    max="30"
                    step="0.01"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 pr-8 focus:outline-none focus:ring-1 focus:ring-orange-400"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                </div>
              </div>
            </div>
          </Section>

          {/* Quote details */}
          <Section title="Quote Details">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Valid Until</label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Message to Homeowner</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Deposit Note <span className="text-gray-300">(optional)</span>
                </label>
                <input
                  value={depositNote}
                  onChange={(e) => setDepositNote(e.target.value)}
                  placeholder="e.g. 50% deposit required to schedule"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-400"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Internal Notes <span className="text-gray-300">(not shown to homeowner)</span>
                </label>
                <textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  rows={2}
                  placeholder="Notes for yourself..."
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-400 resize-none"
                />
              </div>
            </div>
          </Section>
        </div>

        {/* ── RIGHT: Live Preview ────────────────────────────────────────────── */}
        <div className="xl:sticky xl:top-6">
          <div className="bg-white rounded-[14px] border border-[#E2E8F0] overflow-hidden">
            <div className="bg-slate-50 border-b border-[#E2E8F0] px-5 py-3 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Quote Preview</span>
            </div>

            <div className="px-6 py-6 space-y-5">
              {/* Company + quote number */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-bold text-gray-900 text-base leading-tight">
                    {company?.businessName || "Your Business"}
                  </p>
                  {company?.businessPhone && <p className="text-xs text-gray-400 mt-0.5">{company.businessPhone}</p>}
                  {company?.businessEmail && <p className="text-xs text-gray-400">{company.businessEmail}</p>}
                  {company?.websiteUrl && <p className="text-xs text-gray-400">{company.websiteUrl}</p>}
                </div>
                <div className="text-right">
                  <p className="text-[.6rem] font-bold text-gray-400 uppercase tracking-widest">Quote</p>
                  <p className="text-xs font-bold text-gray-600">{quoteNumber ?? "CC-—"}</p>
                  <p className="text-[.7rem] text-gray-400 mt-1">
                    Issued {issueDate
                      ? new Date(`${issueDate}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : "—"}
                  </p>
                  <p className="text-[.7rem] text-gray-400">
                    Valid until {validUntil
                      ? new Date(`${validUntil}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : "—"}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-100" />

              {/* Homeowner */}
              <div>
                <p className="text-[.65rem] font-semibold text-gray-400 uppercase tracking-wide mb-1">Prepared for</p>
                <p className="text-sm font-semibold text-gray-800">{lead.homeownerName}</p>
                {lead.address && <p className="text-xs text-gray-500">{lead.address}</p>}
                {lead.homeownerPhone && <p className="text-xs text-gray-500">{lead.homeownerPhone}</p>}
                {lead.homeownerEmail && <p className="text-xs text-gray-500">{lead.homeownerEmail}</p>}
              </div>

              {/* Line items */}
              {items.length > 0 && (
                <div className="space-y-1">
                  <div className="grid grid-cols-[1fr_60px] gap-2 text-[.6rem] font-semibold text-gray-400 uppercase tracking-wide pb-1 border-b border-gray-100">
                    <span>Item</span>
                    <span className="text-right">Total</span>
                  </div>
                  {items.map((item) => {
                    const total = calcItemTotal(item);
                    const hasDetails = item.quantity && parseFloat(item.quantity) > 0 && parseDollars(item.unitPrice) > 0;
                    return (
                      <div key={item.id} className="grid grid-cols-[1fr_60px] gap-2 py-1">
                        <div>
                          <p className="text-xs font-medium text-gray-800 leading-tight">
                            {item.name || <span className="text-gray-300 italic">Untitled</span>}
                          </p>
                          {item.description && (
                            <p className="text-[.65rem] text-gray-400 leading-tight">{item.description}</p>
                          )}
                          {hasDetails && item.unit !== "flat" && (
                            <p className="text-[.65rem] text-gray-400">
                              {item.quantity} {UNIT_LABELS[item.unit]} × ${parseDollars(item.unitPrice).toFixed(2)}
                            </p>
                          )}
                        </div>
                        <div className="text-xs font-semibold text-gray-700 text-right self-start pt-0.5">
                          {total > 0 ? formatDollars(total) : "—"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Totals */}
              <div className="space-y-1.5 border-t border-gray-100 pt-3">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatDollars(subtotalCents)}</span>
                </div>
                {discountCents > 0 && (
                  <div className="flex justify-between text-xs text-green-600">
                    <span>Discount {discountType === "percent" ? `(${discountValue}%)` : ""}</span>
                    <span>− {formatDollars(discountCents)}</span>
                  </div>
                )}
                {taxCents > 0 && (
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Tax ({taxRate}%)</span>
                    <span>{formatDollars(taxCents)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-gray-900 pt-1.5 border-t border-gray-200">
                  <span className="text-sm">Total</span>
                  <span className="text-base">{formatDollars(totalCents)}</span>
                </div>
              </div>

              {message && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-[.7rem] text-gray-500 leading-relaxed">{message}</p>
                </div>
              )}

              {depositNote && (
                <div className="rounded-lg bg-orange-50 border border-orange-100 px-3 py-2">
                  <p className="text-[.7rem] text-orange-700">{depositNote}</p>
                </div>
              )}

              <div className="border-t border-gray-100 pt-4 space-y-2">
                <button disabled className="w-full bg-orange-500 text-white text-sm font-semibold py-2.5 rounded-xl opacity-60 cursor-not-allowed">
                  Accept Quote
                </button>
                <button disabled className="w-full border border-gray-200 text-gray-400 text-sm py-2 rounded-xl cursor-not-allowed">
                  Decline
                </button>
                <p className="text-center text-[.65rem] text-gray-300">Preview only — buttons activate when sent</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
