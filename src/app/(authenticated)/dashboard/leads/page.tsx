import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCompanyByClerkId } from "@/lib/db/queries/companies";
import { getLeadsByCompany, getLeadsForPipeline, getLeadPipelineCounts } from "@/lib/db/queries/leads";
import { hasActiveSubscription } from "@/lib/subscription";
import { Zap, List, Columns3 } from "lucide-react";
import { LeadsSearch } from "./leads-search";
import { LeadRowActions } from "./lead-row-actions";
import { LeadsKanban } from "./leads-kanban";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number | null | undefined) {
  if (!n) return null;
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function timeAgo(date: Date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const STATUS_STYLES: Record<string, string> = {
  new:       "bg-blue-50 text-blue-600 border-blue-200",
  contacted: "bg-yellow-50 text-yellow-700 border-yellow-200",
  quoted:    "bg-purple-50 text-purple-700 border-purple-200",
  scheduled: "bg-indigo-50 text-indigo-700 border-indigo-200",
  won:       "bg-green-50 text-green-700 border-green-200",
  completed: "bg-teal-50 text-teal-700 border-teal-200",
  lost:      "bg-slate-100 text-slate-500 border-slate-200",
};

const STATUS_LABELS: Record<string, string> = {
  new: "New", contacted: "Contacted", quoted: "Quoted",
  scheduled: "Scheduled", won: "Won", completed: "Completed", lost: "Lost",
};

const SERVICE_LABELS: Record<string, string> = {
  interior: "Interior", exterior: "Exterior",
  both: "Interior + Exterior", other: "Other",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; page?: string; view?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const company = await getCompanyByClerkId(userId);
  if (!company) redirect("/onboarding");

  const { hasAccess: canAddLead } = await hasActiveSubscription(userId);

  const { status, search, page, view } = await searchParams;
  const isKanban = view === "kanban";
  const currentPage = Math.max(1, parseInt(page ?? "1"));
  const limit = 25;
  const offset = (currentPage - 1) * limit;

  const [leads, pipelineLeads, pipeline] = await Promise.all([
    !isKanban ? getLeadsByCompany(company.id, { status: status || undefined, search: search || undefined, limit, offset }) : Promise.resolve([]),
    isKanban  ? getLeadsForPipeline(company.id) : Promise.resolve([]),
    getLeadPipelineCounts(company.id),
  ]);

  const isNew = (createdAt: Date) => Date.now() - new Date(createdAt).getTime() < 24 * 60 * 60 * 1000;

const DAY = 24 * 60 * 60 * 1000;
function isStale(lead: { status: string; createdAt: Date; updatedAt: Date }): boolean {
  const now = Date.now();
  if (lead.status === "new")       return now - new Date(lead.createdAt).getTime() > 2 * DAY;
  if (lead.status === "contacted") return now - new Date(lead.createdAt).getTime() > 2 * DAY;
  if (lead.status === "quoted")    return now - new Date(lead.updatedAt).getTime() > 5 * DAY;
  if (lead.status === "won")       return now - new Date(lead.updatedAt).getTime() > 3 * DAY;
  return false;
}

  return (
    <div className="space-y-5">

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[1.4rem] font-extrabold tracking-tight text-[#0F1628]" style={{ fontFamily: "var(--font-sora)" }}>Leads</h1>
          <p className="text-slate-500 text-sm mt-0.5">{pipeline.total} total</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center border border-[#E2E8F0] rounded-lg overflow-hidden">
            <Link
              href="/dashboard/leads"
              className={`flex items-center justify-center w-8 h-8 transition-colors ${!isKanban ? "bg-[#0F1628] text-white" : "bg-white text-slate-400 hover:bg-slate-50"}`}
              title="List view"
            >
              <List className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/dashboard/leads?view=kanban"
              className={`flex items-center justify-center w-8 h-8 transition-colors ${isKanban ? "bg-[#0F1628] text-white" : "bg-white text-slate-400 hover:bg-slate-50"}`}
              title="Pipeline view"
            >
              <Columns3 className="w-3.5 h-3.5" />
            </Link>
          </div>

          {canAddLead ? (
            <Link
              href="/dashboard/leads/new"
              className="px-3 py-2 rounded-lg text-sm font-semibold text-white bg-[#F97316] hover:bg-orange-600 transition-colors"
              style={{ boxShadow: "0 2px 8px rgba(249,115,22,.25)" }}
            >
              + Add lead
            </Link>
          ) : (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="bg-gray-200 text-gray-400 px-3 py-2 rounded-lg text-sm font-semibold cursor-not-allowed select-none">
                    + Add lead
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  Subscribe to add leads
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* Pipeline stats bar */}
      {!isKanban && !search && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {([
            { key: null,        label: "All",       count: pipeline.total },
            { key: "new",       label: "New",       count: pipeline.new },
            { key: "contacted", label: "Contacted", count: pipeline.contacted },
            { key: "quoted",    label: "Quoted",    count: pipeline.quoted },
            { key: "scheduled", label: "Scheduled", count: pipeline.scheduled },
            { key: "won",       label: "Won",       count: pipeline.won },
            { key: "completed", label: "Completed", count: pipeline.completed },
            { key: "lost",      label: "Lost",      count: pipeline.lost },
          ] as const).map(({ key, label, count }) => {
            const active = (key === null && !status) || key === status;
            const href = key ? `/dashboard/leads?status=${key}` : "/dashboard/leads";
            return (
              <Link
                key={label}
                href={href}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  active
                    ? "bg-[#0F1628] text-white border-[#0F1628]"
                    : "bg-white text-slate-600 border-[#E2E8F0] hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {label}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                  {count}
                </span>
              </Link>
            );
          })}
          {search && (
            <Link href="/dashboard/leads" className="px-3 py-1.5 rounded-lg text-xs text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors">
              Clear
            </Link>
          )}
        </div>
      )}

      {/* Kanban view */}
      {isKanban && <LeadsKanban leads={pipelineLeads} />}

      {/* List view */}
      {!isKanban && <>

      {/* Search + clear */}
      <div className="flex gap-2 flex-wrap items-center">
        <LeadsSearch defaultValue={search} />
        {(search || status) && (
          <Link
            href="/dashboard/leads"
            className="px-4 py-2 rounded-lg text-sm text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Clear filters
          </Link>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-[14px] overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,.07),0 4px 16px rgba(0,0,0,.05)" }}>
      {leads.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          {search || status ? "No leads match your filters." : "No leads yet. Share your quote link to get started."}
        </div>
      ) : (
          <>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-[.08em]">Contact</th>
                <th className="hidden sm:table-cell text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-[.08em]">Service</th>
                <th className="hidden sm:table-cell text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-[.08em]">Estimate</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-[.08em]">Status</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-[.08em]">Received</th>
                <th className="px-4 py-2.5 text-right text-[10px] font-bold text-slate-500 uppercase tracking-[.08em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-[#FAFBFC] transition-colors cursor-pointer">
                  <td className="px-4 py-3.5">
                    <Link href={`/dashboard/leads/${lead.id}`} className="block mb-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-[#1E293B] text-[.85rem]">{lead.homeownerName}</span>
                        {isNew(lead.createdAt) && lead.status === "new" && (
                          <span className="text-[10px] font-bold px-1.5 py-px rounded-full bg-blue-50 text-blue-600 border border-blue-200">NEW</span>
                        )}
                      </div>
                    </Link>
                    <a href={`tel:${lead.homeownerPhone}`} className="text-[#F97316] text-[.78rem] font-medium block mt-0.5">
                      {lead.homeownerPhone}
                    </a>
                    {lead.homeownerEmail && (
                      <a href={`mailto:${lead.homeownerEmail}`} className="text-slate-400 hover:text-slate-600 text-[.75rem] block truncate max-w-[180px]">
                        {lead.homeownerEmail}
                      </a>
                    )}
                  </td>
                  <td className="hidden sm:table-cell px-4 py-3.5 text-[.82rem] text-[#1E293B]">
                    <Link href={`/dashboard/leads/${lead.id}`} className="block">
                      {lead.serviceType ? SERVICE_LABELS[lead.serviceType] ?? lead.serviceType : "—"}
                    </Link>
                  </td>
                  <td className="hidden sm:table-cell px-4 py-3.5">
                    <Link href={`/dashboard/leads/${lead.id}`} className="block">
                      {lead.aiEstimateLow && lead.aiEstimateHigh ? (
                        <span className="text-[.82rem] font-semibold text-[#1E293B]">
                          {fmt(lead.aiEstimateLow)} – {fmt(lead.aiEstimateHigh)}
                        </span>
                      ) : (
                        <span className="text-[.82rem] text-slate-400">No estimate</span>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <Link href={`/dashboard/leads/${lead.id}`} className="block space-y-1">
                      <span className={`inline-flex text-[.7rem] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLES[lead.status] ?? "bg-slate-100 text-slate-500 border-slate-200"}`}>
                        {STATUS_LABELS[lead.status] ?? lead.status}
                      </span>
                      {isStale(lead) && (
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                          <span className="text-[.68rem] font-semibold text-amber-600">Needs follow-up</span>
                        </span>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 text-[.78rem]">
                    <Link href={`/dashboard/leads/${lead.id}`} className={`block ${isStale(lead) ? "text-amber-500 font-medium" : "text-slate-400"}`}>
                      {timeAgo(lead.createdAt)}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <LeadRowActions leadId={lead.id} hasEmail={!!lead.homeownerEmail && !lead.description} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {leads.length === limit && (
            <div className="px-4 py-3 border-t border-[#E2E8F0] flex justify-end">
              <Link
                href={`/dashboard/leads?${new URLSearchParams({ ...(search ? { search } : {}), ...(status ? { status } : {}), page: String(currentPage + 1) })}`}
                className="text-[.82rem] font-semibold text-[#F97316] hover:underline flex items-center gap-1"
              >
                Next page →
              </Link>
            </div>
          )}
          </>
      )}
      </div>

      </>}
    </div>
  );
}
