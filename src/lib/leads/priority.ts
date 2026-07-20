import type { BadgeColor } from "@/components/dashboard/v2/primitives";
import { priorityTier, isHighValueLead, type LeadTier } from "@/lib/leads/scoring";

const TIER_COLOR: Record<LeadTier, BadgeColor> = { Hot: "red", Warm: "amber", Cool: "gray" };

/** A tier-independent "High value" badge — lets a big but non-urgent lead read
 *  "Cool · High value" so it's visible without inflating its priority. Returns
 *  null when the lead isn't high-value. */
export function highValueBadge(estimatedValueLow: number | null): { label: string; color: BadgeColor } | null {
  return isHighValueLead(estimatedValueLow) ? { label: "High value", color: "purple" } : null;
}

/** The lead's Hot/Warm/Cool tier — the single "call first" badge, derived from the
 *  composite priorityScore (urgency + value + quality). Use this as the primary
 *  badge; `intentMeta` (quality) is the secondary signal. */
export function tierMeta(priorityScore: number | null): { label: string; color: BadgeColor } {
  if (priorityScore == null) return { label: "Unscored", color: "gray" };
  const tier = priorityTier(priorityScore);
  return { label: tier, color: TIER_COLOR[tier] };
}

/** Bucket the numeric urgencyScore (1-10) into a time-sensitivity label. Kept for
 *  the urgency-specific chip / callback routing; the primary lead tier is `tierMeta`. */
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

const MESSAGE_KIND_META: Record<string, { label: string; color: BadgeColor }> = {
  existing_customer: { label: "Existing customer", color: "blue" },
  billing: { label: "Billing", color: "amber" },
  callback: { label: "Callback", color: "blue" },
  question: { label: "Question", color: "gray" },
  general: { label: "Message", color: "gray" },
};

/** The badge for a non-job MESSAGE row — used in place of the Hot/Warm/Cool tier.
 *  A message has no priorityScore, so tierMeta would render a misleading
 *  "Unscored"; this shows what kind of message it is instead. */
export function messageKindMeta(messageKind: string | null): { label: string; color: BadgeColor } {
  return (messageKind && MESSAGE_KIND_META[messageKind]) || { label: "Message", color: "gray" };
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
  voice_overflow: "Recovered by AI",
  voice_human: "Answered by team",
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
  voice_human: "#12b76a",
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
