import { MacroCategory } from "@prisma/client";

import type { MacroUiBinding } from "@/lib/data/macroRegions";

type OfficialSeriesBase = {
  code: string;
  name: string;
  category: MacroCategory;
  country: "EU";
  unit: string;
  maxAgeDays: number;
  ui: MacroUiBinding;
};

export type EurostatSeriesConfig = OfficialSeriesBase & {
  provider: "EUROSTAT";
  dataset: "prc_hicp_minr" | "une_rt_m" | "namq_10_gdp";
  filterVariants: Array<Record<string, string>>;
  lastTimePeriod: number;
  estimatedReleaseType?: "flash" | "estimate";
};

export type EcbSeriesConfig = OfficialSeriesBase & {
  provider: "ECB";
  seriesKey: string;
  lastNObservations: number;
};

export type OfficialEuroAreaSeriesConfig =
  | EurostatSeriesConfig
  | EcbSeriesConfig;

const ui = (
  section: MacroUiBinding["section"],
  metricId: string,
  display: MacroUiBinding["display"],
  change: MacroUiBinding["change"],
  snapshotLabel?: string,
  profileField?: MacroUiBinding["profileField"],
  decimals?: number,
): MacroUiBinding => ({
  section,
  metricId,
  display,
  change,
  snapshotLabel,
  profileField,
  decimals,
});

const hicpFilters = (coicop18: string) => [
  { geo: "EA21", unit: "RCH_A", coicop18 },
  { geo: "EA20", unit: "RCH_A", coicop18 },
  { geo: "EA", unit: "RCH_A", coicop18 },
];

const labourFilters = (age: string) => [
  { geo: "EA21", sex: "T", age, unit: "PC_ACT", s_adj: "SA" },
  { geo: "EA20", sex: "T", age, unit: "PC_ACT", s_adj: "SA" },
];

const gdpFilters = (unit: string) => [
  { geo: "EA21", na_item: "B1GQ", s_adj: "SCA", unit },
  { geo: "EA20", na_item: "B1GQ", s_adj: "SCA", unit },
];

export const OFFICIAL_EURO_AREA_SERIES: OfficialEuroAreaSeriesConfig[] = [
  {
    provider: "ECB",
    code: "ECB_DEPOSIT_RATE",
    seriesKey: "FM.D.U2.EUR.4F.KR.DFR.LEV",
    name: "ECB Deposit Facility Rate",
    category: MacroCategory.CENTRAL_BANK,
    country: "EU",
    unit: "%",
    maxAgeDays: 10,
    lastNObservations: 900,
    ui: ui("centralBank", "eu-deposit", "percent", "bp", "ECB deposit", "policyRate", 2),
  },
  {
    provider: "ECB",
    code: "ECB_MAIN_REFINANCING_RATE",
    seriesKey: "FM.D.U2.EUR.4F.KR.MRR_FR.LEV",
    name: "ECB Main Refinancing Operations Rate",
    category: MacroCategory.CENTRAL_BANK,
    country: "EU",
    unit: "%",
    maxAgeDays: 10,
    lastNObservations: 900,
    ui: ui("centralBank", "eu-mro", "percent", "bp", "Main refinancing", undefined, 2),
  },
  {
    provider: "ECB",
    code: "ECB_MARGINAL_LENDING_RATE",
    seriesKey: "FM.D.U2.EUR.4F.KR.MLFR.LEV",
    name: "ECB Marginal Lending Facility Rate",
    category: MacroCategory.CENTRAL_BANK,
    country: "EU",
    unit: "%",
    maxAgeDays: 10,
    lastNObservations: 900,
    ui: ui("centralBank", "eu-marginal", "percent", "bp", undefined, undefined, 2),
  },
  {
    provider: "EUROSTAT",
    code: "EA_HICP_YOY",
    dataset: "prc_hicp_minr",
    filterVariants: hicpFilters("TOTAL"),
    lastTimePeriod: 120,
    estimatedReleaseType: "flash",
    name: "Euro Area HICP YoY",
    category: MacroCategory.INFLATION,
    country: "EU",
    unit: "%",
    maxAgeDays: 70,
    ui: ui("inflation", "eu-hicp", "percent", "pp", "HICP YoY", "inflation", 1),
  },
  {
    provider: "EUROSTAT",
    code: "EA_CORE_HICP_YOY",
    dataset: "prc_hicp_minr",
    filterVariants: hicpFilters("TOT_X_NRG_FOOD"),
    lastTimePeriod: 120,
    estimatedReleaseType: "flash",
    name: "Euro Area Core HICP YoY",
    category: MacroCategory.INFLATION,
    country: "EU",
    unit: "%",
    maxAgeDays: 70,
    ui: ui("inflation", "eu-core-hicp", "percent", "pp", "Core HICP YoY", undefined, 1),
  },
  {
    provider: "EUROSTAT",
    code: "EA_UNEMPLOYMENT",
    dataset: "une_rt_m",
    filterVariants: labourFilters("TOTAL"),
    lastTimePeriod: 120,
    name: "Euro Area Unemployment Rate",
    category: MacroCategory.LABOR,
    country: "EU",
    unit: "%",
    maxAgeDays: 70,
    ui: ui("labour", "eu-unemployment", "percent", "pp", "Unemployment", "unemployment", 1),
  },
  {
    provider: "EUROSTAT",
    code: "EA_YOUTH_UNEMPLOYMENT",
    dataset: "une_rt_m",
    filterVariants: labourFilters("Y_LT25"),
    lastTimePeriod: 120,
    name: "Euro Area Youth Unemployment Rate",
    category: MacroCategory.LABOR,
    country: "EU",
    unit: "%",
    maxAgeDays: 70,
    ui: ui("labour", "eu-youth-unemployment", "percent", "pp", undefined, undefined, 1),
  },
  {
    provider: "EUROSTAT",
    code: "EA_REAL_GDP_QOQ",
    dataset: "namq_10_gdp",
    filterVariants: gdpFilters("CLV_PCH_PRE"),
    lastTimePeriod: 80,
    estimatedReleaseType: "estimate",
    name: "Euro Area Real GDP Growth QoQ",
    category: MacroCategory.GROWTH,
    country: "EU",
    unit: "%",
    maxAgeDays: 160,
    ui: ui("growth", "eu-gdp", "percent", "pp", "Real GDP", undefined, 1),
  },
  {
    provider: "EUROSTAT",
    code: "EA_REAL_GDP_YOY",
    dataset: "namq_10_gdp",
    filterVariants: gdpFilters("CLV_PCH_SM"),
    lastTimePeriod: 80,
    estimatedReleaseType: "estimate",
    name: "Euro Area Real GDP Growth YoY",
    category: MacroCategory.GROWTH,
    country: "EU",
    unit: "%",
    maxAgeDays: 160,
    ui: ui("growth", "eu-gdp-yoy", "percent", "pp", undefined, undefined, 1),
  },
];
