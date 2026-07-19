import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getBusinessByClerkId } from "@/lib/db/queries/businesses";
import { getCallMetrics } from "@/lib/db/queries/calls";
import { getChannelPerformance, getDailyCapturedVsWon, getReportsFunnel } from "@/lib/db/queries/dashboard";
import { sourceLabel } from "@/lib/leads/priority";
import { centsToDollars, csvDateTime, csvFilename, csvResponse, toCsvSections } from "@/lib/utils/csv";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await getBusinessByClerkId(userId);
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  // Same whitelist + default as the Reports page, so an odd ?range= exports the
  // same 14 days the page would have shown rather than erroring.
  const rangeParam = Number(req.nextUrl.searchParams.get("range"));
  const days = [14, 30, 90].includes(rangeParam) ? rangeParam : 14;

  const [callMetrics, funnel, channels, series] = await Promise.all([
    getCallMetrics(business.id),
    getReportsFunnel(business.id, days),
    getChannelPerformance(business.id, days),
    getDailyCapturedVsWon(business.id, days, business.timezone),
  ]);

  const wonRevenue = channels.reduce((sum, c) => sum + c.revenue, 0);

  // The Reports page isn't one list — it's four small tables. Flattening them into
  // a single row shape would invent relationships that don't exist, so the file
  // keeps them as labeled sections in the order they appear on screen.
  const csv = toCsvSections([
    {
      title: "Report",
      headers: ["Field", "Value"],
      rows: [
        ["Business", business.businessName],
        ["Range", `Last ${days} days`],
        ["Generated", csvDateTime(new Date(), business.timezone)],
        ["Timezone", business.timezone],
      ],
    },
    {
      title: "Summary",
      headers: ["Metric", "Value"],
      rows: [
        ["Overflow calls captured (all time)", callMetrics.overflowCaptured],
        ["Qualified opportunities", funnel.qualified],
        ["Jobs won", funnel.won],
        ["Won revenue (USD)", centsToDollars(wonRevenue)],
      ],
    },
    {
      title: "Conversion funnel",
      headers: ["Stage", "Leads"],
      rows: [
        ["Leads", funnel.captured],
        ["Qualified", funnel.qualified],
        ["Contacted", funnel.contacted],
        ["Won", funnel.won],
      ],
    },
    {
      title: "Captured vs. won by day",
      headers: [`Date (${business.timezone})`, "Leads captured", "Leads won"],
      rows: series.map((d) => [d.day, d.captured, d.won]),
    },
    {
      title: "Performance by channel",
      headers: ["Channel", "Leads", "Won", "Revenue (USD)"],
      rows: channels.map((c) => [sourceLabel(c.source), c.leadCount, c.wonCount, centsToDollars(c.revenue)]),
    },
  ]);

  return csvResponse(csv, csvFilename(`reports-last-${days}-days`, business.timezone));
}
