import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getBusinessByClerkId } from "@/lib/db/queries/businesses";
import { getLeadsByBusiness } from "@/lib/db/queries/leads";

const STATUSES = [
  { value: "", label: "All" },
  { value: "sms_sent", label: "SMS Sent" },
  { value: "intake_completed", label: "Intake Done" },
  { value: "qualified", label: "Qualified" },
  { value: "converted", label: "Converted" },
  { value: "lost", label: "Lost" },
];

function UrgencyBadge({ score }: { score: number | null }) {
  if (!score) return <span className="text-xs text-gray-300">—</span>;
  const color =
    score >= 8 ? "bg-red-100 text-red-700" :
    score >= 6 ? "bg-orange-100 text-orange-700" :
    score >= 4 ? "bg-yellow-100 text-yellow-700" :
    "bg-green-100 text-green-700";
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>{score}/10</span>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    sms_sent: "bg-blue-100 text-blue-700",
    intake_started: "bg-purple-100 text-purple-700",
    intake_completed: "bg-indigo-100 text-indigo-700",
    qualified: "bg-orange-100 text-orange-700",
    converted: "bg-green-100 text-green-700",
    lost: "bg-gray-100 text-gray-500",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${map[status] ?? "bg-gray-100 text-gray-500"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function SourceBadge({ source }: { source: string }) {
  const map: Record<string, string> = {
    missed_call: "📞",
    embed: "🌐",
    email: "✉️",
    manual: "✏️",
  };
  return <span className="text-xs text-gray-400">{map[source] ?? "?"} {source.replace(/_/g, " ")}</span>;
}

function fmt(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function timeAgo(date: Date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const business = await getBusinessByClerkId(userId);
  if (!business) redirect("/onboarding");

  const sp = await searchParams;
  const status = sp.status ?? "";
  const search = sp.search ?? "";
  const page = Math.max(1, Number(sp.page ?? 1));
  const limit = 25;
  const offset = (page - 1) * limit;

  const leads = await getLeadsByBusiness(business.id, {
    status: status || undefined,
    search: search || undefined,
    limit,
    offset,
  });

  function buildUrl(params: Record<string, string>) {
    const base = new URLSearchParams({ ...(status && { status }), ...(search && { search }), ...(page > 1 && { page: String(page) }) });
    Object.entries(params).forEach(([k, v]) => v ? base.set(k, v) : base.delete(k));
    return `/dashboard/leads?${base.toString()}`;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Leads</h1>
        <Link
          href="/dashboard/leads/new"
          className="text-sm font-semibold bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
        >
          + Add lead
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex flex-wrap gap-3 items-center">
        <form method="GET" action="/dashboard/leads" className="flex-1 min-w-0">
          <input
            name="search"
            defaultValue={search}
            placeholder="Search name or phone…"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          {status && <input type="hidden" name="status" value={status} />}
        </form>
        <div className="flex gap-1.5 flex-wrap">
          {STATUSES.map((s) => (
            <Link
              key={s.value}
              href={buildUrl({ status: s.value, page: "1" })}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                status === s.value
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {leads.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-gray-400">
            No leads found.
          </div>
        ) : (
          <>
            <div className="hidden sm:grid grid-cols-[1fr_1fr_auto_auto_auto_auto] gap-4 px-5 py-2.5 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              <span>Caller</span>
              <span>Source</span>
              <span>Urgency</span>
              <span>Est. Value</span>
              <span>Status</span>
              <span>When</span>
            </div>
            <div className="divide-y divide-gray-50">
              {leads.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/dashboard/leads/${lead.id}`}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto_auto_auto] gap-1 sm:gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors items-center"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{lead.callerName ?? "—"}</p>
                    <p className="text-xs text-gray-400">{lead.callerPhone}</p>
                  </div>
                  <SourceBadge source={lead.source} />
                  <UrgencyBadge score={lead.urgencyScore} />
                  <span className="text-sm text-gray-700">
                    {lead.estimatedValueLow && lead.estimatedValueHigh
                      ? `${fmt(lead.estimatedValueLow)}–${fmt(lead.estimatedValueHigh)}`
                      : "—"}
                  </span>
                  <StatusBadge status={lead.status} />
                  <span className="text-xs text-gray-400">{timeAgo(lead.createdAt)}</span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {leads.length === limit && (
        <div className="flex justify-center gap-3">
          {page > 1 && (
            <Link href={buildUrl({ page: String(page - 1) })} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-200 rounded-lg">
              ← Previous
            </Link>
          )}
          <Link href={buildUrl({ page: String(page + 1) })} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-200 rounded-lg">
            Next →
          </Link>
        </div>
      )}
    </div>
  );
}
