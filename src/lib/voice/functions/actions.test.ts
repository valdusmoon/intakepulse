import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkServiceArea, getPriceRangeForCategory, deriveIntakeStatus, canWarmTransfer, captureLead } from "./actions";
import { makeFlowContext, makeSession } from "../state-machine/mockFlowContext";
import type { VerticalQuestion } from "@/lib/db/schema/verticalConfigs";

// actions.ts transitively imports several DB-backed modules that connect to
// Postgres eagerly at import time (via ../index) — none of those code paths
// are exercised by the functions under test here, but the imports still need
// to resolve without throwing, so every DB/env-touching import gets stubbed.
vi.mock("@/lib/db/queries/pricingRules", () => ({ getActivePricingRule: vi.fn() }));
vi.mock("@/lib/db/queries/leads", () => ({ createLead: vi.fn() }));
vi.mock("@/lib/db/queries/calls", () => ({ updateCall: vi.fn() }));
vi.mock("@/lib/leads/assess", () => ({ assessLead: vi.fn() }));
vi.mock("@/lib/email/notifications", () => ({ sendLeadPacketEmail: vi.fn(), sendMessageNotificationEmail: vi.fn() }));
vi.mock("@/lib/twilio/client", () => ({ updateCallWithTwiml: vi.fn() }));
// Must be mocked: push/send imports the db client, which throws at module load
// without DATABASE_URL and takes this whole test file down with it.
vi.mock("@/lib/push/send", () => ({ sendLeadPushNotification: vi.fn() }));
import { getActivePricingRule } from "@/lib/db/queries/pricingRules";
import { createLead } from "@/lib/db/queries/leads";
import { assessLead } from "@/lib/leads/assess";
import { sendLeadPacketEmail, sendMessageNotificationEmail } from "@/lib/email/notifications";

describe("checkServiceArea", () => {
  it("is eligible by default when the business has no configured service area", () => {
    const ctx = makeFlowContext({ business: { ...makeFlowContext().business, serviceArea: null } });
    expect(checkServiceArea(ctx, "10001")).toEqual({ eligible: true });
  });

  it("is eligible when the ZIP appears (case-insensitively) as a substring of the free-text service area", () => {
    const ctx = makeFlowContext({ business: { ...makeFlowContext().business, serviceArea: "Serving 10001, 10002, and surrounding areas" } });
    expect(checkServiceArea(ctx, "10001").eligible).toBe(true);
  });

  it("is ineligible (with the description) when the ZIP is not mentioned in the service area", () => {
    const ctx = makeFlowContext({ business: { ...makeFlowContext().business, serviceArea: "Greater Chicago Area" } });
    const result = checkServiceArea(ctx, "10001");
    expect(result.eligible).toBe(false);
    expect(result.serviceAreaDescription).toBe("Greater Chicago Area");
  });
});

describe("getPriceRangeForCategory", () => {
  beforeEach(() => {
    vi.mocked(getActivePricingRule).mockReset();
  });

  it("returns the business-approved message verbatim when an active rule exists", async () => {
    vi.mocked(getActivePricingRule).mockResolvedValue({
      id: "pr-1",
      businessId: "biz-1",
      vertical: "restoration",
      serviceCategory: "water",
      pricingType: "preliminary_range",
      minimumAmount: 140000,
      maximumAmount: 640000,
      fixedAmount: null,
      startingAmount: null,
      approvedCustomerMessage: "This typically runs $1,400 to $6,400.",
      disclaimer: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const ctx = makeFlowContext();
    const result = await getPriceRangeForCategory(ctx, "water");
    expect(result).toEqual({ eligible: true, message: "This typically runs $1,400 to $6,400." });
  });

  it("falls back to a 'team will review' message when no active rule exists for the category — never invents a number", async () => {
    vi.mocked(getActivePricingRule).mockResolvedValue(null);
    const ctx = makeFlowContext();
    const result = await getPriceRangeForCategory(ctx, "some_unconfigured_category");
    expect(result.eligible).toBe(false);
    expect(result.message).toBe("The team will need to review the details before discussing pricing.");
  });

  it("looks up the rule by this business's id and the exact category passed in", async () => {
    vi.mocked(getActivePricingRule).mockResolvedValue(null);
    const ctx = makeFlowContext({ business: { ...makeFlowContext().business, id: "biz-42" } });
    await getPriceRangeForCategory(ctx, "ac_repair");
    expect(getActivePricingRule).toHaveBeenCalledWith("biz-42", "ac_repair");
  });
});

describe("canWarmTransfer (dead-end forwarding-number guard)", () => {
  it("is false when no urgent transfer number is configured", () => {
    expect(canWarmTransfer(makeSession({ urgentTransferNumber: null }))).toBe(false);
  });

  it("is true when a transfer number is set and the business line was never rung this call (ai_immediate)", () => {
    // businessLineAlreadyTried false → even the same number is fine (it was never dialed).
    expect(
      canWarmTransfer(makeSession({
        urgentTransferNumber: "+15551234567",
        forwardingNumber: "+15551234567",
        businessLineAlreadyTried: false,
      })),
    ).toBe(true);
  });

  it("is FALSE when the transfer number is the same line that already rang out this call", () => {
    expect(
      canWarmTransfer(makeSession({
        urgentTransferNumber: "+15551234567",
        forwardingNumber: "+15551234567",
        businessLineAlreadyTried: true,
      })),
    ).toBe(false);
  });

  it("treats differently-formatted versions of the same number as equal (normalized)", () => {
    expect(
      canWarmTransfer(makeSession({
        urgentTransferNumber: "(555) 123-4567",
        forwardingNumber: "+1 555-123-4567",
        businessLineAlreadyTried: true,
      })),
    ).toBe(false);
  });

  it("is true when the transfer number is a DIFFERENT line than the one that rang out (on-call/partner)", () => {
    expect(
      canWarmTransfer(makeSession({
        urgentTransferNumber: "+15559999999",
        forwardingNumber: "+15551234567",
        businessLineAlreadyTried: true,
      })),
    ).toBe(true);
  });

  it("is true when there is no forwarding number to compare against", () => {
    expect(
      canWarmTransfer(makeSession({
        urgentTransferNumber: "+15551234567",
        forwardingNumber: null,
        businessLineAlreadyTried: true,
      })),
    ).toBe(true);
  });
});

const QUESTIONS: VerticalQuestion[] = [
  { key: "service_type", label: "Service", type: "single_select", options: [{ value: "water", label: "Water" }], required: true },
  { key: "urgency", label: "Urgency", type: "single_select", options: [{ value: "emergency", label: "Emergency" }], required: true },
];

describe("deriveIntakeStatus", () => {
  it("is 'not_started' for an existing-customer/short-path call that never attempted qualification", () => {
    const ctx = makeFlowContext({
      verticalConfig: { ...makeFlowContext().verticalConfig, questions: QUESTIONS },
      session: makeSession({ isNewCustomer: false, conversationContext: { transcript: [], actionsTaken: [], answers: { service_type: "water" } } }),
    });
    expect(deriveIntakeStatus(ctx)).toBe("not_started");
  });

  it("is 'abandoned', not 'not_started', when jumpToWrapUp forces isNewCustomer false after real qualification answers were already given", () => {
    // Regression: jumpToWrapUp (wants_human/frustrated/leave_message global
    // intents) sets isNewCustomer = false even mid-qualification. Gating
    // purely on isNewCustomer would wrongly discard a new customer's real,
    // partial answers as if they were an existing-customer call.
    const ctx = makeFlowContext({
      verticalConfig: { ...makeFlowContext().verticalConfig, questions: QUESTIONS },
      session: makeSession({
        isNewCustomer: false,
        hasStartedQualification: true,
        conversationContext: { transcript: [], actionsTaken: [], answers: { service_type: "water" } },
      }),
    });
    expect(deriveIntakeStatus(ctx)).toBe("abandoned");
  });

  it("is 'not_started' for a new customer with zero answers captured", () => {
    const ctx = makeFlowContext({
      verticalConfig: { ...makeFlowContext().verticalConfig, questions: QUESTIONS },
      session: makeSession({ isNewCustomer: true, conversationContext: { transcript: [], actionsTaken: [], answers: {} } }),
    });
    expect(deriveIntakeStatus(ctx)).toBe("not_started");
  });

  it("is 'completed' when every visible question has an answer", () => {
    const ctx = makeFlowContext({
      verticalConfig: { ...makeFlowContext().verticalConfig, questions: QUESTIONS },
      session: makeSession({
        isNewCustomer: true,
        hasStartedQualification: true,
        conversationContext: { transcript: [], actionsTaken: [], answers: { service_type: "water", urgency: "emergency" } },
      }),
    });
    expect(deriveIntakeStatus(ctx)).toBe("completed");
  });

  it("is 'abandoned' when a new-customer flow started but didn't answer every visible question", () => {
    const ctx = makeFlowContext({
      verticalConfig: { ...makeFlowContext().verticalConfig, questions: QUESTIONS },
      session: makeSession({
        isNewCustomer: true,
        hasStartedQualification: true,
        conversationContext: { transcript: [], actionsTaken: [], answers: { service_type: "water" } },
      }),
    });
    expect(deriveIntakeStatus(ctx)).toBe("abandoned");
  });

  it("only counts questions that are actually visible (conditional questions not yet reached don't block 'completed')", () => {
    const conditionalQuestions: VerticalQuestion[] = [
      { key: "service_type", label: "Service", type: "single_select", options: [{ value: "fire", label: "Fire" }], required: true },
      {
        key: "water_category",
        label: "Water category",
        type: "single_select",
        options: [{ value: "cat_1", label: "Clean" }],
        required: true,
        conditional: { key: "service_type", value: "water" },
      },
    ];
    const ctx = makeFlowContext({
      verticalConfig: { ...makeFlowContext().verticalConfig, questions: conditionalQuestions },
      // service_type is "fire", so water_category was never asked — shouldn't block "completed".
      session: makeSession({
        isNewCustomer: true,
        hasStartedQualification: true,
        conversationContext: { transcript: [], actionsTaken: [], answers: { service_type: "fire" } },
      }),
    });
    expect(deriveIntakeStatus(ctx)).toBe("completed");
  });
});

describe("captureLead — job vs message", () => {
  beforeEach(() => {
    vi.mocked(createLead).mockReset().mockResolvedValue({ id: "lead-1" } as never);
    vi.mocked(assessLead).mockReset().mockResolvedValue({ urgencyReasoning: "u", qualityReasoning: "q", recommendedActions: [] } as never);
    vi.mocked(sendLeadPacketEmail).mockReset();
    vi.mocked(sendMessageNotificationEmail).mockReset();
  });

  it("a job call is scored, assessed, and sent as a lead packet, with leadType 'job'", async () => {
    const ctx = makeFlowContext({
      session: makeSession({
        // no leadType set → defaults to 'job'
        conversationContext: { transcript: [], actionsTaken: [], answers: { service_type: "water", urgency: "emergency" } },
      }),
    });

    await captureLead(ctx);

    expect(createLead).toHaveBeenCalledWith(expect.objectContaining({ leadType: "job", messageKind: null }));
    expect(assessLead).toHaveBeenCalledTimes(1);
    expect(sendLeadPacketEmail).toHaveBeenCalledTimes(1);
    expect(sendMessageNotificationEmail).not.toHaveBeenCalled();
  });

  it("a message call is captured with leadType 'message' and is NOT scored, assessed, or sent as a lead packet", async () => {
    const ctx = makeFlowContext({
      session: makeSession({
        leadType: "message",
        messageKind: "billing",
        conversationContext: { transcript: [], actionsTaken: [], answers: {}, reasonForCall: "question about my invoice" },
      }),
    });

    await captureLead(ctx);

    expect(createLead).toHaveBeenCalledWith(expect.objectContaining({ leadType: "message", messageKind: "billing", notes: "question about my invoice" }));
    // The whole scoring/lead-packet pipeline is skipped for a message.
    expect(assessLead).not.toHaveBeenCalled();
    expect(sendLeadPacketEmail).not.toHaveBeenCalled();
    // ...but the owner still gets a low-key message alert.
    expect(sendMessageNotificationEmail).toHaveBeenCalledTimes(1);
  });
});
