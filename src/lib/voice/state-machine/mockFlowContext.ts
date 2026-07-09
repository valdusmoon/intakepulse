// Shared FlowContext mock builders for tests. Not a *.test.ts file itself —
// vitest's `include` glob only picks up *.test.ts, so this is safe to import
// from multiple suites without being run as its own (empty) test file.
import type { VerticalQuestion, VerticalConfig } from "@/lib/db/schema/verticalConfigs";
import type { FlowContext } from "./types";
import type { BusinessCallData, SessionState } from "../types/session";

export function makeBusiness(overrides: Partial<BusinessCallData> = {}): BusinessCallData {
  return {
    id: "biz-1",
    businessName: "Blue Star Restoration",
    ownerEmail: "owner@example.com",
    ownerName: "Jordan",
    vertical: "restoration",
    serviceArea: null,
    timezone: "America/New_York",
    forwardingNumber: null,
    urgentTransferNumber: null,
    greetingMessage: null,
    aiInstructions: null,
    recordingEnabled: false,
    recordingDisclosure: null,
    callerNumber: "+15551234567",
    notificationPreferences: { newLead: true, qualifiedLead: true, smsNewLead: false, weeklyReport: true },
    voiceName: "alloy",
    customServiceOptions: [],
    ...overrides,
  };
}

export function makeSession(overrides: Partial<SessionState> = {}): SessionState {
  return {
    latestMediaTimestamp: 0,
    callerPhone: "+15551234567",
    conversationContext: { transcript: [], actionsTaken: [], answers: {} },
    correlationId: "corr-1",
    callSid: "CA1",
    callId: "call-1",
    businessId: "biz-1",
    businessName: "Blue Star Restoration",
    urgentTransferNumber: null,
    callStartTime: new Date(),
    state: "greeting",
    qualificationIndex: 0,
    attempts: {},
    dtmfBuffer: "",
    ...overrides,
  };
}

export function makeVerticalConfig(questions: VerticalQuestion[], overrides: Partial<VerticalConfig> = {}): VerticalConfig {
  return {
    id: "vc-1",
    vertical: "restoration",
    displayName: "Restoration",
    questions,
    scoringRules: [],
    aiPromptTemplate: "template",
    baseValueLow: 150000,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function makeFlowContext(overrides: Partial<FlowContext> = {}): FlowContext {
  return {
    session: makeSession(),
    business: makeBusiness(),
    verticalConfig: makeVerticalConfig([
      { key: "service_type", label: "What type of damage?", type: "single_select", options: [{ value: "water", label: "Water" }, { value: "fire", label: "Fire or Smoke" }, { value: "mold", label: "Mold" }], required: true },
      { key: "urgency", label: "How urgent is this?", type: "single_select", options: [{ value: "emergency", label: "Emergency" }], required: true },
    ]),
    pricingRules: [],
    onComplete: () => {},
    ...overrides,
  };
}
