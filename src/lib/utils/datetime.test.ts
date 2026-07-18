import { describe, it, expect } from "vitest";
import {
  formatInTimezone,
  dateKeyInTimezone,
  zonedMonthStartUtc,
  lastNDateKeysInTimezone,
  SUPPORTED_TIMEZONES,
} from "./datetime";

describe("formatInTimezone", () => {
  it("renders the same UTC instant differently per zone", () => {
    // 01:30 UTC is the previous evening across the US.
    const t = "2026-07-18T01:30:00Z";
    expect(formatInTimezone(t, "America/New_York", { hour: "numeric", minute: "2-digit" })).toBe("9:30 PM");
    expect(formatInTimezone(t, "America/Chicago", { hour: "numeric", minute: "2-digit" })).toBe("8:30 PM");
    expect(formatInTimezone(t, "America/Los_Angeles", { hour: "numeric", minute: "2-digit" })).toBe("6:30 PM");
    expect(formatInTimezone(t, "Pacific/Honolulu", { hour: "numeric", minute: "2-digit" })).toBe("3:30 PM");
  });
});

describe("dateKeyInTimezone", () => {
  it("returns the local calendar day, which can differ from the UTC day", () => {
    const t = "2026-07-18T01:30:00Z"; // still Jul 17 in the US
    expect(dateKeyInTimezone(t, "America/New_York")).toBe("2026-07-17");
    expect(dateKeyInTimezone(t, "UTC")).toBe("2026-07-18");
  });
});

describe("zonedMonthStartUtc", () => {
  it("returns the UTC instant of business-local midnight on the 1st (summer / DST)", () => {
    const base = new Date("2026-08-15T12:00:00Z");
    // Start of August, local midnight, expressed as a UTC instant.
    expect(zonedMonthStartUtc("America/New_York", 0, base).toISOString()).toBe("2026-08-01T04:00:00.000Z");
    expect(zonedMonthStartUtc("America/Chicago", 0, base).toISOString()).toBe("2026-08-01T05:00:00.000Z");
    expect(zonedMonthStartUtc("America/Los_Angeles", 0, base).toISOString()).toBe("2026-08-01T07:00:00.000Z");
  });

  it("returns the UTC instant of a winter (standard time) month start", () => {
    const base = new Date("2026-01-15T12:00:00Z");
    // EST is UTC-5 in January.
    expect(zonedMonthStartUtc("America/New_York", 0, base).toISOString()).toBe("2026-01-01T05:00:00.000Z");
  });

  it("handles negative month offset across a year boundary", () => {
    const base = new Date("2026-01-15T12:00:00Z");
    // Previous month = December 2025; EST UTC-5.
    expect(zonedMonthStartUtc("America/New_York", -1, base).toISOString()).toBe("2025-12-01T05:00:00.000Z");
  });

  it("puts a boundary lead in the business-local month, not the UTC month", () => {
    // Recap fires Aug 1; a lead created 03:00 UTC is late Jul 31 in every US zone.
    const now = new Date("2026-08-01T15:00:00Z");
    const lead = new Date("2026-08-01T03:00:00Z");
    for (const tz of ["America/New_York", "America/Chicago", "America/Los_Angeles"]) {
      const prev = zonedMonthStartUtc(tz, -1, now);
      const cur = zonedMonthStartUtc(tz, 0, now);
      expect(lead >= prev && lead < cur).toBe(true); // in July's window
    }
    // Under UTC it would be August (excluded from July).
    const prevUtc = zonedMonthStartUtc("UTC", -1, now);
    const curUtc = zonedMonthStartUtc("UTC", 0, now);
    expect(lead >= prevUtc && lead < curUtc).toBe(false);
  });
});

describe("lastNDateKeysInTimezone", () => {
  it("returns N sequential local day keys, oldest first, ending today", () => {
    const base = new Date("2026-08-15T04:00:00Z"); // Aug 14 21:00 PT
    const keys = lastNDateKeysInTimezone(4, "America/Los_Angeles", base);
    expect(keys).toEqual(["2026-08-11", "2026-08-12", "2026-08-13", "2026-08-14"]);
  });

  it("has no gaps or duplicates", () => {
    const keys = lastNDateKeysInTimezone(30, "America/New_York", new Date("2026-03-20T12:00:00Z"));
    expect(new Set(keys).size).toBe(30); // no dupes (incl. across the Mar DST change)
    expect(keys.length).toBe(30);
  });
});

describe("SUPPORTED_TIMEZONES", () => {
  it("are all valid IANA zones Intl accepts", () => {
    for (const tz of SUPPORTED_TIMEZONES) {
      expect(() => formatInTimezone("2026-07-18T00:00:00Z", tz.value, { hour: "numeric" })).not.toThrow();
    }
  });
});
