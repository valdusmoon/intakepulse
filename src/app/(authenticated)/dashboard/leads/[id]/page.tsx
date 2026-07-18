import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getBusinessByClerkId } from "@/lib/db/queries/businesses";
import { getLeadById } from "@/lib/db/queries/leads";
import { getAiAssessmentByLeadId } from "@/lib/db/queries/aiAssessments";
import { getPendingFollowup } from "@/lib/db/queries/followups";
import { getCallByLeadId } from "@/lib/db/queries/calls";
import { getVerticalConfig } from "@/lib/db/queries/verticalConfigs";
import { formatIntakeAnswers, deriveServiceLabel, isOffListService } from "@/lib/verticals/labels";
import { tierMeta, highValueBadge, intentMeta, sourceLabel, fmtCents, fmtValueRange, timeAgoShort } from "@/lib/leads/priority";
import { formatInTimezone } from "@/lib/utils/datetime";
import { Card, CardHeader, CardTitle, CardBody, Badge, Icon } from "@/components/dashboard/v2/primitives";
import { LeadDetailClient } from "./_client";

function fmtTime(date: Date | string, tz: string) {
  return formatInTimezone(date, tz, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

// Build a flat, time-sorted event list from available data
function buildTimeline(
  call: Awaited<ReturnType<typeof getCallByLeadId>>,
  lead: { source: string; intakeStatus: string; leadStatus: string; createdAt: Date; updatedAt: Date; contactedAt: Date | null; convertedAt: Date | null }
) {
  const events: { key: string; label: string; sub?: string; time: Date }[] = [];

  if (call) {
    events.push({ key: "call_init", label: "Call initiated", sub: call.callerPhone, time: new Date(call.createdAt) });
    if (call.missedAt) {
      events.push({ key: "call_missed", label: "Missed — no answer", time: new Date(call.missedAt) });
    }
  } else if (lead.source !== "voice_overflow") {
    events.push({ key: "lead_created", label: `Lead created via ${sourceLabel(lead.source)}`, time: new Date(lead.createdAt) });
  }

  if (lead.intakeStatus === "completed") {
    events.push({ key: "intake_done", label: "Intake completed", time: new Date(lead.updatedAt) });
  } else if (lead.intakeStatus === "abandoned") {
    events.push({ key: "intake_abandoned", label: "Intake abandoned — caller didn't finish", time: new Date(lead.updatedAt) });
  }
  if (lead.leadStatus === "qualified" || lead.leadStatus === "contacted" || lead.leadStatus === "booked" || lead.leadStatus === "estimate_sent" || lead.leadStatus === "converted") {
    events.push({ key: "qualified", label: "AI assessment complete", time: new Date(lead.updatedAt) });
  }
  if (lead.contactedAt) {
    events.push({ key: "contacted", label: "Marked contacted", time: new Date(lead.contactedAt) });
  }
  if (lead.convertedAt) {
    events.push({ key: "won", label: "Marked won", time: new Date(lead.convertedAt) });
  }

  return events.sort((a, b) => a.time.getTime() - b.time.getTime());
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;
  const business = await getBusinessByClerkId(userId);
  if (!business) redirect("/onboarding");

  const lead = await getLeadById(id);
  if (!lead || lead.businessId !== business.id) notFound();

  const [assessment, pendingFollowup, call, verticalConfig] = await Promise.all([
    getAiAssessmentByLeadId(lead.id),
    getPendingFollowup(lead.id),
    getCallByLeadId(lead.id),
    getVerticalConfig(business.vertical),
  ]);

  const tier = tierMeta(lead.priorityScore);
  const highValue = highValueBadge(lead.estimatedValueLow);
  const intent = intentMeta(lead.qualityScore);
  const timeline = buildTimeline(call, lead);
  const formattedAnswers = formatIntakeAnswers(verticalConfig?.questions ?? [], lead.intakeAnswers);
  const service = deriveServiceLabel(verticalConfig, lead.intakeAnswers, lead.serviceRequested);
  const offListService = isOffListService(verticalConfig, lead.intakeAnswers, lead.serviceRequested);
  const displayName = lead.callerName ?? lead.callerPhone;
  const valueRange = fmtValueRange(lead.estimatedValueLow, lead.estimatedValueHigh);
  const hasCallEvidence = Boolean(call);

  return (
    <div className="font-cv-body text-cv-ink">
      <Link href="/dashboard/leads" className="inline-flex items-center gap-1.5 text-cv-muted text-xs font-bold mb-3 hover:text-cv-ink transition-colors">
        <Icon name="arrow_back" className="!text-base" />
        Back to leads
      </Link>

      <div className="flex justify-between items-start gap-4.5 mb-4 flex-col sm:flex-row">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-cv-heading text-[34px] leading-[1.15] tracking-tight">{displayName}</h1>
            <Badge color={tier.color}>{tier.label}</Badge>
            {highValue && <Badge color={highValue.color}>{highValue.label}</Badge>}
            <Badge color={intent.color}>{intent.label}</Badge>
          </div>
          <p className="mt-[7px] text-cv-muted text-sm">
            {sourceLabel(lead.source)} · captured {timeAgoShort(lead.createdAt)} ago · {lead.callerPhone}
            {lead.callerEmail && <> · {lead.callerEmail}</>}
          </p>
        </div>
        <div className="flex gap-2.5">
          {lead.callerEmail && (
            <a
              href={`mailto:${lead.callerEmail}`}
              className="inline-flex items-center justify-center gap-2 rounded-[9px] border border-cv-border-strong bg-white text-cv-ink font-bold text-[13px] min-h-10 px-3.5 hover:bg-cv-surface-subtle transition-colors"
            >
              <Icon name="mail" className="!text-base" />
              Email
            </a>
          )}
          <a
            href={`tel:${lead.callerPhone}`}
            className="inline-flex items-center justify-center gap-2 rounded-[9px] border border-cv-primary bg-cv-primary text-white font-bold text-[13px] min-h-10 px-3.5 hover:bg-cv-primary-dark transition-colors"
          >
            <Icon name="call" className="!text-base" />
            Call back
          </a>
        </div>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.25fr)_minmax(290px,0.75fr)] gap-4 items-start">
        {/* LEFT: opportunity summary + qualification answers */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="!text-base">Opportunity summary</CardTitle>
            </CardHeader>
            <CardBody className="flex flex-col gap-4">
              {assessment ? (
                <div className="flex flex-col gap-3">
                  <div className="p-3.5 bg-cv-surface-blue border border-[#dce5ff] rounded-[10px] text-[13px] leading-relaxed">
                    <p>
                      <strong>Urgency:</strong> {assessment.urgencyReasoning}
                    </p>
                    <p className="mt-2">
                      <strong>Quality:</strong> {assessment.qualityReasoning}
                    </p>
                  </div>
                  {assessment.recommendedActions.length > 0 && (
                    <div>
                      <span className="block text-[10px] uppercase tracking-wide font-extrabold text-cv-muted mb-1.5">Recommended actions</span>
                      <ul className="flex flex-col gap-1.5">
                        {assessment.recommendedActions.map((action, i) => (
                          <li key={i} className="text-[13px] leading-relaxed flex gap-2">
                            <span className="text-cv-primary">•</span>
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-cv-muted">AI assessment pending — intake not yet completed.</p>
              )}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <span className="block text-[10px] uppercase tracking-wide font-extrabold text-cv-muted">Service</span>
                  <strong className="block mt-[5px] text-[13px]">{service ?? "Not yet captured"}</strong>
                  {offListService && (
                    <span className="mt-1 inline-block">
                      <Badge color="amber">Off your service list · no quote given</Badge>
                    </span>
                  )}
                </div>
                <div>
                  <span className="block text-[10px] uppercase tracking-wide font-extrabold text-cv-muted">Source</span>
                  <strong className="block mt-[5px] text-[13px]">{sourceLabel(lead.source)}</strong>
                </div>
                <div>
                  <span className="block text-[10px] uppercase tracking-wide font-extrabold text-cv-muted">Preliminary range</span>
                  <strong className="block mt-[5px] text-[13px]">{valueRange ?? "Not yet estimated"}</strong>
                </div>
                <div>
                  <span className="block text-[10px] uppercase tracking-wide font-extrabold text-cv-muted">Confirmed value</span>
                  <strong className="block mt-[5px] text-[13px]">{fmtCents(lead.confirmedValue) ?? "Not yet reported"}</strong>
                </div>
              </div>
            </CardBody>
          </Card>

          {formattedAnswers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="!text-base">Qualification answers</CardTitle>
              </CardHeader>
              <CardBody className="grid grid-cols-2 gap-3.5">
                {formattedAnswers.map((a) => (
                  <div key={a.key}>
                    <span className="block text-[10px] uppercase tracking-wide font-extrabold text-cv-muted">{a.label}</span>
                    <strong className="block mt-[5px] text-[13px]">{a.value}</strong>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}
        </div>

        {/* MIDDLE: call evidence */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="!text-base">Call evidence</CardTitle>
              {call?.durationSeconds != null && (
                <p className="text-[11px] text-cv-muted mt-1">
                  {Math.floor(call.durationSeconds / 60)}:{String(call.durationSeconds % 60).padStart(2, "0")}
                </p>
              )}
            </div>
          </CardHeader>
          <CardBody className="flex flex-col gap-4">
            {!hasCallEvidence ? (
              <p className="text-sm text-cv-muted py-8 text-center">This lead didn&apos;t come from a phone call — no transcript to show.</p>
            ) : (
              <>
                <div>
                  <p className="text-[10px] uppercase tracking-wide font-extrabold text-cv-muted mb-2">Summary</p>
                  <p className="text-[13px] leading-relaxed text-cv-ink">
                    {call?.summary ?? "No summary was generated for this call."}
                  </p>
                </div>
                {call?.transcript && call.transcript.length > 0 ? (
                  <div>
                    <p className="text-[10px] uppercase tracking-wide font-extrabold text-cv-muted mb-2">Transcript</p>
                    <div className="flex flex-col gap-2 max-h-80 overflow-y-auto border border-cv-border rounded-[11px] p-3.5 bg-cv-surface-subtle">
                      {call.transcript.map((entry, i) => (
                        <p key={i} className="text-[13px] leading-relaxed">
                          <span className={`font-bold ${entry.role === "assistant" ? "text-cv-primary" : "text-cv-ink"}`}>
                            {entry.role === "assistant" ? "Callverted: " : "Caller: "}
                          </span>
                          {entry.message}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-cv-muted italic">No turn-by-turn transcript was recorded for this call.</p>
                )}
              </>
            )}
          </CardBody>
        </Card>

        {/* RIGHT: update outcome + timeline */}
        <div className="flex flex-col gap-4">
          <LeadDetailClient
            lead={{
              id: lead.id,
              leadStatus: lead.leadStatus,
              notes: lead.notes,
              callerPhone: lead.callerPhone,
              confirmedValue: lead.confirmedValue,
            }}
            hasPendingFollowup={!!pendingFollowup}
          />

          {timeline.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="!text-base">Timeline</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="relative pl-5">
                  <div className="absolute left-[5px] top-1 bottom-1 w-px bg-cv-border-strong" />
                  {timeline.map((e) => (
                    <div key={e.key} className="relative pb-4 pl-1.5 last:pb-0">
                      <div className="absolute -left-[19px] top-1 w-[9px] h-[9px] rounded-full bg-white border-2 border-cv-primary" />
                      <strong className="block text-[11px]">{e.label}</strong>
                      {e.sub && <span className="block mt-0.5 text-[10px] text-cv-muted truncate">{e.sub}</span>}
                      <span className="block mt-0.5 text-[10px] text-cv-muted">{fmtTime(e.time, business.timezone)}</span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
