import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCompanyByClerkId } from "@/lib/db/queries/companies";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema/leads";
import { eq, isNotNull } from "drizzle-orm";
import { addHours } from "date-fns";

function icsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function icsEsc(str: string | null | undefined): string {
  if (!str) return "";
  return str.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

const SERVICE_LABELS: Record<string, string> = {
  interior: "Interior",
  exterior: "Exterior",
  both: "Interior + Exterior",
  other: "Other",
};

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const company = await getCompanyByClerkId(userId);
  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const scheduled = await db
    .select()
    .from(leads)
    .where(eq(leads.companyId, company.id))
    .then((rows) => rows.filter((r) => r.scheduledAt !== null));

  const events = scheduled.map((lead) => {
    const start = new Date(lead.scheduledAt!);
    const end = lead.scheduledEndAt ? new Date(lead.scheduledEndAt) : addHours(start, 2);
    const service = lead.serviceType ? (SERVICE_LABELS[lead.serviceType] ?? lead.serviceType) : "";
    const summary = `${icsEsc(lead.homeownerName)}${service ? ` — ${service}` : ""}`;
    const location = [lead.address, lead.city, lead.state].filter(Boolean).join(", ");
    const description = [
      lead.homeownerPhone ? `Phone: ${lead.homeownerPhone}` : null,
      lead.homeownerEmail ? `Email: ${lead.homeownerEmail}` : null,
      lead.notes ? `Notes: ${lead.notes}` : null,
    ].filter(Boolean).join("\\n");

    return [
      "BEGIN:VEVENT",
      `UID:${lead.id}@craftcapture`,
      `DTSTAMP:${icsDate(new Date())}`,
      `DTSTART:${icsDate(start)}`,
      `DTEND:${icsDate(end)}`,
      `SUMMARY:${summary}`,
      location ? `LOCATION:${icsEsc(location)}` : null,
      description ? `DESCRIPTION:${description}` : null,
      "END:VEVENT",
    ].filter(Boolean).join("\r\n");
  });

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//CraftCapture//Schedule//EN`,
    `X-WR-CALNAME:${icsEsc(company.businessName)} Schedule`,
    "X-WR-TIMEZONE:America/Chicago",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");

  const filename = `craftcapture-schedule-${new Date().toISOString().slice(0, 10)}.ics`;

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
