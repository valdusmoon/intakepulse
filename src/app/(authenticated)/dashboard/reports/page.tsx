import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getBusinessByClerkId } from "@/lib/db/queries/businesses";
import { getCallMetrics } from "@/lib/db/queries/calls";
import { getReportsFunnel, getChannelPerformance, getDailyCapturedVsWon } from "@/lib/db/queries/dashboard";
import { Card, CardHeader, CardTitle, CardBody, MetricCard } from "@/components/dashboard/v2/primitives";
import { RangeSelect } from "./_range-select";
import { fmtCents, sourceLabel, sourceSwatch } from "@/lib/leads/priority";

const RANGES = [
  { value: "14", label: "Last 14 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const business = await getBusinessByClerkId(userId);
  if (!business) redirect("/onboarding");

  const sp = await searchParams;
  const days = [14, 30, 90].includes(Number(sp.range)) ? Number(sp.range) : 14;

  const [callMetrics, funnel, channels, series] = await Promise.all([
    getCallMetrics(business.id),
    getReportsFunnel(business.id),
    getChannelPerformance(business.id),
    getDailyCapturedVsWon(business.id, days),
  ]);

  const maxDaily = Math.max(1, ...series.map((d) => d.captured));
  const funnelSteps = [
    { label: "Captured", value: funnel.captured },
    { label: "Qualified", value: funnel.qualified },
    { label: "Contacted", value: funnel.contacted },
    { label: "Won", value: funnel.won },
  ];
  const maxFunnel = Math.max(1, funnel.captured);
  const biggestDropoff = (() => {
    const gaps = [
      { label: "capture to qualify", pct: funnel.captured > 0 ? Math.round((funnel.qualified / funnel.captured) * 100) : 0 },
      { label: "qualify to contact", pct: funnel.qualified > 0 ? Math.round((funnel.contacted / funnel.qualified) * 100) : 0 },
      { label: "contact to won", pct: funnel.contacted > 0 ? Math.round((funnel.won / funnel.contacted) * 100) : 0 },
    ];
    return gaps.reduce((worst, g) => (g.pct < worst.pct ? g : worst));
  })();
  const wonRevenue = channels.reduce((sum, c) => sum + c.revenue, 0);

  return (
    <div className="font-cv-body text-cv-ink">
      <div className="flex justify-between items-start gap-6 mb-[22px] flex-col sm:flex-row">
        <div>
          <h1 className="font-cv-heading text-[34px] leading-[1.15] tracking-tight">Reports</h1>
          <p className="mt-[7px] text-cv-muted text-sm leading-relaxed">
            Connect captured opportunities to callbacks, booked work, and confirmed revenue.
          </p>
        </div>
        <RangeSelect current={days} options={RANGES} />
      </div>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
        <MetricCard label="Overflow calls captured" value={callMetrics.overflowCaptured} note="All time" />
        <MetricCard
          label="Qualified opportunities"
          value={funnel.qualified}
          note={funnel.captured > 0 ? `${Math.round((funnel.qualified / funnel.captured) * 100)}% of captured leads` : undefined}
        />
        <MetricCard label="Jobs won" value={funnel.won} note={funnel.qualified > 0 ? `${Math.round((funnel.won / funnel.qualified) * 100)}% of qualified opportunities` : undefined} />
        <MetricCard label="Confirmed won revenue" value={fmtCents(wonRevenue) ?? "$0"} note="Reported by your team" valueColor="var(--color-cv-primary-dark)" />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[1.25fr_0.75fr] gap-4">
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="!text-base">Captured vs. won</CardTitle>
              <p className="text-[11px] text-cv-muted mt-1">Daily leads captured against leads won, last {days} days</p>
            </div>
            <div className="text-[11px] flex gap-3 shrink-0">
              <span className="flex items-center gap-1.5">
                <i className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "#b9c8f7" }} /> Captured
              </span>
              <span className="flex items-center gap-1.5">
                <i className="w-2.5 h-2.5 rounded-sm inline-block bg-cv-primary" /> Won
              </span>
            </div>
          </CardHeader>
          <CardBody>
            <div className="h-[220px] flex items-end gap-1 border-b border-cv-border pb-2">
              {series.map((d) => (
                <div key={d.day} className="flex-1 flex gap-[2px] items-end h-full" title={`${d.day}: ${d.captured} captured, ${d.won} won`}>
                  <span className="flex-1 rounded-t-[5px] min-w-[3px] bg-[#b9c8f7]" style={{ height: `${Math.max(2, (d.captured / maxDaily) * 100)}%` }} />
                  <span className="flex-1 rounded-t-[5px] min-w-[3px] bg-cv-primary" style={{ height: `${Math.max(0, (d.won / maxDaily) * 100)}%` }} />
                </div>
              ))}
            </div>
            <div className="flex gap-1 mt-2.5 text-[9px] text-cv-muted">
              {series
                .filter((_, i) => i % Math.ceil(series.length / 6) === 0)
                .map((d) => (
                  <span key={d.day} className="flex-1 text-center">
                    {new Date(d.day).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="!text-base">Conversion funnel</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-col gap-2.5">
            {funnelSteps.map((step, i) => (
              <div
                key={step.label}
                className="p-3 rounded-[9px] text-white flex justify-between text-xs font-extrabold mx-auto"
                style={{
                  width: `${Math.max(30, (step.value / maxFunnel) * 100)}%`,
                  background: ["#6585e3", "#4d71dd", "#365ed5", "#244fc9"][i],
                }}
              >
                <span>{step.label}</span>
                <span>{step.value}</span>
              </div>
            ))}
            <p className="text-[11px] text-cv-muted text-center mt-1">
              Biggest opportunity: improve {biggestDropoff.label} completion from {biggestDropoff.pct}%.
            </p>
          </CardBody>
        </Card>
      </section>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="!text-base">Performance by channel</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col">
          <div className="grid grid-cols-4 gap-2.5 py-1 text-cv-muted text-[10px] uppercase tracking-wide font-extrabold">
            <span>Channel</span>
            <span>Leads</span>
            <span>Won</span>
            <span>Revenue</span>
          </div>
          {channels.map((c) => (
            <div key={c.source} className="grid grid-cols-4 gap-2.5 items-center py-3 border-t border-cv-border text-xs">
              <span className="flex items-center gap-2">
                <i className="w-[9px] h-[9px] rounded-[3px] shrink-0" style={{ background: sourceSwatch(c.source) }} />
                <strong>{sourceLabel(c.source)}</strong>
              </span>
              <span className="font-cv-mono">{c.leadCount}</span>
              <span className="font-cv-mono">{c.wonCount}</span>
              <span className="font-cv-mono font-bold">{fmtCents(c.revenue) ?? "$0"}</span>
            </div>
          ))}
        </CardBody>
      </Card>

      <p className="text-[11px] text-cv-muted mt-3">
        Need raw data? Every lead is visible in{" "}
        <Link href="/dashboard/leads" className="text-cv-primary font-bold hover:underline">
          Leads
        </Link>
        .
      </p>
    </div>
  );
}
