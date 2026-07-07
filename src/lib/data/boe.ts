import type { BoeSeriesConfig } from "@/lib/data/global-series";
import { replaceMacroSeries, type MacroObservation } from "@/lib/data/macroStore";

const BOE_IADB_URL = "https://www.bankofengland.co.uk/boeapps/database/_iadb-fromshowcolumns.asp";

export async function fetchBoeSeries(seriesCode: string): Promise<MacroObservation[]> {
  const url = new URL(BOE_IADB_URL);
  url.searchParams.set("csv.x", "yes");
  url.searchParams.set("Datefrom", "01/Jan/2010");
  url.searchParams.set("Dateto", "now");
  url.searchParams.set("SeriesCodes", seriesCode);
  url.searchParams.set("UsingCodes", "Y");
  url.searchParams.set("VPD", "Y");
  url.searchParams.set("VFD", "N");

  const response = await fetch(url, {
    headers: {
      Accept: "text/csv,*/*",
      "User-Agent": "Private Macro Desk/1.0 private research app",
    },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`BoE request failed for ${seriesCode}: HTTP ${response.status}`);

  return parseBoeCsv(await response.text(), seriesCode);
}

export async function syncBoeSeries(config: BoeSeriesConfig) {
  const observations = await fetchBoeSeries(config.seriesCode);
  return replaceMacroSeries({
    code: config.code,
    name: config.name,
    category: config.category,
    country: config.country,
    unit: config.unit,
    source: "BoE",
    providerUpdatedAt: null,
    observations,
  });
}

export function parseBoeCsv(csv: string, seriesCode: string): MacroObservation[] {
  const rows = parseCsv(csv);
  const headers = rows[0]?.map((header) => header.trim()) ?? [];
  if (headers.length === 0) return [];

  const dateIndex = headers.findIndex((header) => /date/i.test(header));
  const valueIndex = headers.findIndex((header) => header.toUpperCase() === seriesCode.toUpperCase()) >= 0
    ? headers.findIndex((header) => header.toUpperCase() === seriesCode.toUpperCase())
    : headers.findIndex((header) => /value/i.test(header) || /iu|xu/i.test(header));
  if (dateIndex < 0 || valueIndex < 0) return [];

  return rows.slice(1).flatMap((row) => {
    const date = parseBoeDate(row[dateIndex]);
    const value = Number(row[valueIndex]);
    return date && Number.isFinite(value) ? [{ date, value }] : [];
  });
}

function parseBoeDate(value: string | undefined) {
  if (!value) return null;
  const direct = new Date(value + "T00:00:00.000Z");
  if (!Number.isNaN(direct.getTime())) return direct;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
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
      row.push(field.trim());
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && input[index + 1] === "\n") index += 1;
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }
  if (field || row.length > 0) {
    row.push(field.trim());
    if (row.some(Boolean)) rows.push(row);
  }
  return rows;
}
