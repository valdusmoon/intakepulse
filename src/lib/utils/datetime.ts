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
 *  tz-aware "is this Today / Yesterday" comparisons. en-CA yields ISO-style output. */
export function dateKeyInTimezone(date: Date | string | number, timezone: string): string {
  return new Date(date).toLocaleDateString("en-CA", { timeZone: timezone });
}
