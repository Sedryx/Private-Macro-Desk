import type { OnsSeriesConfig } from "@/lib/data/global-series";
import { replaceMacroSeries, type MacroObservation } from "@/lib/data/macroStore";

const ONS_BASE_URL = "https://api.ons.gov.uk/timeseries/";

type OnsPeriod = { date?: string; value?: string; month?: string; quarter?: string; year?: string };
type OnsResponse = { months?: OnsPeriod[]; quarters?: OnsPeriod[]; years?: OnsPeriod[] };

export async function fetchOnsTimeSeries(datasetId: string, timeseriesId: string): Promise<MacroObservation[]> {
  const url = new URL(`${timeseriesId.toLowerCase()}/dataset/${datasetId.toLowerCase()}/data`, ONS_BASE_URL);
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Private Macro Desk/1.0 private research app",
    },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`ONS request failed for ${datasetId}/${timeseriesId}: HTTP ${response.status}`);

  const payload = (await response.json()) as OnsResponse;
  return parseOnsPayload(payload);
}

export async function syncOnsSeries(config: OnsSeriesConfig) {
  const observations = await fetchOnsTimeSeries(config.datasetId, config.timeseriesId);
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

export function parseOnsPayload(payload: OnsResponse): MacroObservation[] {
  const periods = payload.months?.length
    ? payload.months
    : payload.quarters?.length
      ? payload.quarters
      : payload.years ?? [];

  return periods.flatMap((period) => {
    const date = parseOnsDate(period);
    const value = Number(period.value);
    return date && Number.isFinite(value) ? [{ date, value }] : [];
  });
}

function parseOnsDate(period: OnsPeriod) {
  if (period.date) {
    const date = new Date(period.date + "T00:00:00.000Z");
    if (!Number.isNaN(date.getTime())) return date;
  }
  if (period.month) {
    const date = new Date(period.month + "T00:00:00.000Z");
    if (!Number.isNaN(date.getTime())) return date;
  }
  if (period.quarter) {
    const match = /^(\d{4})\s*Q([1-4])$/i.exec(period.quarter);
    if (match) return new Date(Date.UTC(Number(match[1]), (Number(match[2]) - 1) * 3, 1));
  }
  if (period.year && /^\d{4}$/.test(period.year)) return new Date(Date.UTC(Number(period.year), 0, 1));
  return null;
}
