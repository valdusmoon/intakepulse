/**
 * A faithful, static recreation of the live Callverted dashboard for the /v4
 * landing — same layout, sidebar, metric cards, priority-leads inbox and
 * conversion snapshot as the real app, minus the trial banner / test channels /
 * help chrome (fluff that doesn't help the pitch). Curated illustrative data:
 * strong but believable, nothing overstated. Shown inside a browser frame so it
 * reads as a product screenshot, not markup dropped onto the page.
 *
 * Not the real app (which needs auth + seeded data); a marketing stand-in. Keep
 * the numbers plausible so it never misleads.
 */

import { CallvertedLogo } from "@/components/CallvertedLogo";

const NAV = [
  { group: "Operate", items: [{ label: "Home", active: true, icon: "M3 11l9-8 9 8M5 10v10h14V10" }, { label: "Leads", badge: 4, icon: "M16 21v-2a4 4 0 0 0-8 0v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" }, { label: "Calls", icon: "M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.3 1L6.6 10.8z" }] },
  { group: "Grow", items: [{ label: "Capture", icon: "M4 5h16v14H4zM4 9h16" }, { label: "Reports", icon: "M4 19V5m0 14h16M8 15l3-4 3 2 4-6" }] },
  { group: "Configure", items: [{ label: "Settings", icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12a7 7 0 0 0-.1-1l2-1.6-2-3.4-2.3 1a7 7 0 0 0-1.7-1l-.3-2.5H9.4l-.3 2.5a7 7 0 0 0-1.7 1l-2.3-1-2 3.4L5 11a7 7 0 0 0 0 2l-2 1.6 2 3.4 2.3-1a7 7 0 0 0 1.7 1l.3 2.5h4.2l.3-2.5a7 7 0 0 0 1.7-1l2.3 1 2-3.4-2-1.6a7 7 0 0 0 .2-1z" }] },
];

const METRICS = [
  { label: "Captured opportunity value", value: "$48,200", sub: "Across 27 recovered calls this month", accent: "text-landing-primary" },
  { label: "Confirmed won revenue", value: "$19,400", sub: "From recovered calls, this month", delta: "↑ 32%", deltaTone: "text-[#177245]" },
  { label: "Urgent awaiting callback", value: "2", sub: "Flagged in the last hour" },
  { label: "Average callback time", value: "14 min", sub: "Down from 3h+ before Callverted", delta: "↓", deltaTone: "text-[#177245]" },
];

const LEADS = [
  { initials: "SC", name: "Sarah Chen", service: "Water damage", intent: "Emergency", intentTone: "bg-[#fee4e2] text-[#b42318]", value: "$4,500–$9,000", wait: "8m", tier: "Hot", score: 94 },
  { initials: "MW", name: "Marcus Webb", service: "Furnace: no heat", intent: "High intent", intentTone: "bg-[#fef0c7] text-[#b25e09]", value: "$3,200–$8,500", wait: "22m", tier: "Hot", score: 88 },
  { initials: "DA", name: "Diane Alvarez", service: "Burst pipe", intent: "Emergency", intentTone: "bg-[#fee4e2] text-[#b42318]", value: "$1,800–$3,400", wait: "35m", tier: "Hot", score: 91 },
  { initials: "TB", name: "Tom Becker", service: "AC tune-up", intent: "Routine", intentTone: "bg-[#eef1f4] text-[#667085]", value: "$150–$400", wait: "1h", tier: "Warm", score: 52 },
  { initials: "RG", name: "Ray Gomez", service: "Pricing question only", intent: "Low intent", intentTone: "bg-[#eef1f4] text-[#667085]", value: "—", wait: "2h", tier: "Cold", score: 21 },
];

const FUNNEL = [
  { label: "Leads → contacted", pct: 92 },
  { label: "Contacted → booked", pct: 61 },
  { label: "Booked → won", pct: 58 },
];

const CHANNELS = [
  { label: "Voice overflow", pct: 68 },
  { label: "Website widget", pct: 22 },
  { label: "After-hours line", pct: 10 },
];

export function DashboardMock() {
  return (
    <div className="relative" data-dash-mock>
      <div
        className="pointer-events-none absolute -inset-x-4 top-8 bottom-0 -z-10 rounded-[32px] opacity-40 blur-2xl"
        style={{ background: "radial-gradient(ellipse 65% 55% at 50% 100%, rgba(16,24,40,.4), transparent 75%)" }}
        aria-hidden
      />
      <div data-dash-card className="rounded-2xl border border-[#e3e7ed] bg-white overflow-hidden shadow-[0_36px_60px_-20px_rgba(16,24,40,.32),0_12px_24px_-10px_rgba(36,84,216,.16)]">
        {/* browser chrome */}
        <div className="flex items-center gap-1.5 px-3.5 py-2.5 border-b border-[#e3e7ed] bg-[#f9fafb]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#e3e7ed]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#e3e7ed]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#e3e7ed]" />
          <span className="ml-3 font-mono text-[10.5px] text-[#98a2b3]">app.callverted.com/dashboard</span>
        </div>

        <div className="flex bg-[#f6f7f9] text-[#152033]">
          {/* sidebar */}
          <aside className="hidden lg:flex w-[186px] shrink-0 flex-col gap-5 border-r border-[#e9edf2] bg-white px-3 py-4">
            <div className="flex items-center gap-2 px-1">
              <CallvertedLogo className="h-7 w-7 rounded-lg shadow-sm" gradientId="dashMockLogo" />
              <span className="font-cv-heading text-[14px] font-bold">Callverted</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-[#e9edf2] px-2.5 py-2">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-[#eef3ff] text-landing-primary text-[11px] font-bold">BS</span>
              <div className="min-w-0">
                <p className="text-[11.5px] font-bold leading-tight truncate">Blue Star Restoration</p>
                <p className="text-[10px] text-[#98a2b3] leading-tight">Austin, TX</p>
              </div>
            </div>
            {NAV.map((g) => (
              <div key={g.group}>
                <p className="px-1.5 mb-1.5 text-[9.5px] font-bold uppercase tracking-wider text-[#b0b8c4]">{g.group}</p>
                <div className="flex flex-col gap-0.5">
                  {g.items.map((it) => (
                    <div key={it.label} className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium ${it.active ? "bg-[#eef3ff] text-landing-primary" : "text-[#475467]"}`}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={it.icon} /></svg>
                      <span className="flex-1">{it.label}</span>
                      {it.badge && <span className="grid h-4 min-w-4 place-items-center rounded-full bg-[#ff5d5d] px-1 text-[9.5px] font-bold text-white">{it.badge}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </aside>

          {/* main */}
          <div className="flex-1 min-w-0 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="font-cv-heading text-[19px] font-bold leading-tight">Good afternoon, Jordan</h3>
                <p className="text-[11.5px] text-[#667085] mt-0.5">Here&apos;s what Callverted recovered while your team was on the tools.</p>
              </div>
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                <span className="rounded-lg border border-[#e3e7ed] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#475467]">Review calls</span>
                <span className="rounded-lg bg-landing-primary px-2.5 py-1.5 text-[11px] font-semibold text-white">+ Add lead</span>
              </div>
            </div>

            {/* metric cards */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5 mb-4">
              {METRICS.map((m) => (
                <div key={m.label} className="rounded-xl border border-[#e9edf2] bg-white p-3">
                  <p className="text-[9.5px] font-semibold uppercase tracking-wide text-[#98a2b3] leading-tight mb-1.5">{m.label}</p>
                  <p className={`font-cv-heading text-[20px] font-black leading-none ${m.accent ?? "text-[#152033]"}`}>
                    {m.value}{m.delta && <span className={`ml-1.5 text-[11px] font-bold align-middle ${m.deltaTone}`}>{m.delta}</span>}
                  </p>
                  <p className="text-[9.5px] text-[#98a2b3] mt-1.5 leading-tight">{m.sub}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-2.5">
              {/* priority leads */}
              <div className="rounded-xl border border-[#e9edf2] bg-white p-3.5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[13px] font-bold">Priority leads</p>
                    <p className="text-[10px] text-[#98a2b3]">Ranked by urgency, value, and wait time</p>
                  </div>
                  <span className="text-[11px] font-semibold text-landing-primary">View all</span>
                </div>
                <div className="flex flex-col">
                  {LEADS.map((l, i) => (
                    <div key={l.name} className={`flex items-center gap-2.5 py-2.5 ${i > 0 ? "border-t border-[#f2f4f7]" : ""}`}>
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#eef3ff] text-landing-primary text-[10px] font-bold">{l.initials}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[12px] font-bold truncate">{l.name}</span>
                          <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${l.intentTone}`}>{l.intent}</span>
                        </div>
                        <p className="text-[10.5px] text-[#667085] mt-0.5">{l.service} · <span className="text-[#98a2b3]">{l.value}</span></p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`inline-block rounded-full px-1.5 py-0.5 text-[9.5px] font-bold ${l.tier === "Hot" ? "bg-[#fee4e2] text-[#b42318]" : l.tier === "Warm" ? "bg-[#fef0c7] text-[#b25e09]" : "bg-[#eef1f4] text-[#667085]"}`}>{l.tier} · {l.score}</span>
                        <p className="text-[9.5px] text-[#98a2b3] mt-0.5">{l.wait} ago</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* conversion snapshot */}
              <div className="rounded-xl border border-[#e9edf2] bg-white p-3.5">
                <p className="text-[13px] font-bold mb-3">Conversion snapshot</p>
                <div className="space-y-2.5 mb-4">
                  {FUNNEL.map((f) => (
                    <div key={f.label}>
                      <div className="flex justify-between text-[10.5px] mb-1"><span className="text-[#475467] font-medium">{f.label}</span><span className="font-bold text-[#152033]">{f.pct}%</span></div>
                      <div className="h-1.5 rounded-full bg-[#eef1f4] overflow-hidden"><div className="h-full rounded-full bg-landing-primary" style={{ width: `${f.pct}%` }} /></div>
                    </div>
                  ))}
                </div>
                <p className="text-[9.5px] font-semibold uppercase tracking-wide text-[#98a2b3] mb-2">Where they came from</p>
                <div className="space-y-1.5">
                  {CHANNELS.map((c) => (
                    <div key={c.label} className="flex items-center justify-between text-[10.5px]">
                      <span className="flex items-center gap-1.5 text-[#475467]"><span className="h-1.5 w-1.5 rounded-full bg-landing-primary" />{c.label}</span>
                      <span className="font-semibold text-[#152033]">{c.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
