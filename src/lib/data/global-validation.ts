import type { OfficialGlobalSeriesConfig } from "@/lib/data/global-series";
import type { MacroObservation } from "@/lib/data/macroStore";

const RANGES: Record<OfficialGlobalSeriesConfig["valueKind"], { min: number; max: number }> = {
  rate: { min: -10, max: 30 },
  yield: { min: -10, max: 30 },
  inflation: { min: -20, max: 50 },
  unemployment: { min: 0, max: 50 },
  gdp_qoq: { min: -40, max: 40 },
  fx: { min: 0, max: Number.POSITIVE_INFINITY },
  index: { min: 0, max: Number.POSITIVE_INFINITY },
  spread: { min: -10, max: 30 },
};

export function prepareGlobalObservations(
  config: OfficialGlobalSeriesConfig,
  observations: MacroObservation[],
): MacroObservation[] {
  const transformed = config.transform === "QOQ_PERCENT"
    ? calculatePeriodPercent(observations)
    : observations;
  const deduped = dedupeAndSort(transformed);
  if (deduped.length < 2) {
    throw new Error(`${config.code} needs at least 2 finite observations before replacing DB values.`);
  }

  const range = RANGES[config.valueKind];
  const invalid = deduped.find((point) => !Number.isFinite(point.value) || point.value < range.min || point.value > range.max);
  if (invalid) {
    throw new Error(
      `${config.code} invalid value ${invalid.value} on ${invalid.date.toISOString().slice(0, 10)} for ${config.valueKind}.`,
    );
  }

  return deduped;
}

export function calculatePeriodPercent(observations: MacroObservation[]): MacroObservation[] {
  const sorted = dedupeAndSort(observations);
  return sorted.slice(1).flatMap((observation, index) => {
    const previous = sorted[index];
    if (!previous || previous.value === 0) return [];
    const value = ((observation.value / previous.value) - 1) * 100;
    return Number.isFinite(value) ? [{ date: observation.date, value: Number(value.toFixed(4)) }] : [];
  });
}

export function dedupeAndSort(observations: MacroObservation[]): MacroObservation[] {
  const byDate = new Map<string, MacroObservation>();
  for (const observation of observations) {
    if (!Number.isFinite(observation.value) || Number.isNaN(observation.date.getTime())) continue;
    byDate.set(observation.date.toISOString().slice(0, 10), observation);
  }
  return [...byDate.values()].sort((left, right) => left.date.getTime() - right.date.getTime());
}
