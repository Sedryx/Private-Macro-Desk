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

// Kept well beyond "this week" so repeated syncs accumulate real history for calendar sparklines.
const RETENTION_DAYS = 400;

export type ForexFactorySyncResult = {
  created: number;
  updated: number;
  skipped: number;
  deleted: number;
  ignored: number;
  backfilled: number;
};

export async function syncForexFactoryCalendar(): Promise<ForexFactorySyncResult> {
  const { prisma } = await import("@/lib/prisma");
  const { events, ignored } = await fetchForexFactoryCalendar();
  const externalIds = events.map((event) => event.externalId);

  const existing = await prisma.economicEvent.findMany({
    where: { provider: FOREX_FACTORY_PROVIDER, externalId: { in: externalIds } },
    select: {
      externalId: true,
      title: true,
      country: true,
      currency: true,
      eventTime: true,
      importance: true,
      previousValue: true,
      forecastValue: true,
      actualValue: true,
      source: true,
    },
  });
  const existingById = new Map(existing.map((event) => [event.externalId, event]));

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const event of events) {
    const current = existingById.get(event.externalId);
    if (current && isUnchangedEvent(current, event)) {
      skipped += 1;
      continue;
    }

    await prisma.economicEvent.upsert({
      where: { provider_externalId: { provider: FOREX_FACTORY_PROVIDER, externalId: event.externalId } },
      update: event,
      create: event,
    });
    if (current) updated += 1;
    else created += 1;
  }

  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - RETENTION_DAYS);
  const deleted = await prisma.economicEvent.deleteMany({
    where: { provider: FOREX_FACTORY_PROVIDER, eventTime: { lt: cutoff } },
  });

  const { backfillCalendarActualsFromFred } = await import("@/lib/data/calendarActualBackfill");
  const { filled } = await backfillCalendarActualsFromFred();

  return { created, updated, skipped, deleted: deleted.count, ignored, backfilled: filled };
}

function isUnchangedEvent(
  current: {
    title: string;
    country: string | null;
    currency: string | null;
    eventTime: Date;
    importance: ForexFactoryEvent["importance"];
    previousValue: string | null;
    forecastValue: string | null;
    actualValue: string | null;
    source: string | null;
  },
  event: ForexFactoryEvent,
) {
  return current.title === event.title &&
    current.country === event.country &&
    current.currency === event.currency &&
    current.eventTime.getTime() === event.eventTime.getTime() &&
    current.importance === event.importance &&
    current.previousValue === event.previousValue &&
    current.forecastValue === event.forecastValue &&
    current.actualValue === event.actualValue &&
    current.source === event.source;
}
