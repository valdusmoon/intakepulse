import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getBusinessByClerkId } from "@/lib/db/queries/businesses";
import { getLeadById } from "@/lib/db/queries/leads";
import { getAiAssessmentByLeadId } from "@/lib/db/queries/aiAssessments";
import { getPendingFollowup } from "@/lib/db/queries/followups";
import { getSmsEventsByLead } from "@/lib/db/queries/smsEvents";
import { getCallByLeadId } from "@/lib/db/queries/calls";
import { getVerticalConfig } from "@/lib/db/queries/verticalConfigs";
import { LeadDetailClient } from "./_client";

function fmtCents(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function timeAgo(date: Date) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function fmtTime(date: Date | string) {
  return new Date(date).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function urgencyMeta(score: number | null) {
  if (!score) return { label: "Unscored", bar: "bg-gray-200", text: "text-gray-500", badge: "bg-gray-100 text-gray-500" };
  if (score >= 8) return { label: "Critical", bar: "bg-red-500", text: "text-red-600", badge: "bg-red-50 text-red-600 border border-red-200" };
  if (score >= 5) return { label: "High", bar: "bg-orange-500", text: "text-orange-600", badge: "bg-orange-50 text-orange-600 border border-orange-200" };
  if (score >= 3) return { label: "Medium", bar: "bg-yellow-400", text: "text-yellow-700", badge: "bg-yellow-50 text-yellow-700 border border-yellow-200" };
  return { label: "Low", bar: "bg-gray-300", text: "text-gray-500", badge: "bg-gray-100 text-gray-500" };
}

// Build a flat, time-sorted event list from available data
function buildTimeline(
  call: Awaited<ReturnType<typeof getCallByLeadId>>,
  smsEvents: Awaited<ReturnType<typeof getSmsEventsByLead>>,
  lead: { source: string; status: string; createdAt: Date; updatedAt: Date }
) {
  const events: { key: string; label: string; sub?: string; time: Date; dot: string }[] = [];

  if (call) {
    events.push({ key: "call_init", label: "Call initiated", sub: call.callerPhone, time: new Date(call.createdAt), dot: "bg-gray-300" });
    if (call.missedAt) {
      events.push({ key: "call_missed", label: "Missed — no answer", time: new Date(call.missedAt), dot: "bg-red-400" });
    }
  } else if (lead.source !== "missed_call") {
    events.push({ key: "lead_created", label: `Lead created via ${lead.source.replace(/_/g, " ")}`, time: new Date(lead.createdAt), dot: "bg-gray-300" });
  }

  for (const sms of smsEvents) {
    if (sms.direction === "outbound") {
      const delivered = sms.status === "delivered" ? " · delivered ✓" : "";
      events.push({ key: `sms_${sms.id}`, label: "Recovery SMS sent", sub: `${sms.status}${delivered}`, time: new Date(sms.createdAt), dot: "bg-orange-400" });
    } else {
      events.push({ key: `sms_in_${sms.id}`, label: "Prospect replied", sub: sms.body.slice(0, 60), time: new Date(sms.createdAt), dot: "bg-green-400" });
    }
  }

  if (["intake_completed", "qualified", "converted"].includes(lead.status)) {
    events.push({ key: "intake_done", label: "Intake completed", time: new Date(lead.updatedAt), dot: "bg-green-500" });
  }
  if (lead.status === "qualified") {
    events.push({ key: "qualified", label: "AI assessment complete", time: new Date(lead.updatedAt), dot: "bg-orange-500" });
  }

  return events.sort((a, b) => a.time.getTime() - b.time.getTime());
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
      <div className="px-5 py-3 border-b border-gray-100">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">{label}</span>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;
  const business = await getBusinessByClerkId(userId);
  if (!business) redirect("/onboarding");

  const lead = await getLeadById(id);
  if (!lead || lead.businessId !== business.id) notFound();

  const [assessment, pendingFollowup, smsEvents, call, verticalConfig] = await Promise.all([
    getAiAssessmentByLeadId(lead.id),
    getPendingFollowup(lead.id),
    getSmsEventsByLead(lead.id),
    getCallByLeadId(lead.id),
    getVerticalConfig(business.vertical),
  ]);

  const urgency = urgencyMeta(lead.urgencyScore);
  const timeline = buildTimeline(call, smsEvents, lead);

  // Formatted intake answers
  const questions = verticalConfig?.questions ?? [];
  const qMap = new Map(questions.map((q) => [q.key, q]));
  const formattedAnswers = lead.intakeAnswers
    ? Object.entries(lead.intakeAnswers)
        .sort(([a], [b]) => {
          const ai = questions.findIndex((q) => q.key === a);
          const bi = questions.findIndex((q) => q.key === b);
          return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
        })
        .map(([key, value]) => {
          const q = qMap.get(key);
          const label = q?.label ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
          const optMap = new Map(q?.options?.map((o) => [o.value, o.label]) ?? []);
          const val = Array.isArray(value)
            ? value.map((v) => optMap.get(v) ?? v).join(", ")
            : (optMap.get(value as string) ?? value);
          return { label, value: val as string };
        })
    : [];

  const displayName = lead.callerName ?? lead.callerPhone;

  return (
    <div>
      {/* Back + title */}
      <div className="flex items-center gap-3 mb-4">
        <Link href="/dashboard/leads" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Leads
        </Link>
        <span className="text-gray-200">/</span>
        <h1 className="text-base font-semibold text-gray-900">{displayName}</h1>
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${urgency.badge}`}>
          {urgency.label}{lead.urgencyScore ? ` · ${lead.urgencyScore}/10` : ""}
        </span>
      </div>

      {/* Hero */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
        <div className={`h-[3px] ${urgency.bar}`} />
        <div className="px-5 py-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 leading-tight">{displayName}</h2>
            <a
              href={`tel:${lead.callerPhone}`}
              className="inline-flex items-center gap-1.5 text-sm text-orange-500 font-medium hover:text-orange-600 mt-1"
            >
              📞 {lead.callerPhone}
            </a>
            {lead.callerEmail && (
              <a
                href={`mailto:${lead.callerEmail}`}
                className="block text-sm text-gray-400 hover:text-gray-600 mt-0.5"
              >
                ✉️ {lead.callerEmail}
              </a>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full capitalize">
                {lead.source.replace(/_/g, " ")}
              </span>
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full capitalize">
                {lead.status.replace(/_/g, " ")}
              </span>
              <span className="text-xs text-gray-400 px-2.5 py-1">{timeAgo(lead.createdAt)}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            {lead.estimatedValueLow && lead.estimatedValueHigh ? (
              <>
                <p className="text-[11px] uppercase tracking-widest font-semibold text-gray-400">Est. Value</p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">
                  {fmtCents(lead.estimatedValueLow)}–{fmtCents(lead.estimatedValueHigh)}
                </p>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 items-start">

        {/* ── LEFT ── */}
        <div>
          {/* Call Timeline */}
          {timeline.length > 0 && (
            <Section label="Timeline">
              <div className="space-y-0">
                {timeline.map((e, i) => (
                  <div key={e.key} className="flex gap-3 pb-4 relative last:pb-0">
                    {i < timeline.length - 1 && (
                      <div className="absolute left-[7px] top-4 bottom-0 w-px bg-gray-100" />
                    )}
                    <div className={`w-3.5 h-3.5 rounded-full ${e.dot} shrink-0 mt-0.5 z-10`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 leading-snug">{e.label}</p>
                      {e.sub && <p className="text-xs text-gray-400 mt-0.5 truncate">{e.sub}</p>}
                      <p className="text-[11px] text-gray-300 mt-0.5">{fmtTime(e.time)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* SMS Thread */}
          {smsEvents.length > 0 && (
            <Section label="SMS Thread">
              <div className="space-y-3">
                {smsEvents.map((sms) => (
                  <div key={sms.id}>
                    <p className={`text-[11px] font-semibold uppercase tracking-wide mb-1 ${sms.direction === "outbound" ? "text-gray-400" : "text-green-600"}`}>
                      {sms.direction === "outbound" ? "↓ Outbound" : "↑ Inbound — Prospect"}
                    </p>
                    <div className={`text-sm rounded-lg px-3.5 py-2.5 leading-relaxed ${
                      sms.direction === "outbound"
                        ? "bg-gray-50 text-gray-700 border border-gray-100"
                        : "bg-orange-50 text-gray-800 border border-orange-100"
                    }`}>
                      {sms.body}
                    </div>
                    <p className="text-[11px] text-gray-300 mt-1">{fmtTime(sms.createdAt)} · {sms.status}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Intake Answers */}
          {formattedAnswers.length > 0 && (
            <Section label="Intake Answers">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                {formattedAnswers.map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[11px] uppercase tracking-widest font-semibold text-gray-400">{label}</p>
                    <p className="text-sm font-medium text-gray-800 mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* ── RIGHT ── */}
        <div>
          {/* AI Assessment */}
          {assessment ? (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">AI Assessment</span>
                {lead.urgencyScore && (
                  <span className={`text-xs font-semibold ${urgency.text}`}>{urgency.label}</span>
                )}
              </div>

              {/* Scores */}
              <div className="flex gap-0 border-b border-gray-100">
                <div className="flex-1 px-5 py-4 text-center border-r border-gray-100">
                  <p className={`text-5xl font-bold leading-none ${urgency.text}`}>{lead.urgencyScore}</p>
                  <p className="text-[11px] uppercase tracking-widest text-gray-400 mt-1.5">Urgency / 10</p>
                </div>
                <div className="flex-1 px-5 py-4 text-center">
                  <p className="text-3xl font-bold text-gray-800 leading-none">{lead.qualityScore}</p>
                  <p className="text-[11px] uppercase tracking-widest text-gray-400 mt-1.5">Quality / 100</p>
                </div>
              </div>

              {/* Value */}
              {lead.estimatedValueLow && lead.estimatedValueHigh && (
                <div className="px-5 py-3 bg-orange-50 border-b border-orange-100">
                  <p className="text-[11px] uppercase tracking-widest font-semibold text-orange-400 mb-0.5">Est. Job Value</p>
                  <p className="text-lg font-bold text-gray-900">
                    {fmtCents(lead.estimatedValueLow)} – {fmtCents(lead.estimatedValueHigh)}
                  </p>
                </div>
              )}

              {/* Reasoning */}
              <div className="px-5 py-4 border-b border-gray-100">
                <p className="text-sm text-gray-600 leading-relaxed">{assessment.urgencyReasoning}</p>
              </div>

              {/* Recommended actions */}
              {assessment.recommendedActions.length > 0 && (
                <div className="px-5 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Recommended Actions</p>
                  <div className="space-y-2.5">
                    {assessment.recommendedActions.map((action, i) => (
                      <div key={i} className="flex gap-2.5 items-start">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-sm text-gray-700 leading-snug">{action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">AI Assessment</p>
              <p className="text-sm text-gray-400">Pending — intake form not yet completed.</p>
            </div>
          )}

          {/* Interactive: status, notes, followup */}
          <LeadDetailClient
            lead={{
              id: lead.id,
              status: lead.status,
              notes: lead.notes,
              callerPhone: lead.callerPhone,
            }}
            hasPendingFollowup={!!pendingFollowup}
          />
        </div>
      </div>
    </div>
  );
}
