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
// Must be mocked: push/send imports the db client, which throws at module load
// without DATABASE_URL and takes this whole test file down with it.
vi.mock("@/lib/push/send", () => ({ sendLeadPushNotification: vi.fn() }));

import * as engine from "./engine";
import { createLead } from "@/lib/db/queries/leads";
import { makeFlowContext, makeVerticalConfig, makeSession } from "./mockFlowContext";
import type { VerticalQuestion } from "@/lib/db/schema/verticalConfigs";
import type { FlowContext } from "./types";

const RESTORATION: VerticalQuestion[] = [
  { key: "service_type", label: "What type of damage?", type: "single_select", options: [{ value: "water", label: "Water" }, { value: "fire", label: "Fire or Smoke" }, { value: "mold", label: "Mold" }], required: true },
  { key: "urgency", label: "How urgent is this?", type: "single_select", options: [{ value: "emergency", label: "Emergency" }, { value: "soon", label: "Soon" }, { value: "flexible", label: "Flexible" }], required: true },
  { key: "time_since_issue", label: "When did it start?", type: "single_select", options: [{ value: "today", label: "Today" }, { value: "this_week", label: "This week" }, { value: "longer", label: "Longer ago" }], required: true },
  { key: "has_coverage", label: "Is this covered by insurance?", type: "single_select", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }, { value: "unsure", label: "Not sure" }], required: true },
  // Enrichment (voiceExtractOnly) — captured if mentioned, never asked aloud.
  { key: "cause", label: "What caused the damage?", type: "text", options: [], required: false, voiceExtractOnly: true },
  { key: "rooms_affected", label: "How many rooms are affected?", type: "single_select", options: [{ value: "one", label: "One room" }, { value: "two_three", label: "Two or three rooms" }, { value: "four_plus", label: "Four or more rooms" }], required: false, voiceExtractOnly: true },
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

  it("infers new-customer when a problem was described but customer_type was omitted", async () => {
    engine.startCall(ctx, client);
    // Model filled the damage fields but (as mini often does) omitted customer_type.
    await engine.handleToolCall(ctx, client, "extract_intake", { service_type: "water", urgency: "emergency" });
    expect(ctx.session.isNewCustomer).toBe(true);
    // Goes to ZIP, NOT a redundant "new or existing?" question.
    expect(ctx.session.state).toBe("zip_code");
  });

  it("an empty opener asks the 3-way clarification once, then takes a message (never dead-ends)", async () => {
    engine.startCall(ctx, client);
    // 1st empty opener → one 3-way clarification, still gathering.
    await engine.handleToolCall(ctx, client, "extract_intake", {});
    expect(ctx.session.state).toBe("open_description");
    const reask = [...ctx.session.conversationContext.transcript].reverse().find((t) => t.role === "assistant")?.message ?? "";
    expect(reask.toLowerCase()).toContain("take a message");

    // 2nd empty opener → take a message (name ask), NOT voicemail.
    await engine.handleToolCall(ctx, client, "extract_intake", {});
    expect(ctx.session.state).toBe("name");
    expect(ctx.session.isNewCustomer).toBe(false);
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

  it("existing customer with no stated reason: name → reason → confirm", async () => {
    engine.startCall(ctx, client);
    await engine.handleToolCall(ctx, client, "extract_intake", { customer_type: "existing" });
    expect(ctx.session.state).toBe("name");

    await engine.handleTranscript(ctx, client, "Daniel");
    expect(ctx.session.conversationContext.callerName).toBe("Daniel");
    expect(ctx.session.state).toBe("wrap_up_reason");
    expect(ctx.session.wrapUpReasonMode).toBe("existing");

    await engine.handleTranscript(ctx, client, "following up on my flooded basement");
    expect(ctx.session.conversationContext.reasonForCall).toBe("following up on my flooded basement");
    expect(ctx.session.state).toBe("confirmation");
  });

  it("existing customer whose opener already gave a reason skips the reason ask (gets the final-check beat)", async () => {
    engine.startCall(ctx, client);
    await engine.handleToolCall(ctx, client, "extract_intake", { customer_type: "existing", service_type: "water" });
    expect(ctx.session.state).toBe("name");
    await engine.handleTranscript(ctx, client, "Sam");
    // Reason already known → no open reason turn; a message gets the one "anything
    // I missed?" beat instead of confirming blind.
    expect(ctx.session.state).toBe("final_check");
    // Answering the beat → confirmation.
    await engine.handleTranscript(ctx, client, "no that's it");
    expect(ctx.session.state).toBe("confirmation");
  });

  it("captures enrichment fields (cause, rooms) from the opener but never asks them", async () => {
    engine.startCall(ctx, client);
    // The flagship demo line, extracted.
    await engine.handleToolCall(ctx, client, "extract_intake", {
      customer_type: "new",
      service_type: "water",
      urgency: "emergency",
      cause: "burst dishwasher line",
      rooms_affected: "two_three",
    });
    // cause + rooms are captured…
    expect(ctx.session.conversationContext.answers.cause).toBe("burst dishwasher line");
    expect(ctx.session.conversationContext.answers.rooms_affected).toBe("two_three");
    // …and the engine moves on to the next *askable* gap (ZIP), never asking them.
    expect(ctx.session.state).toBe("zip_code");

    for (const d of "07030") await engine.handleDtmf(ctx, client, noopWs, d);
    // Only the two remaining askable questions get asked — not cause/rooms.
    expect(ctx.session.currentQuestionKey).toBe("time_since_issue");
    await engine.handleTranscript(ctx, client, "today");
    expect(ctx.session.currentQuestionKey).toBe("has_coverage");
    await engine.handleDtmf(ctx, client, noopWs, "1");
    // Reaches name even though cause/rooms were never asked.
    expect(ctx.session.state).toBe("name");
  });

  it("'just take a message' takes a name then one open message turn", async () => {
    engine.startCall(ctx, client);
    await engine.handleTranscript(ctx, client, "just take a message");
    expect(ctx.session.state).toBe("name");
    expect(ctx.session.wrapUpReasonMode).toBe("message");

    await engine.handleTranscript(ctx, client, "Pat");
    expect(ctx.session.state).toBe("wrap_up_reason");

    await engine.handleTranscript(ctx, client, "tell them my invoice looks wrong");
    expect(ctx.session.conversationContext.reasonForCall).toBe("tell them my invoice looks wrong");
    expect(ctx.session.state).toBe("confirmation");
  });
});

describe("leadType: non-job calls become messages, junk gets screened", () => {
  let ctx: FlowContext;
  let client: ReturnType<typeof mockClient>;

  beforeEach(() => {
    ctx = ctxFor();
    client = mockClient();
    vi.mocked(createLead).mockReset();
  });

  it("an existing customer is tagged leadType 'message' (existing_customer)", async () => {
    engine.startCall(ctx, client);
    await engine.handleToolCall(ctx, client, "extract_intake", { customer_type: "existing" });
    expect(ctx.session.leadType).toBe("message");
    expect(ctx.session.messageKind).toBe("existing_customer");
  });

  it("'just take a message' is tagged leadType 'message' (general)", async () => {
    engine.startCall(ctx, client);
    await engine.handleTranscript(ctx, client, "just take a message");
    expect(ctx.session.leadType).toBe("message");
    expect(ctx.session.messageKind).toBe("general");
  });

  it("triage → billing becomes a billing message", async () => {
    engine.startCall(ctx, client);
    await engine.handleToolCall(ctx, client, "extract_intake", { contact_type: "message", message_kind: "billing" });
    expect(ctx.session.leadType).toBe("message");
    expect(ctx.session.messageKind).toBe("billing");
    expect(ctx.session.state).toBe("name");
  });

  it("triage → callback becomes a callback message", async () => {
    engine.startCall(ctx, client);
    await engine.handleToolCall(ctx, client, "extract_intake", { contact_type: "message", message_kind: "callback" });
    expect(ctx.session.leadType).toBe("message");
    expect(ctx.session.messageKind).toBe("callback");
  });

  it("triage → a serve-area / hours / pricing question becomes a question message", async () => {
    engine.startCall(ctx, client);
    await engine.handleToolCall(ctx, client, "extract_intake", { contact_type: "message", message_kind: "question" });
    expect(ctx.session.leadType).toBe("message");
    expect(ctx.session.messageKind).toBe("question");
  });

  it("triage → wrong_number is screened with NO lead + a screenedReason", async () => {
    engine.startCall(ctx, client);
    await engine.handleToolCall(ctx, client, "extract_intake", { contact_type: "wrong_number" });
    expect(ctx.session.screened).toBe(true);
    expect(ctx.session.screenedReason).toBe("wrong_number");
    expect(ctx.session.state).toBe("end");
    expect(ctx.session.leadType).toBeUndefined(); // never tagged a message either
    expect(createLead).not.toHaveBeenCalled();
  });

  it("triage → solicitation is screened with NO lead", async () => {
    engine.startCall(ctx, client);
    await engine.handleToolCall(ctx, client, "extract_intake", { contact_type: "solicitation" });
    expect(ctx.session.screened).toBe(true);
    expect(ctx.session.screenedReason).toBe("solicitation");
    expect(createLead).not.toHaveBeenCalled();
  });

  it("job signal wins: a captured service routes to the job flow even if contact_type says message", async () => {
    engine.startCall(ctx, client);
    await engine.handleToolCall(ctx, client, "extract_intake", { contact_type: "message", service_type: "water" });
    // A real service outranks the classifier → job flow (ZIP next), never a message.
    expect(ctx.session.leadType).toBeUndefined();
    expect(ctx.session.state).toBe("zip_code");
  });

  it("job signal wins: 'wrong number' AFTER a service was captured does NOT screen the call", async () => {
    engine.startCall(ctx, client);
    await engine.handleToolCall(ctx, client, "extract_intake", { service_type: "water" });
    expect(ctx.session.state).toBe("zip_code"); // job in progress
    await engine.handleTranscript(ctx, client, "sorry wrong number");
    // Contradictory with a real job → not screened; the intake continues.
    expect(ctx.session.screened).toBeFalsy();
    expect(ctx.session.state).not.toBe("end");
  });

  it("an ambiguous empty opener falls through to a general message (never screened, never dropped)", async () => {
    engine.startCall(ctx, client);
    await engine.handleToolCall(ctx, client, "extract_intake", {}); // nothing extracted → one retry
    expect(ctx.session.state).toBe("open_description");
    await engine.handleToolCall(ctx, client, "extract_intake", {}); // still nothing → take a message
    expect(ctx.session.leadType).toBe("message");
    expect(ctx.session.messageKind).toBe("general");
    expect(ctx.session.screened).toBeFalsy();
  });
});

// The revamped flow: the service question is asked open-ended (voiceOpenAsk), an
// off-list service is captured as free text instead of dead-ending, and only
// urgency is asked after it (timing/coverage are voiceExtractOnly).
const RESTORATION_V2: VerticalQuestion[] = [
  { key: "service_type", label: "What service do you need?", type: "single_select", options: [{ value: "water", label: "Water" }, { value: "fire", label: "Fire or Smoke" }, { value: "mold", label: "Mold" }], required: true, voiceOpenAsk: true },
  { key: "urgency", label: "How urgent is this?", type: "single_select", options: [{ value: "emergency", label: "Emergency" }, { value: "soon", label: "Soon" }, { value: "flexible", label: "Flexible" }], required: true },
  { key: "time_since_issue", label: "When did it start?", type: "single_select", options: [{ value: "today", label: "Today" }], required: true, voiceExtractOnly: true },
  { key: "has_coverage", label: "Insurance?", type: "single_select", options: [{ value: "yes", label: "Yes" }], required: true, voiceExtractOnly: true },
];

function ctxV2(): FlowContext {
  return makeFlowContext({ verticalConfig: makeVerticalConfig(RESTORATION_V2), session: makeSession() });
}

function lastSpoken(ctx: FlowContext): string {
  const t = [...ctx.session.conversationContext.transcript].reverse().find((e) => e.role === "assistant");
  return t?.message ?? "";
}

describe("open-ended service ask + off-list capture", () => {
  it("asks the service question open-ended, with no spoken menu", async () => {
    const ctx = ctxV2();
    const client = mockClient();
    engine.startCall(ctx, client);
    await engine.handleToolCall(ctx, client, "extract_intake", { customer_type: "new" });
    expect(ctx.session.state).toBe("qualification");
    expect(ctx.session.currentQuestionKey).toBe("service_type");
    const prompt = lastSpoken(ctx);
    expect(prompt).not.toMatch(/press \d/i);
    expect(prompt.toLowerCase()).toContain("just tell me");
  });

  it("captures a CLEAR off-list service immediately — no retry, no dead-end", async () => {
    const ctx = ctxV2();
    const client = mockClient();
    engine.startCall(ctx, client);
    await engine.handleToolCall(ctx, client, "extract_intake", { customer_type: "new" });
    expect(ctx.session.currentQuestionKey).toBe("service_type");

    await engine.handleTranscript(ctx, client, "I need drywall repair after a leak");
    await engine.handleToolCall(ctx, client, "classify_service", { status: "off_list" });

    expect(ctx.session.conversationContext.serviceRequested).toBeTruthy();
    expect(ctx.session.conversationContext.answers.service_type).toBeUndefined();
    expect(ctx.session.state).toBe("zip_code"); // captured + moved on, no re-ask
  });

  it("a VAGUE service answer is retried once, then captured", async () => {
    const ctx = ctxV2();
    const client = mockClient();
    engine.startCall(ctx, client);
    await engine.handleToolCall(ctx, client, "extract_intake", { customer_type: "new" });

    await engine.handleTranscript(ctx, client, "I just need someone to come out");
    await engine.handleToolCall(ctx, client, "classify_service", { status: "unclear" }); // 1st → retry
    expect(ctx.session.state).toBe("qualification");
    expect(ctx.session.currentQuestionKey).toBe("service_type");

    await engine.handleTranscript(ctx, client, "you know, just to look at things");
    await engine.handleToolCall(ctx, client, "classify_service", { status: "unclear" }); // 2nd → capture off-list
    expect(ctx.session.conversationContext.serviceRequested).toBeTruthy();
    expect(ctx.session.state).toBe("zip_code");
  });

  it("a matched service via the classifier is stored structurally", async () => {
    const ctx = ctxV2();
    const client = mockClient();
    engine.startCall(ctx, client);
    await engine.handleToolCall(ctx, client, "extract_intake", { customer_type: "new" });
    await engine.handleTranscript(ctx, client, "there's flooding all over my floor");
    await engine.handleToolCall(ctx, client, "classify_service", { status: "matched", matched_value: "water" });
    expect(ctx.session.conversationContext.answers.service_type).toBe("water");
    expect(ctx.session.state).toBe("zip_code");
  });

  it("a matched spoken service is stored structurally AND as serviceRequested", async () => {
    const ctx = ctxV2();
    const client = mockClient();
    engine.startCall(ctx, client);
    await engine.handleToolCall(ctx, client, "extract_intake", { customer_type: "new" });
    await engine.handleTranscript(ctx, client, "water");
    expect(ctx.session.conversationContext.answers.service_type).toBe("water");
    expect(ctx.session.conversationContext.serviceRequested).toBe("water");
    expect(ctx.session.state).toBe("zip_code");
  });

  it("after the service, only urgency is asked (timing/coverage are extract-only)", async () => {
    const ctx = ctxV2();
    const client = mockClient();
    engine.startCall(ctx, client);
    await engine.handleToolCall(ctx, client, "extract_intake", { customer_type: "new", service_type: "water" });
    expect(ctx.session.state).toBe("zip_code");
    for (const d of "07030") await engine.handleDtmf(ctx, client, noopWs, d);
    expect(ctx.session.state).toBe("qualification");
    expect(ctx.session.currentQuestionKey).toBe("urgency");
    await engine.handleTranscript(ctx, client, "emergency");
    expect(ctx.session.state).toBe("name");
  });
});

describe("graceful degradation — light retries, no voicemail dead-ends", () => {
  it("gives ZIP two retries, then skips it and continues", async () => {
    const ctx = ctxV2();
    const client = mockClient();
    engine.startCall(ctx, client);
    await engine.handleToolCall(ctx, client, "extract_intake", { customer_type: "new", service_type: "water", urgency: "emergency" });
    expect(ctx.session.state).toBe("zip_code");

    await engine.handleToolCall(ctx, client, "extract_zip", { zip: "" }); // retry 1
    expect(ctx.session.state).toBe("zip_code");
    await engine.handleToolCall(ctx, client, "extract_zip", { zip: "" }); // retry 2
    expect(ctx.session.state).toBe("zip_code");
    await engine.handleToolCall(ctx, client, "extract_zip", { zip: "" }); // exhausted → intent classifier
    await engine.handleToolCall(ctx, client, "detect_intent", { intent: "unknown" });

    expect(ctx.session.conversationContext.zipSkipped).toBe(true);
    expect(ctx.session.conversationContext.zipCode).toBeUndefined();
    expect(ctx.session.state).toBe("name"); // never voicemail
  });

  it("marks urgency unknown after one retry and moves on", async () => {
    const ctx = ctxV2();
    const client = mockClient();
    engine.startCall(ctx, client);
    await engine.handleToolCall(ctx, client, "extract_intake", { customer_type: "new", service_type: "water" });
    for (const d of "07030") await engine.handleDtmf(ctx, client, noopWs, d);
    expect(ctx.session.currentQuestionKey).toBe("urgency");

    await engine.handleToolCall(ctx, client, "classify_answer", { value: "unclear" }); // retry
    expect(ctx.session.state).toBe("qualification");
    await engine.handleToolCall(ctx, client, "classify_answer", { value: "unclear" }); // exhausted → intent classifier
    await engine.handleToolCall(ctx, client, "detect_intent", { intent: "unknown" });

    expect(ctx.session.conversationContext.answers.urgency).toBe("unknown");
    expect(ctx.session.state).toBe("name"); // never voicemail
  });
});

// The assistant side of the transcript must reflect the audio that actually went
// out, not the text we asked for — businesses rely on it as a record of the call.
describe("spoken transcript recording", () => {
  function ctxMidTurn(): FlowContext {
    const ctx = makeFlowContext({
      session: makeSession(),
      verticalConfig: makeVerticalConfig(RESTORATION),
    });
    const cc = ctx.session.conversationContext;
    cc.transcript.push({ role: "user", message: "my basement is flooding" });
    ctx.session.spokenTranscriptIndex = cc.transcript.length;
    cc.transcript.push({ role: "assistant", message: "the text we asked for" });
    return ctx;
  }

  it("replaces the intended text with what was actually said", () => {
    const ctx = ctxMidTurn();
    engine.recordSpokenTranscript(ctx, "  Sorry you're dealing with this. The team has your details.  ");
    expect(ctx.session.conversationContext.transcript[1].message).toBe(
      "Sorry you're dealing with this. The team has your details."
    );
    expect(ctx.session.spokenTranscriptIndex).toBeUndefined();
  });

  it("records a barge-in as the partial sentence the caller actually heard", () => {
    const ctx = ctxMidTurn();
    engine.recordSpokenTranscript(ctx, "Thanks, I have this noted as an");
    expect(ctx.session.conversationContext.transcript[1].message).toBe("Thanks, I have this noted as an");
  });

  it("keeps the intended text when the spoken transcript is empty", () => {
    const ctx = ctxMidTurn();
    engine.recordSpokenTranscript(ctx, "   ");
    expect(ctx.session.conversationContext.transcript[1].message).toBe("the text we asked for");
  });

  it("ignores a stray transcript event with no turn in flight", () => {
    const ctx = ctxMidTurn();
    engine.recordSpokenTranscript(ctx, "the real line");
    engine.recordSpokenTranscript(ctx, "a later event that must not overwrite it");
    expect(ctx.session.conversationContext.transcript[1].message).toBe("the real line");
  });

  it("keeps assistant turns in order with the caller's turns", () => {
    const ctx = ctxMidTurn();
    engine.recordSpokenTranscript(ctx, "What is the ZIP code?");
    ctx.session.conversationContext.transcript.push({ role: "user", message: "07030" });
    expect(ctx.session.conversationContext.transcript.map((t) => t.role)).toEqual([
      "user",
      "assistant",
      "user",
    ]);
  });
});
