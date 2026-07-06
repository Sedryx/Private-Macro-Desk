import {
  FRED_SERIES,
  type FredSeriesConfig,
  type FredTransform,
} from "@/lib/data/macroRegions";

export { FRED_SERIES };
export type { FredSeriesConfig, FredTransform };

const FRED_OBSERVATIONS_URL =
  "https://api.stlouisfed.org/fred/series/observations";
const OBSERVATION_START = "2018-01-01";

export type FredObservation = {
  date: string;
  value?: string | null;
};

export type ParsedFredObservation = {
  date: Date;
  value: number;
};

type FredObservationsResponse = {
  observations?: FredObservation[];
  error_message?: string;
};

export async function fetchFredObservations(
  seriesId: string,
  apiKey = process.env.FRED_API_KEY,
): Promise<FredObservation[]> {
  if (!apiKey) throw new Error("FRED_API_KEY is not configured.");

  const url = new URL(FRED_OBSERVATIONS_URL);
  url.searchParams.set("series_id", seriesId);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("file_type", "json");
  url.searchParams.set("observation_start", OBSERVATION_START);

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(30_000),
  });
  const payload = (await response.json()) as FredObservationsResponse;

  if (!response.ok || !Array.isArray(payload.observations)) {
    throw new Error(
      `FRED request failed for ${seriesId}: ${payload.error_message ?? `HTTP ${response.status}`}`,
    );
  }

  return payload.observations;
}

export function parseFredObservations(
  observations: FredObservation[],
): ParsedFredObservation[] {
  return observations.flatMap((observation) => {
    if (
      observation.value === "." ||
      observation.value === null ||
      observation.value === undefined
    ) {
      return [];
    }

    const value = Number(observation.value);
    const date = new Date(`${observation.date}T00:00:00.000Z`);

    return Number.isFinite(value) && !Number.isNaN(date.getTime())
      ? [{ date, value }]
      : [];
  });
}

export function calculateYoY(
  observations: ParsedFredObservation[],
): ParsedFredObservation[] {
  const byMonth = new Map(
    observations.map((observation) => [monthKey(observation.date), observation.value]),
  );

  return observations.flatMap((observation) => {
    const previousYear = new Date(observation.date);
    previousYear.setUTCFullYear(previousYear.getUTCFullYear() - 1);
    const previousValue = byMonth.get(monthKey(previousYear));

    return previousValue === undefined || previousValue === 0
      ? []
      : [point(observation.date, ((observation.value / previousValue) - 1) * 100)];
  });
}

export function calculateMoM(
  observations: ParsedFredObservation[],
): ParsedFredObservation[] {
  return observations.slice(1).flatMap((observation, index) => {
    const previousValue = observations[index]?.value;
    return previousValue === undefined || previousValue === 0
      ? []
      : [point(observation.date, ((observation.value / previousValue) - 1) * 100)];
  });
}

export function calculateMonthlyChange(
  observations: ParsedFredObservation[],
): ParsedFredObservation[] {
  return observations.slice(1).flatMap((observation, index) => {
    const previousValue = observations[index]?.value;
    return previousValue === undefined
      ? []
      : [point(observation.date, observation.value - previousValue)];
  });
}

export function transformFredObservations(
  observations: ParsedFredObservation[],
  transform: FredTransform,
): ParsedFredObservation[] {
  if (transform === "YOY_PERCENT") return calculateYoY(observations);
  if (transform === "MOM_PERCENT" || transform === "PERIOD_PERCENT") {
    return calculateMoM(observations);
  }
  if (transform === "MONTHLY_CHANGE") return calculateMonthlyChange(observations);
  return observations;
}

export async function syncFredSeries(
  config: FredSeriesConfig,
  apiKey = process.env.FRED_API_KEY,
  sourceOverride?: "FRED fallback",
) {
  const raw = await fetchFredObservations(config.seriesId, apiKey);
  const parsed = parseFredObservations(raw);
  const transformed = transformFredObservations(parsed, config.transform);
  const scale = config.scale;
  const values = scale !== undefined
    ? transformed.map((observation) =>
        point(observation.date, observation.value * scale),
      )
    : transformed;

  if (values.length === 0) {
    throw new Error(`FRED returned no usable values for ${config.seriesId}.`);
  }

  const { prisma } = await import("@/lib/prisma");
  const source = sourceOverride ??
    (config.transform === "DIRECT" ? "FRED" : "FRED / calculated");

  return prisma.$transaction(async (transaction) => {
    const indicator = await transaction.macroIndicator.upsert({
      where: { code: config.code },
      update: {
        name: config.name,
        category: config.category,
        country: config.country,
        unit: config.unit,
        source,
        releaseType: null,
        providerUpdatedAt: null,
      },
      create: {
        code: config.code,
        name: config.name,
        category: config.category,
        country: config.country,
        unit: config.unit,
        source,
        releaseType: null,
        providerUpdatedAt: null,
      },
    });

    await transaction.macroValue.deleteMany({
      where: { indicatorId: indicator.id },
    });
    await transaction.macroValue.createMany({
      data: values.map((observation) => ({
        indicatorId: indicator.id,
        date: observation.date,
        value: observation.value,
      })),
    });

    return {
      code: config.code,
      seriesId: config.seriesId,
      valueCount: values.length,
      latestDate: values.at(-1)?.date,
    };
  });
}

function point(date: Date, value: number): ParsedFredObservation {
  return { date, value: Number(value.toFixed(4)) };
}

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}
