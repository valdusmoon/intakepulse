import { dateKeyInTimezone, formatInTimezone } from "./datetime";

// Shared CSV building for the dashboard export routes. Every export goes through
// here so escaping (and the spreadsheet-formula guard) is written once — a route
// that hand-rolls `values.join(",")` is a quoting bug waiting to happen.

export type CsvValue = string | number | boolean | null | undefined;

/** Hard ceiling on rows in a single export. Large enough that no real account hits
 *  it in normal use, small enough that the route stays a single fast query and the
 *  file opens in Excel without complaint. */
export const EXPORT_ROW_LIMIT = 5000;

// A cell that opens with any of these is interpreted as a formula by Excel /
// Sheets / LibreOffice, which turns an attacker-supplied caller name into code
// the business owner executes by opening the file (CSV injection).
const FORMULA_PREFIXES = ["=", "+", "-", "@", "\t", "\r"];

export function escapeCsvCell(value: CsvValue): string {
  if (value == null) return "";
  // Numbers are emitted bare so the spreadsheet stores them as numbers and can
  // sum/sort them. They also skip the formula guard below on purpose — prefixing
  // a negative number would corrupt every one of them.
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  if (typeof value === "boolean") return value ? "Yes" : "No";

  let text = String(value);
  // A leading apostrophe is the standard neutralizer: spreadsheets strip it on
  // display and treat the rest as literal text.
  if (FORMULA_PREFIXES.some((p) => text.startsWith(p))) text = `'${text}`;
  if (/[",\r\n]/.test(text)) text = `"${text.replace(/"/g, '""')}"`;
  return text;
}

/** One CSV table: a header row plus data rows. CRLF line endings per RFC 4180 —
 *  bare LF trips older Excel builds on Windows. */
export function toCsv(headers: string[], rows: CsvValue[][]): string {
  return [headers, ...rows].map((row) => row.map(escapeCsvCell).join(",")).join("\r\n");
}

/** Stack several labeled tables into one file, blank-line separated. Used by the
 *  reports export, where the page itself is several small tables rather than one
 *  long list, and a reader that expects uniform columns would be wrong either way. */
export function toCsvSections(sections: { title: string; headers: string[]; rows: CsvValue[][] }[]): string {
  return sections
    .map((s) => `${escapeCsvCell(s.title)}\r\n${toCsv(s.headers, s.rows)}`)
    .join("\r\n\r\n");
}

/** Trailing row flagging that the row cap kicked in, so a truncated export can't
 *  be mistaken for a complete one. */
export function truncationNoteRow(): CsvValue[] {
  return [`Note: export capped at ${EXPORT_ROW_LIMIT.toLocaleString("en-US")} rows. Narrow the filters or date range to export the rest.`];
}

/** Timestamps are stored UTC; every exported time renders in the business's zone,
 *  same as the screen the export was taken from. Format is sortable as text and
 *  still readable (2026-07-19 14:05). */
export function csvDateTime(date: Date | string | null | undefined, timezone: string): string {
  if (!date) return "";
  const day = dateKeyInTimezone(date, timezone);
  const time = formatInTimezone(date, timezone, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  return `${day} ${time}`;
}

/** Money is stored in cents. Exports emit plain dollars as a number rather than a
 *  "$1,500" string so the column can actually be summed in the spreadsheet. */
export function centsToDollars(cents: number | null | undefined): number | null {
  return cents == null ? null : Math.round(cents) / 100;
}

export function csvFilename(page: string, timezone: string): string {
  return `callverted-${page}-${dateKeyInTimezone(new Date(), timezone)}.csv`;
}

export function csvResponse(csv: string, filename: string): Response {
  // Excel only reads a CSV as UTF-8 when it opens with a BOM; without it the
  // en-dash in value ranges and any accented caller name arrive as mojibake.
  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
