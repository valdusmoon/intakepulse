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
import { priorityMeta, intentMeta, initials, timeAgoShort, fmtCents, fmtValueRange, sourceLabel, sourceSwatch } from "@/lib/leads/priority";
import { Card, CardHeader, CardTitle, CardBody, Badge, StatusPill, MetricCard, Trend, Icon, LinkButton } from "@/components/dashboard/v2/primitives";
import { hasPaymentOnFile } from "@/lib/subscription";

/** First-run activation checklist — replaces the wall-of-zeros for a brand-new
 *  account. Each step's done-state is derived from real signals, so it needs no
 *  stored state. It disappears once the account captures its first lead. */
function ActivationChecklist({
  lineLive,
  hasTestCall,
  widgetInstalled,
}: {
  lineLive: boolean;
  hasTestCall: boolean;
  widgetInstalled: boolean;
}) {
  const steps = [
    {
      done: hasTestCall,
      href: "/dashboard/test-call",
      title: "Make your first test call",
      body: "Hear the AI answer and watch it qualify a lead in real time.",
    },
    {
      done: lineLive,
      href: "/dashboard/settings",
      title: "Get your line live",
      body: "Confirm your number and forwarding so real calls reach the AI.",
    },
    {
      done: widgetInstalled,
      href: "/dashboard/capture",
      title: "Set up website capture",
      body: "Add the widget or share your intake link to catch web leads too.",
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <Card className="mb-4">
      <CardHeader>
        <div>
          <CardTitle>Finish setting up</CardTitle>
          <p className="text-[11px] text-cv-muted mt-1">A couple of steps and you are capturing every call</p>
        </div>
        <span className="font-cv-mono text-xs font-bold text-cv-muted">{doneCount}/3 done</span>
      </CardHeader>
      <CardBody className="flex flex-col gap-2">
        {steps.map((s, i) => (
          <Link
            key={s.title}
            href={s.href}
            className={`flex items-center gap-3.5 rounded-xl border px-4 py-3 transition-colors ${
              s.done ? "border-cv-border bg-cv-surface-subtle" : "border-cv-border hover:border-cv-primary hover:bg-cv-surface-blue"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full grid place-items-center shrink-0 text-xs font-extrabold ${
                s.done ? "bg-cv-green text-white" : "bg-cv-primary-soft text-cv-primary"
              }`}
            >
              {s.done ? <Icon name="check" className="!text-[17px]" /> : i + 1}
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-bold ${s.done ? "text-cv-muted line-through" : "text-cv-ink"}`}>{s.title}</p>
              {!s.done && <p className="text-xs text-cv-muted mt-0.5">{s.body}</p>}
            </div>
            {!s.done && <Icon name="arrow_forward" className="!text-[18px] text-cv-primary shrink-0" />}
          </Link>
        ))}
      </CardBody>
    </Card>
  );
}

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

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

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

  // First-run: no captured leads yet. Show the activation checklist instead of a
  // wall of zeros. It falls away the moment the first real lead lands.
  const showActivation = metrics.totalLeads === 0;
  const hasTestCall = recentCalls.length > 0;

  const captured = metrics.totalLeads || 1; // guard div-by-zero
  const contactedPct = Math.round((metrics.contactedOrBeyond / captured) * 100);
  const bookedPct = metrics.contactedOrBeyond > 0 ? Math.round((metrics.bookedOrBeyond / metrics.contactedOrBeyond) * 100) : 0;
  const wonPct = metrics.bookedOrBeyond > 0 ? Math.round((metrics.convertedCount / metrics.bookedOrBeyond) * 100) : 0;

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
      const service = deriveServiceLabel(verticalConfig, lead.intakeAnswers) ?? "a new job";
      activity.push({
        key: `widget-${lead.id}`,
        icon: "widgets",
        iconClass: "bg-cv-purple-soft text-cv-purple",
        title: "Website lead qualified",
        body: `${service} reported by ${name}.`,
        time: lead.updatedAt,
      });
    } else if (lead.source === "voice_overflow") {
      const service = deriveServiceLabel(verticalConfig, lead.intakeAnswers) ?? "a call";
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
      <div className="flex flex-wrap gap-2.5 mb-[18px]">
        <StatusPill color={isVoiceLive ? "green" : "gray"} dot>
          {isVoiceLive ? "Voice line live" : "Voice line not active"}
        </StatusPill>
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

      {showActivation && (
        <ActivationChecklist lineLive={isVoiceLive} hasTestCall={hasTestCall} widgetInstalled={widgetInstalled} />
      )}

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
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
          note="Compared with your previous 30 days"
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[1.75fr_minmax(320px,0.85fr)] gap-4">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Priority leads</CardTitle>
              <p className="text-[11px] text-cv-muted mt-1">Ranked by urgency, intent, and waiting time</p>
            </div>
            <LinkButton href="/dashboard/leads" variant="ghost" size="sm">
              View all
            </LinkButton>
          </CardHeader>
          <div className="flex flex-col">
            {priorityLeads.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-cv-muted">
                No leads waiting on a callback right now.
              </div>
            ) : (
              priorityLeads.map((lead) => {
                const priority = priorityMeta(lead.urgencyScore);
                const intent = intentMeta(lead.qualityScore);
                const service = deriveServiceLabel(verticalConfig, lead.intakeAnswers);
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
                          priority.label === "Urgent" ? "bg-cv-red-soft text-cv-red" : priority.label === "Call today" ? "bg-cv-amber-soft text-cv-amber" : "bg-cv-gray-soft text-[#344054]"
                        }`}
                      >
                        {initials(lead.callerName)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center flex-wrap gap-1.5">
                          <span className="text-sm font-extrabold">{lead.callerName ?? lead.callerPhone}</span>
                          <Badge color={priority.color}>{priority.label}</Badge>
                          <Badge color={intent.color}>{intent.label}</Badge>
                        </div>
                        <div className="text-cv-muted text-xs mt-1 truncate">{service ?? "Details pending"}</div>
                        <div className="flex gap-2.5 items-center mt-[7px] text-cv-muted text-[11px] flex-wrap">
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
              {[
                { label: "Captured → contacted", pct: contactedPct },
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
    </div>
  );
}
