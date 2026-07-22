import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Call } from "@/lib/db/schema/calls";
import type { VerticalQuestion, ScoringRule } from "@/lib/db/schema/verticalConfigs";
import type { TranscriptIntake } from "./extract-from-transcript";
import type { ScoringResult } from "./scoring";

// Same stubbing rationale as actions.test.ts: these imports resolve DB/env-backed
// modules at load time; none of their real behavior is under test here.
vi.mock("@/lib/db/queries/leads", () => ({ createLead: vi.fn() }));
vi.mock("@/lib/db/queries/calls", () => ({ updateCall: vi.fn() }));
vi.mock("@/lib/leads/assess", () => ({ assessLead: vi.fn() }));
import { createLead } from "@/lib/db/queries/leads";
import { updateCall } from "@/lib/db/queries/calls";
import { assessLead } from "@/lib/leads/assess";
import { captureHumanCallLead } from "./capture-human-call";

const QUESTIONS: VerticalQuestion[] = [
  { key: "service_type", label: "Service", type: "single_select", options: [{ value: "water", label: "Water" }], required: true },
  { key: "urgency", label: "Urgency", type: "single_select", options: [{ value: "emergency", label: "Emergency" }], required: true },
];
const RULES: ScoringRule[] = [{ answerKey: "urgency", answerValue: "emergency", urgencyBonus: 10 }];
const VERTICAL_CONFIG = { questions: QUESTIONS, scoringRules: RULES, baseValueLow: 50000, aiPromptTemplate: "template" };

const CALL = { id: "call-1", businessId: "biz-1", leadId: null, callerPhone: "+15551234567" } as unknown as Call;

function makeIntake(overrides: Partial<TranscriptIntake> = {}): TranscriptIntake {
  return {
    extraction: { answers: {} },
    signal: { jobIntent: false, urgency: false, callbackRequested: false, quoteRequested: false, contactCaptured: false },
    contactKind: "none",
    messageKind: null,
    messageForTeam: null,
    serviceRequested: null,
    summary: "Team-answered call.",
    callerName: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.mocked(createLead).mockReset().mockResolvedValue({ id: "lead-1" } as never);
  vi.mocked(updateCall).mockReset().mockResolvedValue(undefined as never);
  vi.mocked(assessLead).mockReset().mockResolvedValue({ urgencyReasoning: "u", qualityReasoning: "q", recommendedActions: [] } as never);
});

describe("captureHumanCallLead — three-outcome contract", () => {
  it("job signal always wins: structured answers beat a 'message' classification", async () => {
    const intake = makeIntake({
      extraction: { answers: { service_type: "water", urgency: "emergency" } },
      contactKind: "message",
      messageKind: "general",
    });
    const result = await captureHumanCallLead({ call: CALL, verticalConfig: VERTICAL_CONFIG, intake, transcriptText: "t" });
    expect(result.leadId).toBe("lead-1");
    expect(createLead).toHaveBeenCalledWith(expect.objectContaining({ leadType: "job", source: "voice_human" }));
    expect(assessLead).toHaveBeenCalled();
  });

  it("folds an extracted ZIP into intakeAnswers.zip_code, same key as voice and web", async () => {
    const intake = makeIntake({
      extraction: { answers: { service_type: "water" }, zipCode: "33618" },
      contactKind: "job",
    });
    await captureHumanCallLead({ call: CALL, verticalConfig: VERTICAL_CONFIG, intake, transcriptText: "t" });
    expect(createLead).toHaveBeenCalledWith(
      expect.objectContaining({ intakeAnswers: { service_type: "water", zip_code: "33618" } })
    );
  });

  it("scores jobs with the transcript as signalText so the critical-signal floor fires on team calls", async () => {
    const intake = makeIntake({ contactKind: "job", serviceRequested: "gas line inspection" });
    await captureHumanCallLead({
      call: CALL,
      verticalConfig: VERTICAL_CONFIG,
      intake,
      transcriptText: "Caller: I think there's a gas leak in my basement.",
    });
    const scores = vi.mocked(assessLead).mock.calls[0][2] as ScoringResult;
    expect(scores.trace.floorsApplied).toContain("critical_signal_floor");
    expect(scores.priorityScore).toBeGreaterThanOrEqual(80);
  });

  it("a message call is stored unscored with kind + the caller's own words as notes", async () => {
    const intake = makeIntake({
      contactKind: "message",
      messageKind: "billing",
      messageForTeam: "Question about my invoice from last week — call Dana back at 555-0142.",
      callerName: "Dana",
    });
    const result = await captureHumanCallLead({ call: CALL, verticalConfig: VERTICAL_CONFIG, intake, transcriptText: "t" });
    expect(result.leadId).toBe("lead-1");
    expect(createLead).toHaveBeenCalledWith(
      expect.objectContaining({
        leadType: "message",
        messageKind: "billing",
        notes: "Question about my invoice from last week — call Dana back at 555-0142.",
        intakeStatus: "not_started",
      })
    );
    expect(assessLead).not.toHaveBeenCalled();
    expect(updateCall).toHaveBeenCalledWith("call-1", { leadId: "lead-1" });
  });

  it("a message with no message_for_team falls back to the summary for notes", async () => {
    const intake = makeIntake({ contactKind: "message", messageKind: "callback", summary: "Caller asked to be called back." });
    await captureHumanCallLead({ call: CALL, verticalConfig: VERTICAL_CONFIG, intake, transcriptText: "t" });
    expect(createLead).toHaveBeenCalledWith(expect.objectContaining({ notes: "Caller asked to be called back." }));
  });

  it("junk creates no lead row", async () => {
    const intake = makeIntake({ contactKind: "junk" });
    const result = await captureHumanCallLead({ call: CALL, verticalConfig: VERTICAL_CONFIG, intake, transcriptText: "t" });
    expect(result.leadId).toBeNull();
    expect(createLead).not.toHaveBeenCalled();
  });

  it("'none' with no legacy signals creates no lead row", async () => {
    const intake = makeIntake({ contactKind: "none" });
    const result = await captureHumanCallLead({ call: CALL, verticalConfig: VERTICAL_CONFIG, intake, transcriptText: "t" });
    expect(result.leadId).toBeNull();
    expect(createLead).not.toHaveBeenCalled();
  });

  it("fails OPEN to a job when classification is unusable but a legacy signal fired", async () => {
    const intake = makeIntake({
      contactKind: "none",
      signal: { jobIntent: false, urgency: false, callbackRequested: true, quoteRequested: false, contactCaptured: false },
    });
    const result = await captureHumanCallLead({ call: CALL, verticalConfig: VERTICAL_CONFIG, intake, transcriptText: "t" });
    expect(result.leadId).toBe("lead-1");
    expect(createLead).toHaveBeenCalledWith(expect.objectContaining({ leadType: "job" }));
  });

  it("is idempotent: a call that already has a lead is a no-op", async () => {
    const call = { ...CALL, leadId: "existing-lead" } as unknown as Call;
    const result = await captureHumanCallLead({ call, verticalConfig: VERTICAL_CONFIG, intake: makeIntake({ contactKind: "job" }), transcriptText: "t" });
    expect(result.leadId).toBe("existing-lead");
    expect(createLead).not.toHaveBeenCalled();
    expect(assessLead).not.toHaveBeenCalled();
  });

  it("honest intakeStatus: partial extraction is 'started', full extraction is 'completed'", async () => {
    await captureHumanCallLead({
      call: CALL,
      verticalConfig: VERTICAL_CONFIG,
      intake: makeIntake({ extraction: { answers: { service_type: "water" } }, contactKind: "job" }),
      transcriptText: "t",
    });
    expect(createLead).toHaveBeenLastCalledWith(expect.objectContaining({ intakeStatus: "started" }));

    await captureHumanCallLead({
      call: CALL,
      verticalConfig: VERTICAL_CONFIG,
      intake: makeIntake({ extraction: { answers: { service_type: "water", urgency: "emergency" } }, contactKind: "job" }),
      transcriptText: "t",
    });
    expect(createLead).toHaveBeenLastCalledWith(expect.objectContaining({ intakeStatus: "completed" }));
  });
});
