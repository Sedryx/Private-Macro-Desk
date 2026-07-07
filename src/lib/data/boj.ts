import type { BojApiSeriesConfig, BojCsvSeriesConfig } from "@/lib/data/global-series";
import { replaceMacroSeries, type MacroObservation } from "@/lib/data/macroStore";
import { prepareGlobalObservations } from "@/lib/data/global-validation";

const BOJ_API_URL = "https://www.stat-search.boj.or.jp/api/v1/getDataCode";

export async function syncBojSeries(config: BojCsvSeriesConfig | BojApiSeriesConfig) {
  const raw = config.mode === "csv"
    ? await fetchBojCsvSeries(config.csvUrl, config.seriesCode)
    : await fetchBojApiSeries(config);
  const observations = prepareGlobalObservations(config, raw);
  return replaceMacroSeries({
    code: config.code,
    name: config.name,
    category: config.category,
    country: config.country,
    unit: config.unit,
    source: "BOJ",
    providerUpdatedAt: null,
    observations,
  });
}

export async function fetchBojApiSeries(config: BojApiSeriesConfig): Promise<MacroObservation[]> {
  const url = new URL(BOJ_API_URL);
  url.searchParams.set("lang", "en");
  url.searchParams.set("database", config.database);
  url.searchParams.set("code", config.seriesCode);
  url.searchParams.set("format", "csv");

  const response = await fetch(url, {
    headers: {
      Accept: "text/csv,application/json,*/*",
      "User-Agent": "Private Macro Desk/1.0 private research app",
    },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`BOJ API request failed for ${config.database}/${config.seriesCode}: HTTP ${response.status}`);

  const text = await response.text();
  return text.trim().startsWith("{") ? parseBojJson(text, config.seriesCode) : parseGenericBojCsv(text, config.seriesCode);
}

export async function fetchBojCsvSeries(csvUrl: string, seriesCode: string): Promise<MacroObservation[]> {
  const response = await fetch(csvUrl, {
    headers: {
      Accept: "text/csv,*/*",
      "User-Agent": "Private Macro Desk/1.0 private research app",
    },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`BOJ request failed for ${seriesCode}: HTTP ${response.status}`);
  return parseBojCsv(await response.text(), seriesCode);
}

export function parseBojCsv(csv: string, seriesCode: string): MacroObservation[] {
  const rows = parseCsv(csv);
  const seriesRow = rows.find((row) => row[0]?.toLowerCase() === "series code");
  const valueIndex = seriesRow?.findIndex((cell) => cell === seriesCode) ?? -1;
  if (valueIndex < 1) return [];

  return rows.flatMap((row) => {
    const date = parseBojPeriod(row[0]);
    const value = Number(row[valueIndex]);
    return date && Number.isFinite(value) ? [{ date, value }] : [];
  });
}

function parseGenericBojCsv(csv: string, seriesCode: string): MacroObservation[] {
  const rows = parseCsv(csv);
  const headers = rows[0] ?? [];
  const dateIndex = headers.findIndex((header) => /date|time|period/i.test(header));
  const valueIndex = headers.findIndex((header) => header === seriesCode || /value|obs/i.test(header));
  if (dateIndex < 0 || valueIndex < 0) return [];
  return rows.slice(1).flatMap((row) => {
    const date = parseBojPeriod(row[dateIndex]);
    const value = Number(row[valueIndex]);
    return date && Number.isFinite(value) ? [{ date, value }] : [];
  });
}

function parseBojJson(input: string, seriesCode: string): MacroObservation[] {
  const payload = JSON.parse(input) as { data?: unknown[]; observations?: unknown[] };
  const rows = Array.isArray(payload.data) ? payload.data : Array.isArray(payload.observations) ? payload.observations : [];
  return rows.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const record = row as Record<string, unknown>;
    const date = parseBojPeriod(String(record.date ?? record.Date ?? record.time ?? record.TIME_PERIOD ?? ""));
    const rawValue = record.value ?? record.Value ?? record[seriesCode] ?? record.OBS_VALUE;
    const value = Number(rawValue);
    return date && Number.isFinite(value) ? [{ date, value }] : [];
  });
}

function parseBojPeriod(value: string | undefined) {
  const text = value?.trim();
  if (!text) return null;
  const daySlash = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/.exec(text);
  if (daySlash) return new Date(Date.UTC(Number(daySlash[1]), Number(daySlash[2]) - 1, Number(daySlash[3])));
  const month = /^(\d{4})[/-](\d{1,2})$/.exec(text);
  if (month) return new Date(Date.UTC(Number(month[1]), Number(month[2]) - 1, 1));
  const day = new Date(`${text}T00:00:00.000Z`);
  return Number.isNaN(day.getTime()) ? null : day;
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
