import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getBusinessByClerkId } from "@/lib/db/queries/businesses";
import { getLeadsByBusiness } from "@/lib/db/queries/leads";
import { getVerticalConfig } from "@/lib/db/queries/verticalConfigs";
import { withCustomServiceOptions } from "@/lib/verticals/customOptions";
import { getAnswerOptionLabel, deriveServiceLabel } from "@/lib/verticals/labels";
import { intentMeta, priorityMeta, sourceLabel, statusMeta, tierMeta, messageKindMeta } from "@/lib/leads/priority";
import {
  EXPORT_ROW_LIMIT,
  centsToDollars,
  csvDateTime,
  csvFilename,
  csvResponse,
  toCsv,
  truncationNoteRow,
  type CsvValue,
} from "@/lib/utils/csv";

const INTAKE_STATUS_LABELS: Record<string, string> = {
  not_started: "Not started",
  started: "Started",
  completed: "Completed",
  abandoned: "Abandoned",
};

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await getBusinessByClerkId(userId);
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  // Same param names the Leads page reads, so the export is exactly the list the
  // user is looking at. businessId is never accepted from the client — it comes
  // from the Clerk session.
  const { searchParams } = req.nextUrl;
  const priority = searchParams.get("priority");
  const type = searchParams.get("type");
  const opts = {
    leadStatus: searchParams.get("status") || undefined,
    source: searchParams.get("source") || undefined,
    priority: (priority === "hot" || priority === "warm" || priority === "cool" ? priority : undefined) as
      | "hot"
      | "warm"
      | "cool"
      | undefined,
    leadType: (type === "job" || type === "message" ? type : undefined) as "job" | "message" | undefined,
    search: searchParams.get("search") || undefined,
  };

  const [rows, verticalConfig] = await Promise.all([
    // One over the cap: if it comes back we know the export was truncated without
    // paying for a second count query.
    getLeadsByBusiness(business.id, { ...opts, limit: EXPORT_ROW_LIMIT + 1, offset: 0 }),
    getVerticalConfig(business.vertical),
  ]);

  const truncated = rows.length > EXPORT_ROW_LIMIT;
  const leadRows = truncated ? rows.slice(0, EXPORT_ROW_LIMIT) : rows;

  // Custom categories the business added itself only resolve to labels once merged
  // in — without this they'd export as raw slugs ("duct_cleaning").
  const questions = withCustomServiceOptions(verticalConfig?.questions ?? [], business.customServiceOptions);

  const headers = [
    `Captured (${business.timezone})`,
    "Name",
    "Phone",
    "Email",
    "Type",
    "Source",
    "Status",
    "Priority tier",
    "Priority score",
    "Urgency",
    "Urgency score (1-10)",
    "Intent",
    "Service",
    "Caller's own words",
    "Estimated value low (USD)",
    "Estimated value high (USD)",
    "Confirmed value (USD)",
    "Intake",
    `First contacted (${business.timezone})`,
    `Won (${business.timezone})`,
    "Notes",
    // One column per configured intake question, in the order the caller is asked.
    ...questions.map((q) => q.label),
  ];

  const csvRows: CsvValue[][] = leadRows.map((lead) => {
    const answers = lead.intakeAnswers ?? {};
    return [
      csvDateTime(lead.createdAt, business.timezone),
      lead.callerName,
      lead.callerPhone,
      lead.callerEmail,
      lead.leadType === "message" ? `Message — ${messageKindMeta(lead.messageKind).label}` : "Job",
      sourceLabel(lead.source),
      statusMeta(lead.leadStatus).label,
      tierMeta(lead.priorityScore).label,
      lead.priorityScore,
      priorityMeta(lead.urgencyScore).label,
      lead.urgencyScore,
      intentMeta(lead.qualityScore).label,
      deriveServiceLabel({ questions }, lead.intakeAnswers, lead.serviceRequested),
      lead.serviceRequested,
      centsToDollars(lead.estimatedValueLow),
      centsToDollars(lead.estimatedValueHigh),
      centsToDollars(lead.confirmedValue),
      INTAKE_STATUS_LABELS[lead.intakeStatus] ?? lead.intakeStatus,
      csvDateTime(lead.contactedAt, business.timezone),
      csvDateTime(lead.convertedAt, business.timezone),
      lead.notes,
      ...questions.map((q) => {
        const raw = answers[q.key];
        if (raw == null) return "";
        return Array.isArray(raw)
          ? raw.map((v) => getAnswerOptionLabel(q, v)).join("; ")
          : getAnswerOptionLabel(q, raw);
      }),
    ];
  });

  if (truncated) csvRows.push(truncationNoteRow());

  return csvResponse(toCsv(headers, csvRows), csvFilename("leads", business.timezone));
}
