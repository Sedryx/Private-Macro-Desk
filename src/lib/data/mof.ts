import type { MofSeriesConfig } from "@/lib/data/global-series";
import { replaceMacroSeries, type MacroObservation } from "@/lib/data/macroStore";
import { prepareGlobalObservations } from "@/lib/data/global-validation";

export async function fetchMofSeries(csvUrl: string, seriesCode: string): Promise<MacroObservation[]> {
  const response = await fetch(csvUrl, {
    headers: {
      Accept: "text/csv,*/*",
      "User-Agent": "Private Macro Desk/1.0 private research app",
    },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`MOF request failed for ${seriesCode}: HTTP ${response.status}`);

  return parseMofCsv(await response.text(), seriesCode);
}

export async function syncMofSeries(config: MofSeriesConfig) {
  const observations = prepareGlobalObservations(config, await fetchMofSeries(config.csvUrl, config.seriesCode));
  return replaceMacroSeries({
    code: config.code,
    name: config.name,
    category: config.category,
    country: config.country,
    unit: config.unit,
    source: "MOF",
    providerUpdatedAt: null,
    observations,
  });
}

export function parseMofCsv(csv: string, seriesCode: string): MacroObservation[] {
  const rows = csv.split(/\r?\n/).map((line) => line.split(","));
  const headerIndex = rows.findIndex((row) => row[0]?.trim().toLowerCase() === "date");
  if (headerIndex < 0) return [];

  const headers = rows[headerIndex].map((header) => header.trim());
  const columnIndex = headers.findIndex((header) => header === seriesCode);
  if (columnIndex < 0) return [];

  return rows.slice(headerIndex + 1).flatMap((row) => {
    const date = parseMofDate(row[0]);
    const value = Number(row[columnIndex]?.trim());
    return date && Number.isFinite(value) ? [{ date, value }] : [];
  });
}

function parseMofDate(value: string | undefined) {
  const match = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(value?.trim() ?? "");
  if (!match) return null;
  const [, year, month, day] = match;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
}
