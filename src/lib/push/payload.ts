import type { LeadPushPayload } from "./send";
import { priorityTier } from "@/lib/leads/scoring";

interface LeadPushInput {
  leadId: string;
  callerName: string | null;
  priorityScore: number;
  estimatedValueLow?: number | null;
  estimatedValueHigh?: number | null;
}

function usd(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

// One place that turns a scored lead into the notification an operator sees on
// their phone. Kept identical across the web-intake and voice-overflow paths.
export function buildLeadPushPayload(input: LeadPushInput): LeadPushPayload {
  const { leadId, callerName, priorityScore, estimatedValueLow, estimatedValueHigh } = input;

  const TIER_TITLE = { Hot: "🔥 Hot lead", Warm: "Warm lead", Cool: "New lead" } as const;
  const tier = TIER_TITLE[priorityTier(priorityScore)];
  const who = callerName?.trim() || "New caller";

  let value = "";
  if (estimatedValueLow && estimatedValueHigh) {
    value = `Est. ${usd(estimatedValueLow)}–${usd(estimatedValueHigh)}. `;
  } else if (estimatedValueLow) {
    value = `Est. ${usd(estimatedValueLow)}. `;
  }

  return {
    title: `${tier} — ${who}`,
    body: `${value}Tap to see the details and call back.`,
    url: `/dashboard/leads/${leadId}`,
    // One notification per lead — a re-send for the same lead replaces the prior.
    tag: `lead-${leadId}`,
  };
}
