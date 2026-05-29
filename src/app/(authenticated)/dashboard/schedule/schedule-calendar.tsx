"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  format, addHours, isSameDay, isToday, addMonths, subMonths,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  isSameMonth,
} from "date-fns";

function staffColor(id: string): string {
  const hash = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return `hsl(${hash % 360}, 65%, 48%)`;
}

interface ScheduledLead {
  id: string;
  homeownerName: string;
  homeownerPhone: string;
  address: string | null;
  city: string | null;
  serviceType: string | null;
  scheduledAt: string;
  scheduledEndAt: string | null;
  status: string;
  staffName: string | null;
  staffId: string | null;
}

interface StaffMember {
  id: string;
  name: string;
}

interface UnscheduledLead {
  id: string;
  homeownerName: string;
  address: string | null;
}

const SERVICE_LABELS: Record<string, string> = {
  interior: "Interior",
  exterior: "Exterior",
  both: "Int + Ext",
  other: "Other",
};

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function ScheduleCalendar() {
  const router = useRouter();
  const [leads, setLeads] = useState<ScheduledLead[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [staffColorMap, setStaffColorMap] = useState<Record<string, string>>({});
  const [calMonth, setCalMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [unscheduledLeads, setUnscheduledLeads] = useState<UnscheduledLead[]>([]);

  // Modal form state
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [slotStart, setSlotStart] = useState("");
  const [slotEnd, setSlotEnd] = useState("");
  const [saving, setSaving] = useState(false);
  const [sendConfirmation, setSendConfirmation] = useState(true);

  const fetchLeads = useCallback(async () => {
    const res = await fetch("/api/schedule");
    if (!res.ok) return;
    const data: ScheduledLead[] = await res.json();
    setLeads(data);
  }, []);

  useEffect(() => {
    fetchLeads();
    fetch("/api/staff")
      .then((r) => r.ok ? r.json() : [])
      .then((members: StaffMember[]) => {
        setStaffList(members);
        if (members.length > 0) setSelectedStaffId(members[0].id);
        const colorMap: Record<string, string> = {};
        members.forEach((m) => { colorMap[m.id] = staffColor(m.id); });
        setStaffColorMap(colorMap);
      })
      .catch(() => {});
  }, [fetchLeads]);

  function openModal(date?: Date) {
    const base = date ?? selectedDate ?? new Date();
    const start = new Date(base);
    start.setHours(8, 0, 0, 0);
    setSlotStart(toDatetimeLocal(start));
    setSlotEnd(toDatetimeLocal(addHours(start, 4)));
    setSelectedLeadId("");
    setSendConfirmation(true);

    fetch("/api/leads?limit=100")
      .then((r) => r.ok ? r.json() : { leads: [] })
      .then((data) => {
        const all = Array.isArray(data) ? data : (data.leads ?? []);
        setUnscheduledLeads(
          all
            .filter((l: { status: string }) => !["won", "completed", "lost"].includes(l.status))
            .map((l: { id: string; homeownerName: string; address: string | null }) => ({
              id: l.id, homeownerName: l.homeownerName, address: l.address,
            }))
        );
      })
      .catch(() => {});

    setModalOpen(true);
  }

  async function handleSave() {
    if (!selectedLeadId || !slotStart) return;
    setSaving(true);
    await fetch(`/api/leads/${selectedLeadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scheduledAt: new Date(slotStart).toISOString(),
        scheduledEndAt: slotEnd ? new Date(slotEnd).toISOString() : null,
        staffId: selectedStaffId || null,
        status: "scheduled",
      }),
    });
    if (sendConfirmation) {
      fetch(`/api/leads/${selectedLeadId}/send-schedule`, { method: "POST" }).catch(() => {});
    }
    setSaving(false);
    setModalOpen(false);
    await fetchLeads();
  }

  // Calendar grid
  const monthStart = startOfMonth(calMonth);
  const monthEnd = endOfMonth(calMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const gridDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

  function jobSpansDay(lead: ScheduledLead, day: Date): boolean {
    const start = new Date(lead.scheduledAt);
    const end = lead.scheduledEndAt ? new Date(lead.scheduledEndAt) : addHours(start, 2);
    const dayStart = new Date(day); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day); dayEnd.setHours(23, 59, 59, 999);
    return start <= dayEnd && end >= dayStart;
  }

  function hasJob(day: Date) {
    return leads.some((l) => jobSpansDay(l, day));
  }

  // Filtered job list — for selected date show jobs that span that day, grouped by start date
  const filteredLeads = selectedDate
    ? leads.filter((l) => jobSpansDay(l, selectedDate))
    : leads;

  const sortedLeads = [...filteredLeads].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );

  // Group by date
  const grouped: { label: string; items: ScheduledLead[] }[] = [];
  for (const lead of sortedLeads) {
    const d = new Date(lead.scheduledAt);
    const label = isToday(d) ? "Today" : format(d, "EEEE, MMM d");
    const existing = grouped.find((g) => g.label === label);
    if (existing) existing.items.push(lead);
    else grouped.push({ label, items: [lead] });
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1
          className="text-[1.4rem] font-extrabold tracking-tight text-[#0F1628]"
          style={{ fontFamily: "var(--font-sora)" }}
        >
          Schedule
        </h1>
        <div className="flex items-center gap-2">
          <a
            href="/api/schedule/export"
            className="px-3 py-2 rounded-xl text-sm font-medium text-slate-500 border border-[#E2E8F0] hover:bg-slate-50 transition-colors"
            title="Download schedule as .ics for Google Calendar, Apple Calendar, or Outlook"
          >
            Export .ics
          </a>
          <button
            onClick={() => openModal()}
            className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            + Schedule job
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 items-start">

        {/* Mini calendar */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setCalMonth(subMonths(calMonth, 1))}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors text-sm"
            >
              ‹
            </button>
            <span className="text-sm font-semibold text-[#0F1628]">
              {format(calMonth, "MMMM yyyy")}
            </span>
            <button
              onClick={() => setCalMonth(addMonths(calMonth, 1))}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors text-sm"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {DAY_LABELS.map((d) => (
              <div key={d} className="text-center text-[0.65rem] font-semibold text-gray-400 py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-0.5">
            {gridDays.map((day) => {
              const inMonth = isSameMonth(day, calMonth);
              const selected = selectedDate && isSameDay(day, selectedDate);
              const today = isToday(day);
              const hasEvent = hasJob(day);
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(selected ? null : day)}
                  className={`relative flex flex-col items-center justify-center h-8 w-full rounded-lg text-xs font-medium transition-colors
                    ${!inMonth ? "text-gray-300" : ""}
                    ${selected ? "bg-orange-500 text-white" : ""}
                    ${!selected && today ? "bg-orange-50 text-orange-600 font-bold" : ""}
                    ${!selected && !today && inMonth ? "text-gray-700 hover:bg-gray-100" : ""}
                  `}
                >
                  {format(day, "d")}
                  {hasEvent && !selected && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-orange-400" />
                  )}
                </button>
              );
            })}
          </div>

          {selectedDate && (
            <button
              onClick={() => setSelectedDate(null)}
              className="mt-3 w-full text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Show all jobs
            </button>
          )}

          {/* Staff legend */}
          {staffList.length > 1 && (
            <div className="mt-4 pt-4 border-t border-[#E2E8F0] flex flex-col gap-1.5">
              {staffList.map((m) => (
                <div key={m.id} className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: staffColorMap[m.id] ?? "#94a3b8" }}
                  />
                  <span className="text-xs text-gray-500">{m.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Job list */}
        <div className="space-y-5">
          {grouped.length === 0 && (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 text-center">
              <p className="text-sm text-gray-400">
                {selectedDate ? "No jobs scheduled for this day." : "No jobs scheduled yet."}
              </p>
              <button
                onClick={() => openModal()}
                className="mt-3 text-sm text-orange-500 font-medium hover:underline"
              >
                Schedule a job →
              </button>
            </div>
          )}

          {grouped.map(({ label, items }) => (
            <div key={label}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
                {label}
              </p>
              <div className="space-y-2">
                {items.map((lead) => {
                  const start = new Date(lead.scheduledAt);
                  const end = lead.scheduledEndAt ? new Date(lead.scheduledEndAt) : addHours(start, 2);
                  const crewColor = lead.staffId ? (staffColorMap[lead.staffId] ?? "#94a3b8") : "#94a3b8";
                  const isMultiDay = !isSameDay(start, end);
                  return (
                    <div
                      key={lead.id}
                      onClick={() => router.push(`/dashboard/leads/${lead.id}`)}
                      className="bg-white border border-[#E2E8F0] rounded-2xl px-4 py-3.5 flex items-center gap-4 cursor-pointer hover:border-orange-300 hover:shadow-sm transition-all"
                    >
                      {/* Color bar */}
                      <div
                        className="w-1 self-stretch rounded-full shrink-0"
                        style={{ backgroundColor: crewColor }}
                      />

                      {/* Time */}
                      <div className="shrink-0 text-center min-w-[52px]">
                        {isMultiDay ? (
                          <>
                            <div className="text-xs font-bold text-[#0F1628]">{format(start, "MMM d")}</div>
                            <div className="text-[0.65rem] text-gray-400">{format(start, "h a")}</div>
                            <div className="text-[0.6rem] text-gray-300">–{format(end, "MMM d")}</div>
                          </>
                        ) : (
                          <>
                            <div className="text-xs font-bold text-[#0F1628]">{format(start, "h:mm")}</div>
                            <div className="text-[0.65rem] text-gray-400">{format(start, "a")}</div>
                            <div className="text-[0.6rem] text-gray-300">–{format(end, "h a")}</div>
                          </>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-[#0F1628] truncate">{lead.homeownerName}</div>
                        {lead.address && (
                          <div className="text-xs text-gray-400 truncate">{lead.address}{lead.city ? `, ${lead.city}` : ""}</div>
                        )}
                      </div>

                      {/* Badges */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {isMultiDay && (
                          <span className="text-[0.65rem] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-500">
                            Multi-day
                          </span>
                        )}
                        {lead.serviceType && (
                          <span className="text-[0.65rem] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600">
                            {SERVICE_LABELS[lead.serviceType] ?? lead.serviceType}
                          </span>
                        )}
                        {lead.staffName && (
                          <span
                            className="text-[0.65rem] font-semibold px-2 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: crewColor }}
                          >
                            {lead.staffName}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4 mx-4">
            <div className="flex items-center justify-between">
              <p className="font-bold text-[#0F1628] text-base" style={{ fontFamily: "var(--font-sora)" }}>
                Schedule Job
              </p>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Lead</label>
                <select
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                >
                  <option value="">Select a lead...</option>
                  {unscheduledLeads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.homeownerName}{l.address ? ` — ${l.address}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Start</label>
                  <input
                    type="datetime-local"
                    value={slotStart}
                    onChange={(e) => setSlotStart(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">End</label>
                  <input
                    type="datetime-local"
                    value={slotEnd}
                    onChange={(e) => setSlotEnd(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>

              {staffList.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Assigned crew</label>
                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                  >
                    <option value="">Unassigned</option>
                    {staffList.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sendConfirmation}
                onChange={(e) => setSendConfirmation(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
              />
              <span className="text-xs text-gray-600">Send homeowner a confirmation email</span>
            </label>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSave}
                disabled={saving || !selectedLeadId || !slotStart}
                className="flex-1 bg-orange-500 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-40"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2.5 border border-gray-200 text-gray-500 text-sm rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function toDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
