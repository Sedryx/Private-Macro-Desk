import { describe, expect, it } from "vitest";

import { parseComparableValue } from "@/lib/calendarValue";

describe("parseComparableValue", () => {
  it("returns null for null or empty input", () => {
    expect(parseComparableValue(null)).toBeNull();
    expect(parseComparableValue("")).toBeNull();
  });

  it("parses plain numbers, including negatives and decimals", () => {
    expect(parseComparableValue("3.5%")).toBeCloseTo(3.5);
    expect(parseComparableValue("-0.4%")).toBeCloseTo(-0.4);
    expect(parseComparableValue("215")).toBe(215);
  });

  it("scales K/M/B/T suffixes", () => {
    expect(parseComparableValue("215K")).toBe(215_000);
    expect(parseComparableValue("1.2M")).toBeCloseTo(1_200_000);
    expect(parseComparableValue("2.5B")).toBeCloseTo(2_500_000_000);
    expect(parseComparableValue("1T")).toBe(1_000_000_000_000);
  });

  it("strips thousands separators before parsing", () => {
    expect(parseComparableValue("1,234K")).toBe(1_234_000);
  });

  it("returns null when no number can be found", () => {
    expect(parseComparableValue("N/A")).toBeNull();
    expect(parseComparableValue("—")).toBeNull();
  });
});
