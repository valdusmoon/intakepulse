/**
 * V8JobsVsMessages — the "Not every call is a job" two-card beat for /v8.
 *
 * Left: a JOB — qualified, scored, prioritized, with the full lead packet and a
 * Hot · 92 badge; visually the stronger of the two. Right: a MESSAGE —
 * documented and routed, deliberately with no score and no pipeline, but still
 * respectable. Static/presentational, so this stays a server component.
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

export function V8JobsVsMessages() {
  return (
    <div>
      <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-[1.1fr_0.9fr]">
        {/* ── Card A: Job (visually stronger) ──────────────────────────── */}
        <div className="relative flex flex-col overflow-hidden rounded-3xl border-2 border-landing-primary/25 bg-white p-6 shadow-[0_28px_70px_-34px_rgba(36,84,216,0.45)] sm:p-7">
          <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-landing-primary/10 blur-3xl" aria-hidden />
          <div className="relative mb-5 flex items-start justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-landing-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-landing-primary">Job</span>
              <p className="mt-2 text-[12.5px] font-semibold text-[#667085]">Qualified · scored · prioritized</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[12px] font-bold text-amber-700">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Hot · 92
            </span>
          </div>

          <div className="relative grid grid-cols-2 gap-2.5">
            {JOB_FIELDS.map((f) => (
              <div key={f.label} className="rounded-xl border border-[#eef1f4] bg-[#f9fafb] px-3 py-2.5">
                <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#98a2b3]">{f.label}</p>
                <p className={`font-cv-heading text-[15px] font-bold leading-tight ${f.danger ? "text-[#b42318]" : "text-[#152033]"}`}>{f.value}</p>
              </div>
            ))}
          </div>

          <p className="relative mt-4 text-[13.5px] leading-relaxed text-[#475467]">
            Burst supply line flooding a finished basement, water still spreading. Main is off and someone is on site to let a crew in tonight.
          </p>

          <div className="relative mt-auto pt-5">
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

        {/* ── Card B: Message (respectable, no score) ──────────────────── */}
        <div className="flex flex-col rounded-3xl border border-[#e3e7ed] bg-[#f9fafb] p-6 sm:p-7">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef1f4] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#667085]">Message</span>
              <p className="mt-2 text-[12.5px] font-semibold text-[#667085]">Documented · routed · no score</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-[#98a2b3] ring-1 ring-[#e3e7ed]">No score</span>
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
            Existing customer asking about a charge on last month&apos;s invoice. Wants a callback to sort it out, no urgency.
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
        A scored job or a tidy message. Never a pile of voicemails.
      </p>
    </div>
  );
}
