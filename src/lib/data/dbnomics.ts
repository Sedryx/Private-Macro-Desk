import type { DbnomicsSeriesConfig } from "@/lib/data/global-series";
import { replaceMacroSeries, type MacroObservation } from "@/lib/data/macroStore";
import { prepareGlobalObservations } from "@/lib/data/global-validation";

const DBNOMICS_BASE = "https://api.db.nomics.world/v22/series";

export async function syncDbnomicsSeries(config: DbnomicsSeriesConfig) {
  const observations = prepareGlobalObservations(config, await fetchDbnomicsSeries(config.seriesPath));
  return replaceMacroSeries({
    code: config.code,
    name: config.name,
    category: config.category,
    country: config.country,
    unit: config.unit,
    source: "DBnomics",
    providerUpdatedAt: null,
    observations,
  });
}

export async function fetchDbnomicsSeries(seriesPath: string): Promise<MacroObservation[]> {
  const response = await fetch(`${DBNOMICS_BASE}/${seriesPath}?observations=1`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Private Macro Desk/1.0 private research app",
    },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`DBnomics request failed for ${seriesPath}: HTTP ${response.status}`);

  const payload = await response.json() as { series?: { docs?: Array<{ period?: string[]; value?: Array<string | number | null> }> } };
  const doc = payload.series?.docs?.[0];
  const periods = doc?.period ?? [];
  const values = doc?.value ?? [];
  return periods.flatMap((period, index) => {
    const date = parsePeriod(period);
    const value = Number(values[index]);
    return date && Number.isFinite(value) ? [{ date, value }] : [];
  });
}

function parsePeriod(value: string) {
  const month = /^(\d{4})-(\d{2})$/.exec(value);
  if (month) return new Date(Date.UTC(Number(month[1]), Number(month[2]) - 1, 1));
  const quarter = /^(\d{4})-Q([1-4])$/i.exec(value);
  if (quarter) return new Date(Date.UTC(Number(quarter[1]), (Number(quarter[2]) - 1) * 3, 1));
  const day = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(day.getTime()) ? null : day;
}
