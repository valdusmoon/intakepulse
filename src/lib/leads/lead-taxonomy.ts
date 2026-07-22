/**
 * Canonical contact taxonomy shared by every intake channel (voice AI, human-answered
 * calls, web form). Every channel resolves a contact into exactly one of three outcomes:
 * a scored 'job' lead, an unscored 'message' lead (with a messageKind sub-label), or
 * screened junk that creates no lead row at all. See docs/intake-capture-contract.md.
 */
export type LeadType = "job" | "message";
export type MessageKind = "existing_customer" | "billing" | "callback" | "question" | "general";
export const MESSAGE_KINDS: MessageKind[] = ["existing_customer", "billing", "callback", "question", "general"];
