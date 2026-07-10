import { describe, it, expect } from "vitest";
import { tryMatchOptionLabel, tryMatchOrdinal, tryExtractZipDeterministic, cleanSpokenName, type OptionLike } from "./deterministic";

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
