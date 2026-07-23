/**
 * V7JobsVsMessages — the "Jobs vs Messages" two-card beat (NEW piece). Card A is
 * a qualified, scored, prioritized Job; Card B is a documented, routed Message
 * with no score. Makes the category point visually: Callverted knows the
 * difference. Static (no client hooks). Illustrative scripted content.
 */

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-[#98a2b3] font-semibold">{label}</p>
      <p className="text-[13.5px] font-bold text-[#152033]">{value}</p>
    </div>
  );
}

export function V7JobsVsMessages() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* Card A — Job */}
      <div className="relative rounded-3xl border border-[#e3e7ed] bg-white p-6 shadow-[0_20px_50px_-30px_rgba(16,24,40,.28)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef7f1] px-2.5 py-1 text-[12px] font-bold text-[#177245]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#23a35a]" /> Job
            </span>
            <p className="mt-2 text-[12px] text-[#667085] font-medium">Qualified · scored · prioritized</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ffece9] px-3 py-1.5 text-[13px] font-bold text-[#c0392b] ring-1 ring-[#f6ccc4]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#e5484d]" /> Hot · 92
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 rounded-2xl border border-[#eef1f4] bg-[#f9fafb] p-4">
          <Field label="Service" value="Water damage" />
          <Field label="Location" value="ZIP 33618" />
          <Field label="Urgency" value="Emergency" />
          <Field label="Est. value" value="$1.8k–$3.2k" />
        </div>

        <p className="mt-4 text-[13.5px] text-[#475467] leading-relaxed">
          Basement flooding from a burst supply line, spreading across three rooms. Shutoff not located, caller waiting
          on site.
        </p>

        <div className="mt-4 rounded-xl bg-[#eef3ff] px-3.5 py-2.5">
          <p className="text-[10px] uppercase tracking-wide text-landing-primary/70 font-semibold">Recommended callback priority</p>
          <p className="font-cv-heading text-[15px] font-bold text-landing-primary">Call back now — top of the queue</p>
        </div>
      </div>

      {/* Card B — Message */}
      <div className="relative rounded-3xl border border-[#e3e7ed] bg-white p-6 shadow-[0_20px_50px_-30px_rgba(16,24,40,.28)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef1f6] px-2.5 py-1 text-[12px] font-bold text-[#475467]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#98a2b3]" /> Message
            </span>
            <p className="mt-2 text-[12px] text-[#667085] font-medium">Documented · routed · no score</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f2f4f7] px-3 py-1.5 text-[12.5px] font-semibold text-[#98a2b3] ring-1 ring-[#e3e7ed]">
            No score
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 rounded-2xl border border-[#eef1f4] bg-[#f9fafb] p-4">
          <Field label="Type" value="Billing question" />
          <Field label="Customer" value="Dana Whitfield" />
          <Field label="Requested" value="Callback" />
          <Field label="Pipeline" value="None" />
        </div>

        <p className="mt-4 text-[13.5px] text-[#475467] leading-relaxed">
          Existing customer asking about a charge on last month&apos;s invoice. Not a new job, so it&apos;s routed to
          the office, not the callback queue.
        </p>

        <div className="mt-4 rounded-xl bg-[#f2f4f7] px-3.5 py-2.5">
          <p className="text-[10px] uppercase tracking-wide text-[#98a2b3] font-semibold">Handling</p>
          <p className="font-cv-heading text-[15px] font-bold text-[#475467]">No pipeline, just handled</p>
        </div>
      </div>
    </div>
  );
}
