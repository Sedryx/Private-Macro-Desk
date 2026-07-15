import "server-only";

import { FX_VOLATILITY_SERIES } from "@/lib/data/fxVolatility";

const USD_CODE = "US_DOLLAR_BROAD_INDEX";
const WINDOW_DAYS = 30;
const CURRENCY_ORDER = ["USD", ...FX_VOLATILITY_SERIES.map((series) => series.currency)];

export type CurrencyVolatilityPoint = { date: string; pctChange: number };
export type CurrencyVolatilitySeries = { currency: string; points: CurrencyVolatilityPoint[] };

export async function getCurrencyVolatilitySeries(days = WINDOW_DAYS): Promise<CurrencyVolatilitySeries[]> {
  const { prisma } = await import("@/lib/prisma");

  const codes = [USD_CODE, ...FX_VOLATILITY_SERIES.map((series) => series.code)];
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);

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
  const series: CurrencyVolatilitySeries[] = [];

  const usdValues = byCode.get(USD_CODE);
  if (usdValues && usdValues.length > 1) {
    series.push({
      currency: "USD",
      points: toPercentSeries(usdValues.map((item) => ({ date: item.date, value: item.value.toNumber() })), false),
    });
  }

  for (const config of FX_VOLATILITY_SERIES) {
    const values = byCode.get(config.code);
    if (!values || values.length < 2) continue;
    series.push({
      currency: config.currency,
      points: toPercentSeries(values.map((item) => ({ date: item.date, value: item.value.toNumber() })), config.invert),
    });
  }

  return series.sort((a, b) => CURRENCY_ORDER.indexOf(a.currency) - CURRENCY_ORDER.indexOf(b.currency));
}

function toPercentSeries(values: { date: Date; value: number }[], invert: boolean): CurrencyVolatilityPoint[] {
  const normalized = values.map((point) => ({ date: point.date, value: invert ? 1 / point.value : point.value }));
  const baseline = normalized[0]?.value;
  if (!baseline) return [];

  return normalized.map((point) => ({
    date: point.date.toISOString(),
    pctChange: Number((((point.value / baseline) - 1) * 100).toFixed(3)),
  }));
}
