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

const STATUS_META: Record<string, { label: string; color: BadgeColor }> = {
  new: { label: "New", color: "gray" },
  contacted: { label: "Contacted", color: "blue" },
  qualified: { label: "Qualified", color: "purple" },
  booked: { label: "Booked", color: "blue" },
  estimate_sent: { label: "Estimate sent", color: "amber" },
  converted: { label: "Won", color: "green" },
  lost: { label: "Lost", color: "red" },
};

export function statusMeta(leadStatus: string): { label: string; color: BadgeColor } {
  return STATUS_META[leadStatus] ?? { label: leadStatus, color: "gray" };
}

const SOURCE_LABELS: Record<string, string> = {
  voice_overflow: "Voice overflow",
  website_widget: "Website widget",
  direct_intake: "Direct intake",
  manual: "Manual entry",
  email: "Email",
};

/** Human-readable label for a lead's raw `source` enum value — never show the DB value itself in the UI. */
export function sourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? source;
}

const SOURCE_SWATCHES: Record<string, string> = {
  voice_overflow: "#2454d8",
  website_widget: "#6941c6",
  direct_intake: "#667085",
  manual: "#98a2b3",
  email: "#98a2b3",
};

/** Swatch/dot color for a lead's raw `source` enum value, for consistent channel color-coding across the dashboard. */
export function sourceSwatch(source: string): string {
  return SOURCE_SWATCHES[source] ?? "#98a2b3";
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
