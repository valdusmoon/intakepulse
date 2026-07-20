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

interface MessagePushInput {
  leadId: string;
  callerName: string | null;
  messageKind: string | null;
  notes: string | null;
}

const MESSAGE_KIND_LABEL: Record<string, string> = {
  existing_customer: "Existing customer",
  billing: "Billing",
  callback: "Callback request",
  question: "Question",
  general: "Message",
};

/** The low-key counterpart to buildLeadPushPayload for a non-job MESSAGE — no
 *  tier, no value, no "Hot lead" urgency. The operator still gets pinged, just
 *  told it's a message to return, not a scored opportunity to chase. */
export function buildMessagePushPayload(input: MessagePushInput): LeadPushPayload {
  const { leadId, callerName, messageKind, notes } = input;
  const who = callerName?.trim() || "New caller";
  const kindLabel = (messageKind && MESSAGE_KIND_LABEL[messageKind]) || "Message";
  const trimmed = notes?.trim();
  const snippet = trimmed ? (trimmed.length > 80 ? `${trimmed.slice(0, 79)}…` : trimmed) : "Tap to see the details.";
  return {
    title: `New message — ${who}`,
    body: `${kindLabel}. ${snippet}`,
    url: `/dashboard/leads/${leadId}`,
    tag: `lead-${leadId}`,
  };
}
