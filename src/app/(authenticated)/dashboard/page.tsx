import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getBusinessByClerkId } from "@/lib/db/queries/businesses";
import {
  getHomeMetrics,
  getSourceBreakdown,
  getPriorityQueue,
  getRecentLeadsForActivity,
  getRecentCallsForActivity,
} from "@/lib/db/queries/dashboard";
import { getVerticalConfig } from "@/lib/db/queries/verticalConfigs";
import { deriveServiceLabel } from "@/lib/verticals/labels";
import { tierMeta, intentMeta, highValueBadge, initials, timeAgoShort, fmtCents, fmtValueRange, sourceLabel, sourceSwatch } from "@/lib/leads/priority";
import { Card, CardHeader, CardTitle, CardBody, Badge, StatusPill, MetricCard, Trend, Icon, LinkButton } from "@/components/dashboard/v2/primitives";
import { hasPaymentOnFile, getSetupStage } from "@/lib/subscription";
import { ActivationChecklist } from "@/components/dashboard/ActivationChecklist";
import { NotificationsPrompt } from "@/components/push/NotificationsPrompt";
import { ChooseNumber } from "@/components/dashboard/ChooseNumber";
import { GoLiveProgress } from "@/components/dashboard/GoLiveProgress";
import { ExampleLead } from "@/components/dashboard/ExampleLead";
import { DashboardTour } from "@/components/dashboard/DashboardTour";
import { CheckoutReturnGate } from "@/components/dashboard/CheckoutReturnGate";

function fmtDuration(seconds: number) {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const justPaid = (await searchParams).checkout_success === "true";

  const business = await getBusinessByClerkId(userId);
  if (!business) redirect("/onboarding");

  const [metrics, sources, priorityLeads, recentLeads, recentCalls, verticalConfig] = await Promise.all([
    getHomeMetrics(business.id),
    getSourceBreakdown(business.id),
    getPriorityQueue(business.id, 4),
    getRecentLeadsForActivity(business.id, 5),
    getRecentCallsForActivity(business.id, 5),
    getVerticalConfig(business.vertical),
  ]);

  const isVoiceLive = Boolean(
    business.twilioPhoneNumber && !business.isPaused && hasPaymentOnFile(business)
  );
  const widgetInstalled = sources.some((s) => s.source === "website_widget");

  // Model B setup stage, derived from existing columns. "needs_payment" = no card
  // yet (setup mode).
  const setupStage = getSetupStage(business);

  // First-run zero-state (example lead + tour) shows only when there are no leads
  // at all. The activation checklist shows for a first-run account OR whenever
  // we're in setup mode (no card yet) — so a cardless account always sees the
  // "Add payment & go live" CTA, but an established account with leads isn't nagged.
  const showActivation = metrics.totalLeads === 0;
  const showChecklist = showActivation || setupStage === "needs_payment";
  // "Made a test call" is true from a completed test call (which persists no
  // call row, only this flag) OR any real call record.
  const hasTestCall = recentCalls.length > 0 || Boolean(business.testCallCompletedAt);

  // Conversion snapshot is time-boxed (last snapshotWindowDays) so it tracks
  // current performance rather than a frozen all-time ratio.
  const snapCaptured = metrics.snapshotCaptured || 1; // guard div-by-zero
  const contactedPct = Math.round((metrics.snapshotContacted / snapCaptured) * 100);
  const bookedPct = metrics.snapshotContacted > 0 ? Math.round((metrics.snapshotBooked / metrics.snapshotContacted) * 100) : 0;
  const wonPct = metrics.snapshotBooked > 0 ? Math.round((metrics.snapshotConverted / metrics.snapshotBooked) * 100) : 0;

  // Recent activity feed — synthesized from recent leads + calls (no dedicated events table)
  type Activity = { key: string; icon: string; iconClass: string; title: string; body: string; time: Date };
  const activity: Activity[] = [];
  for (const lead of recentLeads) {
    const name = lead.callerName ?? lead.callerPhone;
    if (lead.leadStatus === "converted") {
      activity.push({
        key: `won-${lead.id}`,
        icon: "paid",
        iconClass: "bg-cv-green-soft text-cv-green",
        title: "Lead marked won",
        body: `${fmtCents(lead.confirmedValue ?? lead.estimatedValueHigh) ?? "Revenue"} recorded for ${name}.`,
        time: lead.updatedAt,
      });
    } else if (lead.source === "website_widget" && lead.intakeStatus === "completed") {
      const service = deriveServiceLabel(verticalConfig, lead.intakeAnswers, lead.serviceRequested) ?? "a new job";
      activity.push({
        key: `widget-${lead.id}`,
        icon: "widgets",
        iconClass: "bg-cv-purple-soft text-cv-purple",
        title: "Website lead qualified",
        body: `${service} reported by ${name}.`,
        time: lead.updatedAt,
      });
    } else if (lead.source === "voice_overflow") {
      const service = deriveServiceLabel(verticalConfig, lead.intakeAnswers, lead.serviceRequested) ?? "a call";
      activity.push({
        key: `voice-${lead.id}`,
        icon: "phone_in_talk",
        iconClass: "bg-cv-primary-soft text-cv-primary",
        title: "Overflow call captured",
        body: `${name} reported ${service.toLowerCase()}.`,
        time: lead.createdAt,
      });
    }
  }
  for (const call of recentCalls) {
    if (call.outcome === "abandoned") {
      activity.push({
        key: `call-${call.id}`,
        icon: "phone_missed",
        iconClass: "bg-cv-gray-soft text-[#667085]",
        title: "Caller abandoned",
        body: `${call.callerPhone} hung up before completing intake.`,
        time: call.createdAt,
      });
    }
  }
  activity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  const topActivity = activity.slice(0, 3);

  return (
    <div className="font-cv-body text-cv-ink">
      {justPaid && setupStage === "needs_payment" && <CheckoutReturnGate />}
      <div className="flex flex-wrap gap-2.5 mb-[18px]">
        {setupStage === "needs_payment" ? (
          <StatusPill color="amber" dot>
            Setup mode · add payment to go live
          </StatusPill>
        ) : (
          <StatusPill color={isVoiceLive ? "green" : "gray"} dot>
            {isVoiceLive ? "Voice line live" : "Voice line not active"}
          </StatusPill>
        )}
        <StatusPill color={widgetInstalled ? "green" : "gray"}>
          <Icon name={widgetInstalled ? "check_circle" : "info"} className="!text-[15px]" />
          {widgetInstalled ? "Website widget installed" : "Website widget not yet used"}
        </StatusPill>
        {metrics.urgentAwaitingCallback > 0 && (
          <StatusPill color="amber">
            <Icon name="schedule" className="!text-[15px]" />
            {metrics.urgentAwaitingCallback} lead{metrics.urgentAwaitingCallback === 1 ? "" : "s"} awaiting callback
          </StatusPill>
        )}
      </div>

      <div className="flex justify-between items-start gap-6 mb-[22px] flex-col sm:flex-row">
        <div>
          <h1 className="font-cv-heading text-[34px] leading-[1.15] tracking-tight">
            {greeting()}, {business.ownerName?.split(" ")[0] ?? "there"}
          </h1>
          <p className="mt-[7px] text-cv-muted text-sm leading-relaxed">
            Here is what Callverted captured and what needs your attention.
          </p>
        </div>
        <div className="flex gap-2.5 flex-wrap">
          <LinkButton href="/dashboard/calls">
            <Icon name="call" />
            Review calls
          </LinkButton>
          <LinkButton href="/dashboard/leads/new" variant="primary">
            <Icon name="add" />
            Add lead
          </LinkButton>
        </div>
      </div>

      {(setupStage === "provisioning" || setupStage === "needs_publish") && (
        <GoLiveProgress stage={setupStage} />
      )}

      {setupStage === "provisioning" ? (
        <div id="cv-tour-activation">
          <ChooseNumber assistedUrl={process.env.NEXT_PUBLIC_ASSISTED_ONBOARDING_URL ?? null} />
        </div>
      ) : showChecklist ? (
        <div id="cv-tour-activation">
          <ActivationChecklist
            hasTestCall={hasTestCall}
            numberPublished={business.numberPublished}
            widgetInstalled={widgetInstalled}
            callvertedNumber={business.twilioPhoneNumber}
            assistedUrl={process.env.NEXT_PUBLIC_ASSISTED_ONBOARDING_URL ?? null}
            setupStage={setupStage}
          />
        </div>
      ) : null}

      {/* Nudge to enable phone push alerts (self-hides once on / unsupported / dismissed). */}
      <NotificationsPrompt id="cv-tour-notifications" />

      <section id="cv-tour-metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
        <MetricCard
          label="Captured opportunity value"
          value={fmtCents(metrics.capturedValueThisMonth) ?? "$0"}
          note={`Across ${metrics.capturedCountThisMonth} qualified opportunities this month`}
          valueColor="var(--color-cv-primary-dark)"
        />
        <MetricCard
          label="Confirmed won revenue"
          value={
            <>
              {fmtCents(metrics.wonRevenueThisMonth) ?? "$0"}
              {metrics.wonRevenueTrendPct != null && (
                <Trend direction={metrics.wonRevenueTrendPct >= 0 ? "up" : "down"}>
                  {Math.abs(metrics.wonRevenueTrendPct)}%
                </Trend>
              )}
            </>
          }
          note="From leads marked won by your team"
        />
        <MetricCard
          label="Urgent awaiting callback"
          value={metrics.urgentAwaitingCallback}
          note={
            metrics.urgentAwaitingCallback > 0
              ? `Oldest has been waiting ${fmtDuration(metrics.oldestUrgentWaitSeconds)}`
              : "Nothing urgent right now"
          }
          valueColor={metrics.urgentAwaitingCallback > 0 ? "var(--color-cv-amber)" : undefined}
        />
        <MetricCard
          label="Average callback time"
          value={
            <>
              {metrics.avgCallbackSeconds != null ? fmtDuration(metrics.avgCallbackSeconds) : "—"}
              {metrics.avgCallbackTrendSeconds != null && (
                <Trend direction={metrics.avgCallbackTrendSeconds <= 0 ? "up" : "down"}>
                  {fmtDuration(Math.abs(metrics.avgCallbackTrendSeconds))}
                </Trend>
              )}
            </>
          }
          note="Time until you mark a lead contacted, vs previous 30 days"
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[1.75fr_minmax(320px,0.85fr)] gap-4">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Priority leads</CardTitle>
              <p className="text-[11px] text-cv-muted mt-1">Ranked by priority — urgency, value, and intent combined</p>
            </div>
            <LinkButton href="/dashboard/leads" variant="ghost" size="sm">
              View all
            </LinkButton>
          </CardHeader>
          <div className="flex flex-col">
            {showActivation ? (
              <ExampleLead />
            ) : priorityLeads.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-cv-muted">
                No leads waiting on a callback right now.
              </div>
            ) : (
              priorityLeads.map((lead) => {
                const tier = tierMeta(lead.priorityScore);
                const intent = intentMeta(lead.qualityScore);
                const highValue = highValueBadge(lead.estimatedValueLow);
                const service = deriveServiceLabel(verticalConfig, lead.intakeAnswers, lead.serviceRequested);
                const value = fmtValueRange(lead.estimatedValueLow, lead.estimatedValueHigh);
                return (
                  <Link
                    key={lead.id}
                    href={`/dashboard/leads/${lead.id}`}
                    className="grid grid-cols-[minmax(0,1fr)_auto] gap-3.5 items-center px-4 py-3.5 border-b border-cv-border last:border-b-0 hover:bg-cv-surface-subtle transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-[11px] grid place-items-center shrink-0 font-extrabold text-xs ${
                          tier.label === "Hot" ? "bg-cv-red-soft text-cv-red" : tier.label === "Warm" ? "bg-cv-amber-soft text-cv-amber" : "bg-cv-gray-soft text-[#344054]"
                        }`}
                      >
                        {initials(lead.callerName)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center flex-wrap gap-1.5">
                          <span className="text-sm font-extrabold">{lead.callerName ?? lead.callerPhone}</span>
                          <Badge color={tier.color}>{tier.label}</Badge>
                          <Badge color={intent.color}>{intent.label}</Badge>
                          {highValue && <Badge color={highValue.color}>{highValue.label}</Badge>}
                        </div>
                        <div className="text-cv-muted text-xs mt-1 truncate">{service ?? "Details pending"}</div>
                        <div className="flex gap-2.5 items-center mt-[7px] text-cv-muted text-[11px] flex-wrap">
                          {lead.urgencyScore != null && <span>Urgency {lead.urgencyScore}/10</span>}
                          {value && <span>Estimated {value}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="text-right min-w-[60px]">
                        <strong className="block font-cv-mono text-xs">{timeAgoShort(lead.createdAt)}</strong>
                        <span className="block text-cv-muted text-[10px] mt-0.5">waiting</span>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="!text-base">Conversion snapshot</CardTitle>
              <LinkButton href="/dashboard/reports" variant="ghost" size="sm">
                Reports
              </LinkButton>
            </CardHeader>
            <CardBody className="flex flex-col gap-[15px]">
              <p className="text-[11px] text-cv-muted -mt-1">
                Last {metrics.snapshotWindowDays} days, from the statuses you set on leads.
              </p>
              {[
                { label: "Leads → contacted", pct: contactedPct },
                { label: "Contacted → booked", pct: bookedPct },
                { label: "Booked → won", pct: wonPct },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between text-xs font-bold mb-[7px]">
                    <span>{row.label}</span>
                    <span className="font-cv-mono">{row.pct}%</span>
                  </div>
                  <div className="h-[7px] bg-[#edf0f4] rounded-full overflow-hidden">
                    <span className="block h-full bg-cv-primary rounded-full" style={{ width: `${row.pct}%` }} />
                  </div>
                </div>
              ))}
              <div className="h-px bg-cv-border" />
              {sources.slice(0, 3).map((s) => (
                <div key={s.source} className="flex justify-between items-center text-xs">
                  <span className="flex items-center gap-2">
                    <i className="w-[9px] h-[9px] rounded-[3px] shrink-0" style={{ background: sourceSwatch(s.source) }} />
                    {sourceLabel(s.source)}
                  </span>
                  <strong className="font-cv-mono">{s.pct}%</strong>
                </div>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="!text-base">Recent activity</CardTitle>
            </CardHeader>
            <CardBody className="!py-[7px]">
              {topActivity.length === 0 ? (
                <p className="text-sm text-cv-muted py-3">No recent activity yet.</p>
              ) : (
                topActivity.map((a) => (
                  <div key={a.key} className="flex gap-[11px] py-[11px] border-b border-cv-border last:border-b-0">
                    <div className={`w-[31px] h-[31px] rounded-[9px] grid place-items-center shrink-0 ${a.iconClass}`}>
                      <Icon name={a.icon} className="!text-[17px]" />
                    </div>
                    <div className="text-xs leading-relaxed">
                      <strong className="block text-xs mb-0.5">{a.title}</strong>
                      {a.body}
                      <div className="text-[11px] text-cv-muted mt-[3px]">{timeAgoShort(a.time)} ago</div>
                    </div>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </div>
      </section>

      {showActivation && <DashboardTour />}
    </div>
  );
}
