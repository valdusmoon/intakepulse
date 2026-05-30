import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getBusinessByClerkId } from "@/lib/db/queries/businesses";
import { getLeadsByBusiness, getLeadStats } from "@/lib/db/queries/leads";

function fmt(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function UrgencyBadge({ score }: { score: number | null }) {
  if (!score) return <span className="text-xs text-gray-400">—</span>;
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
  const label = status.replace(/_/g, " ");
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${map[status] ?? "bg-gray-100 text-gray-500"}`}>
      {label}
    </span>
  );
}

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const business = await getBusinessByClerkId(userId);
  if (!business) redirect("/onboarding");

  const [stats, recentLeads] = await Promise.all([
    getLeadStats(business.id),
    getLeadsByBusiness(business.id, { limit: 10 }),
  ]);

  const metrics = [
    { label: "Leads this month", value: stats.totalThisMonth.toString() },
    { label: "Intake completion", value: stats.intakeCompletionRate != null ? `${stats.intakeCompletionRate}%` : "—" },
    { label: "Converted", value: stats.converted.toString() },
    { label: "Pipeline value", value: stats.estimatedRevenue > 0 ? fmt(stats.estimatedRevenue) : "—" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <Link
          href="/dashboard/leads/new"
          className="text-sm font-semibold bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
        >
          + Add lead
        </Link>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">{m.label}</p>
            <p className="text-2xl font-bold text-gray-900">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Recent leads */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Recent Leads</h2>
          <Link href="/dashboard/leads" className="text-xs text-orange-500 font-medium hover:text-orange-600">
            View all →
          </Link>
        </div>

        {recentLeads.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">
            No leads yet. Leads appear here when a missed call is recovered or a form is submitted.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentLeads.map((lead) => (
              <Link
                key={lead.id}
                href={`/dashboard/leads/${lead.id}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {lead.callerName ?? lead.callerPhone}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{lead.callerPhone} · {lead.source}</p>
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
