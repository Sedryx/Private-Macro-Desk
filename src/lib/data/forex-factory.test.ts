import { describe, expect, it } from "vitest";

import { parseForexFactoryEvent } from "@/lib/data/forex-factory";

describe("parseForexFactoryEvent", () => {
  it("parses a well-formed event", () => {
    const event = parseForexFactoryEvent({
      title: "CPI y/y",
      country: "usd",
      date: "2026-07-14T12:30:00Z",
      impact: "High",
      forecast: "3.8%",
      previous: "4.2%",
      actual: null,
    });

    expect(event).not.toBeNull();
    expect(event?.title).toBe("CPI y/y");
    expect(event?.currency).toBe("USD");
    expect(event?.importance).toBe("HIGH");
    expect(event?.forecastValue).toBe("3.8%");
    expect(event?.previousValue).toBe("4.2%");
    expect(event?.actualValue).toBeNull();
  });

  it("maps unrecognized impact to LOW", () => {
    const event = parseForexFactoryEvent({
      title: "Bank Holiday",
      country: "gbp",
      date: "2026-07-14T00:00:00Z",
      impact: "Holiday",
    });
    expect(event?.importance).toBe("LOW");
  });

  it("rejects events missing a title", () => {
    expect(parseForexFactoryEvent({ country: "usd", date: "2026-07-14T12:30:00Z" })).toBeNull();
  });

  it("rejects events with an invalid currency code", () => {
    expect(parseForexFactoryEvent({ title: "Test", country: "usdollar", date: "2026-07-14T12:30:00Z" })).toBeNull();
  });

  it("rejects events with an unparseable date", () => {
    expect(parseForexFactoryEvent({ title: "Test", country: "usd", date: "not-a-date" })).toBeNull();
  });

  it("rejects non-object input", () => {
    expect(parseForexFactoryEvent(null)).toBeNull();
    expect(parseForexFactoryEvent("string")).toBeNull();
  });

  it("produces a stable externalId hash for the same title/currency/time", () => {
    const raw = { title: "GDP q/q", country: "eur", date: "2026-07-14T09:00:00Z" };
    const first = parseForexFactoryEvent(raw);
    const second = parseForexFactoryEvent({ ...raw });
    expect(first?.externalId).toBe(second?.externalId);
  });
});
