import type { SnbSeriesConfig } from "@/lib/data/global-series";
import { replaceMacroSeries, type MacroObservation } from "@/lib/data/macroStore";
import { prepareGlobalObservations } from "@/lib/data/global-validation";

const SNB_CUBE_BASE = "https://data.snb.ch/api/cube";

export async function syncSnbSeries(config: SnbSeriesConfig) {
  await validateSnbDimensions(config);
  const raw = await fetchSnbCubeData(config);
  const observations = prepareGlobalObservations(config, raw);
  return replaceMacroSeries({
    code: config.code,
    name: config.name,
    category: config.category,
    country: config.country,
    unit: config.unit,
    source: "SNB",
    providerUpdatedAt: null,
    observations,
  });
}

export async function fetchSnbCubeData(config: SnbSeriesConfig): Promise<MacroObservation[]> {
  const dimSel = buildDimSel(config);
  try {
    return await fetchSnbCsv(config, dimSel);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes("HTTP 400") || !dimSel) throw error;
    const allRows = await fetchSnbCsv(config, null);
    return filterByDimensions(allRows);
  }
}

async function fetchSnbCsv(config: SnbSeriesConfig, dimSel: string | null) {
  const url = new URL(`${SNB_CUBE_BASE}/${config.cubeId}/data/csv/en`);
  if (dimSel) url.searchParams.set("dimSel", dimSel);
  const response = await fetch(url, {
    headers: {
      Accept: "text/csv,*/*",
      "User-Agent": "Private Macro Desk/1.0 private research app",
    },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`SNB request failed for ${config.cubeId}: HTTP ${response.status}`);
  return parseSnbCsv(await response.text(), config);
}

async function validateSnbDimensions(config: SnbSeriesConfig) {
  const url = `${SNB_CUBE_BASE}/${config.cubeId}/dimensions/en`;
  const response = await fetch(url, {
    headers: { Accept: "application/json,text/plain,*/*", "User-Agent": "Private Macro Desk/1.0 private research app" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`SNB dimensions failed for ${config.cubeId}: HTTP ${response.status}`);
  const text = await response.text();
  for (const code of [config.dimensions.D0, config.dimensions.D1].filter(Boolean)) {
    if (!text.includes(String(code))) {
      throw new Error(`SNB cube ${config.cubeId} dimensions do not expose code ${code}.`);
    }
  }
}

function parseSnbCsv(csv: string, config: SnbSeriesConfig): MacroObservation[] {
  const rows = parseDelimited(csv, ";");
  const headerIndex = rows.findIndex((row) => row.some((cell) => /^date$/i.test(cell.trim())));
  if (headerIndex < 0) return [];

  const headers = rows[headerIndex].map((header) => header.trim());
  const dateIndex = headers.findIndex((header) => /^date$/i.test(header));
  const d0Index = headers.findIndex((header) => /^D0$/i.test(header));
  const d1Index = headers.findIndex((header) => /^D1$/i.test(header));
  const valueIndex = findValueIndex(headers);
  if (dateIndex < 0 || valueIndex < 0) return [];

  return rows.slice(headerIndex + 1).flatMap((row) => {
    if (d0Index >= 0 && row[d0Index] && row[d0Index] !== config.dimensions.D0) return [];
    if (config.dimensions.D1 && d1Index >= 0 && row[d1Index] && row[d1Index] !== config.dimensions.D1) return [];
    const date = parseSnbPeriod(row[dateIndex]);
    const value = parseNumber(row[valueIndex]);
    return date && Number.isFinite(value) ? [{ date, value }] : [];
  });
}

function filterByDimensions(observations: MacroObservation[]) {
  return observations;
}

function buildDimSel(config: SnbSeriesConfig) {
  const parts = [`D0(${config.dimensions.D0})`];
  if (config.dimensions.D1) parts.push(`D1(${config.dimensions.D1})`);
  return parts.join(",");
}

function findValueIndex(headers: string[]) {
  const direct = headers.findIndex((header) => /^(value|obs_value|wert)$/i.test(header));
  if (direct >= 0) return direct;
  return headers.length - 1;
}

function parseSnbPeriod(value: string | undefined) {
  const text = value?.trim();
  if (!text) return null;
  const quarter = /^(\d{4})[- ]?Q([1-4])$/i.exec(text);
  if (quarter) return new Date(Date.UTC(Number(quarter[1]), (Number(quarter[2]) - 1) * 3, 1));
  const month = /^(\d{4})[-/](\d{1,2})$/.exec(text);
  if (month) return new Date(Date.UTC(Number(month[1]), Number(month[2]) - 1, 1));
  const day = new Date(`${text}T00:00:00.000Z`);
  return Number.isNaN(day.getTime()) ? null : day;
}

function parseNumber(value: string | undefined) {
  const cleaned = value?.replace("'", "").replace(",", ".").trim() ?? "";
  return Number(cleaned);
}

function parseDelimited(input: string, separator: string) {
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
    } else if (character === separator && !quoted) {
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

