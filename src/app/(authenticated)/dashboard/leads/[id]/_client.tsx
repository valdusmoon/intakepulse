"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUSES = [
  { value: "sms_sent", label: "SMS Sent" },
  { value: "intake_started", label: "Intake Started" },
  { value: "intake_completed", label: "Intake Completed" },
  { value: "qualified", label: "Qualified" },
  { value: "converted", label: "Converted" },
  { value: "lost", label: "Lost" },
];

function fmt(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

interface Props {
  lead: {
    id: string;
    status: string;
    notes: string | null;
    urgencyScore: number | null;
    qualityScore: number | null;
    estimatedValueLow: number | null;
    estimatedValueHigh: number | null;
    callerPhone: string;
  };
  assessment: {
    urgencyReasoning: string;
    qualityReasoning: string;
    recommendedActions: string[];
  } | null;
  hasPendingFollowup: boolean;
  urgencyLabel: string;
  urgencyColor: string;
}

export function LeadDetailClient({ lead, assessment, hasPendingFollowup, urgencyLabel, urgencyColor }: Props) {
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
    <div className="space-y-4">

      {/* Quick actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-2">
          <a
            href={`tel:${lead.callerPhone}`}
            className="flex items-center justify-center gap-1.5 bg-orange-500 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-orange-600 transition-colors"
          >
            📞 Call Now
          </a>
          <a
            href={`sms:${lead.callerPhone}`}
            className="flex items-center justify-center gap-1.5 bg-gray-100 text-gray-700 text-sm font-semibold py-2.5 rounded-lg hover:bg-gray-200 transition-colors"
          >
            💬 Send SMS
          </a>
        </div>
      </div>

      {/* AI Assessment */}
      {assessment ? (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">AI Assessment</h2>

          {lead.urgencyScore && (
            <div className="flex gap-3 mb-4">
              <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">Urgency</p>
                <p className="text-2xl font-bold text-gray-900">{lead.urgencyScore}<span className="text-sm text-gray-400">/10</span></p>
              </div>
              <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">Quality</p>
                <p className="text-2xl font-bold text-gray-900">{lead.qualityScore}<span className="text-sm text-gray-400">/100</span></p>
              </div>
            </div>
          )}

          {lead.estimatedValueLow && lead.estimatedValueHigh && (
            <div className="mb-4 bg-orange-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-0.5">Estimated Job Value</p>
              <p className="text-lg font-bold text-gray-900">
                {fmt(lead.estimatedValueLow)} – {fmt(lead.estimatedValueHigh)}
              </p>
            </div>
          )}

          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-1">Urgency</p>
              <p className="text-gray-700 leading-relaxed">{assessment.urgencyReasoning}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-1">Quality</p>
              <p className="text-gray-700 leading-relaxed">{assessment.qualityReasoning}</p>
            </div>
            {assessment.recommendedActions.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-1.5">Recommended Actions</p>
                <ul className="space-y-1">
                  {assessment.recommendedActions.map((a, i) => (
                    <li key={i} className="flex gap-2 text-gray-700">
                      <span className="text-orange-400 shrink-0">·</span>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">AI Assessment</h2>
          <p className="text-sm text-gray-400">Assessment pending — intake form not yet completed.</p>
        </div>
      )}

      {/* Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Status</h2>
        <div className="grid grid-cols-2 gap-1.5">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => updateStatus(s.value)}
              disabled={savingStatus}
              className={`text-xs font-medium py-2 px-3 rounded-lg border transition-colors text-left ${
                status === s.value
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Follow-up */}
      {(hasPendingFollowup && !followupCanceled) && (
        <div className="bg-white rounded-xl border border-orange-200 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1">Follow-up Pending</h2>
              <p className="text-xs text-gray-500">A follow-up SMS is scheduled. Cancel if you've already spoken with this lead.</p>
            </div>
            <button
              onClick={cancelFollowup}
              disabled={cancelingFollowup}
              className="shrink-0 text-xs font-semibold text-red-500 hover:text-red-700 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {cancelingFollowup ? "Canceling…" : "Cancel"}
            </button>
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Private Notes</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Notes visible only to you…"
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
        />
        <button
          onClick={saveNotes}
          disabled={savingNotes}
          className="mt-2 text-sm font-semibold text-orange-500 hover:text-orange-600 disabled:opacity-50 transition-colors"
        >
          {savingNotes ? "Saving…" : notesSaved ? "Saved ✓" : "Save notes"}
        </button>
      </div>
    </div>
  );
}
