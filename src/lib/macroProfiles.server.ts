import "server-only";

import {
  FRED_SERIES,
  MACRO_REGION_CONFIGS,
  type FredSeriesConfig,
  type MacroChangeKind,
  type MacroDisplayKind,
} from "@/lib/data/macroRegions";
import {
  countryMacroProfiles,
  type CountryMacroProfile,
  type MacroSource,
  type MacroTrendPoint,
} from "@/lib/macroProfiles";
import { prisma } from "@/lib/prisma";

type SeriesPoint = { date: Date; value: number };

const configByCode = new Map(FRED_SERIES.map((series) => [series.code, series]));
const regionByCode = new Map(
  MACRO_REGION_CONFIGS.flatMap((region) =>
    region.indicators.map((series) => [series.code, region] as const),
  ),
);

export async function getMacroProfiles(): Promise<CountryMacroProfile[]> {
  const profiles = structuredClone(countryMacroProfiles);

  try {
    const indicators = await prisma.macroIndicator.findMany({
      where: {
        code: { in: FRED_SERIES.map((series) => series.code) },
        source: { in: ["FRED", "FRED / calculated"] },
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

      if (isStale(latest.date, seriesConfig.maxAgeDays)) {
        markSeriesUnavailable(profile, seriesConfig, latest.date);
        continue;
      }

      loadedSeries.set(indicator.code, values);
      hydrateMetric(
        profile,
        seriesConfig,
        values,
        latest,
        previous,
        normalizeSource(indicator.source),
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
  config: FredSeriesConfig,
  values: SeriesPoint[],
  latest: SeriesPoint,
  previous: SeriesPoint | undefined,
  source: MacroSource,
) {
  const displayValue = formatValue(latest.value, config.ui.display);
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
    metric.context = `${config.name} · FRED series ${config.seriesId}`;
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
    }
  }

  if (config.ui.profileField) {
    profile[config.ui.profileField] = displayValue;
  }
}

function markSeriesUnavailable(
  profile: CountryMacroProfile,
  config: FredSeriesConfig,
  latestDate: Date,
) {
  const metric = profile.sections[config.ui.section].indicators.find(
    (item) => item.id === config.ui.metricId,
  );
  const context = `Latest FRED observation is stale (${formatDate(latestDate)})`;

  if (metric) {
    metric.value = "Data unavailable";
    metric.change = undefined;
    metric.history = [];
    metric.source = "Data unavailable";
    metric.latestDate = formatDate(latestDate);
    metric.context = context;
  }

  if (config.ui.snapshotLabel) {
    const snapshot = profile.snapshot.find(
      (item) => item.label === config.ui.snapshotLabel,
    );
    if (snapshot) {
      snapshot.value = "Data unavailable";
      snapshot.change = undefined;
      snapshot.source = "Data unavailable";
      snapshot.latestDate = formatDate(latestDate);
    }
  }

  if (config.ui.profileField) {
    profile[config.ui.profileField] = "Data unavailable";
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
      section.indicators.some((metric) => metric.source.startsWith("FRED")),
    );
    if (hasLiveMetric) {
      profile.stance = "Live data";
      profile.stanceTone = "neutral";
      profile.summary = `${region.regionName} macro data is synchronized server-side from ${region.sourceLabels.join(", ")} series available through FRED.`;
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
    }));
}

function formatValue(value: number, display: MacroDisplayKind) {
  if (display === "percent") return `${formatNumber(value, 2)}%`;
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

function normalizeSource(source: string | null): MacroSource {
  return source === "FRED / calculated" ? "FRED / calculated" : "FRED";
}

function isStale(date: Date, maxAgeDays?: number) {
  return (
    maxAgeDays !== undefined &&
    Date.now() - date.getTime() > maxAgeDays * 24 * 60 * 60 * 1000
  );
}
