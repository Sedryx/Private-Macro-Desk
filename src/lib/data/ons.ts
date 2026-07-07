import type { OnsSeriesConfig } from "@/lib/data/global-series";
import { replaceMacroSeries, type MacroObservation } from "@/lib/data/macroStore";
import { prepareGlobalObservations } from "@/lib/data/global-validation";

const ONS_GENERATOR_URL = "https://www.ons.gov.uk/generator";

export async function fetchOnsTimeSeries(config: OnsSeriesConfig): Promise<MacroObservation[]> {
  const url = new URL(ONS_GENERATOR_URL);
  url.searchParams.set("format", "csv");
  url.searchParams.set("uri", config.generatorUri);
  const response = await fetch(url, {
    headers: {
      Accept: "text/csv,*/*",
      "User-Agent": "Private Macro Desk/1.0 private research app",
    },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`ONS request failed for ${config.datasetId}/${config.timeseriesId}: HTTP ${response.status}`);

  return parseOnsGeneratorCsv(await response.text(), config.frequency);
}

export async function syncOnsSeries(config: OnsSeriesConfig) {
  const observations = prepareGlobalObservations(config, await fetchOnsTimeSeries(config));
  return replaceMacroSeries({
    code: config.code,
    name: config.name,
    category: config.category,
    country: config.country,
    unit: config.unit,
    source: "ONS",
    providerUpdatedAt: null,
    observations,
  });
}

export function parseOnsGeneratorCsv(csv: string, frequency: OnsSeriesConfig["frequency"] = "monthly"): MacroObservation[] {
  return parseCsv(csv).flatMap((row) => {
    const date = frequency === "quarterly" ? parseQuarterlyPeriod(row[0]) : parseMonthlyPeriod(row[0]);
    const value = Number(row[1]);
    return date && Number.isFinite(value) ? [{ date, value }] : [];
  });
}

function parseMonthlyPeriod(value: string | undefined) {
  if (!value) return null;
  const match = /^(\d{4})\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)$/i.exec(value.trim());
  if (!match) return null;
  const month = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"].indexOf(match[2].toUpperCase());
  return new Date(Date.UTC(Number(match[1]), month, 1));
}

function parseQuarterlyPeriod(value: string | undefined) {
  if (!value) return null;
  const text = value.trim();
  const match = /^(\d{4})\s+Q([1-4])$/i.exec(text) ?? /^Q([1-4])\s+(\d{4})$/i.exec(text);
  if (!match) return null;
  const year = match[1].length === 4 ? Number(match[1]) : Number(match[2]);
  const quarter = match[1].length === 4 ? Number(match[2]) : Number(match[1]);
  return new Date(Date.UTC(year, (quarter - 1) * 3, 1));
}

function parseCsv(input: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (character === '"') {
      if (quoted && input[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(field.trim().replace(/^\uFEFF/, ""));
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && input[index + 1] === "\n") index += 1;
      row.push(field.trim().replace(/^\uFEFF/, ""));
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }
  if (field || row.length > 0) {
    row.push(field.trim().replace(/^\uFEFF/, ""));
    if (row.some(Boolean)) rows.push(row);
  }
  return rows;
}
