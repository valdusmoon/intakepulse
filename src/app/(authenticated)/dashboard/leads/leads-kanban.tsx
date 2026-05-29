"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Lead = {
  id: string;
  homeownerName: string;
  address: string | null;
  serviceType: string | null;
  quotedAmount: number | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

const COLUMNS = [
  { key: "new",       label: "New",       color: "bg-blue-500" },
  { key: "contacted", label: "Contacted",  color: "bg-yellow-500" },
  { key: "quoted",    label: "Quoted",     color: "bg-purple-500" },
  { key: "scheduled", label: "Scheduled",  color: "bg-indigo-500" },
  { key: "won",       label: "Won",        color: "bg-green-500" },
] as const;

// Completed and Lost are terminal states — handled from lead detail, not kanban
const NO_DROP_COLUMNS = new Set<string>();

const SERVICE_LABELS: Record<string, string> = {
  interior: "Interior",
  exterior: "Exterior",
  both: "Interior + Exterior",
  other: "Other",
};

function timeAgo(date: Date) {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  if (days === 0) return "Today";
  if (days === 1) return "1d ago";
  return `${days}d ago`;
}

function fmt(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function isStale(lead: Lead) {
  const DAY = 24 * 60 * 60 * 1000;
  const thresholds: Record<string, number> = { new: 2, contacted: 5, quoted: 5, scheduled: 7 };
  const threshold = thresholds[lead.status];
  if (!threshold) return false;
  const ref = lead.status === "new" ? lead.createdAt : lead.updatedAt;
  return Date.now() - new Date(ref).getTime() > threshold * DAY;
}

export function LeadsKanban({ leads: initialLeads }: { leads: Lead[] }) {
  const router = useRouter();
  const [leads, setLeads] = useState(initialLeads);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const grouped = Object.fromEntries(COLUMNS.map((c) => [c.key, [] as Lead[]]));
  for (const lead of leads) {
    if (grouped[lead.status]) grouped[lead.status].push(lead);
  }

  function handleDragStart(e: React.DragEvent, leadId: string) {
    setDraggingId(leadId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", leadId);
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDragOverColumn(null);
  }

  function handleDragOver(e: React.DragEvent, columnKey: string) {
    if (NO_DROP_COLUMNS.has(columnKey)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnKey);
  }

  function handleDragLeave(e: React.DragEvent) {
    // Only clear if leaving the column entirely (not entering a child)
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
      setDragOverColumn(null);
    }
  }

  async function handleDrop(e: React.DragEvent, targetStatus: string) {
    e.preventDefault();
    setDragOverColumn(null);

    const leadId = e.dataTransfer.getData("text/plain") || draggingId;
    if (!leadId || NO_DROP_COLUMNS.has(targetStatus)) return;

    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === targetStatus) { setDraggingId(null); return; }

    const prevStatus = lead.status;

    // Optimistic update
    setLeads((prev) =>
      prev.map((l) => l.id === leadId ? { ...l, status: targetStatus, updatedAt: new Date() } : l)
    );
    setDraggingId(null);

    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Revert on failure
      setLeads((prev) =>
        prev.map((l) => l.id === leadId ? { ...l, status: prevStatus } : l)
      );
    }
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-3 min-w-max">
        {COLUMNS.map(({ key, label, color }) => {
          const column = grouped[key] ?? [];
          const isDropTarget = dragOverColumn === key;
          const noDrop = NO_DROP_COLUMNS.has(key);

          return (
            <div
              key={key}
              className="w-[180px] flex flex-col gap-2"
              onDragOver={(e) => handleDragOver(e, key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, key)}
            >
              {/* Column header */}
              <div className="flex items-center gap-2 px-1">
                <div className={`w-2 h-2 rounded-full ${color} shrink-0`} />
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{label}</span>
                <span className="ml-auto text-xs font-semibold text-slate-400">{column.length}</span>
              </div>

              {/* Drop zone */}
              <div
                className={`flex flex-col gap-2 min-h-[64px] rounded-xl transition-colors ${
                  isDropTarget
                    ? "bg-orange-50 ring-2 ring-orange-300 ring-offset-1"
                    : noDrop && draggingId
                    ? "opacity-40"
                    : ""
                }`}
              >
                {column.length === 0 ? (
                  <div className={`h-16 rounded-xl border border-dashed flex items-center justify-center ${
                    isDropTarget ? "border-orange-300" : "border-slate-200"
                  }`}>
                    {noDrop && draggingId ? (
                      <span className="text-[10px] text-slate-300 font-medium text-center px-2">Open lead to mark complete</span>
                    ) : (
                      <span className="text-[10px] text-slate-300 font-medium">Empty</span>
                    )}
                  </div>
                ) : (
                  column.map((lead) => {
                    const stale = isStale(lead);
                    const isDragging = draggingId === lead.id;
                    return (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => !isDragging && router.push(`/dashboard/leads/${lead.id}`)}
                        className={`bg-white rounded-xl border p-2.5 transition-all group cursor-pointer select-none ${
                          isDragging
                            ? "opacity-40 scale-95 shadow-none"
                            : "hover:shadow-md hover:-translate-y-0.5 cursor-grab active:cursor-grabbing"
                        } ${stale ? "border-orange-200" : "border-[#E2E8F0]"}`}
                        style={{ boxShadow: isDragging ? "none" : "0 1px 3px rgba(0,0,0,.06)" }}
                      >
                        <div className="flex items-start justify-between gap-1 mb-1.5">
                          <p className="text-[.8rem] font-semibold text-[#1E293B] leading-tight group-hover:text-orange-600 transition-colors truncate">
                            {lead.homeownerName}
                          </p>
                          {stale && <div className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0 mt-1" />}
                        </div>

                        {(lead.serviceType || lead.address) && (
                          <p className="text-[.72rem] text-slate-400 leading-tight mb-2 line-clamp-2">
                            {lead.serviceType ? SERVICE_LABELS[lead.serviceType] ?? lead.serviceType : lead.address}
                          </p>
                        )}

                        <div className="flex items-center justify-between gap-1">
                          {lead.quotedAmount ? (
                            <span className="text-[.68rem] font-bold px-1.5 py-0.5 rounded-md bg-green-50 text-green-700 border border-green-100">
                              {fmt(lead.quotedAmount)}
                            </span>
                          ) : (
                            <span />
                          )}
                          <span className="text-[.68rem] text-slate-300 shrink-0">
                            {timeAgo(lead.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
