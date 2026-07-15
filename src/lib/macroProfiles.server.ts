import "server-only";

import {
  FRED_SERIES,
  MACRO_REGION_CONFIGS,
  type FredSeriesConfig,
  type MacroChangeKind,
  type MacroDisplayKind,
} from "@/lib/data/macroRegions";
import { OFFICIAL_EURO_AREA_SERIES } from "@/lib/data/euroAreaConfig";
import { FOREX_FACTORY_PROVIDER } from "@/lib/data/forex-factory";
import { OFFICIAL_GLOBAL_SERIES } from "@/lib/data/global-series";
import {
  countryMacroProfiles,
  isLiveMacroSource,
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
    sourceRef: globalSourceRef(series),
  })),
];
function globalSourceRef(series: (typeof OFFICIAL_GLOBAL_SERIES)[number]) {
  if ("seriesCode" in series) return `${series.provider} series ${series.seriesCode}`;
  if ("timeseriesId" in series) return `${series.provider} ${series.datasetId}/${series.timeseriesId}`;
  if ("cubeId" in series) return `${series.provider} cube ${series.cubeId}`;
  if ("seriesId" in series) return `${series.provider} series ${series.seriesId}`;
  if ("seriesPath" in series) return `${series.provider} ${series.seriesPath}`;
  if ("seriesKey" in series) return `${series.provider} ${series.seriesKey}`;
  return `${series.provider} ${series.leftCode}-${series.rightCode}`;
}
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

    const trendedProfileIds = applyPolicyRateTrends(profiles, loadedSeries);
    applyBalanceSheetTrend(profiles, loadedSeries);
    markConnectedRegions(profiles, trendedProfileIds);
    await applyNextMeetingDates(profiles);
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

// One policy-rate series per region, all already synced (FRED for US, FRED-fallback-or-ECB for the
// Euro Area, SNB/BoE/BoJ direct for the rest) — reused here to derive a real "rates rising/falling"
// trend instead of leaving every non-US region's central bank stance permanently unset.
const REGION_POLICY_RATE_SERIES: Record<string, string> = {
  "united-states": "FEDFUNDS",
  eurozone: "ECB_DEPOSIT_RATE",
  switzerland: "CH_POLICY_RATE",
  "united-kingdom": "UK_POLICY_RATE",
  japan: "JP_POLICY_RATE",
};
const REGION_POLICY_TREND_METRIC: Record<string, string> = {
  "united-states": "us-policy-trend",
  eurozone: "eu-policy-trend",
  switzerland: "ch-policy-trend",
  "united-kingdom": "uk-policy-trend",
  japan: "jp-policy-trend",
};

function applyPolicyRateTrends(
  profiles: CountryMacroProfile[],
  loadedSeries: Map<string, SeriesPoint[]>,
): Set<string> {
  const trendedProfileIds = new Set<string>();

  for (const profile of profiles) {
    const seriesCode = REGION_POLICY_RATE_SERIES[profile.id];
    const metricId = REGION_POLICY_TREND_METRIC[profile.id];
    if (!seriesCode || !metricId) continue;

    applyThreeMonthTrend(profile, loadedSeries.get(seriesCode), metricId, "Tightening", "Easing");

    const policyTrend = profile.sections.centralBank.indicators.find((metric) => metric.id === metricId);
    if (policyTrend?.source === "FRED / calculated") {
      profile.stance = `${policyTrend.value} policy trend`;
      profile.stanceTone =
        policyTrend.value === "Tightening"
          ? "tight"
          : policyTrend.value === "Easing"
            ? "easing"
            : "neutral";
      trendedProfileIds.add(profile.id);
    }
  }

  return trendedProfileIds;
}

function applyBalanceSheetTrend(
  profiles: CountryMacroProfile[],
  loadedSeries: Map<string, SeriesPoint[]>,
) {
  const usProfile = profiles.find((profile) => profile.id === "united-states");
  if (!usProfile) return;

  applyThreeMonthTrend(
    usProfile,
    loadedSeries.get("FED_BALANCE_SHEET"),
    "us-balance-trend",
    "Expanding",
    "Shrinking",
  );
}

// Forex Factory's free feed only ever exposes "this week" (verified live — no next-week/next-month
// export exists), so this only finds a date when the decision happens to fall within the currently
// synced window. That's a real limitation of the free data source, not a bug: coverage improves on
// its own as each central bank's meeting week comes around and gets synced. Title patterns below are
// Forex Factory's typical naming for the headline rate-decision event per currency.
const REGION_CENTRAL_BANK_EVENT: Record<string, { currency: string; matches: (lowerTitle: string) => boolean }> = {
  "united-states": {
    currency: "USD",
    matches: (title) => (title.includes("fomc") && title.includes("statement")) || title === "federal funds rate",
  },
  eurozone: {
    currency: "EUR",
    matches: (title) => title.includes("ecb press conference") || title === "main refinancing rate",
  },
  switzerland: { currency: "CHF", matches: (title) => title.includes("snb policy rate") },
  "united-kingdom": { currency: "GBP", matches: (title) => title === "official bank rate" },
  japan: { currency: "JPY", matches: (title) => title.includes("boj policy rate") },
};

async function applyNextMeetingDates(profiles: CountryMacroProfile[]) {
  const upcoming = await prisma.economicEvent.findMany({
    where: { provider: FOREX_FACTORY_PROVIDER, eventTime: { gte: new Date() } },
    orderBy: { eventTime: "asc" },
    select: { title: true, currency: true, eventTime: true },
  });

  for (const [profileId, matcher] of Object.entries(REGION_CENTRAL_BANK_EVENT)) {
    const profile = profiles.find((item) => item.id === profileId);
    if (!profile) continue;

    const match = upcoming.find(
      (event) => event.currency === matcher.currency && matcher.matches(event.title.trim().toLowerCase()),
    );
    profile.nextMeeting = match ? formatDate(match.eventTime) : "No confirmed date in synced calendar";
  }
}

function markConnectedRegions(profiles: CountryMacroProfile[], trendedProfileIds: Set<string>) {
  for (const region of MACRO_REGION_CONFIGS) {
    const profile = profiles.find((item) => item.id === region.profileId);
    if (!profile || trendedProfileIds.has(region.profileId)) continue;

    const allMetrics = Object.values(profile.sections).flatMap((section) => section.indicators);
    const connectedMetrics = allMetrics.filter((metric) => isLiveSource(metric.source));
    const coreIds = coreMetricIds(profile.countryCode);
    const coreMetrics = allMetrics.filter((metric) => coreIds.includes(metric.id));
    const connectedCore = coreMetrics.filter((metric) => isLiveSource(metric.source));

    if (connectedMetrics.length === 0) {
      profile.stance = "Coming soon";
      profile.stanceTone = "neutral";
      continue;
    }

    if (connectedCore.length < coreIds.length) {
      profile.stance = "Partial data";
      profile.stanceTone = "neutral";
    } else if (connectedCore.some((metric) => metric.stale)) {
      profile.stance = "Stale data";
      profile.stanceTone = "neutral";
    } else {
      profile.stance = "Live data";
      profile.stanceTone = "neutral";
    }
  }
}

function coreMetricIds(countryCode: string) {
  if (countryCode === "EU") return ["eu-deposit", "eu-hicp", "eu-unemployment", "eu-eurusd", "eu-de-10y"];
  if (countryCode === "CH") return ["ch-policy", "ch-cpi", "ch-unemployment", "ch-gdp", "ch-10y", "ch-usd"];
  if (countryCode === "UK") return ["uk-policy", "uk-cpi", "uk-unemployment", "uk-fx"];
  if (countryCode === "JP") return ["jp-policy", "jp-cpi", "jp-unemployment", "jp-gdp", "jp-10y", "jp-fx"];
  return [];
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
  if (source === "DBnomics") return "DBnomics";
  if (source === "FRED/OECD") return "FRED/OECD";
  if (source === "FRED / Japan Cabinet Office") return "FRED / Japan Cabinet Office";
  if (source === "Bundesbank") return "Bundesbank";
  if (source === "MOF") return "MOF";
  if (source === "Calculated") return "Calculated";
  if (source === "e-Stat") return "e-Stat";
  if (source === "Eurostat") {
    return releaseType === "flash" ? "Eurostat flash" : "Eurostat";
  }
  if (source === "FRED fallback") return "FRED fallback";
  return source === "FRED / calculated" ? "FRED / calculated" : "FRED";
}

function isLiveSource(source: MacroSource) {
  return isLiveMacroSource(source);
}

function isStale(date: Date, maxAgeDays?: number) {
  return (
    maxAgeDays !== undefined &&
    Date.now() - date.getTime() > maxAgeDays * 24 * 60 * 60 * 1000
  );
}



