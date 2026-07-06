import type { EcbSeriesConfig } from "@/lib/data/euroAreaConfig";
import {
  replaceMacroSeries,
  type MacroObservation,
} from "@/lib/data/macroStore";

const ECB_DATA_BASE_URL = "https://data-api.ecb.europa.eu/service/data/";

export type EcbDataResult = {
  observations: MacroObservation[];
  providerUpdatedAt: Date | null;
  notModified: boolean;
};

export async function fetchEcbSeries(
  seriesKey: string,
  options: { lastNObservations?: number; updatedAfter?: Date } = {},
): Promise<EcbDataResult> {
  const [flow, ...keyParts] = seriesKey.split(".");
  if (!flow || keyParts.length === 0) throw new Error(`Invalid ECB series key: ${seriesKey}`);

  const url = new URL(`${flow}/${keyParts.join(".")}`, ECB_DATA_BASE_URL);
  url.searchParams.set("format", "csvdata");
  if (options.lastNObservations) {
    url.searchParams.set("lastNObservations", String(options.lastNObservations));
  }
  if (options.updatedAfter) {
    url.searchParams.set("updatedAfter", options.updatedAfter.toISOString());
  }

  const response = await fetch(url, {
    headers: { Accept: "text/csv" },
    signal: AbortSignal.timeout(30_000),
  });
  if (response.status === 304) {
    return { observations: [], providerUpdatedAt: options.updatedAfter ?? null, notModified: true };
  }
  if (!response.ok) {
    throw new Error(`ECB request failed for ${seriesKey}: HTTP ${response.status}`);
  }

  const observations = parseEcbCsv(await response.text());
  const lastModified = response.headers.get("last-modified");
  const providerUpdatedAt = lastModified ? new Date(lastModified) : null;
  return {
    observations,
    providerUpdatedAt:
      providerUpdatedAt && !Number.isNaN(providerUpdatedAt.getTime())
        ? providerUpdatedAt
        : null,
    notModified: false,
  };
}

export async function syncEcbSeries(config: EcbSeriesConfig) {
  const result = await fetchEcbSeries(config.seriesKey, {
    lastNObservations: config.lastNObservations,
  });
  return replaceMacroSeries({
    code: config.code,
    name: config.name,
    category: config.category,
    country: config.country,
    unit: config.unit,
    source: "ECB",
    providerUpdatedAt: result.providerUpdatedAt,
    observations: result.observations,
  });
}

export function parseEcbCsv(csv: string): MacroObservation[] {
  const rows = parseCsv(csv);
  const headers = rows[0];
  if (!headers) return [];
  const dateIndex = headers.indexOf("TIME_PERIOD");
  const valueIndex = headers.indexOf("OBS_VALUE");
  const statusIndex = headers.indexOf("OBS_STATUS");
  if (dateIndex < 0 || valueIndex < 0) return [];

  return rows.slice(1).flatMap((row) => {
    const date = new Date(`${row[dateIndex]}T00:00:00.000Z`);
    const value = Number(row[valueIndex]);
    return Number.isNaN(date.getTime()) || !Number.isFinite(value)
      ? []
      : [{ date, value, flag: statusIndex >= 0 ? row[statusIndex] : undefined }];
  });
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
      row.push(field);
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && input[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }
  if (field || row.length > 0) {
    row.push(field);
    if (row.some(Boolean)) rows.push(row);
  }
  return rows;
}
