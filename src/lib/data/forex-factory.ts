import { createHash } from "node:crypto";

import { EventImportance } from "@prisma/client";

export const FOREX_FACTORY_PROVIDER = "Forex Factory";
export const DEFAULT_FOREX_FACTORY_URL =
  "https://nfs.faireconomy.media/ff_calendar_thisweek.json";

type ForexFactoryRawEvent = {
  title?: unknown;
  country?: unknown;
  date?: unknown;
  impact?: unknown;
  forecast?: unknown;
  previous?: unknown;
  actual?: unknown;
};

export type ForexFactoryEvent = {
  externalId: string;
  provider: typeof FOREX_FACTORY_PROVIDER;
  title: string;
  country: string;
  currency: string;
  eventTime: Date;
  importance: EventImportance;
  previousValue: string | null;
  forecastValue: string | null;
  actualValue: string | null;
  source: typeof FOREX_FACTORY_PROVIDER;
};

export async function fetchForexFactoryCalendar(
  url = process.env.FOREX_FACTORY_CALENDAR_URL || DEFAULT_FOREX_FACTORY_URL,
): Promise<{ events: ForexFactoryEvent[]; ignored: number }> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    throw new Error(`Forex Factory calendar request failed: HTTP ${response.status}`);
  }

  const payload: unknown = await response.json();
  if (!Array.isArray(payload)) {
    throw new Error("Forex Factory calendar response is not an array.");
  }

  const events = payload.flatMap((item) => {
    const event = parseForexFactoryEvent(item);
    return event ? [event] : [];
  });
  return { events, ignored: payload.length - events.length };
}

export function parseForexFactoryEvent(raw: unknown): ForexFactoryEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as ForexFactoryRawEvent;
  const title = cleanString(item.title);
  const currency = cleanString(item.country).toUpperCase();
  const dateValue = cleanString(item.date);
  const eventTime = new Date(dateValue);

  if (
    !title ||
    !/^[A-Z]{3}$/.test(currency) ||
    !dateValue ||
    Number.isNaN(eventTime.getTime())
  ) {
    return null;
  }

  return {
    externalId: createHash("sha256")
      .update(`${title}\u0000${currency}\u0000${eventTime.toISOString()}`)
      .digest("hex"),
    provider: FOREX_FACTORY_PROVIDER,
    title,
    country: currency,
    currency,
    eventTime,
    importance: mapImpact(cleanString(item.impact)),
    previousValue: nullableString(item.previous),
    forecastValue: nullableString(item.forecast),
    actualValue: nullableString(item.actual),
    source: FOREX_FACTORY_PROVIDER,
  };
}

function mapImpact(impact: string) {
  if (impact.toLowerCase() === "high") return EventImportance.HIGH;
  if (impact.toLowerCase() === "medium") return EventImportance.MEDIUM;
  return EventImportance.LOW;
}

function nullableString(value: unknown) {
  return cleanString(value) || null;
}

function cleanString(value: unknown) {
  if (typeof value === "string") return value.trim();
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "";
}
