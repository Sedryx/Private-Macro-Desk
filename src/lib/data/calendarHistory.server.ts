import "server-only";

import { parseComparableValue } from "@/lib/calendarValue";
import { FOREX_FACTORY_PROVIDER } from "@/lib/data/forex-factory";

const LOOKBACK_DAYS = 400;
const MAX_POINTS = 8;

export function historyKey(currency: string | null, title: string) {
  return `${currency ?? ""}|${title}`;
}

export async function getEventHistoryMap(): Promise<Map<string, number[]>> {
  const { prisma } = await import("@/lib/prisma");

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - LOOKBACK_DAYS);

  const rows = await prisma.economicEvent.findMany({
    where: { provider: FOREX_FACTORY_PROVIDER, eventTime: { gte: since } },
    orderBy: { eventTime: "asc" },
    select: { title: true, currency: true, eventTime: true, actualValue: true },
  });

  const byKey = new Map<string, { time: number; value: number }[]>();

  for (const row of rows) {
    const value = parseComparableValue(row.actualValue);
    if (value === null) continue;

    const key = historyKey(row.currency, row.title);
    const points = byKey.get(key) ?? [];
    points.push({ time: row.eventTime.getTime(), value });
    byKey.set(key, points);
  }

  const result = new Map<string, number[]>();
  for (const [key, points] of byKey) {
    result.set(
      key,
      points.slice(-MAX_POINTS).map((point) => point.value),
    );
  }

  return result;
}
