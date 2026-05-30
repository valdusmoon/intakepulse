import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getBusinessByClerkId } from "@/lib/db/queries/businesses";
import { getLeadById } from "@/lib/db/queries/leads";
import { getAiAssessmentByLeadId } from "@/lib/db/queries/aiAssessments";
import { getPendingFollowup, getFollowupsByLead } from "@/lib/db/queries/followups";
import { getVerticalConfig } from "@/lib/db/queries/verticalConfigs";
import { LeadDetailClient } from "./_client";

function fmt(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;
  const business = await getBusinessByClerkId(userId);
  if (!business) redirect("/onboarding");

  const lead = await getLeadById(id);
  if (!lead || lead.businessId !== business.id) notFound();

  const [assessment, pendingFollowup, allFollowups, verticalConfig] = await Promise.all([
    getAiAssessmentByLeadId(lead.id),
    getPendingFollowup(lead.id),
    getFollowupsByLead(lead.id),
    getVerticalConfig(business.vertical),
  ]);

  const urgencyLabel =
    (lead.urgencyScore ?? 0) >= 8 ? "Critical" :
    (lead.urgencyScore ?? 0) >= 6 ? "High" :
    (lead.urgencyScore ?? 0) >= 4 ? "Medium" : "Low";

  const urgencyColor =
    (lead.urgencyScore ?? 0) >= 8 ? "text-red-600 bg-red-50 border-red-200" :
    (lead.urgencyScore ?? 0) >= 6 ? "text-orange-600 bg-orange-50 border-orange-200" :
    (lead.urgencyScore ?? 0) >= 4 ? "text-yellow-600 bg-yellow-50 border-yellow-200" :
    "text-green-600 bg-green-50 border-green-200";

  // Map intake answers to human-readable labels, ordered by question definition
  const questions = verticalConfig?.questions ?? [];
  const qMap = new Map(questions.map((q) => [q.key, q]));
  const answerEntries = lead.intakeAnswers ? Object.entries(lead.intakeAnswers) : [];
  const formattedAnswers = answerEntries
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
        : (optMap.get(value) ?? value);
      return { label, value: val };
    });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/leads" className="text-sm text-gray-400 hover:text-gray-600">
          ← Leads
        </Link>
        <span className="text-gray-200">/</span>
        <h1 className="text-lg font-bold text-gray-900">
          {lead.callerName ?? lead.callerPhone}
        </h1>
        {lead.urgencyScore && (
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${urgencyColor}`}>
            {urgencyLabel} · {lead.urgencyScore}/10
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
        {/* Left column */}
        <div className="space-y-4">

          {/* Caller info */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Caller</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm shrink-0">
                  {(lead.callerName ?? lead.callerPhone)[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{lead.callerName ?? "Unknown"}</p>
                  <a href={`tel:${lead.callerPhone}`} className="text-sm text-orange-500 font-medium hover:text-orange-600">
                    {lead.callerPhone}
                  </a>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 text-sm">
                <div>
                  <p className="text-xs text-gray-400">Source</p>
                  <p className="font-medium text-gray-700 capitalize">{lead.source.replace(/_/g, " ")}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Received</p>
                  <p className="font-medium text-gray-700">{new Date(lead.createdAt).toLocaleString()}</p>
                </div>
                {lead.callerEmail && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400">Email</p>
                    <p className="font-medium text-gray-700">{lead.callerEmail}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Intake answers */}
          {formattedAnswers.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Intake Answers</h2>
              <div className="space-y-2.5">
                {formattedAnswers.map(({ label, value }) => (
                  <div key={label} className="flex gap-3">
                    <span className="text-sm text-gray-400 w-48 shrink-0">{label}</span>
                    <span className="text-sm font-medium text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Follow-up history */}
          {allFollowups.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Follow-up History</h2>
              <div className="space-y-2">
                {allFollowups.map((f) => (
                  <div key={f.id} className="flex items-center gap-3 text-sm">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${f.sentAt ? "bg-green-400" : f.canceledAt ? "bg-gray-300" : "bg-orange-400"}`} />
                    <span className="text-gray-600">
                      Sequence {f.sequence} —{" "}
                      {f.sentAt ? `Sent ${new Date(f.sentAt).toLocaleString()}` :
                       f.canceledAt ? `Canceled (${f.cancelReason ?? "manual"})` :
                       `Scheduled ${new Date(f.scheduledAt).toLocaleString()}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column — client component for interactive parts */}
        <LeadDetailClient
          lead={{
            id: lead.id,
            status: lead.status,
            notes: lead.notes,
            urgencyScore: lead.urgencyScore,
            qualityScore: lead.qualityScore,
            estimatedValueLow: lead.estimatedValueLow,
            estimatedValueHigh: lead.estimatedValueHigh,
            callerPhone: lead.callerPhone,
          }}
          assessment={assessment ? {
            urgencyReasoning: assessment.urgencyReasoning,
            qualityReasoning: assessment.qualityReasoning,
            recommendedActions: assessment.recommendedActions,
          } : null}
          hasPendingFollowup={!!pendingFollowup}
          urgencyLabel={urgencyLabel}
          urgencyColor={urgencyColor}
        />
      </div>
    </div>
  );
}
