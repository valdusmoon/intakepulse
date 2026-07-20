import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getBusinessByClerkId } from "@/lib/db/queries/businesses";
import { getCallsByBusiness } from "@/lib/db/queries/calls";
import { getVerticalConfig } from "@/lib/db/queries/verticalConfigs";
import { withCustomServiceOptions } from "@/lib/verticals/customOptions";
import { deriveServiceLabel } from "@/lib/verticals/labels";
import { priorityMeta } from "@/lib/leads/priority";
import {
  EXPORT_ROW_LIMIT,
  csvDateTime,
  csvFilename,
  csvResponse,
  toCsv,
  truncationNoteRow,
  type CsvValue,
} from "@/lib/utils/csv";

// Mirrors OUTCOME_META on the Calls page — the CSV should never leak the raw enum.
const OUTCOME_LABELS: Record<string, string> = {
  in_progress: "In progress",
  business_answered: "Business answered",
  ai_captured: "Captured by Callverted",
  transferred: "Transferred to team",
  abandoned: "Caller abandoned",
  screened: "Screened (spam / wrong number)",
};

function fmtDuration(seconds: number | null) {
  if (seconds == null) return "";
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await getBusinessByClerkId(userId);
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  // Same param names the Calls page reads, so the export matches the filtered list
  // on screen. The business is resolved from the session, never from the query.
  const { searchParams } = req.nextUrl;
  const opts = {
    outcome: searchParams.get("outcome") || undefined,
    search: searchParams.get("search") || undefined,
  };

  const [rows, verticalConfig] = await Promise.all([
    getCallsByBusiness(business.id, { ...opts, limit: EXPORT_ROW_LIMIT + 1, offset: 0 }),
    getVerticalConfig(business.vertical),
  ]);

  const truncated = rows.length > EXPORT_ROW_LIMIT;
  const callRows = truncated ? rows.slice(0, EXPORT_ROW_LIMIT) : rows;
  const questions = withCustomServiceOptions(verticalConfig?.questions ?? [], business.customServiceOptions);

  const headers = [
    `Date and time (${business.timezone})`,
    "Caller",
    "Number called",
    "Outcome",
    "Handled by Callverted",
    "Duration",
    "Duration (seconds)",
    "Lead captured",
    "Service",
    "Urgency",
    "Summary",
  ];

  const csvRows: CsvValue[][] = callRows.map((call) => [
    csvDateTime(call.createdAt, business.timezone),
    call.callerPhone,
    call.calledNumber,
    call.outcome === "screened" && call.screenedReason
      ? `${OUTCOME_LABELS.screened} — ${call.screenedReason.replace(/_/g, " ")}`
      : OUTCOME_LABELS[call.outcome] ?? call.outcome,
    call.aiHandled,
    fmtDuration(call.durationSeconds),
    call.durationSeconds,
    call.leadId != null,
    deriveServiceLabel({ questions }, call.leadIntakeAnswers),
    // Urgency only means something once a lead was scored off the call.
    call.leadId ? priorityMeta(call.leadUrgencyScore).label : "",
    call.summary,
  ]);

  if (truncated) csvRows.push(truncationNoteRow());

  return csvResponse(toCsv(headers, csvRows), csvFilename("calls", business.timezone));
}
