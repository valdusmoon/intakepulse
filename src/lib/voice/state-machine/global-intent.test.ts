import { describe, it, expect } from "vitest";
import { matchDeterministicIntent } from "./global-intent";

describe("matchDeterministicIntent — the cheap deterministic escapes", () => {
  it("matches the six unambiguous escape phrases", () => {
    expect(matchDeterministicIntent("can I speak to a person")).toBe("wants_human");
    expect(matchDeterministicIntent("I'm already a customer")).toBe("existing_customer");
    expect(matchDeterministicIntent("just take a message")).toBe("leave_message");
    expect(matchDeterministicIntent("can we start over")).toBe("start_over");
    expect(matchDeterministicIntent("can you repeat that again")).toBe("repeat");
    expect(matchDeterministicIntent("this is ridiculous")).toBe("frustrated");
    expect(matchDeterministicIntent("oh, sorry, wrong number")).toBe("wrong_number");
    expect(matchDeterministicIntent("I think I dialed the wrong number")).toBe("wrong_number");
  });

  it("returns null for a job description — job vs message vs junk is the model's triage, not here", () => {
    // These must fall through to extract_intake (which classifies contact_type),
    // never be diverted by a phrase pattern.
    expect(matchDeterministicIntent("my water heater is leaking, how much to fix it")).toBeNull();
    expect(matchDeterministicIntent("my basement is flooding")).toBeNull();
    expect(matchDeterministicIntent("I have a question about my bill")).toBeNull();
    expect(matchDeterministicIntent("I'm calling to offer you SEO services")).toBeNull();
  });
});
