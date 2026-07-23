import { describe, it, expect } from "vitest";
import { buildLeadPushPayload, buildMessagePushPayload } from "./payload";

describe("buildLeadPushPayload", () => {
  // Regression: values are stored in cents, but this formatter treated them as
  // dollars, so a $4,500–$9,000 job pushed as "Est. $450,000–$900,000".
  it("formats the estimated range in dollars, not raw cents", () => {
    const p = buildLeadPushPayload({
      leadId: "lead-1",
      callerName: "Sarah",
      priorityScore: 92,
      estimatedValueLow: 450000,
      estimatedValueHigh: 900000,
    });
    expect(p.body).toContain("$4,500–$9,000");
    expect(p.body).not.toContain("450,000");
  });

  it("formats a lone low value in dollars", () => {
    const p = buildLeadPushPayload({
      leadId: "lead-1",
      callerName: null,
      priorityScore: 50,
      estimatedValueLow: 180000,
    });
    expect(p.body).toContain("$1,800");
  });

  it("omits the value entirely when none was estimated", () => {
    const p = buildLeadPushPayload({ leadId: "lead-1", callerName: "Sarah", priorityScore: 30 });
    expect(p.body).not.toContain("$");
  });

  it("titles by tier and falls back to a generic caller label", () => {
    expect(buildLeadPushPayload({ leadId: "l", callerName: "Sarah", priorityScore: 92 }).title).toContain("Sarah");
    expect(buildLeadPushPayload({ leadId: "l", callerName: null, priorityScore: 92 }).title).toContain("New caller");
    expect(buildLeadPushPayload({ leadId: "l", callerName: null, priorityScore: 30 }).title).toContain("New lead");
  });

  it("tags one notification per lead so a re-send replaces rather than stacks", () => {
    expect(buildLeadPushPayload({ leadId: "abc", callerName: null, priorityScore: 10 }).tag).toBe("lead-abc");
  });
});

describe("buildMessagePushPayload", () => {
  it("labels the message kind and never implies a scored opportunity", () => {
    const p = buildMessagePushPayload({
      leadId: "lead-2",
      callerName: "Dana",
      messageKind: "billing",
      notes: "question about my invoice",
    });
    expect(p.title).toContain("New message");
    expect(p.body).toContain("Billing");
    expect(p.body).toContain("question about my invoice");
    expect(p.body).not.toContain("$");
  });

  it("truncates a long note", () => {
    const p = buildMessagePushPayload({
      leadId: "lead-2",
      callerName: null,
      messageKind: null,
      notes: "x".repeat(200),
    });
    expect(p.body.length).toBeLessThan(120);
    expect(p.body).toContain("…");
  });
});
