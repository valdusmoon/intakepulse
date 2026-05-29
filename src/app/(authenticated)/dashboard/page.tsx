import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCompanyByClerkId } from "@/lib/db/queries/companies";
import { getLeadStats, getLeadsByCompany, getLeadsNeedingAttention } from "@/lib/db/queries/leads";
import { hasActiveSubscription } from "@/lib/subscription";
import { Zap } from "lucide-react";
import ActivationChecklist from "./activation-checklist";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function timeAgo(date: Date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-50 text-blue-700",
  contacted: "bg-yellow-50 text-yellow-700",
  quoted: "bg-purple-50 text-purple-700",
  scheduled: "bg-indigo-50 text-indigo-700",
  won: "bg-green-50 text-green-700",
  completed: "bg-teal-50 text-teal-700",
  lost: "bg-gray-100 text-gray-500",
};

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const company = await getCompanyByClerkId(userId);
  if (!company) redirect("/onboarding");

  const [{ hasAccess: canAddLead }, stats, attention, recentLeads] = await Promise.all([
    hasActiveSubscription(userId),
    getLeadStats(company.id),
    getLeadsNeedingAttention(company.id),
    getLeadsByCompany(company.id, { limit: 5 }),
  ]);

  return (
    <div className="space-y-8">

      {/* Trial activation CTA */}
      {!canAddLead && (
        <div className="bg-gradient-to-r from-orange-500 to-orange-400 rounded-[14px] px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4" style={{ boxShadow: "0 4px 16px rgba(249,115,22,.3)" }}>
          <div className="flex items-start gap-3 flex-1">
            <Zap className="w-5 h-5 text-white shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-white">Your quote link and lead capture are inactive</p>
              <p className="text-xs text-orange-100 mt-0.5">Start your free trial to go live — homeowners can't reach your form and you can't add leads until you do.</p>
            </div>
          </div>
          <Link
            href="/dashboard/billing"
            className="shrink-0 bg-white text-orange-500 text-xs font-bold px-4 py-2 rounded-lg hover:bg-orange-50 transition-colors whitespace-nowrap"
          >
            Start free trial →
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[1.4rem] font-extrabold tracking-tight text-[#0F1628]" style={{ fontFamily: "var(--font-sora)" }}>Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Welcome back, {company.ownerName.split(" ")[0]}.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/dashboard/leads" className="px-3 py-2 rounded-lg text-sm font-semibold text-[#0F1628] bg-white border border-[#CBD5E1] hover:border-slate-400 transition-colors">
            View all leads
          </Link>
          {canAddLead ? (
            <Link href="/dashboard/leads/new" className="px-3 py-2 rounded-lg text-sm font-semibold text-white bg-[#F97316] hover:bg-orange-600 transition-colors" style={{ boxShadow: "0 2px 8px rgba(249,115,22,.25)" }}>
              + Add lead
            </Link>
          ) : null}
        </div>
      </div>

      {/* Zero state — activation checklist (shown until first lead arrives) */}
      {recentLeads.length === 0 && (
        <ActivationChecklist
          quoteUrl={`${APP_URL}/quote/${company.id}`}
          hasGoogleReviewUrl={!!company.googleReviewUrl}
        />
      )}

      {/* KPI cards — hidden until first lead arrives */}
      {recentLeads.length > 0 && (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* This Month — orange accent */}
        <div className="bg-white border border-gray-200 rounded-[14px] overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,.07),0 4px 16px rgba(0,0,0,.05)" }}>
          <div className="h-[3px] bg-gradient-to-r from-orange-400 to-orange-300" />
          <div className="p-5">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-[.08em] mb-2">This Month</p>
            <p className="text-[1.9rem] font-extrabold leading-none text-[#0F1628]" style={{ fontFamily: "var(--font-sora)" }}>{stats.thisMonth}</p>
            <p className="text-[11px] text-slate-400 mt-1.5">leads captured</p>
          </div>
        </div>
        {/* Last 7 Days */}
        <div className="bg-white border border-gray-200 rounded-[14px] overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,.07),0 4px 16px rgba(0,0,0,.05)" }}>
          <div className="h-[3px] bg-[#E2E8F0]" />
          <div className="p-5">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-[.08em] mb-2">Last 7 Days</p>
            <p className="text-[1.9rem] font-extrabold leading-none text-[#0F1628]" style={{ fontFamily: "var(--font-sora)" }}>{stats.thisWeek}</p>
            <p className="text-[11px] text-slate-400 mt-1.5">leads captured</p>
          </div>
        </div>
        {/* Conversion */}
        <div className="bg-white border border-gray-200 rounded-[14px] overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,.07),0 4px 16px rgba(0,0,0,.05)" }}>
          <div className="h-[3px] bg-[#E2E8F0]" />
          <div className="p-5">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-[.08em] mb-2">Conversion</p>
            <p className={`text-[1.9rem] font-extrabold leading-none ${stats.conversionRate !== null ? "text-[#10B981]" : "text-[#0F1628]"}`} style={{ fontFamily: "var(--font-sora)" }}>
              {stats.conversionRate !== null ? `${stats.conversionRate}%` : "—"}
            </p>
            <p className="text-[11px] text-slate-400 mt-1.5">quoted → won</p>
          </div>
        </div>
        {/* Revenue Won */}
        <div className="bg-white border border-gray-200 rounded-[14px] overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,.07),0 4px 16px rgba(0,0,0,.05)" }}>
          <div className="h-[3px] bg-[#E2E8F0]" />
          <div className="p-5">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-[.08em] mb-2">Revenue Won</p>
            <p className={`text-[1.9rem] font-extrabold leading-none ${stats.revenueWon > 0 ? "text-[#F97316]" : "text-[#0F1628]"}`} style={{ fontFamily: "var(--font-sora)" }}>
              {stats.revenueWon > 0 ? fmt(stats.revenueWon) : "—"}
            </p>
            <p className="text-[11px] text-slate-400 mt-1.5">quoted amount</p>
          </div>
        </div>
      </div>
      )}

      {/* Needs attention */}
      {attention.length > 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-[14px] overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,.07),0 4px 16px rgba(0,0,0,.05)" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
            <h2 className="text-[.9rem] font-bold text-[#0F1628]" style={{ fontFamily: "var(--font-sora)" }}>Needs attention</h2>
            <Link href="/dashboard/leads" className="text-[.78rem] font-semibold text-[#F97316] hover:underline">
              View all leads →
            </Link>
          </div>
          <div className="divide-y divide-[#E2E8F0]">
            {attention.slice(0, 5).map((lead) => {
              const daysStale = Math.floor(
                (Date.now() - new Date(lead.status === "new" ? lead.createdAt : lead.updatedAt).getTime()) / (24 * 60 * 60 * 1000)
              );
              const actionLabel: Record<string, string> = {
                new: "Follow up",
                contacted: "Send a quote",
                quoted: "Check in",
                scheduled: "Send contract",
              };
              return (
                <Link
                  key={lead.id}
                  href={`/dashboard/leads/${lead.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-[#FAFBFC] transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                    <div>
                      <p className="text-[.83rem] font-semibold text-[#1E293B] group-hover:text-orange-600 transition-colors leading-tight">
                        {actionLabel[lead.status] ?? "Review"} · {lead.homeownerName}
                      </p>
                      <p className="text-[.72rem] text-slate-400 mt-0.5 capitalize">{lead.status} · {daysStale}d ago</p>
                    </div>
                  </div>
                  <span className="text-slate-300 text-xs">→</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent leads */}
      {recentLeads.length > 0 && (
      <div className="bg-white border border-[#E2E8F0] rounded-[14px] overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,.07),0 4px 16px rgba(0,0,0,.05)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
          <h2 className="text-[.9rem] font-bold text-[#0F1628]" style={{ fontFamily: "var(--font-sora)" }}>Recent leads</h2>
          <Link href="/dashboard/leads" className="text-[.78rem] font-semibold text-[#F97316] hover:underline">
            View all →
          </Link>
        </div>

        <>
            {/* Column headers */}
            <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[2.5fr_1.2fr_1fr_0.9fr] px-4 py-2.5 bg-[#F8FAFC] border-b border-[#E2E8F0]">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[.08em]">Contact</span>
              <span className="hidden sm:block text-[10px] font-bold text-slate-500 uppercase tracking-[.08em]">Estimate</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[.08em]">Status</span>
              <span className="hidden sm:block text-[10px] font-bold text-slate-500 uppercase tracking-[.08em]">Received</span>
            </div>
            {recentLeads.map((lead, i) => (
              <Link
                key={lead.id}
                href={`/dashboard/leads/${lead.id}`}
                className={`grid grid-cols-[1fr_auto] sm:grid-cols-[2.5fr_1.2fr_1fr_0.9fr] px-4 py-3.5 hover:bg-[#FAFBFC] transition-colors items-center ${i < recentLeads.length - 1 ? "border-b border-[#E2E8F0]" : ""}`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[.85rem] font-semibold text-[#1E293B]">{lead.homeownerName}</span>
                    {lead.status === "new" && Date.now() - new Date(lead.createdAt).getTime() < 24 * 60 * 60 * 1000 && (
                      <span className="text-[10px] font-bold px-1.5 py-px rounded-full bg-blue-50 text-blue-600 border border-blue-200">NEW</span>
                    )}
                  </div>
                  <div className="text-[.78rem] font-medium text-[#F97316] mt-0.5">{lead.homeownerPhone}</div>
                </div>
                <div className="hidden sm:block">
                  {lead.aiEstimateLow && lead.aiEstimateHigh ? (
                    <span className="text-[.82rem] font-semibold text-[#1E293B]">{fmt(lead.aiEstimateLow)}–{fmt(lead.aiEstimateHigh)}</span>
                  ) : (
                    <span className="text-[.82rem] text-slate-400">No estimate</span>
                  )}
                </div>
                <div>
                  <span className={`inline-flex text-[.7rem] font-bold px-2 py-0.5 rounded-full border ${
                    lead.status === "new" ? "bg-blue-50 text-blue-600 border-blue-200" :
                    lead.status === "contacted" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                    lead.status === "quoted" ? "bg-purple-50 text-purple-700 border-purple-200" :
                    lead.status === "scheduled" ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                    lead.status === "won" ? "bg-green-50 text-green-700 border-green-200" :
                    "bg-slate-100 text-slate-500 border-slate-200"
                  }`}>
                    {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                  </span>
                </div>
                <div className="hidden sm:block text-[.78rem] text-slate-400">{timeAgo(lead.createdAt)}</div>
              </Link>
            ))}
          </>
      </div>
      )}
    </div>
  );
}
