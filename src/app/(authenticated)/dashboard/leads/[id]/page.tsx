"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, AlertTriangle, Trophy, ArrowRight } from "lucide-react";
import JobPhotosSection from "./job-photos";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Lead {
  id: string;
  homeownerName: string;
  homeownerEmail: string | null;
  homeownerPhone: string;
  address: string | null;
  serviceType: string | null;
  description: string | null;
  preferredTimeline: string | null;
  status: string;
  aiEstimateLow: number | null;
  aiEstimateHigh: number | null;
  aiConfidence: string | null;
  aiPhotoSummary: string | null;
  quotedAmount: number | null;
  notes: string | null;
  scheduledAt: string | null;
  scheduledEndAt: string | null;
  scheduledNote: string | null;
  scheduledType: string | null;
  staffId: string | null;
  createdAt: string;
}

interface StaffMember {
  id: string;
  name: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

const STATUS_OPTIONS = [
  { value: "new",       label: "New",       color: "bg-blue-50 text-blue-700" },
  { value: "contacted", label: "Contacted", color: "bg-yellow-50 text-yellow-700" },
  { value: "quoted",    label: "Quoted",    color: "bg-purple-50 text-purple-700" },
  { value: "scheduled", label: "Scheduled", color: "bg-indigo-50 text-indigo-700" },
  { value: "won",       label: "Won",       color: "bg-green-50 text-green-700" },
  { value: "completed", label: "Completed", color: "bg-teal-50 text-teal-700" },
  { value: "lost",      label: "Lost",      color: "bg-gray-100 text-gray-500" },
];

const SERVICE_LABELS: Record<string, string> = {
  interior: "Interior", exterior: "Exterior",
  both: "Interior + Exterior", other: "Other",
};

const TIMELINE_LABELS: Record<string, string> = {
  asap: "ASAP",
  within_2_weeks: "Within 2 weeks",
  within_month: "Within a month",
  flexible: "Flexible / just exploring",
};

const CONF_STYLES: Record<string, string> = {
  high: "text-green-600 bg-green-50",
  medium: "text-yellow-700 bg-yellow-50",
  low: "text-orange-600 bg-orange-50",
};

// ─── Request details button ───────────────────────────────────────────────────

function RequestDetailsButton({ leadId, hasEmail, onContacted }: { leadId: string; hasEmail: boolean; onContacted: () => void }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSend() {
    setSending(true);
    try {
      await fetch(`/api/leads/${leadId}/request-details`, { method: "POST" });
      setSent(true);
      onContacted();
    } catch {
      // silent
    }
    setSending(false);
  }

  if (!hasEmail) return null;

  return (
    <button
      onClick={handleSend}
      disabled={sending || sent}
      className="text-sm text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
    >
      {sent ? "✓ Sent" : sending ? "Sending..." : "Request project details"}
    </button>
  );
}

// ─── Delete button ────────────────────────────────────────────────────────────

function DeleteButton({ leadId, onDeleted }: { leadId: string; onDeleted: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await fetch(`/api/leads/${leadId}`, { method: "DELETE" });
      onDeleted();
    } catch {
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Delete this lead?</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
        >
          {deleting ? "Deleting..." : "Yes, delete"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-sm text-gray-400 hover:text-red-500 transition-colors"
    >
      Delete
    </button>
  );
}

// ─── Quote + Contract summary ─────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  draft:    "bg-gray-100 text-gray-500",
  sent:     "bg-blue-50 text-blue-600",
  accepted: "bg-green-50 text-green-700",
  declined: "bg-red-50 text-red-500",
  expired:  "bg-amber-50 text-amber-600",
  signed:   "bg-green-50 text-green-700",
  void:     "bg-gray-100 text-gray-400",
  voided:   "bg-gray-100 text-gray-400",
};

function QuoteContractSummary({ leadId }: { leadId: string }) {
  const [quote, setQuote] = useState<{ id: string; quoteNumber: string; status: string; totalCents: number } | null>(null);
  const [contract, setContract] = useState<{ id: string; status: string; signerName: string | null } | null>(null);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_FEATURE_QUOTES !== "true") return;
    fetch(`/api/quotes?leadId=${leadId}`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        if (Array.isArray(data)) {
          const active = data.find((q: { status: string }) => q.status !== "voided");
          if (active) setQuote(active);
        }
      })
      .catch(() => {});

    if (process.env.NEXT_PUBLIC_FEATURE_CONTRACTS !== "true") return;
    fetch(`/api/contracts?leadId=${leadId}`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        if (Array.isArray(data)) {
          const active = data.find((c: { status: string }) => c.status !== "void");
          if (active) setContract(active);
        }
      })
      .catch(() => {});
  }, [leadId]);

  if (!quote && !contract) return null;

  return (
    <div className="bg-white rounded-[14px] border border-[#E2E8F0] px-5 py-5 space-y-3">
      <p className="text-[.9rem] font-bold text-[#0F1628]" style={{ fontFamily: "var(--font-sora)" }}>Documents</p>
      {quote && (
        <Link
          href={`/dashboard/leads/${leadId}/quote`}
          className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50/30 transition-colors group"
        >
          <div className="flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-gray-400 group-hover:text-orange-400 transition-colors" />
            <div>
              <p className="text-sm font-semibold text-gray-800">{quote.quoteNumber}</p>
              <p className="text-xs text-gray-400">
                {(quote.totalCents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[quote.status] ?? "bg-gray-100 text-gray-500"}`}>
            {quote.status}
          </span>
        </Link>
      )}
      {contract && (
        <Link
          href={`/dashboard/leads/${leadId}/contract`}
          className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50/30 transition-colors group"
        >
          <div className="flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-gray-400 group-hover:text-orange-400 transition-colors" />
            <div>
              <p className="text-sm font-semibold text-gray-800">Contract</p>
              {contract.signerName && (
                <p className="text-xs text-gray-400">Signed by {contract.signerName}</p>
              )}
            </div>
          </div>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[contract.status] ?? "bg-gray-100 text-gray-500"}`}>
            {contract.status}
          </span>
        </Link>
      )}
    </div>
  );
}

// ─── Next step banner ─────────────────────────────────────────────────────────

type BannerColor = "blue" | "purple" | "orange" | "green" | "teal";

const BANNER_STYLES: Record<BannerColor, string> = {
  blue:   "border-blue-400 bg-blue-50 text-blue-900",
  purple: "border-purple-400 bg-purple-50 text-purple-900",
  orange: "border-orange-400 bg-orange-50 text-orange-900",
  green:  "border-green-500 bg-green-50 text-green-900",
  teal:   "border-teal-500 bg-teal-50 text-teal-900",
};

const HINT_STYLES: Record<BannerColor, string> = {
  blue:   "text-blue-700",
  purple: "text-purple-700",
  orange: "text-orange-700",
  green:  "text-green-700",
  teal:   "text-teal-700",
};

function getNextStep(lead: Lead): { message: string; hint: string; color: BannerColor; href?: string } | null {
  const now = new Date();

  switch (lead.status) {
    case "new":
      return {
        color: "blue",
        message: "New lead — reach out to this homeowner.",
        hint: "Change status to Contacted after you call or text.",
      };
    case "contacted":
      return {
        color: "purple",
        message: "Ready to send a quote?",
        hint: "Open the Quote builder above to send a professional quote.",
      };
    case "quoted":
      if ((lead as any)._quoteAccepted) {
        return {
          color: "orange",
          message: "Quote accepted — send the contract to lock it in.",
          hint: "Open the Contract builder above to send a contract for signature.",
        };
      }
      return {
        color: "purple",
        message: "Quote sent — waiting on the homeowner's response.",
        hint: "You'll be notified by email and SMS when they accept or decline.",
      };
    case "won":
      if (!lead.scheduledAt) {
        return {
          color: "orange",
          message: "Contract signed — schedule the job.",
          hint: "Set the job date in the Schedule section on the right.",
        };
      }
      if (new Date(lead.scheduledAt) <= now) {
        return {
          color: "teal",
          message: "Job date has passed — mark it Complete when the work is done.",
          hint: "Marking Complete sends the homeowner a review request automatically.",
        };
      }
      return {
        color: "green",
        message: `Job scheduled — you're all set.`,
        hint: "Upload before, progress, and after photos as you work.",
      };
    case "scheduled":
      if (lead.scheduledAt && new Date(lead.scheduledAt) <= now) {
        return {
          color: "teal",
          message: "Job date has passed — mark it Complete when the work is done.",
          hint: "Marking Complete sends the homeowner a review request automatically.",
        };
      }
      return {
        color: "green",
        message: "Job is scheduled.",
        hint: "Upload before, progress, and after photos as you work.",
      };
    default:
      return null;
  }
}

function NextStepBanner({ lead }: { lead: Lead }) {
  const [quoteStatus, setQuoteStatus] = useState<string | null>(null);

  useEffect(() => {
    if (lead.status === "quoted") {
      fetch(`/api/quotes?leadId=${lead.id}`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (Array.isArray(data) && data.length) setQuoteStatus(data[0].status);
        })
        .catch(() => {});
    }
  }, [lead.id, lead.status]);

  const effectiveLead = lead.status === "quoted" && quoteStatus === "accepted"
    ? { ...lead, _quoteAccepted: true }
    : lead;
  const step = getNextStep(effectiveLead as Lead);
  if (!step) return null;

  const containerClass = `border-l-4 rounded-r-xl px-4 py-3 ${BANNER_STYLES[step.color]}`;
  const hintClass = `text-xs mt-0.5 ${HINT_STYLES[step.color]}`;

  const content = (
    <div className={containerClass}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{step.message}</p>
          <p className={hintClass}>{step.hint}</p>
        </div>
        {step.href && <ArrowRight className="w-4 h-4 shrink-0 mt-0.5 opacity-60" />}
      </div>
    </div>
  );

  if (step.href) {
    return <Link href={step.href}>{content}</Link>;
  }
  return content;
}

// ─── Status selector ──────────────────────────────────────────────────────────

function StatusSelector({
  leadId,
  current,
  homeownerName,
  homeownerEmail,
  onChange,
}: {
  leadId: string;
  current: string;
  homeownerName: string;
  homeownerEmail: string | null;
  onChange: (s: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [confirmCompleted, setConfirmCompleted] = useState(false);

  async function applyStatus(newStatus: string) {
    setSaving(true);
    try {
      await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      onChange(newStatus);
    } catch {
      // silent fail
    }
    setSaving(false);
  }

  function handleClick(newStatus: string) {
    if (newStatus === current) return;
    if (newStatus === "completed") {
      setConfirmCompleted(true);
      return;
    }
    applyStatus(newStatus);
  }

  const current_ = STATUS_OPTIONS.find((s) => s.value === current);

  return (
    <>
      {/* Confirmation modal for Completed */}
      {confirmCompleted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <div>
              <p className="text-base font-bold text-gray-900">Mark job as complete?</p>
              <p className="text-sm text-gray-500 mt-1">
                {homeownerEmail
                  ? <>A review request email will be sent to <span className="font-medium text-gray-700">{homeownerName}</span> automatically.</>
                  : <>No homeowner email on file — review request won&apos;t be sent. You can add one on this page.</>
                }
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmCompleted(false)}
                className="flex-1 border border-gray-200 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { setConfirmCompleted(false); applyStatus("completed"); }}
                disabled={saving}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Yes, mark complete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleClick(opt.value)}
            disabled={saving}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              current === opt.value
                ? `${opt.color} border-transparent ring-2 ring-offset-1 ${opt.color.includes("blue") ? "ring-blue-400" : opt.color.includes("yellow") ? "ring-yellow-400" : opt.color.includes("purple") ? "ring-purple-400" : opt.color.includes("indigo") ? "ring-indigo-400" : opt.color.includes("teal") ? "ring-teal-400" : opt.color.includes("green") ? "ring-green-400" : "ring-gray-400"}`
                : "border-gray-200 text-gray-500 hover:border-gray-400"
            } disabled:opacity-50`}
          >
            {opt.label}
          </button>
        ))}
        {saving && <span className="text-xs text-gray-400 self-center">Saving...</span>}
        {current_ && !saving && <span className="text-xs text-gray-400 self-center">Current: {current_.label}</span>}
      </div>

      {/* Won vs Completed helper */}
      <div className="mt-2 space-y-0.5">
        <p className="text-xs text-gray-400">
          <span className="font-medium text-gray-500">Won</span> — contract signed.{" "}
          <span className="font-medium text-gray-500">Completed</span> — job physically done. Mark Completed to send the review request automatically.
        </p>
      </div>
    </>
  );
}

// ─── Notes editor ─────────────────────────────────────────────────────────────

function NotesEditor({ leadId, initialNotes }: { leadId: string; initialNotes: string | null }) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // silent fail
    }
    setSaving(false);
  }

  return (
    <div className="space-y-2">
      <textarea
        value={notes}
        onChange={(e) => { setNotes(e.target.value); setSaved(false); }}
        rows={4}
        placeholder="Add private notes about this lead..."
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className="text-sm bg-white text-[#0F1628] border border-[#CBD5E1] hover:border-slate-400 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 font-semibold"
      >
        {saved ? "Saved!" : saving ? "Saving..." : "Save notes"}
      </button>
    </div>
  );
}

// ─── Email banner ─────────────────────────────────────────────────────────────

function EmailBanner({ leadId, onSaved }: { leadId: string; onSaved: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Enter a valid email address.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homeownerEmail: trimmed }),
      });
      if (!res.ok) throw new Error();
      onSaved(trimmed);
    } catch {
      setError("Failed to save. Try again.");
    }
    setSaving(false);
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-[14px] px-5 py-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="flex-1 space-y-3">
          <div>
            <p className="text-sm font-semibold text-amber-800">No email on file</p>
            <p className="text-xs text-amber-600 mt-0.5">You won&apos;t be able to send quotes or contracts without a homeowner email.</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="homeowner@email.com"
              className="flex-1 text-sm border border-amber-300 bg-white rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-gray-300"
            />
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-sm font-semibold bg-amber-500 text-white px-3 py-1.5 rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 shrink-0"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Mark as won ──────────────────────────────────────────────────────────────

function MarkWonButton({ leadId, onWon }: { leadId: string; onWon: (amount: number | null) => void }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const amountCents = amount ? Math.round(parseFloat(amount) * 100) : null;
    try {
      await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "won",
          ...(amountCents !== null ? { quotedAmount: amountCents } : {}),
        }),
      });
      onWon(amountCents);
      setOpen(false);
      setAmount("");
    } catch {
      // silent fail
    }
    setSaving(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm text-green-600 border border-green-200 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors font-medium"
      >
        <Trophy className="w-3.5 h-3.5" />
        Mark as won
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
      <Trophy className="w-3.5 h-3.5 text-green-600 shrink-0" />
      <div className="relative">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
        <input
          type="number"
          min="0"
          placeholder="Job amount (optional)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg pl-5 pr-2 py-1 w-40 focus:outline-none focus:ring-1 focus:ring-green-400"
          autoFocus
        />
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="text-sm bg-green-600 text-white px-3 py-1 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save"}
      </button>
      <button
        onClick={() => { setOpen(false); setAmount(""); }}
        className="text-sm text-gray-400 hover:text-gray-600 px-1"
      >
        ✕
      </button>
    </div>
  );
}

// ─── Schedule section ─────────────────────────────────────────────────────────

function ScheduleSection({
  leadId,
  initialScheduledAt,
  initialScheduledEndAt,
  initialScheduledNote,
  initialScheduledType,
  initialStaffId,
  homeownerEmail,
  onSaved,
}: {
  leadId: string;
  initialScheduledAt: string | null;
  initialScheduledEndAt: string | null;
  initialScheduledNote: string | null;
  initialScheduledType: string | null;
  initialStaffId: string | null;
  homeownerEmail: string | null;
  onSaved?: (scheduledAt: string | null, isJobAppointment: boolean) => void;
}) {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [startDate, setStartDate] = useState(initialScheduledAt ? initialScheduledAt.slice(0, 10) : "");
  const [startTime, setStartTime] = useState(
    initialScheduledAt
      ? new Date(initialScheduledAt).toTimeString().slice(0, 5)
      : "08:00"
  );
  const [endDate, setEndDate] = useState(initialScheduledEndAt ? initialScheduledEndAt.slice(0, 10) : "");
  const [endTime, setEndTime] = useState(
    initialScheduledEndAt
      ? new Date(initialScheduledEndAt).toTimeString().slice(0, 5)
      : "16:00"
  );
  const [note, setNote] = useState(initialScheduledNote ?? "");
  const [appointmentType, setAppointmentType] = useState<"quote" | "job" | "other">(
    (initialScheduledType as "quote" | "job" | "other") ?? "quote"
  );
  const [staffId, setStaffId] = useState(initialStaffId ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sendConfirmation, setSendConfirmation] = useState(true);

  useEffect(() => {
    fetch("/api/staff")
      .then((r) => r.ok ? r.json() : [])
      .then(setStaffList)
      .catch(() => {});
  }, []);

  async function handleSave() {
    setSaving(true);
    const scheduledAt = startDate ? new Date(`${startDate}T${startTime || "08:00"}`).toISOString() : null;
    const effectiveEndDate = endDate || startDate;
    const scheduledEndAt = startDate && endTime ? new Date(`${effectiveEndDate}T${endTime}`).toISOString() : null;
    await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scheduledAt,
        scheduledEndAt,
        scheduledNote: note.trim() || null,
        scheduledType: appointmentType,
        staffId: staffId || null,
        ...(scheduledAt && appointmentType === "job" ? { status: "scheduled" } : {}),
      }),
    });
    if (scheduledAt && sendConfirmation && homeownerEmail) {
      fetch(`/api/leads/${leadId}/send-schedule`, { method: "POST" }).catch(() => {});
    }
    setSaving(false);
    setSaved(true);
    onSaved?.(scheduledAt, appointmentType === "job");
    setTimeout(() => setSaved(false), 2000);
  }

  const scheduledDate = initialScheduledAt ? new Date(initialScheduledAt) : null;
  const scheduledEndDate = initialScheduledEndAt ? new Date(initialScheduledEndAt) : null;
  const isMultiDay = scheduledDate && scheduledEndDate
    ? scheduledDate.toDateString() !== scheduledEndDate.toDateString()
    : false;

  return (
    <div className="bg-white rounded-[14px] border border-[#E2E8F0] px-5 py-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[.9rem] font-bold text-[#0F1628]" style={{ fontFamily: "var(--font-sora)" }}>Schedule</p>
          <p className="text-xs text-gray-400 mt-0.5">Quote visit, job start, or any appointment</p>
        </div>
        {scheduledDate && (
          <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-medium">
            {isMultiDay && scheduledEndDate
              ? `${scheduledDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${scheduledEndDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
              : `${scheduledDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${scheduledDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`}
          </span>
        )}
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-1 p-1 bg-gray-100 rounded-xl">
          {(["quote", "job", "other"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setAppointmentType(type)}
              className={`text-xs font-semibold py-2 rounded-lg transition-colors ${
                appointmentType === type
                  ? "bg-white text-[#0F1628] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {type === "quote" ? "Quote visit" : type === "job" ? "Job start" : "Other"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">End date <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Start time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">End time</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Note <span className="text-gray-400 font-normal">(optional)</span></label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Quote visit, Exterior job, Day 2..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        {staffList.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Assigned crew</label>
            <select
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
            >
              <option value="">Unassigned</option>
              {staffList.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        )}

        {startDate && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={sendConfirmation}
              onChange={(e) => setSendConfirmation(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-xs text-gray-600">
              {homeownerEmail
                ? "Send homeowner a confirmation email"
                : <span>Send confirmation <span className="text-gray-400">(no email on file)</span></span>}
            </span>
          </label>
        )}

        <button
          onClick={handleSave}
          disabled={saving || !startDate}
          className="w-full text-sm bg-white text-[#0F1628] border border-[#CBD5E1] hover:border-slate-400 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 font-semibold"
        >
          {saved ? "Saved!" : saving ? "Saving..." : "Save schedule"}
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [photos, setPhotos] = useState<{ id: string; url: string; photoType: string }[]>([]);

  useEffect(() => {
    fetch(`/api/leads/${leadId}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => { if (data) setLead(data); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [leadId]);

  useEffect(() => {
    fetch(`/api/leads/${leadId}/photos`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.photos) setPhotos(data.photos); })
      .catch(() => {});
  }, [leadId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 rounded-full animate-spin" style={{ border: "2px solid #e5e7eb", borderTopColor: "#f97316" }} />
      </div>
    );
  }

  if (notFound || !lead) {
    return (
      <div className="text-center py-20 text-gray-400 text-sm">
        Lead not found.{" "}
        <Link href="/dashboard/leads" className="underline text-gray-600">Back to leads</Link>
      </div>
    );
  }

  const receivedAt = new Date(lead.createdAt).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });

  const hasEmail = !!lead.homeownerEmail;

  return (
    <div className="space-y-5">
      {/* Back + header */}
      <Link href="/dashboard/leads" className="text-sm text-gray-400 hover:text-gray-700 flex items-center gap-1">
        ← All leads
      </Link>

      {/* Email banner — shown when no email on file */}
      {!hasEmail && (
        <EmailBanner
          leadId={lead.id}
          onSaved={(email) => setLead((prev) => prev ? { ...prev, homeownerEmail: email } : prev)}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-[1.4rem] font-extrabold tracking-tight text-[#0F1628]" style={{ fontFamily: "var(--font-sora)" }}>{lead.homeownerName}</h1>
          <p className="text-sm text-slate-400 mt-0.5">Received {receivedAt}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!["won", "lost"].includes(lead.status) && (
            <MarkWonButton
              leadId={lead.id}
              onWon={(amountCents) =>
                setLead((prev) => prev
                  ? { ...prev, status: "won", ...(amountCents !== null ? { quotedAmount: amountCents } : {}) }
                  : prev)
              }
            />
          )}
          <RequestDetailsButton
            leadId={lead.id}
            hasEmail={!!lead.homeownerEmail && !lead.description}
            onContacted={() => setLead((prev) => prev?.status === "new" ? { ...prev, status: "contacted" } : prev)}
          />
          {process.env.NEXT_PUBLIC_FEATURE_QUOTES === "true" && (
            <>
              {hasEmail ? (
                <Link
                  href={`/dashboard/leads/${lead.id}/quote`}
                  className="flex items-center gap-1.5 text-sm bg-white text-[#0F1628] border border-[#CBD5E1] hover:border-orange-400 hover:text-orange-500 px-3 py-1.5 rounded-lg transition-colors font-semibold"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Quote
                </Link>
              ) : (
                <span
                  title="Add homeowner email first"
                  className="flex items-center gap-1.5 text-sm bg-white text-gray-300 border border-gray-100 px-3 py-1.5 rounded-lg font-semibold cursor-not-allowed select-none"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Quote
                </span>
              )}
              {process.env.NEXT_PUBLIC_FEATURE_CONTRACTS === "true" && (
                hasEmail ? (
                  <Link
                    href={`/dashboard/leads/${lead.id}/contract`}
                    className="flex items-center gap-1.5 text-sm bg-white text-[#0F1628] border border-[#CBD5E1] hover:border-orange-400 hover:text-orange-500 px-3 py-1.5 rounded-lg transition-colors font-semibold"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Contract
                  </Link>
                ) : (
                  <span
                    title="Add homeowner email first"
                    className="flex items-center gap-1.5 text-sm bg-white text-gray-300 border border-gray-100 px-3 py-1.5 rounded-lg font-semibold cursor-not-allowed select-none"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Contract
                  </span>
                )
              )}
            </>
          )}
          <DeleteButton leadId={lead.id} onDeleted={() => router.push("/dashboard/leads")} />
        </div>
      </div>

      {/* Next step banner */}
      <NextStepBanner lead={lead} />

      {/* 2-col layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start">
        {/* Left column */}
        <div className="space-y-4 order-2 lg:order-none">
          {/* Status */}
          <div className="bg-white rounded-[14px] border border-[#E2E8F0] px-5 py-5 space-y-4">
            <p className="text-[.9rem] font-bold text-[#0F1628]" style={{ fontFamily: "var(--font-sora)" }}>Status</p>
            <StatusSelector
              leadId={lead.id}
              current={lead.status}
              homeownerName={lead.homeownerName}
              homeownerEmail={lead.homeownerEmail}
              onChange={(s) => setLead((prev) => prev ? { ...prev, status: s } : prev)}
            />
          </div>

          {/* Job details */}
          <div className="bg-white rounded-[14px] border border-[#E2E8F0] px-5 py-5 space-y-4">
            <p className="text-[.9rem] font-bold text-[#0F1628]" style={{ fontFamily: "var(--font-sora)" }}>Job Details</p>
            <div className="space-y-2 text-sm">
              {lead.serviceType && (
                <div className="flex gap-3">
                  <span className="text-gray-400 w-20 shrink-0">Service</span>
                  <span className="text-gray-700">{SERVICE_LABELS[lead.serviceType] ?? lead.serviceType}</span>
                </div>
              )}
              {lead.preferredTimeline && (
                <div className="flex gap-3">
                  <span className="text-gray-400 w-20 shrink-0">Timeline</span>
                  <span className="text-gray-700">{TIMELINE_LABELS[lead.preferredTimeline] ?? lead.preferredTimeline}</span>
                </div>
              )}
              {lead.description && (
                <div className="flex gap-3">
                  <span className="text-gray-400 w-20 shrink-0">Description</span>
                  <span className="text-gray-700 leading-relaxed">{lead.description}</span>
                </div>
              )}
            </div>
          </div>

          {/* AI Estimate */}
          {lead.aiEstimateLow && lead.aiEstimateHigh && (
            <div
              className="rounded-xl border border-orange-200 px-4 py-4 space-y-3"
              style={{ background: "linear-gradient(135deg, #FFF7ED, #FFFBF5)" }}
            >
              <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">AI Estimate</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-gray-900">
                  {fmt(lead.aiEstimateLow)} – {fmt(lead.aiEstimateHigh)}
                </span>
                {lead.aiConfidence && (
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${CONF_STYLES[lead.aiConfidence] ?? ""}`}>
                    {lead.aiConfidence.charAt(0).toUpperCase() + lead.aiConfidence.slice(1)} confidence
                  </span>
                )}
              </div>
              <p className="text-xs text-orange-400">Ballpark only — based on homeowner description. Verify on-site.</p>
            </div>
          )}

          {/* AI photo summary */}
          {lead.aiPhotoSummary && (
            <div className="bg-white rounded-[14px] border border-[#E2E8F0] px-5 py-5 space-y-3">
              <div className="flex items-center gap-2">
                <p className="text-[.9rem] font-bold text-[#0F1628]" style={{ fontFamily: "var(--font-sora)" }}>Photo Assessment</p>
                <span className="text-[.68rem] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wide">AI</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{lead.aiPhotoSummary}</p>
            </div>
          )}

          {/* Homeowner photos */}
          {photos.filter((p) => !["before","progress","after"].includes(p.photoType)).length > 0 && (() => {
            const homeownerPhotos = photos.filter((p) => !["before","progress","after"].includes(p.photoType));
            return (
              <div className="bg-white rounded-[14px] border border-[#E2E8F0] px-5 py-5 space-y-3">
                <p className="text-[.9rem] font-bold text-[#0F1628]" style={{ fontFamily: "var(--font-sora)" }}>
                  Photos <span className="text-slate-400 font-normal text-sm">({homeownerPhotos.length})</span>
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {homeownerPhotos.map((photo, i) => (
                    <a
                      key={photo.id}
                      href={photo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="aspect-square rounded-lg overflow-hidden border border-[#E2E8F0] hover:opacity-90 transition-opacity"
                    >
                      <img src={photo.url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Job photos — before / progress / after */}
          <JobPhotosSection leadId={lead.id} />

          {/* Notes */}
          <div className="bg-white rounded-[14px] border border-[#E2E8F0] px-5 py-5 space-y-4">
            <p className="text-[.9rem] font-bold text-[#0F1628]" style={{ fontFamily: "var(--font-sora)" }}>Private Notes</p>
            <NotesEditor leadId={lead.id} initialNotes={lead.notes} />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4 order-1 lg:order-none">
          {/* Contact info */}
          <div className="bg-white rounded-[14px] border border-[#E2E8F0] px-5 py-5 space-y-4">
            <p className="text-[.9rem] font-bold text-[#0F1628]" style={{ fontFamily: "var(--font-sora)" }}>Contact</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3">
                <span className="text-gray-400 w-16">Phone</span>
                <a href={`tel:${lead.homeownerPhone}`} className="text-orange-500 hover:underline font-medium">
                  {lead.homeownerPhone}
                </a>
              </div>
              {lead.homeownerEmail && (
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 w-16">Email</span>
                  <a href={`mailto:${lead.homeownerEmail}`} className="text-orange-500 hover:underline">
                    {lead.homeownerEmail}
                  </a>
                </div>
              )}
              {lead.address && (
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 w-16">Address</span>
                  <span className="text-gray-700">{lead.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Schedule */}
          <ScheduleSection
            leadId={lead.id}
            initialScheduledAt={lead.scheduledAt}
            initialScheduledEndAt={lead.scheduledEndAt ?? null}
            initialScheduledNote={lead.scheduledNote ?? null}
            initialScheduledType={lead.scheduledType ?? null}
            initialStaffId={lead.staffId}
            homeownerEmail={lead.homeownerEmail ?? null}
            onSaved={(scheduledAt, isJobAppointment) =>
              setLead((prev) => prev ? {
                ...prev,
                scheduledAt,
                status: scheduledAt && isJobAppointment && prev.status !== "scheduled" ? "scheduled" : prev.status,
              } : prev)
            }
          />

          {/* Quote + Contract summary */}
          <QuoteContractSummary leadId={lead.id} />

        </div>
      </div>


    </div>
  );
}
