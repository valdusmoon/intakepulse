import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getBusinessByClerkId } from "@/lib/db/queries/businesses";
import { getLeadsByBusiness, getLeadStats } from "@/lib/db/queries/leads";

function fmt(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function timeAgo(date: Date) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function UrgencyBadge({ score }: { score: number | null }) {
  if (!score) return <span className="text-xs text-gray-300">—</span>;
  const cls =
    score >= 8 ? "text-red-600 bg-red-50" :
    score >= 5 ? "text-orange-600 bg-orange-50" :
    score >= 3 ? "text-yellow-700 bg-yellow-50" :
    "text-gray-500 bg-gray-100";
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${cls}`}>{score}/10</span>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    sms_sent: "text-blue-600 bg-blue-50",
    intake_started: "text-purple-600 bg-purple-50",
    intake_completed: "text-indigo-600 bg-indigo-50",
    qualified: "text-orange-600 bg-orange-50",
    converted: "text-green-600 bg-green-50",
    lost: "text-gray-500 bg-gray-100",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-md capitalize ${map[status] ?? "text-gray-500 bg-gray-100"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

const METRICS = [
  { key: "totalThisMonth", label: "Leads this month", strip: "bg-orange-400", fmt: (v: number) => v.toString() },
  { key: "intakeCompletionRate", label: "Intake completion", strip: "bg-blue-400", fmt: (v: number | null) => v != null ? `${v}%` : "—" },
  { key: "converted", label: "Converted", strip: "bg-green-400", fmt: (v: number) => v.toString() },
  { key: "estimatedRevenue", label: "Pipeline value", strip: "bg-orange-300", fmt: (v: number) => v > 0 ? fmt(v) : "—" },
] as const;

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const business = await getBusinessByClerkId(userId);
  if (!business) redirect("/onboarding");

  const [stats, recentLeads] = await Promise.all([
    getLeadStats(business.id),
    getLeadsByBusiness(business.id, { limit: 8 }),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>
        <Link
          href="/dashboard/leads/new"
          className="text-sm font-semibold bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
        >
          + Add lead
        </Link>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {METRICS.map((m) => {
          const raw = stats[m.key as keyof typeof stats] as number | null;
          return (
            <div key={m.label} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className={`h-[3px] ${m.strip}`} />
              <div className="px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">{m.label}</p>
                <p className="text-3xl font-bold text-gray-900 leading-none">{m.fmt(raw as never)}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent leads */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Recent Leads</span>
          <Link href="/dashboard/leads" className="text-xs text-orange-500 font-medium hover:text-orange-600">
            View all →
          </Link>
        </div>

        {recentLeads.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">
            No leads yet. They appear here once a missed call is recovered or a form is submitted.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentLeads.map((lead) => (
              <Link
                key={lead.id}
                href={`/dashboard/leads/${lead.id}`}
                className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {lead.callerName ?? lead.callerPhone}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 font-mono">{lead.callerPhone} · {timeAgo(lead.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <UrgencyBadge score={lead.urgencyScore} />
                  <StatusBadge status={lead.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
