"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUSES = [
  { value: "sms_sent", label: "SMS Sent" },
  { value: "intake_started", label: "Intake Started" },
  { value: "intake_completed", label: "Intake Done" },
  { value: "qualified", label: "Qualified" },
  { value: "converted", label: "Converted" },
  { value: "lost", label: "Lost" },
];

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
      <div className="px-5 py-3 border-b border-gray-100">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">{label}</span>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

interface Props {
  lead: {
    id: string;
    status: string;
    notes: string | null;
    callerPhone: string;
  };
  hasPendingFollowup: boolean;
}

export function LeadDetailClient({ lead, hasPendingFollowup }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(lead.status);
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [cancelingFollowup, setCancelingFollowup] = useState(false);
  const [followupCanceled, setFollowupCanceled] = useState(false);

  async function updateStatus(newStatus: string) {
    setSavingStatus(true);
    setStatus(newStatus);
    try {
      await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      router.refresh();
    } finally {
      setSavingStatus(false);
    }
  }

  async function saveNotes() {
    setSavingNotes(true);
    try {
      await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2500);
    } finally {
      setSavingNotes(false);
    }
  }

  async function cancelFollowup() {
    setCancelingFollowup(true);
    try {
      await fetch(`/api/leads/${lead.id}/followup`, { method: "DELETE" });
      setFollowupCanceled(true);
    } finally {
      setCancelingFollowup(false);
    }
  }

  return (
    <>
      {/* Quick actions */}
      <div className="flex gap-2 mb-4">
        <a
          href={`tel:${lead.callerPhone}`}
          className="flex-1 flex items-center justify-center gap-1.5 bg-orange-500 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-orange-600 transition-colors"
        >
          📞 Call Now
        </a>
        <button
          onClick={() => updateStatus("converted")}
          disabled={savingStatus || status === "converted"}
          className="flex-1 text-sm font-semibold py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors disabled:opacity-40"
        >
          Mark Won ✓
        </button>
        <button
          onClick={() => updateStatus("lost")}
          disabled={savingStatus || status === "lost"}
          className="flex-1 text-sm font-semibold py-2.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
        >
          Lost
        </button>
      </div>

      {/* Status */}
      <Section label="Status">
        <div className="grid grid-cols-3 gap-1.5">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => updateStatus(s.value)}
              disabled={savingStatus}
              className={`text-xs font-medium py-2 px-2 rounded-lg border transition-colors ${
                status === s.value
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </Section>

      {/* Follow-up */}
      {hasPendingFollowup && !followupCanceled && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-600">Follow-up Pending</p>
            <p className="text-xs text-gray-500 mt-0.5">Cancel if you've already spoken with this lead.</p>
          </div>
          <button
            onClick={cancelFollowup}
            disabled={cancelingFollowup}
            className="shrink-0 text-xs font-semibold text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {cancelingFollowup ? "Canceling…" : "Cancel"}
          </button>
        </div>
      )}

      {/* Notes */}
      <Section label="Private Notes">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Notes visible only to you…"
          className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none leading-relaxed"
        />
        <button
          onClick={saveNotes}
          disabled={savingNotes}
          className="mt-2 text-sm font-semibold text-orange-500 hover:text-orange-600 disabled:opacity-50 transition-colors"
        >
          {savingNotes ? "Saving…" : notesSaved ? "Saved ✓" : "Save notes"}
        </button>
      </Section>
    </>
  );
}
