// Timestamps are stored as UTC in the DB. Every business-facing absolute time
// should render in the business's configured timezone (businesses.timezone) so the
// owner, office staff, and techs all see the same wall-clock time regardless of the
// device or location they're viewing from — a single canonical zone per account,
// not the viewer's browser zone (these render server-side anyway).

/** The set of business-selectable timezones (IANA id + label). Kept small and
 *  US-focused since that's the customer base; extend as needed. */
export const SUPPORTED_TIMEZONES: { value: string; label: string }[] = [
  { value: "America/New_York", label: "Eastern (New York)" },
  { value: "America/Chicago", label: "Central (Chicago)" },
  { value: "America/Denver", label: "Mountain (Denver)" },
  { value: "America/Phoenix", label: "Mountain – no DST (Phoenix)" },
  { value: "America/Los_Angeles", label: "Pacific (Los Angeles)" },
  { value: "America/Anchorage", label: "Alaska (Anchorage)" },
  { value: "Pacific/Honolulu", label: "Hawaii (Honolulu)" },
];

/** Format an instant in the given IANA timezone. Thin wrapper over toLocaleString
 *  that guarantees the timeZone is always applied (the bug being fixed was call sites
 *  omitting timeZone, so they silently rendered in the server zone / UTC on Vercel). */
export function formatInTimezone(
  date: Date | string | number,
  timezone: string,
  opts: Intl.DateTimeFormatOptions
): string {
  return new Date(date).toLocaleString("en-US", { timeZone: timezone, ...opts });
}

/** The calendar date (YYYY-MM-DD) of an instant as seen in a timezone. Used for
 *  tz-aware "is this Today / Yesterday" comparisons and day-bucket keys. en-CA yields
 *  ISO-style output. */
export function dateKeyInTimezone(date: Date | string | number, timezone: string): string {
  return new Date(date).toLocaleDateString("en-CA", { timeZone: timezone });
}

/** How far ahead (ms) a timezone's local wall clock is vs UTC at a given instant.
 *  e.g. America/New_York in summer is UTC-4 -> returns -14400000. */
function tzOffsetMs(date: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hourCycle: "h23",
    year: "numeric", month: "numeric", day: "numeric",
    hour: "numeric", minute: "numeric", second: "numeric",
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  const asIfUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asIfUtc - date.getTime();
}

/** The UTC instant at which a timezone's local clock reads the first moment of a
 *  month (00:00:00 on the 1st). `monthOffset` shifts by whole months from the month
 *  containing `base` in that zone (0 = current business-local month, -1 = previous).
 *  Used so "this month" / "the month that just ended" are bucketed on the business's
 *  calendar, not the server's (UTC). Month starts are never inside a US DST gap, so a
 *  single offset correction is exact. */
export function zonedMonthStartUtc(timezone: string, monthOffset = 0, base: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone, year: "numeric", month: "numeric",
  }).formatToParts(base);
  const localYear = Number(parts.find((p) => p.type === "year")!.value);
  const localMonth = Number(parts.find((p) => p.type === "month")!.value); // 1-12
  const target = localMonth - 1 + monthOffset; // 0-based month index, may be out of range
  const year = localYear + Math.floor(target / 12);
  const month = ((target % 12) + 12) % 12; // 0-11
  // Interpret y-m-01 00:00 as if it were UTC, then correct by the zone's offset at
  // that instant to land on the true UTC instant of business-local midnight.
  const asIfUtc = Date.UTC(year, month, 1, 0, 0, 0);
  return new Date(asIfUtc - tzOffsetMs(new Date(asIfUtc), timezone));
}

/** The list of the last `days` calendar dates (YYYY-MM-DD) in a timezone, oldest
 *  first, ending today (business-local). Anchored at noon UTC of each business-local
 *  day so the calendar decrement is DST-safe. Matches the day-bucket keys produced by
 *  a `to_char(... AT TIME ZONE tz, 'YYYY-MM-DD')` SQL bucket. */
export function lastNDateKeysInTimezone(days: number, timezone: string, base: Date = new Date()): string[] {
  const todayKey = dateKeyInTimezone(base, timezone);
  const keys: string[] = [];
  let cursor = new Date(`${todayKey}T12:00:00Z`);
  for (let i = 0; i < days; i++) {
    keys.unshift(cursor.toISOString().slice(0, 10));
    cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
  }
  return keys;
}
