import "server-only";

import {
  countryMacroProfiles,
  type CountryMacroProfile,
  type MacroSectionKey,
  type MacroSource,
  type MacroTrendPoint,
} from "@/lib/macroProfiles";
import { prisma } from "@/lib/prisma";

type DisplayKind = "percent" | "billions" | "jobs" | "claims" | "index";
type ChangeKind = "bp" | "pp" | "value";

type FredBinding = {
  section: MacroSectionKey;
  metricId: string;
  display: DisplayKind;
  change: ChangeKind;
  snapshotLabel?: string;
};

type SeriesPoint = { date: Date; value: number };

const fredBindings: Record<string, FredBinding> = {
  FEDFUNDS: binding("centralBank", "us-policy", "percent", "bp", "Fed funds"),
  FED_BALANCE_SHEET: binding("centralBank", "us-balance", "billions", "value"),
  US_CPI_YOY: binding("inflation", "us-cpi", "percent", "pp", "CPI YoY"),
  US_CORE_CPI_YOY: binding("inflation", "us-core-cpi", "percent", "pp"),
  US_PCE_YOY: binding("inflation", "us-pce", "percent", "pp"),
  US_CORE_PCE_YOY: binding("inflation", "us-core-pce", "percent", "pp"),
  US_UNEMPLOYMENT: binding("labour", "us-unemployment", "percent", "pp", "Unemployment"),
  US_NFP_CHANGE: binding("labour", "us-nfp", "jobs", "value"),
  US_INITIAL_CLAIMS: binding("labour", "us-claims", "claims", "value"),
  US_AVG_HOURLY_EARNINGS_YOY: binding("labour", "us-wages", "percent", "pp"),
  US_REAL_GDP_GROWTH: binding("growth", "us-gdp", "percent", "pp", "Real GDP"),
  US_RETAIL_SALES_MOM: binding("growth", "us-retail", "percent", "pp"),
  US_INDUSTRIAL_PRODUCTION_YOY: binding("growth", "us-industrial-production", "percent", "pp"),
  US_CONSUMER_SENTIMENT: binding("growth", "us-sentiment", "index", "value"),
  US2Y: binding("ratesMarkets", "us-2y", "percent", "bp"),
  US10Y: binding("ratesMarkets", "us-10y", "percent", "bp", "US 10Y"),
  US_2Y10Y_CURVE: binding("ratesMarkets", "us-curve", "percent", "bp"),
  US_DOLLAR_BROAD_INDEX: binding("ratesMarkets", "us-dollar", "index", "value", "Broad USD"),
};

export async function getMacroProfiles(): Promise<CountryMacroProfile[]> {
  const profiles = structuredClone(countryMacroProfiles);

  try {
    const indicators = await prisma.macroIndicator.findMany({
      where: {
        code: { in: Object.keys(fredBindings) },
        source: { in: ["FRED", "FRED / calculated"] },
      },
      include: {
        values: {
          orderBy: { date: "desc" },
          take: 520,
        },
      },
    });

    const usProfile = profiles.find((profile) => profile.id === "united-states");
    if (!usProfile) return profiles;

    const loadedSeries = new Map<string, SeriesPoint[]>();

    for (const indicator of indicators) {
      const bindingConfig = fredBindings[indicator.code];
      if (!bindingConfig || indicator.values.length === 0) continue;

      const values = indicator.values
        .map((item) => ({ date: item.date, value: item.value.toNumber() }))
        .reverse();
      const latest = values.at(-1);
      const previous = values.at(-2);
      if (!latest) continue;

      loadedSeries.set(indicator.code, values);

      const source = normalizeSource(indicator.source);
      const displayValue = formatValue(latest.value, bindingConfig.display);
      const displayChange = formatChange(
        latest.value - (previous?.value ?? latest.value),
        bindingConfig.change,
        bindingConfig.display,
      );
      const latestDate = formatDate(latest.date);
      const metric = usProfile.sections[bindingConfig.section].indicators.find(
        (item) => item.id === bindingConfig.metricId,
      );

      if (metric) {
        metric.value = displayValue;
        metric.change = displayChange;
        metric.history = toChartPoints(values);
        metric.source = source;
        metric.latestDate = latestDate;
      }

      if (bindingConfig.snapshotLabel) {
        const snapshot = usProfile.snapshot.find(
          (item) => item.label === bindingConfig.snapshotLabel,
        );
        if (snapshot) {
          snapshot.value = displayValue;
          snapshot.change = displayChange;
          snapshot.source = source;
          snapshot.latestDate = latestDate;
        }
      }

      if (indicator.code === "FEDFUNDS") usProfile.policyRate = displayValue;
      if (indicator.code === "US_CPI_YOY") usProfile.inflation = displayValue;
      if (indicator.code === "US_UNEMPLOYMENT") usProfile.unemployment = displayValue;
      if (indicator.code === "US_DOLLAR_BROAD_INDEX") usProfile.marketProxy = displayValue;
    }

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

    return profiles;
  } catch (error) {
    console.error("Unable to load FRED macro values from PostgreSQL", error);
    return profiles;
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
  const comparison = values
    .filter((point) => point.date <= targetDate)
    .at(-1);
  if (!comparison) return;

  const difference = latest.value - comparison.value;
  const trend =
    Math.abs(difference) < 0.0001
      ? "Flat"
      : difference > 0
        ? risingLabel
        : fallingLabel;
  const metric = profile.sections.centralBank.indicators.find(
    (item) => item.id === metricId,
  );
  if (!metric) return;

  metric.value = trend;
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

function formatValue(value: number, display: DisplayKind) {
  if (display === "percent") return `${formatNumber(value, 2)}%`;
  if (display === "billions") return `$${formatNumber(value, 0)}bn`;
  if (display === "jobs") return `${value > 0 ? "+" : ""}${formatNumber(value, 0)}k`;
  if (display === "claims") return formatNumber(value, 0);
  return formatNumber(value, 2);
}

function formatChange(
  difference: number,
  change: ChangeKind,
  display: DisplayKind,
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

function binding(
  section: MacroSectionKey,
  metricId: string,
  display: DisplayKind,
  change: ChangeKind,
  snapshotLabel?: string,
): FredBinding {
  return { section, metricId, display, change, snapshotLabel };
}
