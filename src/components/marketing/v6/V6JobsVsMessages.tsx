/**
 * V6JobsVsMessages — the "Not every call is a job" two-card beat (locked copy §5).
 *
 * Left: a JOB — qualified, scored, prioritized, with the full lead packet and a
 * Hot · 92 badge. Right: a MESSAGE — documented and routed, deliberately with no
 * score and no pipeline. Static/presentational, so this stays a server component.
 * Page-scoped to /v6.
 */

const JOB_FIELDS = [
  { label: "Service", value: "Water damage", danger: false },
  { label: "Location", value: "ZIP 33618", danger: false },
  { label: "Urgency", value: "Emergency", danger: true },
  { label: "Est. value", value: "$1.8k–$3.2k", danger: false },
];

const MESSAGE_FIELDS = [
  { label: "Type", value: "Billing question" },
  { label: "From", value: "Dana Ruiz" },
  { label: "Requested", value: "Callback" },
];

export function V6JobsVsMessages() {
  return (
    <div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* ── Card A: Job ─────────────────────────────────────────────── */}
        <div className="flex flex-col rounded-3xl border border-[#e3e7ed] bg-white p-6 shadow-[0_24px_60px_-38px_rgba(16,24,40,0.4)] sm:p-7">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-landing-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-landing-primary">
                Job
              </span>
              <p className="mt-2 text-[12.5px] font-semibold text-[#667085]">Qualified · scored · prioritized</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#fff1f0] px-3 py-1.5 text-[12px] font-bold text-[#e5484d] ring-1 ring-[#f7c9c7]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#e5484d]" />
              Hot · 92
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {JOB_FIELDS.map((f) => (
              <div key={f.label} className="rounded-xl border border-[#eef1f4] bg-[#f9fafb] px-3 py-2.5">
                <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#98a2b3]">{f.label}</p>
                <p className={`font-cv-heading text-[15px] font-bold leading-tight ${f.danger ? "text-[#b42318]" : "text-[#152033]"}`}>
                  {f.value}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-4 text-[13.5px] leading-relaxed text-[#475467]">
            Burst supply line flooding a finished basement, water still spreading. Main is off and someone is on site to
            let a crew in tonight.
          </p>

          <div className="mt-auto pt-5">
            <div className="flex items-center gap-2.5 rounded-xl bg-landing-primary/10 px-3.5 py-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-landing-primary text-white">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.3 1L6.6 10.8z" /></svg>
              </span>
              <div>
                <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-landing-primary">Recommended callback priority</p>
                <p className="text-[13.5px] font-bold text-[#152033]">Call back now — top of the list.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Card B: Message ─────────────────────────────────────────── */}
        <div className="flex flex-col rounded-3xl border border-[#e3e7ed] bg-[#f9fafb] p-6 sm:p-7">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef1f4] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#667085]">
                Message
              </span>
              <p className="mt-2 text-[12.5px] font-semibold text-[#667085]">Documented · routed · no score</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-[#98a2b3] ring-1 ring-[#e3e7ed]">
              No score
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {MESSAGE_FIELDS.map((f) => (
              <div key={f.label} className="rounded-xl border border-[#eef1f4] bg-white px-3 py-2.5">
                <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#98a2b3]">{f.label}</p>
                <p className="font-cv-heading text-[14px] font-bold leading-tight text-[#152033]">{f.value}</p>
              </div>
            ))}
          </div>

          <p className="mt-4 text-[13.5px] leading-relaxed text-[#475467]">
            Existing customer asking about a charge on last month&apos;s invoice. Wants a callback to sort it out, no
            urgency.
          </p>

          <div className="mt-auto pt-5">
            <div className="flex items-center gap-2.5 rounded-xl bg-white px-3.5 py-3 ring-1 ring-[#eef1f4]">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#eef1f4] text-[#667085]">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
              </span>
              <div>
                <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#98a2b3]">No pipeline</p>
                <p className="text-[13.5px] font-bold text-[#344054]">Routed to the office and marked handled.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-7 text-center text-[15px] font-semibold text-[#344054]">
        A scored job or a tidy message—never a pile of voicemails.
      </p>
    </div>
  );
}
