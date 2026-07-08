"use client";

import { useState } from "react";

const TABS = [
  { key: "inbox", label: "Lead inbox" },
  { key: "assessment", label: "AI assessment" },
  { key: "calls", label: "Call log" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function BrowserFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {/* Soft floor shadow — reads as the frame lifting off the page, not sitting flat on it */}
      <div
        className="pointer-events-none absolute -inset-x-4 top-8 bottom-0 -z-10 rounded-[32px] opacity-40 blur-2xl"
        style={{ background: "radial-gradient(ellipse 65% 55% at 50% 100%, rgba(16,24,40,.4), transparent 75%)" }}
        aria-hidden
      />
      <div className="rounded-2xl border border-[#e3e7ed] bg-white overflow-hidden shadow-[0_36px_60px_-20px_rgba(16,24,40,.32),0_12px_24px_-10px_rgba(36,84,216,.16)]">
        <div className="flex items-center gap-1.5 px-3.5 py-2.5 border-b border-[#e3e7ed] bg-[#f9fafb]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#e3e7ed]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#e3e7ed]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#e3e7ed]" />
          <span className="ml-3 font-mono text-[10.5px] text-[#98a2b3]">app.callverted.com/dashboard</span>
        </div>
        <div className="p-4 sm:p-5">{children}</div>
      </div>
    </div>
  );
}

function Pill({ children, tone }: { children: React.ReactNode; tone: "red" | "amber" | "blue" | "gray" | "green" }) {
  const tones = {
    red: "bg-[#fff0ee] text-[#b42318] border-[#f3c9c3]",
    amber: "bg-[#fff5df] text-[#a15c00] border-[#f3d99d]",
    blue: "bg-[#eaf0ff] text-[#173a8f] border-[#cfdbff]",
    gray: "bg-[#f2f4f7] text-[#475467] border-[#e4e7ec]",
    green: "bg-[#ecfdf3] text-[#067647] border-[#abefc6]",
  };
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${tones[tone]}`}>{children}</span>;
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-[#e3e7ed] overflow-hidden ${className}`}>{children}</div>;
}

function PanelHead({ title, pill }: { title: string; pill: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#e3e7ed]">
      <span className="text-[13px] font-extrabold text-[#152033]">{title}</span>
      {pill}
    </div>
  );
}

function InboxPanel() {
  const rows = [
    { name: "Marcus Webb", detail: "HVAC · no heat · furnace failure", tone: "red" as const, badge: "Urgent", value: "$1,800–$3,200", time: "4m" },
    { name: "Priya Nandakumar", detail: "Electrical · flickering panel · tenant occupied", tone: "amber" as const, badge: "Today", value: "$800–$1,600", time: "1h" },
    { name: "Diane Ostrowski", detail: "Plumbing · slow leak · multiple rooms", tone: "gray" as const, badge: "Routine", value: "$2,000–$4,000", time: "6h" },
  ];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-4">
      <Panel>
        <PanelHead title="Priority leads" pill={<Pill tone="red">3 urgent</Pill>} />
        <div>
          {rows.map((r) => (
            <div key={r.name} className="flex items-center justify-between gap-3 px-4 py-3.5 border-b border-[#e3e7ed] last:border-b-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[13px] font-extrabold text-[#152033]">{r.name}</span>
                  <Pill tone={r.tone}>{r.badge}</Pill>
                </div>
                <p className="text-[12px] text-[#667085] mt-0.5">{r.detail}</p>
              </div>
              <div className="text-right shrink-0">
                <div className="font-mono text-[13px] font-extrabold text-[#152033]">{r.value}</div>
                <div className="text-[10.5px] text-[#98a2b3] mt-1">{r.time} ago</div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel>
        <PanelHead title="Recovered this month" pill={<Pill tone="green">Live</Pill>} />
        <div className="grid grid-cols-3 divide-x divide-[#e3e7ed] border-b border-[#e3e7ed]">
          {[
            { big: "18", small: "captured" },
            { big: "11", small: "qualified" },
            { big: "$42k", small: "pipeline" },
          ].map((s) => (
            <div key={s.small} className="text-center py-3.5">
              <div className="font-mono text-xl font-extrabold text-[#152033]">{s.big}</div>
              <div className="text-[9.5px] uppercase tracking-wide text-[#98a2b3] mt-1">{s.small}</div>
            </div>
          ))}
        </div>
        <div className="px-4 py-3.5 text-[12.5px] text-[#475467] leading-relaxed">
          Callverted is catching after-hours and no-answer calls, ranking them by urgency and job value, then pushing the
          owner to call the highest-intent leads first.
        </div>
      </Panel>
    </div>
  );
}

function AssessmentPanel() {
  return (
    <Panel>
      <PanelHead title="Marcus Webb · HVAC emergency" pill={<Pill tone="red">Call within 10 min</Pill>} />
      <div className="grid grid-cols-3 divide-x divide-[#e3e7ed] border-b border-[#e3e7ed]">
        <div className="text-center py-3.5">
          <div className="font-mono text-2xl font-extrabold text-[#b42318]">9</div>
          <div className="text-[9.5px] uppercase tracking-wide text-[#98a2b3] mt-1">Urgency / 10</div>
        </div>
        <div className="text-center py-3.5">
          <div className="font-mono text-2xl font-extrabold text-[#152033]">High</div>
          <div className="text-[9.5px] uppercase tracking-wide text-[#98a2b3] mt-1">Intent</div>
        </div>
        <div className="text-center py-3.5">
          <div className="font-mono text-lg font-extrabold text-[#152033]">$1.8k–$3.2k</div>
          <div className="text-[9.5px] uppercase tracking-wide text-[#98a2b3] mt-1">Value range</div>
        </div>
      </div>
      <div className="px-4 py-3.5 text-[12.5px] text-[#475467] leading-relaxed">
        <strong className="text-[#152033]">Reasoning:</strong> Caller reported no heat, an older furnace unit, and
        occupants home right now. Service area is eligible. Recommended action: call immediately and schedule a
        technician.
      </div>
    </Panel>
  );
}

function CallsPanel() {
  const rows = [
    { caller: "(973) 555-0142", outcome: "Captured by Callverted", sub: "No answer after 20s", duration: "2:18", tone: "blue" as const },
    { caller: "Unknown caller", outcome: "Business answered", sub: "Connected in 9s", duration: "4:02", tone: "gray" as const },
    { caller: "(973) 555-0198", outcome: "Caller abandoned", sub: "Hung up during greeting", duration: "0:11", tone: "gray" as const },
  ];
  return (
    <Panel>
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-[1fr_auto] items-center gap-3.5 px-4 py-3.5 border-b border-[#e3e7ed] last:border-b-0">
          <div className="min-w-0">
            <span className="text-[13px] font-extrabold text-[#152033]">{r.caller}</span>
            <p className="text-[11.5px] text-[#667085] mt-0.5">
              <Pill tone={r.tone}>{r.outcome}</Pill> <span className="ml-1">{r.sub}</span>
            </p>
          </div>
          <div className="font-mono text-[12px] text-[#475467] shrink-0">{r.duration}</div>
        </div>
      ))}
    </Panel>
  );
}

export function ProductShowcase() {
  const [tab, setTab] = useState<TabKey>("inbox");

  return (
    <div>
      <div className="flex justify-center gap-2 mb-6 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors border ${
              tab === t.key ? "bg-[#152033] text-white border-[#152033]" : "bg-white text-[#475467] border-[#e3e7ed] hover:border-[#98a2b3]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <BrowserFrame>
        {tab === "inbox" && <InboxPanel />}
        {tab === "assessment" && <AssessmentPanel />}
        {tab === "calls" && <CallsPanel />}
      </BrowserFrame>
    </div>
  );
}
