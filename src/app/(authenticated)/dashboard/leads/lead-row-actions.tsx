"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function LeadRowActions({
  leadId,
  hasEmail,
}: {
  leadId: string;
  hasEmail: boolean;
}) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSend(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setSending(true);
    try {
      await fetch(`/api/leads/${leadId}/request-details`, { method: "POST" });
      setSent(true);
    } catch { /* silent */ }
    setSending(false);
  }

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      await fetch(`/api/leads/${leadId}`, { method: "DELETE" });
      router.refresh();
    } catch {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  function handleCancelDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setConfirmDelete(false);
  }

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      {confirmDelete ? (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">Delete?</span>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50 px-1.5 py-1 rounded"
          >
            {deleting ? "..." : "Yes"}
          </button>
          <button
            onClick={handleCancelDelete}
            className="text-xs text-gray-400 hover:text-gray-600 px-1.5 py-1 rounded"
          >
            No
          </button>
        </div>
      ) : (
        <>
          {/* View lead */}
          <Link
            href={`/dashboard/leads/${leadId}`}
            title="View lead"
            className="w-7 h-7 rounded-md flex items-center justify-center border border-[#E2E8F0] bg-white text-slate-400 hover:border-slate-300 hover:bg-slate-50 hover:text-[#0F1628] transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/></svg>
          </Link>
          {hasEmail && (
            <button
              onClick={handleSend}
              disabled={sending || sent}
              title={sent ? "Sent!" : "Request project details"}
              className="w-7 h-7 rounded-md flex items-center justify-center border border-[#E2E8F0] bg-white text-slate-400 hover:border-slate-300 hover:bg-slate-50 hover:text-[#0F1628] transition-all disabled:opacity-40"
            >
              {sent ? (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4z" stroke="currentColor" strokeWidth="1.3"/><path d="M2 4l6 5 6-5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>
              )}
            </button>
          )}
          <button
            onClick={handleDelete}
            title="Delete lead"
            className="w-7 h-7 rounded-md flex items-center justify-center border border-[#E2E8F0] bg-white text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-500 transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M5 4V2.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 .5.5V4M6 7v4M10 7v4M3 4l1 9.5a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5L13 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </>
      )}
    </div>
  );
}
