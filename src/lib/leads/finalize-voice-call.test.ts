import { describe, it, expect, vi, beforeEach } from "vitest";
import type { VerticalQuestion, ScoringRule } from "@/lib/db/schema/verticalConfigs";
import type { ScoringResult } from "./scoring";

vi.mock("@/lib/db/queries/calls", () => ({ getCallById: vi.fn(), updateCall: vi.fn() }));
vi.mock("@/lib/db/queries/leads", () => ({ getLeadById: vi.fn() }));
vi.mock("@/lib/db/queries/businesses", () => ({ getBusinessById: vi.fn() }));
vi.mock("@/lib/db/queries/verticalConfigs", () => ({ getVerticalConfig: vi.fn() }));
vi.mock("@/lib/db/queries/pricingRules", () => ({ getPricingRulesByBusiness: vi.fn() }));
vi.mock("@/lib/leads/assess", () => ({ assessLead: vi.fn() }));
vi.mock("@/lib/leads/notify-job", () => ({ notifyJobLead: vi.fn() }));
vi.mock("@/lib/leads/notify-message", () => ({ notifyMessageCaptured: vi.fn() }));
vi.mock("@/lib/openai", () => ({ openai: { chat: { completions: { create: vi.fn() } } } }));
import { getCallById, updateCall } from "@/lib/db/queries/calls";
import { getLeadById } from "@/lib/db/queries/leads";
import { getBusinessById } from "@/lib/db/queries/businesses";
import { getVerticalConfig } from "@/lib/db/queries/verticalConfigs";
import { getPricingRulesByBusiness } from "@/lib/db/queries/pricingRules";
import { assessLead } from "@/lib/leads/assess";
import { notifyJobLead } from "@/lib/leads/notify-job";
import { notifyMessageCaptured } from "@/lib/leads/notify-message";
import { openai } from "@/lib/openai";
import { finalizeVoiceCall } from "./finalize-voice-call";

const QUESTIONS: VerticalQuestion[] = [
  { key: "service_type", label: "Service", type: "single_select", options: [{ value: "water", label: "Water" }], required: true },
  { key: "urgency", label: "Urgency", type: "single_select", options: [{ value: "emergency", label: "Emergency" }], required: true },
];
const RULES: ScoringRule[] = [{ answerKey: "urgency", answerValue: "emergency", urgencyBonus: 10 }];

const BUSINESS = {
  id: "biz-1", ownerEmail: "o@x.com", ownerName: "O", businessName: "Blue Star",
  vertical: "restoration", customServiceOptions: [],
  notificationPreferences: { qualifiedLead: true, pushNewLead: true, messageNotification: true },
};

function mockCall(overrides: Record<string, unknown> = {}) {
  return { id: "call-1", businessId: "biz-1", leadId: null, summary: null, transcript: [{ role: "user", message: "hi" }], ...overrides };
}

beforeEach(() => {
  vi.mocked(getCallById).mockReset();
  vi.mocked(updateCall).mockReset().mockResolvedValue(undefined as never);
  vi.mocked(getLeadById).mockReset();
  vi.mocked(getBusinessById).mockReset().mockResolvedValue(BUSINESS as never);
  vi.mocked(getVerticalConfig).mockReset().mockResolvedValue({ questions: QUESTIONS, scoringRules: RULES, baseValueLow: 50000, aiPromptTemplate: "t" } as never);
  vi.mocked(getPricingRulesByBusiness).mockReset().mockResolvedValue([] as never);
  vi.mocked(assessLead).mockReset().mockResolvedValue({ urgencyReasoning: "u", qualityReasoning: "q", recommendedActions: [] } as never);
  vi.mocked(notifyJobLead).mockReset();
  vi.mocked(notifyMessageCaptured).mockReset();
  vi.mocked(openai.chat.completions.create).mockReset().mockResolvedValue({ choices: [{ message: { content: "A water damage call." } }] } as never);
});

describe("finalizeVoiceCall", () => {
  it("scores an unscored job with the lead's own serviceRequested + notes as ScoringContext, then notifies", async () => {
    vi.mocked(getCallById).mockResolvedValue(mockCall({ leadId: "lead-1" }) as never);
    vi.mocked(getLeadById).mockResolvedValue({
      id: "lead-1", businessId: "biz-1", source: "voice_overflow", leadType: "job", priorityScore: null,
      intakeAnswers: { service_type: "water" }, serviceRequested: null, notes: "there is a gas leak in the basement",
      callerName: "Sam", callerPhone: "+15550001111", messageKind: null,
    } as never);

    await finalizeVoiceCall({ callId: "call-1" });

    expect(assessLead).toHaveBeenCalledTimes(1);
    const scores = vi.mocked(assessLead).mock.calls[0][2] as ScoringResult;
    expect(scores.trace.floorsApplied).toContain("critical_signal_floor");
    expect(notifyJobLead).toHaveBeenCalledTimes(1);
    expect(notifyMessageCaptured).not.toHaveBeenCalled();
  });

  it("an already-finalized call is a no-op (the summary marks it done)", async () => {
    vi.mocked(getCallById).mockResolvedValue(mockCall({ leadId: "lead-1", summary: "done" }) as never);
    vi.mocked(getLeadById).mockResolvedValue({
      id: "lead-1", businessId: "biz-1", source: "voice_overflow", leadType: "job", priorityScore: 82,
    } as never);

    await finalizeVoiceCall({ callId: "call-1" });

    expect(assessLead).not.toHaveBeenCalled();
    expect(notifyJobLead).not.toHaveBeenCalled();
    expect(updateCall).not.toHaveBeenCalled();
  });

  // Three triggers fire this event; a message has no score to mark it handled,
  // so without the summary guard the owner got one push per trigger.
  it("does not re-alert a message lead when the call was already finalized", async () => {
    vi.mocked(getCallById).mockResolvedValue(mockCall({ leadId: "lead-2", summary: "already summarized" }) as never);
    vi.mocked(getLeadById).mockResolvedValue({
      id: "lead-2", businessId: "biz-1", source: "voice_overflow", leadType: "message",
      messageKind: "billing", priorityScore: null, notes: "invoice question",
    } as never);

    await finalizeVoiceCall({ callId: "call-1" });

    expect(notifyMessageCaptured).not.toHaveBeenCalled();
  });

  it("a message lead gets the low-key alert and is never scored", async () => {
    vi.mocked(getCallById).mockResolvedValue(mockCall({ leadId: "lead-2" }) as never);
    vi.mocked(getLeadById).mockResolvedValue({
      id: "lead-2", businessId: "biz-1", source: "voice_overflow", leadType: "message", messageKind: "billing",
      priorityScore: null, callerName: "Dana", callerPhone: "+15550002222", notes: "question about my invoice",
    } as never);

    await finalizeVoiceCall({ callId: "call-1" });

    expect(notifyMessageCaptured).toHaveBeenCalledWith(expect.objectContaining({ messageKind: "billing", notes: "question about my invoice" }));
    expect(assessLead).not.toHaveBeenCalled();
    expect(notifyJobLead).not.toHaveBeenCalled();
  });

  it("a call without a lead (screened/abandoned) still gets its summary", async () => {
    vi.mocked(getCallById).mockResolvedValue(mockCall() as never);

    await finalizeVoiceCall({ callId: "call-1" });

    expect(updateCall).toHaveBeenCalledWith("call-1", { summary: "A water damage call." });
    expect(notifyJobLead).not.toHaveBeenCalled();
    expect(notifyMessageCaptured).not.toHaveBeenCalled();
  });

  it("an empty transcript writes the honest 'No conversation recorded.' summary without a model call", async () => {
    vi.mocked(getCallById).mockResolvedValue(mockCall({ transcript: [] }) as never);

    await finalizeVoiceCall({ callId: "call-1" });

    expect(openai.chat.completions.create).not.toHaveBeenCalled();
    expect(updateCall).toHaveBeenCalledWith("call-1", { summary: "No conversation recorded." });
  });

  it("test-harness leads (source voice_test) never notify", async () => {
    vi.mocked(getCallById).mockResolvedValue(mockCall({ leadId: "lead-3", summary: "s" }) as never);
    vi.mocked(getLeadById).mockResolvedValue({
      id: "lead-3", businessId: "biz-1", source: "voice_test", leadType: "job", priorityScore: null,
    } as never);

    await finalizeVoiceCall({ callId: "call-1" });

    expect(assessLead).not.toHaveBeenCalled();
    expect(notifyJobLead).not.toHaveBeenCalled();
  });

  it("a summary-generation failure degrades to 'Summary unavailable.' instead of throwing", async () => {
    vi.mocked(getCallById).mockResolvedValue(mockCall() as never);
    vi.mocked(openai.chat.completions.create).mockRejectedValue(new Error("api down") as never);

    await finalizeVoiceCall({ callId: "call-1" });

    expect(updateCall).toHaveBeenCalledWith("call-1", { summary: "Summary unavailable." });
  });
});
