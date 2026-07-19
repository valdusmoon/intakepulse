import { describe, it, expect } from "vitest";
import {
  escapeCsvCell,
  toCsv,
  toCsvSections,
  csvDateTime,
  centsToDollars,
  csvFilename,
  csvResponse,
} from "./csv";

describe("escapeCsvCell", () => {
  it("renders null and undefined as an empty cell", () => {
    expect(escapeCsvCell(null)).toBe("");
    expect(escapeCsvCell(undefined)).toBe("");
  });

  it("leaves plain text untouched", () => {
    expect(escapeCsvCell("Jane Doe")).toBe("Jane Doe");
  });

  it("quotes values containing a comma", () => {
    expect(escapeCsvCell("Doe, Jane")).toBe('"Doe, Jane"');
  });

  it("doubles embedded quotes and wraps the cell", () => {
    expect(escapeCsvCell('He said "urgent"')).toBe('"He said ""urgent"""');
  });

  it("quotes values containing newlines", () => {
    expect(escapeCsvCell("line one\nline two")).toBe('"line one\nline two"');
    expect(escapeCsvCell("line one\r\nline two")).toBe('"line one\r\nline two"');
  });

  it("neutralizes leading formula characters", () => {
    expect(escapeCsvCell("=1+1")).toBe("'=1+1");
    expect(escapeCsvCell("+1 555 0100")).toBe("'+1 555 0100");
    expect(escapeCsvCell("-5 star")).toBe("'-5 star");
    expect(escapeCsvCell("@SUM(A1)")).toBe("'@SUM(A1)");
  });

  it("neutralizes and quotes a formula that also needs quoting", () => {
    expect(escapeCsvCell('=HYPERLINK("http://evil","click")')).toBe(
      "\"'=HYPERLINK(\"\"http://evil\"\",\"\"click\"\")\""
    );
  });

  it("emits numbers bare so spreadsheets keep them numeric", () => {
    expect(escapeCsvCell(1500)).toBe("1500");
    expect(escapeCsvCell(12.5)).toBe("12.5");
    expect(escapeCsvCell(0)).toBe("0");
  });

  it("does not apply the formula guard to negative numbers", () => {
    expect(escapeCsvCell(-42)).toBe("-42");
  });

  it("blanks non-finite numbers rather than writing NaN/Infinity", () => {
    expect(escapeCsvCell(NaN)).toBe("");
    expect(escapeCsvCell(Infinity)).toBe("");
  });

  it("renders booleans as Yes/No", () => {
    expect(escapeCsvCell(true)).toBe("Yes");
    expect(escapeCsvCell(false)).toBe("No");
  });
});

describe("toCsv", () => {
  it("joins a header row and data rows with CRLF", () => {
    const csv = toCsv(["Name", "Value"], [["Jane", 100], ["Bob, Jr.", null]]);
    expect(csv).toBe("Name,Value\r\nJane,100\r\n\"Bob, Jr.\",");
  });

  it("emits just the header when there are no rows", () => {
    expect(toCsv(["A", "B"], [])).toBe("A,B");
  });
});

describe("toCsvSections", () => {
  it("stacks titled tables separated by a blank line", () => {
    const csv = toCsvSections([
      { title: "Summary", headers: ["Metric", "Value"], rows: [["Leads", 3]] },
      { title: "By channel", headers: ["Channel", "Leads"], rows: [["Manual entry", 1]] },
    ]);
    expect(csv).toBe("Summary\r\nMetric,Value\r\nLeads,3\r\n\r\nBy channel\r\nChannel,Leads\r\nManual entry,1");
  });
});

describe("csvDateTime", () => {
  it("renders a UTC instant in the business timezone", () => {
    // 18:05 UTC is 14:05 in New York (EDT) and 11:05 in Los Angeles (PDT).
    expect(csvDateTime("2026-07-19T18:05:00Z", "America/New_York")).toBe("2026-07-19 14:05");
    expect(csvDateTime("2026-07-19T18:05:00Z", "America/Los_Angeles")).toBe("2026-07-19 11:05");
  });

  it("rolls the calendar date back when the business zone is a day behind UTC", () => {
    expect(csvDateTime("2026-07-19T03:30:00Z", "America/Los_Angeles")).toBe("2026-07-18 20:30");
  });

  it("returns an empty cell for a missing timestamp", () => {
    expect(csvDateTime(null, "America/New_York")).toBe("");
    expect(csvDateTime(undefined, "America/New_York")).toBe("");
  });
});

describe("centsToDollars", () => {
  it("converts cents to a numeric dollar amount", () => {
    expect(centsToDollars(150000)).toBe(1500);
    expect(centsToDollars(1999)).toBe(19.99);
  });

  it("passes null through so the cell stays empty", () => {
    expect(centsToDollars(null)).toBeNull();
    expect(centsToDollars(undefined)).toBeNull();
  });
});

describe("csvFilename", () => {
  it("includes the page name and the business-local date", () => {
    expect(csvFilename("leads", "America/New_York")).toMatch(/^callverted-leads-\d{4}-\d{2}-\d{2}\.csv$/);
  });
});

describe("csvResponse", () => {
  it("sets download headers and prefixes a UTF-8 BOM", async () => {
    const res = csvResponse("A,B\r\n1,2", "callverted-leads-2026-07-19.csv");
    expect(res.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
    expect(res.headers.get("Content-Disposition")).toBe(
      'attachment; filename="callverted-leads-2026-07-19.csv"'
    );
    // Asserted on raw bytes: Response.text() runs a UTF-8 decode that swallows a
    // leading BOM, so it can't tell a BOM-prefixed body from one without.
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(new TextDecoder().decode(bytes.slice(3))).toBe("A,B\r\n1,2");
  });
});
