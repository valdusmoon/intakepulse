import type { LeadPushPayload } from "./send";

interface LeadPushInput {
  leadId: string;
  callerName: string | null;
  urgencyScore: number;
  estimatedValueLow?: number | null;
  estimatedValueHigh?: number | null;
}

function usd(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

// One place that turns a scored lead into the notification an operator sees on
// their phone. Kept identical across the web-intake and voice-overflow paths.
export function buildLeadPushPayload(input: LeadPushInput): LeadPushPayload {
  const { leadId, callerName, urgencyScore, estimatedValueLow, estimatedValueHigh } = input;

  const tier = urgencyScore >= 80 ? "🔥 Hot lead" : urgencyScore >= 50 ? "Warm lead" : "New lead";
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
