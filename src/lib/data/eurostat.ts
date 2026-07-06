import type { EurostatSeriesConfig } from "@/lib/data/euroAreaConfig";
import {
  replaceMacroSeries,
  type MacroObservation,
} from "@/lib/data/macroStore";

const EUROSTAT_BASE_URL =
  "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/";

type JsonStatDimension = {
  category?: {
    index?: Record<string, number> | string[];
  };
};

type EurostatResponse = {
  id?: string[];
  size?: number[];
  value?: Record<string, number> | Array<number | null>;
  status?: Record<string, string> | Array<string | null>;
  dimension?: Record<string, JsonStatDimension>;
  updated?: string;
  error?: Array<{ label?: string }>;
};

export type EurostatDatasetResult = {
  observations: MacroObservation[];
  providerUpdatedAt: Date | null;
  filters: Record<string, string>;
};

export async function fetchEurostatDataset(
  dataset: string,
  filters: Record<string, string>,
  lastTimePeriod: number,
): Promise<EurostatDatasetResult> {
  const url = new URL(dataset, EUROSTAT_BASE_URL);
  url.searchParams.set("lang", "en");
  url.searchParams.set("lastTimePeriod", String(lastTimePeriod));
  for (const [dimension, value] of Object.entries(filters)) {
    url.searchParams.set(dimension, value);
  }

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(30_000),
  });
  const payload = (await response.json()) as EurostatResponse;

  if (!response.ok) {
    const detail = payload.error?.map((item) => item.label).filter(Boolean).join("; ");
    throw new Error(`Eurostat ${dataset} failed: ${detail || `HTTP ${response.status}`}`);
  }

  return {
    observations: parseJsonStat(payload),
    providerUpdatedAt: parseProviderDate(payload.updated),
    filters,
  };
}

export async function syncEurostatSeries(config: EurostatSeriesConfig) {
  let latestError: unknown;

  for (const filters of config.filterVariants) {
    try {
      const result = await fetchEurostatDataset(
        config.dataset,
        filters,
        config.lastTimePeriod,
      );
      if (result.observations.length === 0) continue;

      const latestFlag = result.observations.at(-1)?.flag;
      const releaseType = latestFlag
        ? latestFlag.includes("e")
          ? config.estimatedReleaseType ?? "estimate"
          : latestFlag.includes("p")
            ? "provisional"
            : latestFlag
        : null;

      return replaceMacroSeries({
        code: config.code,
        name: config.name,
        category: config.category,
        country: config.country,
        unit: config.unit,
        source: "Eurostat",
        releaseType,
        providerUpdatedAt: result.providerUpdatedAt,
        observations: result.observations,
      });
    } catch (error) {
      latestError = error;
    }
  }

  throw latestError instanceof Error
    ? latestError
    : new Error(`Eurostat returned no values for ${config.code}.`);
}

export function parseJsonStat(payload: EurostatResponse): MacroObservation[] {
  if (!payload.id || !payload.size || !payload.dimension || !payload.value) {
    return [];
  }

  const timePosition = payload.id.indexOf("time");
  if (timePosition < 0) return [];
  if (payload.size.some((size, index) => index !== timePosition && size > 1)) {
    throw new Error("Eurostat query returned more than one non-time series.");
  }

  const timeIndex = payload.dimension.time?.category?.index;
  if (!timeIndex) return [];
  const periods = Array.isArray(timeIndex)
    ? timeIndex
    : Object.entries(timeIndex)
        .sort((left, right) => left[1] - right[1])
        .map(([period]) => period);
  const stride = payload.size
    .slice(timePosition + 1)
    .reduce((product, size) => product * size, 1);
  const values = Array.isArray(payload.value)
    ? payload.value.map((value, index) => [String(index), value] as const)
    : Object.entries(payload.value);

  return values.flatMap(([rawIndex, rawValue]) => {
    if (rawValue === null || !Number.isFinite(Number(rawValue))) return [];
    const flatIndex = Number(rawIndex);
    const timeCoordinate = Math.floor(flatIndex / stride) % payload.size![timePosition];
    const period = periods[timeCoordinate];
    const date = parsePeriod(period);
    if (!date) return [];
    const flag = Array.isArray(payload.status)
      ? payload.status[flatIndex] ?? undefined
      : payload.status?.[rawIndex];
    return [{ date, value: Number(rawValue), flag }];
  });
}

function parsePeriod(period: string | undefined) {
  if (!period) return null;
  const monthly = /^(\d{4})-(\d{2})$/.exec(period);
  if (monthly) return new Date(Date.UTC(Number(monthly[1]), Number(monthly[2]) - 1, 1));
  const quarterly = /^(\d{4})-Q([1-4])$/.exec(period);
  if (quarterly) return new Date(Date.UTC(Number(quarterly[1]), (Number(quarterly[2]) - 1) * 3, 1));
  const annual = /^(\d{4})$/.exec(period);
  return annual ? new Date(Date.UTC(Number(annual[1]), 0, 1)) : null;
}

function parseProviderDate(value?: string) {
  if (!value) return null;
  const normalized = value.replace(/([+-]\d{2})(\d{2})$/, "$1:$2");
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}
