import type { BadgeColor } from "@/components/dashboard/v2/primitives";

/** Bucket the numeric urgencyScore (1-10) into the mockup's 3-tier priority label. */
export function priorityMeta(urgencyScore: number | null): { label: string; color: BadgeColor } {
  if (urgencyScore == null) return { label: "Unscored", color: "gray" };
  if (urgencyScore >= 7) return { label: "Urgent", color: "red" };
  if (urgencyScore >= 4) return { label: "Call today", color: "amber" };
  return { label: "Routine", color: "gray" };
}

/** Bucket the numeric qualityScore (1-100) into an "intent" label — reuses the
 * existing AI quality score rather than inventing a new scoring dimension. */
export function intentMeta(qualityScore: number | null): { label: string; color: BadgeColor } {
  if (qualityScore == null) return { label: "Intent unclear", color: "gray" };
  if (qualityScore >= 65) return { label: "High intent", color: "blue" };
  if (qualityScore >= 35) return { label: "Medium intent", color: "amber" };
  return { label: "Intent unclear", color: "gray" };
}

export function initials(name: string | null) {
  if (!name) return "—";
  const parts = name.trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}

export function timeAgoShort(date: Date | string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export function fmtCents(cents: number | null) {
  if (cents == null) return null;
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function fmtValueRange(low: number | null, high: number | null) {
  if (low == null && high == null) return null;
  if (low != null && high != null) return `${fmtCents(low)}–${fmtCents(high)}`;
  return fmtCents(low ?? high);
}
