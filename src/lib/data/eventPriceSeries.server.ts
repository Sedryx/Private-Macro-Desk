import "server-only";

import { FX_VOLATILITY_SERIES } from "@/lib/data/fxVolatility";

const USD_CODE = "US_DOLLAR_BROAD_INDEX";
const LOOKBACK_DAYS = 400; // matches the calendar's Forex Factory retention window

export type PricePoint = { date: string; value: number };
export type EventPriceSeries = { pairLabel: string; points: PricePoint[] };

const CURRENCY_TO_SERIES = new Map<string, { code: string; pairLabel: string }>([
  ["USD", { code: USD_CODE, pairLabel: "US Dollar Index" }],
  ...FX_VOLATILITY_SERIES.map((series): [string, { code: string; pairLabel: string }] => [
    series.currency,
    { code: series.code, pairLabel: series.name },
  ]),
]);

export async function getEventPriceSeriesByCurrency(): Promise<Record<string, EventPriceSeries>> {
  const { prisma } = await import("@/lib/prisma");

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - LOOKBACK_DAYS);

  const codes = Array.from(new Set(Array.from(CURRENCY_TO_SERIES.values()).map((entry) => entry.code)));
  const indicators = await prisma.macroIndicator.findMany({
    where: { code: { in: codes } },
    select: {
      code: true,
      values: {
        where: { date: { gte: since } },
        orderBy: { date: "asc" },
        select: { date: true, value: true },
      },
    },
  });
  const byCode = new Map(indicators.map((indicator) => [indicator.code, indicator.values]));

  const result: Record<string, EventPriceSeries> = {};
  for (const [currency, { code, pairLabel }] of CURRENCY_TO_SERIES) {
    const values = byCode.get(code);
    if (!values || values.length === 0) continue;
    result[currency] = {
      pairLabel,
      points: values.map((point) => ({ date: point.date.toISOString(), value: point.value.toNumber() })),
    };
  }
  return result;
}
