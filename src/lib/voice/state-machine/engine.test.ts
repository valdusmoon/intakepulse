import { describe, it, expect, vi, beforeEach } from "vitest";

// actions.ts transitively imports DB-backed modules that connect eagerly at
// import time — stub them so the real engine/actions logic runs offline. The
// only DB call the adaptive walk reaches is getActivePricingRule (via
// getPriceRangeForCategory), stubbed to null → the "team will review" message.
vi.mock("@/lib/db/queries/pricingRules", () => ({ getActivePricingRule: vi.fn(async () => null) }));
vi.mock("@/lib/db/queries/leads", () => ({ createLead: vi.fn() }));
vi.mock("@/lib/db/queries/calls", () => ({ updateCall: vi.fn() }));
vi.mock("@/lib/leads/assess", () => ({ assessLead: vi.fn() }));
vi.mock("@/lib/email/notifications", () => ({ sendLeadPacketEmail: vi.fn() }));
vi.mock("@/lib/twilio/client", () => ({ updateCallWithTwiml: vi.fn() }));

import * as engine from "./engine";
import { makeFlowContext, makeVerticalConfig, makeSession } from "./mockFlowContext";
import type { VerticalQuestion } from "@/lib/db/schema/verticalConfigs";
import type { FlowContext } from "./types";

const RESTORATION: VerticalQuestion[] = [
  { key: "service_type", label: "What type of damage?", type: "single_select", options: [{ value: "water", label: "Water" }, { value: "fire", label: "Fire or Smoke" }, { value: "mold", label: "Mold" }], required: true },
  { key: "urgency", label: "How urgent is this?", type: "single_select", options: [{ value: "emergency", label: "Emergency" }, { value: "soon", label: "Soon" }, { value: "flexible", label: "Flexible" }], required: true },
  { key: "time_since_issue", label: "When did it start?", type: "single_select", options: [{ value: "today", label: "Today" }, { value: "this_week", label: "This week" }, { value: "longer", label: "Longer ago" }], required: true },
  { key: "has_coverage", label: "Is this covered by insurance?", type: "single_select", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }, { value: "unsure", label: "Not sure" }], required: true },
];

function mockClient() {
  return { createResponse: vi.fn(), cancelResponse: vi.fn(), truncateItem: vi.fn(), sendFunctionResult: vi.fn() } as any;
}
const noopWs = { send: () => {}, close: () => {} } as any;

function ctxFor(): FlowContext {
  return makeFlowContext({
    verticalConfig: makeVerticalConfig(RESTORATION),
    session: makeSession(),
  });
}

describe("adaptive engine flow", () => {
  let ctx: FlowContext;
  let client: ReturnType<typeof mockClient>;

  beforeEach(() => {
    ctx = ctxFor();
    client = mockClient();
  });

  it("opens with the free-form description prompt", () => {
    engine.startCall(ctx, client);
    expect(ctx.session.state).toBe("open_description");
  });

  it("a rich opener skips answered fields and asks only what's missing", async () => {
    engine.startCall(ctx, client);
    // Caller: "water, it's an emergency, new problem" — three fields at once.
    await engine.handleToolCall(ctx, client, "extract_intake", {
      customer_type: "new",
      service_type: "water",
      urgency: "emergency",
    });
    // Never asks new/existing or the two answered questions — goes to ZIP.
    expect(ctx.session.isNewCustomer).toBe(true);
    expect(ctx.session.state).toBe("zip_code");

    // ZIP via keypad.
    for (const d of "07030") await engine.handleDtmf(ctx, client, noopWs, d);
    expect(ctx.session.conversationContext.zipCode).toBe("07030");
    // Next missing field is time_since_issue.
    expect(ctx.session.state).toBe("qualification");
    expect(ctx.session.currentQuestionKey).toBe("time_since_issue");

    await engine.handleTranscript(ctx, client, "today");
    expect(ctx.session.conversationContext.answers.time_since_issue).toBe("today");
    // Then the last missing field, has_coverage.
    expect(ctx.session.currentQuestionKey).toBe("has_coverage");

    await engine.handleDtmf(ctx, client, noopWs, "1"); // yes
    expect(ctx.session.conversationContext.answers.has_coverage).toBe("yes");
    // Everything gathered → price/name.
    expect(ctx.session.state).toBe("name");
  });

  it("a fully-detailed opener leaves only the name to ask", async () => {
    engine.startCall(ctx, client);
    await engine.handleToolCall(ctx, client, "extract_intake", {
      customer_type: "new",
      zip_code: "07030",
      service_type: "water",
      urgency: "emergency",
      time_since_issue: "today",
      has_coverage: "yes",
    });
    expect(ctx.session.conversationContext.zipCode).toBe("07030");
    expect(ctx.session.state).toBe("name");
  });

  it("an empty opener falls back to asking new-or-existing", async () => {
    engine.startCall(ctx, client);
    await engine.handleToolCall(ctx, client, "extract_intake", {});
    expect(ctx.session.isNewCustomer).toBeUndefined();
    expect(ctx.session.state).toBe("new_or_existing");
  });

  it("an existing customer from the opener skips qualification to the name ask", async () => {
    engine.startCall(ctx, client);
    await engine.handleToolCall(ctx, client, "extract_intake", { customer_type: "existing" });
    expect(ctx.session.isNewCustomer).toBe(false);
    expect(ctx.session.state).toBe("name");
    expect(ctx.session.conversationContext.answers).toEqual({});
  });

  it("asks the primary question before ZIP when the opener gave nothing but new-customer", async () => {
    engine.startCall(ctx, client);
    await engine.handleToolCall(ctx, client, "extract_intake", { customer_type: "new" });
    expect(ctx.session.state).toBe("qualification");
    expect(ctx.session.currentQuestionKey).toBe("service_type");
  });
});
