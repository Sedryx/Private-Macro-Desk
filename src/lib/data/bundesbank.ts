import type { BundesbankSeriesConfig } from "@/lib/data/global-series";
import { replaceMacroSeries, type MacroObservation } from "@/lib/data/macroStore";
import { prepareGlobalObservations } from "@/lib/data/global-validation";

const BBK_DATA_URL = "https://api.statistiken.bundesbank.de/rest/data/BBSIS";

export async function fetchBundesbankSeries(seriesKey: string): Promise<MacroObservation[]> {
  const url = `${BBK_DATA_URL}/${seriesKey}?format=csv`;
  const response = await fetch(url, {
    headers: {
      Accept: "text/csv,*/*",
      "User-Agent": "Private Macro Desk/1.0 private research app",
    },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Bundesbank request failed for ${seriesKey}: HTTP ${response.status}`);

  return parseBundesbankCsv(await response.text());
}

export async function syncBundesbankSeries(config: BundesbankSeriesConfig) {
  const observations = prepareGlobalObservations(config, await fetchBundesbankSeries(config.seriesKey));
  return replaceMacroSeries({
    code: config.code,
    name: config.name,
    category: config.category,
    country: config.country,
    unit: config.unit,
    source: "Bundesbank",
    providerUpdatedAt: null,
    observations,
  });
}

export function parseBundesbankCsv(csv: string): MacroObservation[] {
  const lines = csv.split(/\r?\n/);
  const dateRow = /^\d{4}-\d{2}-\d{2};/;

  return lines.flatMap((line) => {
    if (!dateRow.test(line)) return [];
    const [dateText, rawValue] = line.split(";");
    if (!rawValue || rawValue.trim() === ".") return [];

    const date = new Date(`${dateText}T00:00:00.000Z`);
    const value = Number(rawValue.trim().replace(",", "."));
    return Number.isNaN(date.getTime()) || !Number.isFinite(value) ? [] : [{ date, value }];
  });
}
