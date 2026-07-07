import "server-only";

import {
  FRED_SERIES,
  MACRO_REGION_CONFIGS,
  type FredSeriesConfig,
  type MacroChangeKind,
  type MacroDisplayKind,
} from "@/lib/data/macroRegions";
import { OFFICIAL_EURO_AREA_SERIES } from "@/lib/data/euroAreaConfig";
import { OFFICIAL_GLOBAL_SERIES } from "@/lib/data/global-series";
import {
  countryMacroProfiles,
  type CountryMacroProfile,
  type MacroSource,
  type MacroTrendPoint,
} from "@/lib/macroProfiles";
import { prisma } from "@/lib/prisma";

type SeriesPoint = { date: Date; value: number };
type SeriesDisplayConfig = Pick<
  FredSeriesConfig,
  "code" | "name" | "country" | "maxAgeDays" | "ui"
> & { sourceRef: string };

const displayConfigs: SeriesDisplayConfig[] = [
  ...FRED_SERIES.map((series) => ({
    ...series,
    sourceRef: `FRED series ${series.seriesId}`,
  })),
  ...OFFICIAL_EURO_AREA_SERIES.map((series) => ({
    ...series,
    sourceRef: series.provider === "EUROSTAT"
      ? `Eurostat dataset ${series.dataset}`
      : `ECB series ${series.seriesKey}`,
  })),
  ...OFFICIAL_GLOBAL_SERIES.map((series) => ({
    ...series,
    sourceRef: "seriesCode" in series
      ? `${series.provider} series ${series.seriesCode}`
      : "timeseriesId" in series
        ? `${series.provider} ${series.datasetId}/${series.timeseriesId}`
        : `${series.provider} unresolved official metadata`,
  })),
];
const configByCode = new Map(displayConfigs.map((series) => [series.code, series]));
const regionByCode = new Map(
  displayConfigs.map((series) => [
    series.code,
    MACRO_REGION_CONFIGS.find((region) => region.countryCode === series.country),
  ] as const),
);

export async function getMacroProfiles(): Promise<CountryMacroProfile[]> {
  const profiles = structuredClone(countryMacroProfiles);

  try {
    const indicators = await prisma.macroIndicator.findMany({
      where: {
        code: { in: displayConfigs.map((series) => series.code) },
      },
      include: {
        values: {
          orderBy: { date: "desc" },
          take: 520,
        },
      },
    });
    const loadedSeries = new Map<string, SeriesPoint[]>();

    for (const indicator of indicators) {
      const seriesConfig = configByCode.get(indicator.code);
      const regionConfig = regionByCode.get(indicator.code);
      const profile = profiles.find(
        (item) => item.id === regionConfig?.profileId,
      );
      if (!seriesConfig || !profile || indicator.values.length === 0) continue;

      const values = indicator.values
        .map((item) => ({ date: item.date, value: item.value.toNumber() }))
        .reverse();
      const latest = values.at(-1);
      const previous = values.at(-2);
      if (!latest) continue;

      loadedSeries.set(indicator.code, values);
      hydrateMetric(
        profile,
        seriesConfig,
        values,
        latest,
        previous,
        normalizeSource(indicator.source, indicator.releaseType),
        indicator.releaseType,
        indicator.providerUpdatedAt,
        isStale(latest.date, seriesConfig.maxAgeDays),
      );
    }

    applyUnitedStatesTrends(profiles, loadedSeries);
    markConnectedRegions(profiles);
    return profiles;
  } catch (error) {
    console.error("Unable to load macro values from PostgreSQL", error);
    return profiles;
  }
}

function hydrateMetric(
  profile: CountryMacroProfile,
  config: SeriesDisplayConfig,
  values: SeriesPoint[],
  latest: SeriesPoint,
  previous: SeriesPoint | undefined,
  source: MacroSource,
  releaseType: string | null,
  providerUpdatedAt: Date | null,
  stale: boolean,
) {
  const displayValue = formatValue(latest.value, config.ui.display, config.ui.decimals);
  const displayChange = formatChange(
    latest.value - (previous?.value ?? latest.value),
    config.ui.change,
    config.ui.display,
  );
  const latestDate = formatDate(latest.date);
  const metric = profile.sections[config.ui.section].indicators.find(
    (item) => item.id === config.ui.metricId,
  );

  if (metric) {
    metric.value = displayValue;
    metric.change = displayChange;
    metric.history = toChartPoints(values);
    metric.source = source;
    metric.latestDate = latestDate;
    metric.sourceUpdatedDate = providerUpdatedAt ? formatDate(providerUpdatedAt) : undefined;
    metric.releaseType = releaseType ?? undefined;
    metric.stale = stale;
    metric.context = `${config.name} · ${config.sourceRef}`;
  }

  if (config.ui.snapshotLabel) {
    const snapshot = profile.snapshot.find(
      (item) => item.label === config.ui.snapshotLabel,
    );
    if (snapshot) {
      snapshot.value = displayValue;
      snapshot.change = displayChange;
      snapshot.source = source;
      snapshot.latestDate = latestDate;
      snapshot.sourceUpdatedDate = providerUpdatedAt ? formatDate(providerUpdatedAt) : undefined;
      snapshot.releaseType = releaseType ?? undefined;
      snapshot.stale = stale;
    }
  }

  if (config.ui.profileField) {
    profile[config.ui.profileField] = displayValue;
  }
}

function applyUnitedStatesTrends(
  profiles: CountryMacroProfile[],
  loadedSeries: Map<string, SeriesPoint[]>,
) {
  const usProfile = profiles.find((profile) => profile.id === "united-states");
  if (!usProfile) return;

  applyThreeMonthTrend(
    usProfile,
    loadedSeries.get("FEDFUNDS"),
    "us-policy-trend",
    "Tightening",
    "Easing",
  );
  applyThreeMonthTrend(
    usProfile,
    loadedSeries.get("FED_BALANCE_SHEET"),
    "us-balance-trend",
    "Expanding",
    "Shrinking",
  );

  const policyTrend = usProfile.sections.centralBank.indicators.find(
    (metric) => metric.id === "us-policy-trend",
  );
  if (policyTrend?.source === "FRED / calculated") {
    usProfile.stance = `${policyTrend.value} policy trend`;
    usProfile.stanceTone =
      policyTrend.value === "Tightening"
        ? "tight"
        : policyTrend.value === "Easing"
          ? "easing"
          : "neutral";
  }
}

function markConnectedRegions(profiles: CountryMacroProfile[]) {
  for (const region of MACRO_REGION_CONFIGS) {
    if (region.dataStatus !== "live") continue;
    const profile = profiles.find((item) => item.id === region.profileId);
    if (!profile || region.profileId === "united-states") continue;

    const hasLiveMetric = Object.values(profile.sections).some((section) =>
      section.indicators.some((metric) => isLiveSource(metric.source)),
    );
    if (hasLiveMetric) {
      profile.stance = "Live data";
      profile.stanceTone = "neutral";
      profile.summary = region.profileId === "eurozone"
        ? "Euro Area policy rates come directly from the ECB Data Portal; inflation, labour and growth come from Eurostat. FRED is used only when an official request fails."
        : `${region.regionName} macro data is synchronized server-side from ${region.sourceLabels.join(", ")}.`;
    }
  }
}

function applyThreeMonthTrend(
  profile: CountryMacroProfile,
  values: SeriesPoint[] | undefined,
  metricId: string,
  risingLabel: string,
  fallingLabel: string,
) {
  if (!values?.length) return;
  const latest = values.at(-1);
  if (!latest) return;

  const targetDate = new Date(latest.date);
  targetDate.setUTCMonth(targetDate.getUTCMonth() - 3);
  const comparison = values.filter((point) => point.date <= targetDate).at(-1);
  if (!comparison) return;

  const difference = latest.value - comparison.value;
  const metric = profile.sections.centralBank.indicators.find(
    (item) => item.id === metricId,
  );
  if (!metric) return;

  metric.value =
    Math.abs(difference) < 0.0001
      ? "Flat"
      : difference > 0
        ? risingLabel
        : fallingLabel;
  metric.change = `vs ${formatDate(comparison.date)}`;
  metric.context = "Calculated from the latest value versus three months earlier";
  metric.history = toChartPoints(values);
  metric.source = "FRED / calculated";
  metric.latestDate = formatDate(latest.date);
}

function toChartPoints(values: SeriesPoint[]): MacroTrendPoint[] {
  const interval = Math.max(1, Math.ceil(values.length / 120));
  return values
    .filter((_point, index) => index % interval === 0 || index === values.length - 1)
    .map((point) => ({
      label: new Intl.DateTimeFormat("en-GB", {
        day: values.length > 150 ? "2-digit" : undefined,
        month: "short",
        year: "2-digit",
        timeZone: "UTC",
      }).format(point.date),
      value: point.value,
      date: point.date.toISOString(),
    }));
}

function formatValue(value: number, display: MacroDisplayKind, decimals = 2) {
  if (display === "percent") return `${formatNumber(value, decimals)}%`;
  if (display === "billions") return `$${formatNumber(value, 0)}bn`;
  if (display === "jobs") return `${value > 0 ? "+" : ""}${formatNumber(value, 0)}k`;
  if (display === "claims") return formatNumber(value, 0);
  return formatNumber(value, 2);
}

function formatChange(
  difference: number,
  change: MacroChangeKind,
  display: MacroDisplayKind,
) {
  if (Math.abs(difference) < 0.0001) return "Flat";
  if (change === "bp") {
    const basisPoints = Math.round(difference * 100);
    return `${basisPoints > 0 ? "+" : ""}${basisPoints} bp`;
  }
  if (change === "pp") {
    return `${difference > 0 ? "+" : ""}${difference.toFixed(2)} pp`;
  }
  if (display === "billions") {
    return `${difference > 0 ? "+" : ""}$${formatNumber(difference, 0)}bn`;
  }
  if (display === "jobs") {
    return `${difference > 0 ? "+" : ""}${formatNumber(difference, 0)}k`;
  }
  return `${difference > 0 ? "+" : ""}${formatNumber(difference, display === "claims" ? 0 : 2)}`;
}

function formatNumber(value: number, digits: number) {
  return new Intl.NumberFormat("en-GB", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function normalizeSource(source: string | null, releaseType: string | null): MacroSource {
  if (source === "ECB") return "ECB";
  if (source === "SNB") return "SNB";
  if (source === "BFS") return "BFS";
  if (source === "ONS") return "ONS";
  if (source === "BoE") return "BoE";
  if (source === "BOJ") return "BOJ";
  if (source === "e-Stat") return "e-Stat";
  if (source === "Eurostat") {
    return releaseType === "flash" ? "Eurostat flash" : "Eurostat";
  }
  if (source === "FRED fallback") return "FRED fallback";
  return source === "FRED / calculated" ? "FRED / calculated" : "FRED";
}

function isLiveSource(source: MacroSource) {
  return source === "ECB" || source === "Eurostat" ||
    source === "Eurostat flash" || source === "FRED fallback" ||
    source === "FRED" || source === "FRED / calculated" ||
    source === "SNB" || source === "BFS" || source === "ONS" ||
    source === "BoE" || source === "BOJ" || source === "e-Stat";
}

function isStale(date: Date, maxAgeDays?: number) {
  return (
    maxAgeDays !== undefined &&
    Date.now() - date.getTime() > maxAgeDays * 24 * 60 * 60 * 1000
  );
}
