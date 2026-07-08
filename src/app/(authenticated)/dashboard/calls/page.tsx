import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getBusinessByClerkId } from "@/lib/db/queries/businesses";
import { getCallsByBusiness, getCallMetrics } from "@/lib/db/queries/calls";
import { getVerticalConfig } from "@/lib/db/queries/verticalConfigs";
import { deriveServiceLabel } from "@/lib/verticals/labels";
import { priorityMeta } from "@/lib/leads/priority";
import { Card, MetricCard, Badge, Icon } from "@/components/dashboard/v2/primitives";

const OUTCOMES = [
  { value: "", label: "All outcomes" },
  { value: "business_answered", label: "Business answered" },
  { value: "ai_captured", label: "Captured by Callverted" },
  { value: "abandoned", label: "Caller abandoned" },
  { value: "error", label: "Error / transfer failed" },
];

const OUTCOME_META: Record<string, { label: string; icon: string; iconClass: string; sub: string }> = {
  in_progress: { label: "In progress", icon: "sync", iconClass: "bg-cv-gray-soft text-[#667085]", sub: "Call underway" },
  business_answered: { label: "Business answered", icon: "phone_in_talk", iconClass: "bg-cv-green-soft text-cv-green", sub: "Connected directly" },
  ai_captured: { label: "Captured by Callverted", icon: "support_agent", iconClass: "bg-cv-primary-soft text-cv-primary", sub: "No answer — AI took over" },
  abandoned: { label: "Caller abandoned", icon: "phone_missed", iconClass: "bg-cv-gray-soft text-[#667085]", sub: "Hung up before completing" },
  error: { label: "Error", icon: "error", iconClass: "bg-cv-red-soft text-cv-red", sub: "Transfer failed" },
};

function fmtDuration(seconds: number | null) {
  if (seconds == null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function fmtDateTime(date: Date) {
  const d = new Date(date);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (isToday) return `Today · ${time}`;
  if (isYesterday) return `Yesterday · ${time}`;
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${time}`;
}

export default async function CallsPage({
  searchParams,
}: {
  searchParams: Promise<{ outcome?: string; search?: string; page?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const business = await getBusinessByClerkId(userId);
  if (!business) redirect("/onboarding");

  const sp = await searchParams;
  const outcome = sp.outcome ?? "";
  const search = sp.search ?? "";
  const page = Math.max(1, Number(sp.page ?? 1));
  const limit = 25;

  const [callRows, metrics, verticalConfig] = await Promise.all([
    getCallsByBusiness(business.id, { outcome: outcome || undefined, search: search || undefined, limit, offset: (page - 1) * limit }),
    getCallMetrics(business.id),
    getVerticalConfig(business.vertical),
  ]);

  function buildUrl(params: Record<string, string>) {
    const base = new URLSearchParams({ ...(outcome && { outcome }), ...(search && { search }), ...(page > 1 && { page: String(page) }) });
    Object.entries(params).forEach(([k, v]) => (v ? base.set(k, v) : base.delete(k)));
    return `/dashboard/calls?${base.toString()}`;
  }

  return (
    <div className="font-cv-body text-cv-ink">
      <div className="flex justify-between items-start gap-6 mb-[22px] flex-col sm:flex-row">
        <div>
          <h1 className="font-cv-heading text-[34px] leading-[1.15] tracking-tight">Calls</h1>
          <p className="mt-[7px] text-cv-muted text-sm leading-relaxed">
            See which calls your team answered, which Callverted recovered, and where callers dropped.
          </p>
        </div>
      </div>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
        <MetricCard label="Inbound calls" value={metrics.inboundTotal} note="All time" />
        <MetricCard
          label="Answered by your team"
          value={metrics.answeredByTeam}
          note={metrics.inboundTotal > 0 ? `${Math.round((metrics.answeredByTeam / metrics.inboundTotal) * 100)}% of inbound calls` : undefined}
        />
        <MetricCard
          label="Overflow calls captured"
          value={metrics.overflowCaptured}
          valueColor="var(--color-cv-primary)"
          note={metrics.inboundTotal > 0 ? `${Math.round((metrics.overflowCaptured / metrics.inboundTotal) * 100)}% of inbound calls` : undefined}
        />
        <MetricCard
          label="Caller completion"
          value={metrics.callerCompletionRate != null ? `${metrics.callerCompletionRate}%` : "—"}
          note="Finished enough intake to create a lead"
        />
      </section>

      <Card className="p-3.5 flex flex-wrap gap-2.5 items-center mb-3.5">
        <form method="GET" action="/dashboard/calls" className="flex flex-wrap gap-2 items-center flex-1 min-w-0">
          <input
            name="search"
            defaultValue={search}
            placeholder="Search caller number"
            className="h-10 min-w-[200px] flex-1 border border-cv-border-strong rounded-[9px] bg-cv-surface px-[11px] outline-none focus:border-cv-primary focus:ring-[3px] focus:ring-cv-primary/10 text-sm"
          />
          <select name="outcome" defaultValue={outcome} className="h-10 border border-cv-border-strong rounded-[9px] bg-cv-surface px-[11px] outline-none focus:border-cv-primary text-sm">
            {OUTCOMES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button type="submit" className="h-10 px-3.5 rounded-[9px] border border-cv-primary bg-cv-primary text-white text-[13px] font-bold hover:bg-cv-primary-dark transition-colors">
            Apply
          </button>
        </form>
      </Card>

      <Card>
        {callRows.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-cv-muted">No calls yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse">
              <thead>
                <tr>
                  {["Caller", "Date and time", "Outcome", "Service", "Duration", "Lead", "Recording"].map((h, i) => (
                    <th
                      key={h}
                      className={`px-3.5 py-[11px] bg-cv-surface-subtle border-b border-cv-border text-left text-[10px] tracking-wide uppercase text-cv-muted font-semibold ${i === 6 ? "text-right" : ""}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {callRows.map((call) => {
                  const meta = OUTCOME_META[call.outcome] ?? OUTCOME_META.in_progress;
                  const service = deriveServiceLabel(verticalConfig, call.leadIntakeAnswers);
                  const priority = call.leadId ? priorityMeta(call.leadUrgencyScore) : null;
                  return (
                    <tr key={call.id} className="hover:bg-[#fbfcfd] border-b border-cv-border last:border-b-0">
                      <td className="px-3.5 py-3.5 text-xs align-middle">
                        <strong className="block text-[13px]">{call.callerPhone}</strong>
                      </td>
                      <td className="px-3.5 py-3.5 text-xs align-middle whitespace-nowrap">{fmtDateTime(call.createdAt)}</td>
                      <td className="px-3.5 py-3.5 align-middle">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-[31px] h-[31px] rounded-[9px] grid place-items-center shrink-0 ${meta.iconClass}`}>
                            <Icon name={meta.icon} className="!text-[17px]" />
                          </div>
                          <div>
                            <strong className="block text-[13px]">{meta.label}</strong>
                            <div className="text-[11px] text-cv-muted">{meta.sub}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3.5 py-3.5 text-xs align-middle">{service ?? "—"}</td>
                      <td className="px-3.5 py-3.5 align-middle font-cv-mono text-xs">{fmtDuration(call.durationSeconds)}</td>
                      <td className="px-3.5 py-3.5 align-middle">
                        {call.leadId && priority ? <Badge color={priority.color}>{priority.label}</Badge> : <span className="text-cv-muted text-xs">—</span>}
                      </td>
                      <td className="px-3.5 py-3.5 align-middle text-right">
                        {call.recordingUrl ? (
                          <a
                            href={call.leadId ? `/dashboard/leads/${call.leadId}` : call.recordingUrl}
                            className="inline-flex items-center gap-1.5 text-cv-primary text-xs font-bold hover:underline whitespace-nowrap"
                          >
                            <Icon name="play_arrow" className="!text-base" />
                            Play
                          </a>
                        ) : (
                          <span className="text-cv-muted text-xs">Not recorded</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {(callRows.length === limit || page > 1) && (
          <div className="px-[15px] py-[13px] border-t border-cv-border bg-cv-surface-subtle flex justify-between items-center text-[11px] text-cv-muted">
            <span>Page {page}</span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={buildUrl({ page: String(page - 1) })} className="w-9 h-9 rounded-[10px] grid place-items-center hover:bg-white transition-colors">
                  <Icon name="chevron_left" />
                </Link>
              )}
              {callRows.length === limit && (
                <Link href={buildUrl({ page: String(page + 1) })} className="w-9 h-9 rounded-[10px] grid place-items-center hover:bg-white transition-colors">
                  <Icon name="chevron_right" />
                </Link>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
