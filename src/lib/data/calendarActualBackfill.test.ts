import { describe, expect, it } from "vitest";

import { claimsK, indexValue, jobsK, percent1 } from "@/lib/data/calendarActualBackfill";

describe("calendar actual formatters", () => {
  it("percent1 formats to one decimal with a percent sign", () => {
    expect(percent1(3.456)).toBe("3.5%");
    expect(percent1(-0.4)).toBe("-0.4%");
  });

  it("percent1 normalizes negative-zero rounding instead of showing -0.0%", () => {
    expect(percent1(-0.04)).toBe("0.0%");
    expect(percent1(-0.001)).toBe("0.0%");
  });

  it("claimsK rounds to the nearest thousand with a K suffix", () => {
    expect(claimsK(215_400)).toBe("215K");
    expect(claimsK(999_600)).toBe("1000K");
  });

  it("jobsK signs positive changes and rounds to whole thousands", () => {
    expect(jobsK(180)).toBe("+180K");
    expect(jobsK(-25)).toBe("-25K");
    expect(jobsK(0)).toBe("+0K");
  });

  it("indexValue keeps one decimal with no suffix", () => {
    expect(indexValue(61.789)).toBe("61.8");
  });
});
