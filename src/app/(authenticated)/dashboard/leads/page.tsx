import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getBusinessByClerkId } from "@/lib/db/queries/businesses";
import { getLeadsByBusiness } from "@/lib/db/queries/leads";
import { getVerticalConfig } from "@/lib/db/queries/verticalConfigs";
import { deriveServiceLabel, deriveReasonLine } from "@/lib/verticals/labels";
import { tierMeta, highValueBadge, intentMeta, statusMeta, sourceLabel, timeAgoShort, fmtValueRange, messageKindMeta } from "@/lib/leads/priority";
import { Card, Badge, LinkButton, DownloadLink, Icon } from "@/components/dashboard/v2/primitives";
import { FilterSelect } from "./_filter-select";
import { LeadRowActions } from "./lead-row-actions";

const STATUSES = [
  { value: "", label: "All statuses" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "booked", label: "Booked" },
  { value: "estimate_sent", label: "Estimate sent" },
  { value: "converted", label: "Won" },
  { value: "lost", label: "Lost" },
];

const PRIORITIES = [
  { value: "", label: "All priorities" },
  { value: "hot", label: "Hot" },
  { value: "warm", label: "Warm" },
  { value: "cool", label: "Cool" },
];

const SOURCES = [
  { value: "", label: "All sources" },
  { value: "voice_overflow", label: "Recovered (AI)" },
  { value: "voice_human", label: "Team answered" },
  { value: "website_widget", label: "Widget" },
  { value: "direct_intake", label: "Direct intake" },
  { value: "manual", label: "Manual" },
];

const TYPES = [
  { value: "", label: "Jobs & messages" },
  { value: "job", label: "Jobs" },
  { value: "message", label: "Messages" },
];

const SOURCE_ICON: Record<string, string> = {
  voice_overflow: "call",
  voice_human: "support_agent",
  website_widget: "widgets",
  direct_intake: "description",
  manual: "edit_note",
  email: "mail",
};

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; source?: string; priority?: string; type?: string; search?: string; page?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const business = await getBusinessByClerkId(userId);
  if (!business) redirect("/onboarding");

  const sp = await searchParams;
  const status = sp.status ?? "";
  const source = sp.source ?? "";
  const priority = (sp.priority ?? "") as "" | "hot" | "warm" | "cool";
  const type = (sp.type ?? "") as "" | "job" | "message";
  const search = sp.search ?? "";
  const page = Math.max(1, Number(sp.page ?? 1));
  const limit = 25;
  const offset = (page - 1) * limit;

  const [leadRows, verticalConfig] = await Promise.all([
    getLeadsByBusiness(business.id, {
      leadStatus: status || undefined,
      source: source || undefined,
      priority: priority || undefined,
      leadType: type || undefined,
      search: search || undefined,
      limit,
      offset,
    }),
    getVerticalConfig(business.vertical),
  ]);

  function buildUrl(params: Record<string, string>) {
    const base = new URLSearchParams({
      ...(status && { status }),
      ...(source && { source }),
      ...(priority && { priority }),
      ...(type && { type }),
      ...(search && { search }),
      ...(page > 1 && { page: String(page) }),
    });
    Object.entries(params).forEach(([k, v]) => (v ? base.set(k, v) : base.delete(k)));
    return `/dashboard/leads?${base.toString()}`;
  }

  const hasFilters = Boolean(status || source || priority || type || search);

  // The export route takes the same filter params as this page (minus paging — it
  // exports every matching lead), so the file matches the list on screen.
  const exportQuery = new URLSearchParams({
    ...(status && { status }),
    ...(source && { source }),
    ...(priority && { priority }),
    ...(type && { type }),
    ...(search && { search }),
  }).toString();
  const exportHref = `/api/export/leads${exportQuery ? `?${exportQuery}` : ""}`;

  return (
    <div className="font-cv-body text-cv-ink">
      <div className="flex justify-between items-start gap-6 mb-[22px] flex-col sm:flex-row">
        <div>
          <h1 className="font-cv-heading text-[34px] leading-[1.15] tracking-tight">Leads</h1>
          <p className="mt-[7px] text-cv-muted text-sm leading-relaxed">
            Every captured opportunity across calls, forms, widgets, and manual entry.
          </p>
        </div>
        <LinkButton href="/dashboard/leads/new" variant="primary">
          <Icon name="add" />
          Add lead
        </LinkButton>
      </div>

      <Card className="p-3.5 flex flex-wrap justify-between gap-3 items-center mb-3.5">
        <div className="flex flex-wrap gap-2 items-center flex-1 min-w-0">
          {/* Free text needs an explicit submit (Enter, or the mobile keyboard's
              search action) — reloading on every keystroke would be janky.
              type="search" gives it a native clear button + "search" IME action. */}
          <form method="GET" action="/dashboard/leads" className="flex-1 min-w-[180px]">
            {priority && <input type="hidden" name="priority" value={priority} />}
            {source && <input type="hidden" name="source" value={source} />}
            {status && <input type="hidden" name="status" value={status} />}
            {type && <input type="hidden" name="type" value={type} />}
            <input
              type="search"
              name="search"
              defaultValue={search}
              placeholder="Search name or phone"
              className="w-full h-10 border border-cv-border-strong rounded-[9px] bg-cv-surface px-[11px] outline-none focus:border-cv-primary focus:ring-[3px] focus:ring-cv-primary/10 text-sm"
            />
          </form>
          {/* Dropdowns filter immediately on change — no reason to batch a
              single discrete choice behind a separate "Apply" step. */}
          <FilterSelect name="type" value={type} options={TYPES} currentParams={{ search, priority, source, status, type }} />
          <FilterSelect name="priority" value={priority} options={PRIORITIES} currentParams={{ search, priority, source, status, type }} />
          <FilterSelect name="source" value={source} options={SOURCES} currentParams={{ search, priority, source, status, type }} />
          <FilterSelect name="status" value={status} options={STATUSES} currentParams={{ search, priority, source, status, type }} />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {hasFilters && (
            <Link href="/dashboard/leads" className="text-cv-primary text-xs font-bold hover:underline whitespace-nowrap">
              Clear filters
            </Link>
          )}
          <DownloadLink href={exportHref}>
            <Icon name="download" />
            Export
          </DownloadLink>
        </div>
      </Card>

      <Card>
        {leadRows.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-cv-muted">No leads found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse">
              <thead>
                <tr>
                  {["Lead", "Source", "Service", "Status", "Priority", "Intent and reason", "Est. value", "Waiting", ""].map((h) => (
                    <th
                      key={h}
                      className="px-3.5 py-[11px] bg-cv-surface-subtle border-b border-cv-border text-left text-[10px] tracking-wide uppercase text-cv-muted font-semibold"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leadRows.map((lead) => {
                  // A non-job message has no tier/intent/value — render its kind + the
                  // captured note instead of misleading "Unscored"/"Intent unclear".
                  const isMessage = lead.leadType === "message";
                  const tier = tierMeta(lead.priorityScore);
                  const highValue = highValueBadge(lead.estimatedValueLow);
                  const intent = intentMeta(lead.qualityScore);
                  const messageBadge = messageKindMeta(lead.messageKind);
                  const status = statusMeta(lead.leadStatus);
                  const service = deriveServiceLabel(verticalConfig, lead.intakeAnswers, lead.serviceRequested);
                  const reason = deriveReasonLine(verticalConfig, lead.intakeAnswers);
                  const value = fmtValueRange(lead.estimatedValueLow, lead.estimatedValueHigh);
                  return (
                    <tr key={lead.id} className="hover:bg-[#fbfcfd] border-b border-cv-border last:border-b-0">
                      <td className="px-3.5 py-3.5 text-xs align-middle">
                        <strong className="block text-[13px]">{lead.callerName ?? "—"}</strong>
                        <span className="block text-cv-muted mt-[3px]">{lead.callerPhone}</span>
                      </td>
                      <td className="px-3.5 py-3.5 align-middle">
                        <div className="flex items-center gap-1.5">
                          <div className="w-[31px] h-[31px] rounded-lg grid place-items-center bg-cv-gray-soft text-[#475467] shrink-0">
                            <Icon name={SOURCE_ICON[lead.source] ?? "help"} className="!text-[17px]" />
                          </div>
                          <span className="text-xs text-cv-ink whitespace-nowrap">{sourceLabel(lead.source)}</span>
                        </div>
                      </td>
                      <td className="px-3.5 py-3.5 text-xs align-middle">{isMessage ? "—" : (service ?? "—")}</td>
                      <td className="px-3.5 py-3.5 align-middle">
                        <Badge color={status.color}>{status.label}</Badge>
                      </td>
                      <td className="px-3.5 py-3.5 align-middle">
                        {isMessage ? (
                          <Badge color={messageBadge.color}>{messageBadge.label}</Badge>
                        ) : (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge color={tier.color}>{tier.label}</Badge>
                            {highValue && <Badge color={highValue.color}>{highValue.label}</Badge>}
                          </div>
                        )}
                      </td>
                      <td className="px-3.5 py-3.5 text-xs align-middle text-cv-muted max-w-[240px] leading-relaxed">
                        {isMessage ? (
                          lead.notes ?? "No message details captured."
                        ) : (
                          <>
                            <Badge color={intent.color} className="mr-1.5">
                              {intent.label}
                            </Badge>
                            {reason ?? "No additional detail captured."}
                          </>
                        )}
                      </td>
                      <td className="px-3.5 py-3.5 align-middle font-cv-mono font-bold text-xs whitespace-nowrap">{isMessage ? "—" : (value ?? "—")}</td>
                      <td className="px-3.5 py-3.5 align-middle font-cv-mono text-xs">{timeAgoShort(lead.createdAt)}</td>
                      <td className="px-3.5 py-3.5 align-middle text-right">
                        {/* hasEmail is false until a "request project details" email endpoint actually exists — see lead-row-actions.tsx */}
                        <LeadRowActions leadId={lead.id} hasEmail={false} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {(leadRows.length === limit || page > 1) && (
          <div className="px-[15px] py-[13px] border-t border-cv-border bg-cv-surface-subtle flex justify-between items-center text-[11px] text-cv-muted">
            <span>Page {page}</span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={buildUrl({ page: String(page - 1) })} className="w-9 h-9 rounded-[10px] grid place-items-center hover:bg-white transition-colors">
                  <Icon name="chevron_left" />
                </Link>
              )}
              {leadRows.length === limit && (
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
