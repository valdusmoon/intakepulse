import { describe, it, expect } from "vitest";
import {
  questionOptions,
  questionDtmfMap,
  greetingPrompt,
  qualificationPrompt,
  confirmationLine,
  zipPrompt,
  namePrompt,
  callbackPreferencePrompt,
  goodbyeLine,
} from "./call-flow";
import type { VerticalQuestion } from "@/lib/db/schema/verticalConfigs";
import { makeBusiness, makeSession, makeVerticalConfig, makeFlowContext } from "./mockFlowContext";

const RESTORATION_QUESTIONS: VerticalQuestion[] = [
  { key: "service_type", label: "What type of damage?", type: "single_select", options: [{ value: "water", label: "Water" }, { value: "fire", label: "Fire or Smoke" }, { value: "mold", label: "Mold" }], required: true },
  { key: "urgency", label: "How urgent is this?", type: "single_select", options: [{ value: "emergency", label: "Emergency" }, { value: "soon", label: "Soon" }, { value: "flexible", label: "Flexible" }], required: true },
];

describe("questionOptions / questionDtmfMap", () => {
  it("maps question options to label/value pairs", () => {
    expect(questionOptions(RESTORATION_QUESTIONS[0])).toEqual([
      { label: "Water", value: "water" },
      { label: "Fire or Smoke", value: "fire" },
      { label: "Mold", value: "mold" },
    ]);
  });

  it("builds a 1-indexed DTMF map for a 2-3 option question", () => {
    expect(questionDtmfMap(RESTORATION_QUESTIONS[0])).toEqual({ "1": "water", "2": "fire", "3": "mold" });
  });

  it("returns undefined DTMF for a question with more than 3 options (speech-only)", () => {
    const q: VerticalQuestion = { key: "x", label: "X", type: "single_select", options: [1, 2, 3, 4].map((n) => ({ value: `v${n}`, label: `L${n}` })), required: true };
    expect(questionDtmfMap(q)).toBeUndefined();
  });

  it("returns undefined DTMF for a question with zero options (free-text)", () => {
    const q: VerticalQuestion = { key: "x", label: "X", type: "text", options: [], required: true };
    expect(questionDtmfMap(q)).toBeUndefined();
  });
});

describe("greetingPrompt", () => {
  it("falls back to a generic greeting when no custom greetingMessage is set", () => {
    const ctx = makeFlowContext();
    expect(greetingPrompt(ctx)).toContain("Thanks for calling Blue Star Restoration");
    expect(greetingPrompt(ctx)).toContain("automated assistant");
    expect(greetingPrompt(ctx)).toContain("get this to the team");
  });

  it("uses the business's custom greetingMessage when set", () => {
    const ctx = makeFlowContext({ business: makeBusiness({ greetingMessage: "Welcome to Acme!" }) });
    expect(greetingPrompt(ctx)).toContain("Welcome to Acme!");
  });

  it("speaks the recording disclosure when recording is enabled with a disclosure set", () => {
    const withBoth = makeFlowContext({ business: makeBusiness({ recordingEnabled: true, recordingDisclosure: "This call may be recorded." }) });
    expect(greetingPrompt(withBoth)).toContain("This call may be recorded.");
  });

  it("never speaks a disclosure when recording is disabled or the disclosure is unset", () => {
    const off = makeFlowContext({ business: makeBusiness({ recordingEnabled: false, recordingDisclosure: "This call may be recorded." }) });
    expect(greetingPrompt(off)).not.toContain("This call may be recorded.");

    // Enabled but no disclosure text: must never leak an empty/null value into speech.
    const enabledButUnset = makeFlowContext({ business: makeBusiness({ recordingEnabled: true, recordingDisclosure: null }) });
    expect(greetingPrompt(enabledButUnset)).not.toContain("null");
    expect(greetingPrompt(enabledButUnset)).toContain("Briefly, what's going on?");
  });

  it("always identifies itself as an automated assistant, regardless of recording settings", () => {
    const ctx = makeFlowContext({ business: makeBusiness({ recordingEnabled: false, recordingDisclosure: null }) });
    expect(greetingPrompt(ctx)).toContain("automated assistant");
  });
});

describe("qualificationPrompt", () => {
  it("includes DTMF digit options when the question has 2-3 options", () => {
    const prompt = qualificationPrompt(RESTORATION_QUESTIONS[0]);
    expect(prompt).toContain("press 1 for water");
    expect(prompt).toContain("press 2 for fire or smoke");
  });

  it("falls back to a speech-only prompt for a free-text question", () => {
    const q: VerticalQuestion = { key: "x", label: "Tell me more.", type: "text", options: [], required: true };
    expect(qualificationPrompt(q)).toBe("Tell me more. You can just tell me.");
  });
});

describe("confirmationLine", () => {
  it("references the vertical's primary question generically (restoration example)", () => {
    const ctx = makeFlowContext({
      session: makeSession({ conversationContext: { transcript: [], actionsTaken: [], answers: { service_type: "water" }, callerName: "Pat", zipCode: "10001" } }),
    });
    const line = confirmationLine(ctx);
    expect(line).toContain("Thanks, Pat.");
    expect(line).toContain("I have this noted as a water issue in ZIP code 10001.");
    expect(line).toContain("Blue Star Restoration has received the request");
  });

  it("works identically for a non-restoration vertical with a totally different primary key/options (HVAC example)", () => {
    const hvacQuestions: VerticalQuestion[] = [
      { key: "service_type", label: "What do you need help with?", type: "single_select", options: [{ value: "ac_repair", label: "AC not cooling / repair" }], required: true },
    ];
    const ctx = makeFlowContext({
      verticalConfig: makeVerticalConfig(hvacQuestions),
      session: makeSession({ conversationContext: { transcript: [], actionsTaken: [], answers: { service_type: "ac_repair" } } }),
    });
    // This is the exact bug that was fixed: confirmationLine used to hardcode
    // `answers.damage_type` and say "damage issue" — neither of which applies to HVAC.
    expect(confirmationLine(ctx)).toContain("I have this noted as an ac not cooling / repair issue");
    expect(confirmationLine(ctx)).not.toContain("damage");
  });

  it("omits the category line entirely when the primary question was never answered", () => {
    const ctx = makeFlowContext({ session: makeSession({ conversationContext: { transcript: [], actionsTaken: [], answers: {} } }) });
    expect(confirmationLine(ctx)).not.toContain("I have this noted as");
  });

  it("opens with a plain 'Thanks.' when no name was captured — a job call never asks for one", () => {
    const ctx = makeFlowContext({ session: makeSession({ conversationContext: { transcript: [], actionsTaken: [], answers: {}, callerName: undefined } }) });
    const line = confirmationLine(ctx);
    expect(line).toContain("Thanks.");
    expect(line).not.toContain("Thanks, ");
  });

  it("greets by name when the caller volunteered one", () => {
    const ctx = makeFlowContext({ session: makeSession({ conversationContext: { transcript: [], actionsTaken: [], answers: {}, callerName: "Sarah" } }) });
    expect(confirmationLine(ctx)).toContain("Thanks, Sarah.");
  });

  it("defaults the callback timing to 'as soon as possible' when no preference was captured", () => {
    const ctx = makeFlowContext({ session: makeSession({ conversationContext: { transcript: [], actionsTaken: [], answers: {} } }) });
    expect(confirmationLine(ctx)).toContain("will call you back as soon as possible.");
  });

  it("uses the captured callback preference when present", () => {
    const ctx = makeFlowContext({ session: makeSession({ conversationContext: { transcript: [], actionsTaken: [], answers: {}, callbackPreference: "today" } }) });
    expect(confirmationLine(ctx)).toContain("will call you back today.");
  });
});

describe("static prompt lines", () => {
  it("zipPrompt/namePrompt/callbackPreferencePrompt/goodbyeLine are non-empty and stable", () => {
    expect(zipPrompt().length).toBeGreaterThan(0);
    expect(namePrompt().length).toBeGreaterThan(0);
    expect(callbackPreferencePrompt().length).toBeGreaterThan(0);
    expect(goodbyeLine().length).toBeGreaterThan(0);
  });

  it("namePrompt prepends an optional prefix line", () => {
    expect(namePrompt("Got it.")).toBe("Got it. Can I get your name?");
    expect(namePrompt()).toBe("Can I get your name?");
  });
});
