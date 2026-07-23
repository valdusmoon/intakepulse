/**
 * V5JobsVsMessages — the §5 "Not every call is a job" two-card (a new UI piece).
 *
 * Left: a JOB — qualified, scored, prioritized, marked Hot · 92. Right: a
 * MESSAGE — documented and routed, with no score and no pipeline. The contrast
 * is the whole point: Callverted knows the difference. Static server component,
 * illustrative scripted content.
 */

const JOB_FIELDS = [
  { label: "Service", value: "Water damage" },
  { label: "Location", value: "ZIP 33618" },
  { label: "Urgency", value: "Emergency" },
  { label: "Est. value", value: "$1.8k–$3.2k" },
];

const MESSAGE_FIELDS = [
  { label: "Type", value: "Billing question" },
  { label: "From", value: "Dana R." },
  { label: "Ask", value: "Callback requested" },
];

export function V5JobsVsMessages() {
  return (
    <div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* ── Job ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-col rounded-3xl border border-landing-primary/25 bg-white p-6 shadow-[0_24px_60px_-34px_rgba(28,63,168,0.45)] sm:p-7">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-cv-heading text-[20px] font-bold text-[#152033]">Job</p>
              <p className="font-cv-mono mt-1 text-[11px] font-semibold uppercase tracking-wide text-[#98a2b3]">
                Qualified · scored · prioritized
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-[#fff1f0] px-2.5 py-1 text-[12px] font-bold text-[#e5484d] ring-1 ring-[#e5484d]/20">
              Hot · 92
            </span>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-2.5">
            {JOB_FIELDS.map((f) => (
              <div key={f.label} className="rounded-xl border border-[#eef1f4] bg-[#f9fafb] px-3 py-2">
                <p className="text-[9px] font-bold uppercase tracking-wide text-[#98a2b3]">{f.label}</p>
                <p className="text-[13px] font-bold text-[#152033]">{f.value}</p>
              </div>
            ))}
          </div>

          <p className="mb-4 text-[13.5px] leading-relaxed text-[#475467]">
            Caller&apos;s water heater burst and the basement is actively flooding. Shutoff not located, so it needs a
            truck rolling now.
          </p>

          <div className="mt-auto flex items-center gap-2 rounded-xl bg-[#eef3ff] px-3.5 py-2.5 ring-1 ring-landing-primary/20">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="shrink-0 text-landing-primary">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
            <p className="text-[13px] font-bold text-landing-primary">Recommended: call back first, within 10 minutes</p>
          </div>
        </div>

        {/* ── Message ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col rounded-3xl border border-[#e3e7ed] bg-white p-6 shadow-[0_24px_60px_-34px_rgba(16,24,40,0.3)] sm:p-7">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-cv-heading text-[20px] font-bold text-[#152033]">Message</p>
              <p className="font-cv-mono mt-1 text-[11px] font-semibold uppercase tracking-wide text-[#98a2b3]">
                Documented · routed · no score
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-[#f2f4f7] px-2.5 py-1 text-[12px] font-semibold text-[#667085] ring-1 ring-[#e3e7ed]">
              No score
            </span>
          </div>

          <div className="mb-4 space-y-2">
            {MESSAGE_FIELDS.map((f) => (
              <div key={f.label} className="flex items-center justify-between rounded-xl border border-[#eef1f4] bg-[#f9fafb] px-3 py-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[#98a2b3]">{f.label}</span>
                <span className="text-[13px] font-bold text-[#152033]">{f.value}</span>
              </div>
            ))}
          </div>

          <p className="mb-4 text-[13.5px] leading-relaxed text-[#475467]">
            Wants to know why last month&apos;s invoice was higher than usual. Asked for a callback to review the
            charges.
          </p>

          <div className="mt-auto flex items-center gap-2 rounded-xl bg-[#f2f4f7] px-3.5 py-2.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="shrink-0 text-[#98a2b3]">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            <p className="text-[13px] font-semibold text-[#667085]">No score, no pipeline. Just handled.</p>
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-[15px] font-semibold text-[#344054]">
        A scored job or a tidy message&mdash;never a pile of voicemails.
      </p>
    </div>
  );
}
