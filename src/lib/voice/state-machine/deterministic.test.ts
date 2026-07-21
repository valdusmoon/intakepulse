import { describe, it, expect } from "vitest";
import { tryMatchOptionLabel, tryMatchOrdinal, tryExtractZipDeterministic, cleanSpokenName, looksLikeName, isNameRefusal, trustDeterministicName, mentionsServiceNeed, isNegatedOptionMatch, type OptionLike } from "./deterministic";

const DAMAGE: OptionLike[] = [
  { label: "Water", value: "water" },
  { label: "Fire or Smoke", value: "fire" },
  { label: "Mold", value: "mold" },
];

const CALLBACK: OptionLike[] = [
  { label: "as soon as possible", value: "asap" },
  { label: "today", value: "today" },
  { label: "tomorrow", value: "tomorrow" },
];

describe("tryMatchOptionLabel", () => {
  it("matches the full label", () => {
    expect(tryMatchOptionLabel("it was water", DAMAGE)).toBe("water");
  });

  it("matches on the value keyword even when the label is longer", () => {
    // "fire" is the value; the label is "Fire or Smoke" — a caller says "fire".
    expect(tryMatchOptionLabel("there was a fire", DAMAGE)).toBe("fire");
  });

  it("matches a multi-word label phrase", () => {
    expect(tryMatchOptionLabel("as soon as possible please", CALLBACK)).toBe("asap");
    expect(tryMatchOptionLabel("asap", CALLBACK)).toBe("asap");
  });

  it("returns null when nothing matches", () => {
    expect(tryMatchOptionLabel("I'm not sure honestly", DAMAGE)).toBeNull();
  });

  it("returns null when two options match ambiguously", () => {
    expect(tryMatchOptionLabel("water and fire both", DAMAGE)).toBeNull();
  });
});

describe("tryMatchOrdinal", () => {
  it("resolves a bare cardinal word to its position", () => {
    expect(tryMatchOrdinal("two", DAMAGE)).toBe("fire");
    expect(tryMatchOrdinal("one", DAMAGE)).toBe("water");
    expect(tryMatchOrdinal("three", DAMAGE)).toBe("mold");
  });

  it("resolves a bare digit", () => {
    expect(tryMatchOrdinal("2", DAMAGE)).toBe("fire");
  });

  it("strips menu filler", () => {
    expect(tryMatchOrdinal("number two", DAMAGE)).toBe("fire");
    expect(tryMatchOrdinal("press 3", DAMAGE)).toBe("mold");
    expect(tryMatchOrdinal("option one", DAMAGE)).toBe("water");
  });

  it("resolves ordinal words", () => {
    expect(tryMatchOrdinal("first", DAMAGE)).toBe("water");
    expect(tryMatchOrdinal("the second one", DAMAGE)).toBe("fire");
    expect(tryMatchOrdinal("the third one", DAMAGE)).toBe("mold");
  });

  it("does NOT treat a number inside a real sentence as a menu position", () => {
    expect(tryMatchOrdinal("I have one flooded room", DAMAGE)).toBeNull();
    expect(tryMatchOrdinal("about two feet of water", DAMAGE)).toBeNull();
  });

  it("returns null for an out-of-range position", () => {
    expect(tryMatchOrdinal("five", DAMAGE)).toBeNull();
    expect(tryMatchOrdinal("0", DAMAGE)).toBeNull();
  });
});

describe("tryExtractZipDeterministic", () => {
  it("pulls a 5-digit run", () => {
    expect(tryExtractZipDeterministic("it's 07030")).toBe("07030");
  });
  it("returns null when there's no 5-digit run", () => {
    expect(tryExtractZipDeterministic("somewhere downtown")).toBeNull();
  });
});

describe("cleanSpokenName", () => {
  it("strips lead-ins", () => {
    expect(cleanSpokenName("my name is Daniel")).toBe("Daniel");
    expect(cleanSpokenName("it's Sarah.")).toBe("Sarah");
  });
});

describe("name resolution — real spoken input", () => {
  it("pulls the name out of a rambling answer", () => {
    expect(cleanSpokenName("Yeah, it's Dolores Rivera. I have State Farm insurance too")).toBe("Dolores Rivera");
    expect(cleanSpokenName("Sure, it's Hank Ford")).toBe("Hank Ford");
    expect(cleanSpokenName("um, Marcus Bell")).toBe("Marcus Bell");
    expect(cleanSpokenName("Yeah, of course, it's Ed Nakamura")).toBe("Ed Nakamura");
    expect(cleanSpokenName("Marcus Webb")).toBe("Marcus Webb");
    expect(looksLikeName(cleanSpokenName("Yeah, it's Dolores Rivera. I have State Farm insurance too"))).toBe(true);
  });
  it("trustDeterministicName: trusts short/introduced clean names, hands ambiguous ones to the model", () => {
    expect(trustDeterministicName("Marcus Webb")).toBe("Marcus Webb");
    expect(trustDeterministicName("it's Sarah")).toBe("Sarah");
    expect(trustDeterministicName("my name is Daniel")).toBe("Daniel");
    expect(trustDeterministicName("this is Cora Diaz")).toBe("Cora Diaz");
    // Rambly / phrase-like / declined → null (→ LLM fallback), never a garbage name.
    expect(trustDeterministicName("Yeah, of course, it's Ed Nakamura")).toBeNull(); // long → LLM
    expect(trustDeterministicName("How does this work")).toBeNull();
    expect(trustDeterministicName("I already told you three times, it's really urgent")).toBeNull();
    expect(trustDeterministicName("No, all good, thanks, bye")).toBeNull();
    expect(trustDeterministicName("I'd rather not say")).toBeNull();
  });
  it("rejects one-word filler answers as names ('No', 'bye', 'okay thanks')", () => {
    expect(looksLikeName(cleanSpokenName("No, all good. Thanks, bye."))).toBe(false);
    expect(looksLikeName("No")).toBe(false);
    expect(looksLikeName("okay thanks")).toBe(false);
  });
  it("detects a name refusal", () => {
    expect(isNameRefusal("I'd rather not give my name over the phone")).toBe(true);
    expect(isNameRefusal("why do you need my name")).toBe(true);
    expect(isNameRefusal("Marcus Bell")).toBe(false);
  });
});

describe("screen-guard: mentionsServiceNeed", () => {
  it("catches real restoration problems", () => {
    expect(mentionsServiceNeed("my basement is flooding")).toBe(true);
    expect(mentionsServiceNeed("there's mold behind my shower")).toBe(true);
    expect(mentionsServiceNeed("smoke damage from a fire")).toBe(true);
  });
  it("does not fire on a plain sales pitch", () => {
    expect(mentionsServiceNeed("I can improve your Google ranking")).toBe(false);
    expect(mentionsServiceNeed("sorry, wrong number")).toBe(false);
  });
});

describe("urgency negation guard", () => {
  const URGENCY: OptionLike[] = [
    { label: "Emergency", value: "emergency" },
    { label: "Soon", value: "soon" },
    { label: "Flexible", value: "flexible" },
  ];
  it("flags a negated emergency match so it doesn't route as emergency", () => {
    expect(isNegatedOptionMatch("it doesn't seem like an emergency", "emergency", URGENCY)).toBe(true);
    expect(isNegatedOptionMatch("it's not an emergency", "emergency", URGENCY)).toBe(true);
  });
  it("leaves a genuine emergency match alone", () => {
    expect(isNegatedOptionMatch("yes it's an emergency, water everywhere", "emergency", URGENCY)).toBe(false);
  });
});
