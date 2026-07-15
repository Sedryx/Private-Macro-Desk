import { MacroCategory } from "@prisma/client";

import { syncFredSeries, type FredSeriesConfig } from "@/lib/data/fred";

export type FxVolatilitySeriesConfig = FredSeriesConfig & {
  currency: string;
  invert: boolean;
};

function fx(code: string, seriesId: string, name: string, currency: string, invert: boolean): FxVolatilitySeriesConfig {
  return {
    code,
    seriesId,
    name,
    category: MacroCategory.OTHER,
    country: "FX",
    unit: "rate",
    transform: "DIRECT",
    currency,
    invert,
    ui: { section: "ratesMarkets", metricId: code, display: "index", change: "value" },
  };
}

export const FX_VOLATILITY_SERIES: FxVolatilitySeriesConfig[] = [
  fx("FX_EURUSD", "DEXUSEU", "EUR/USD", "EUR", false),
  fx("FX_USDJPY", "DEXJPUS", "USD/JPY", "JPY", true),
  fx("FX_GBPUSD", "DEXUSUK", "GBP/USD", "GBP", false),
  fx("FX_USDCHF", "DEXSZUS", "USD/CHF", "CHF", true),
  fx("FX_USDCAD", "DEXCAUS", "USD/CAD", "CAD", true),
  fx("FX_AUDUSD", "DEXUSAL", "AUD/USD", "AUD", false),
  fx("FX_NZDUSD", "DEXUSNZ", "NZD/USD", "NZD", false),
];

export const FX_VOLATILITY_CODES = FX_VOLATILITY_SERIES.map((series) => series.code);

export async function syncFxVolatilitySeries() {
  const results = [];
  for (const series of FX_VOLATILITY_SERIES) {
    const result = await syncFredSeries(series);
    results.push(result);
  }
  return results;
}
