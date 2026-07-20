import { describe, it, expect } from "vitest";
import { matchDeterministicIntent, HARD_JUNK_INTENTS } from "./global-intent";

describe("matchDeterministicIntent — non-job (message) intents", () => {
  it("classifies existing-account money matters as billing", () => {
    expect(matchDeterministicIntent("I have a question about my bill")).toBe("billing");
    expect(matchDeterministicIntent("you charged me twice")).toBe("billing");
    expect(matchDeterministicIntent("I want a refund")).toBe("billing");
    expect(matchDeterministicIntent("I need to pay my invoice")).toBe("billing");
  });

  it("classifies explicit callback asks as callback_request", () => {
    expect(matchDeterministicIntent("can you have someone call me back")).toBe("callback_request");
    expect(matchDeterministicIntent("please call me back")).toBe("callback_request");
    expect(matchDeterministicIntent("have the owner call me")).toBe("callback_request");
  });
});

describe("matchDeterministicIntent — hard junk (screened)", () => {
  it("classifies wrong numbers", () => {
    expect(matchDeterministicIntent("sorry, wrong number")).toBe("wrong_number");
    expect(matchDeterministicIntent("I think I dialed the wrong number")).toBe("wrong_number");
    expect(matchDeterministicIntent("oh, wrong business")).toBe("wrong_number");
  });

  it("classifies clear B2B solicitation", () => {
    expect(matchDeterministicIntent("hi, I'm calling to offer you SEO services")).toBe("solicitation");
    expect(matchDeterministicIntent("we provide marketing services for small businesses")).toBe("solicitation");
    expect(matchDeterministicIntent("this is about a business loan")).toBe("solicitation");
  });

  it("wrong_number and solicitation are the hard-junk set", () => {
    expect(HARD_JUNK_INTENTS.has("wrong_number")).toBe(true);
    expect(HARD_JUNK_INTENTS.has("solicitation")).toBe(true);
    expect(HARD_JUNK_INTENTS.has("billing")).toBe(false);
    expect(HARD_JUNK_INTENTS.has("callback_request")).toBe(false);
  });
});

describe("matchDeterministicIntent — job signal must never be misread", () => {
  it("returns null for a real job even when it mentions price", () => {
    // These describe work someone wants done — never billing/junk. The engine
    // then runs extract_intake and captures them as jobs.
    expect(matchDeterministicIntent("my water heater is leaking, how much to fix it")).toBeNull();
    expect(matchDeterministicIntent("my basement is flooding")).toBeNull();
    expect(matchDeterministicIntent("I need my furnace repaired today")).toBeNull();
    expect(matchDeterministicIntent("there's water damage in my kitchen")).toBeNull();
  });
});
