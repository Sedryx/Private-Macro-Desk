import { MacroCategory } from "@prisma/client";

import type { MacroUiBinding } from "@/lib/data/macroRegions";

export type GlobalProvider = "SNB" | "BFS" | "ONS" | "BoE" | "BOJ" | "e-Stat";

type BaseGlobalSeries = {
  code: string;
  name: string;
  category: MacroCategory;
  country: "CH" | "UK" | "JP";
  unit: string;
  provider: GlobalProvider;
  sourceUrl: string;
  maxAgeDays: number;
  ui: MacroUiBinding;
};

export type BoeSeriesConfig = BaseGlobalSeries & {
  provider: "BoE";
  seriesCode: string;
};

export type OnsSeriesConfig = BaseGlobalSeries & {
  provider: "ONS";
  datasetId: string;
  timeseriesId: string;
};

export type UnresolvedOfficialSeriesConfig = BaseGlobalSeries & {
  provider: "SNB" | "BFS" | "ONS" | "BOJ" | "e-Stat";
  status: "unresolved";
  discoveryHint: string;
};

export type OfficialGlobalSeriesConfig =
  | BoeSeriesConfig
  | OnsSeriesConfig
  | UnresolvedOfficialSeriesConfig;

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

export const OFFICIAL_GLOBAL_SERIES: OfficialGlobalSeriesConfig[] = [
  {
    provider: "SNB",
    status: "unresolved",
    code: "CH_POLICY_RATE",
    name: "SNB Policy Rate",
    category: MacroCategory.CENTRAL_BANK,
    country: "CH",
    unit: "%",
    sourceUrl: "https://data.snb.ch/",
    discoveryHint: "Resolve the official SNB Data Portal series/table for the SNB policy rate from metadata before enabling sync.",
    maxAgeDays: 40,
    ui: ui("centralBank", "ch-policy", "percent", "bp", "SNB rate", "policyRate", 2),
  },
  {
    provider: "BFS",
    status: "unresolved",
    code: "CH_CPI_YOY",
    name: "Switzerland CPI YoY",
    category: MacroCategory.INFLATION,
    country: "CH",
    unit: "%",
    sourceUrl: "https://www.pxweb.bfs.admin.ch/",
    discoveryHint: "Resolve the official BFS PxWeb CPI annual-rate table/path from metadata before enabling sync.",
    maxAgeDays: 70,
    ui: ui("inflation", "ch-cpi", "percent", "pp", "CPI YoY", "inflation", 1),
  },
  {
    provider: "BFS",
    status: "unresolved",
    code: "CH_UNEMPLOYMENT",
    name: "Switzerland ILO Unemployment Rate",
    category: MacroCategory.LABOR,
    country: "CH",
    unit: "%",
    sourceUrl: "https://www.pxweb.bfs.admin.ch/",
    discoveryHint: "Resolve the official BFS PxWeb ILO unemployment-rate table/path from metadata before enabling sync.",
    maxAgeDays: 120,
    ui: ui("labour", "ch-unemployment", "percent", "pp", "Unemployment", "unemployment", 1),
  },
  {
    provider: "SNB",
    status: "unresolved",
    code: "CH_FX_PROXY",
    name: "CHF Effective Exchange Rate Index",
    category: MacroCategory.OTHER,
    country: "CH",
    unit: "index",
    sourceUrl: "https://data.snb.ch/",
    discoveryHint: "Resolve the official SNB CHF nominal/effective exchange-rate index series from metadata before enabling sync.",
    maxAgeDays: 40,
    ui: ui("ratesMarkets", "ch-fx", "index", "value", "CHF FX proxy", "marketProxy", 2),
  },
  {
    provider: "BoE",
    code: "UK_POLICY_RATE",
    name: "Bank of England Bank Rate",
    category: MacroCategory.CENTRAL_BANK,
    country: "UK",
    unit: "%",
    seriesCode: "IUDBEDR",
    sourceUrl: "https://www.bankofengland.co.uk/boeapps/database/Bank-Rate.asp",
    maxAgeDays: 40,
    ui: ui("centralBank", "uk-policy", "percent", "bp", "Bank Rate", "policyRate", 2),
  },
  {
    provider: "ONS",
    status: "unresolved",
    code: "UK_CPI_YOY",
    name: "UK CPI YoY",
    category: MacroCategory.INFLATION,
    country: "UK",
    unit: "%",
    sourceUrl: "https://www.ons.gov.uk/economy/inflationandpriceindices",
    discoveryHint: "Resolve the current official ONS API dataset/timeseries for CPI annual rate from metadata before enabling sync.",
    maxAgeDays: 70,
    ui: ui("inflation", "uk-cpi", "percent", "pp", "CPI YoY", "inflation", 1),
  },
  {
    provider: "ONS",
    status: "unresolved",
    code: "UK_UNEMPLOYMENT",
    name: "UK Unemployment Rate",
    category: MacroCategory.LABOR,
    country: "UK",
    unit: "%",
    sourceUrl: "https://www.ons.gov.uk/employmentandlabourmarket/peoplenotinwork/unemployment",
    discoveryHint: "Resolve the current official ONS API dataset/timeseries for unemployment rate from metadata before enabling sync.",
    maxAgeDays: 120,
    ui: ui("labour", "uk-unemployment", "percent", "pp", "Unemployment", "unemployment", 1),
  },
  {
    provider: "BoE",
    code: "UK_FX_PROXY",
    name: "Sterling Effective Exchange Rate Index",
    category: MacroCategory.OTHER,
    country: "UK",
    unit: "index",
    seriesCode: "XUDLERS",
    sourceUrl: "https://www.bankofengland.co.uk/boeapps/database/",
    maxAgeDays: 20,
    ui: ui("ratesMarkets", "uk-fx", "index", "value", "GBP FX proxy", "marketProxy", 2),
  },
  {
    provider: "BOJ",
    status: "unresolved",
    code: "JP_POLICY_RATE",
    name: "Bank of Japan Policy Rate",
    category: MacroCategory.CENTRAL_BANK,
    country: "JP",
    unit: "%",
    sourceUrl: "https://www.stat-search.boj.or.jp/",
    discoveryHint: "Resolve the official BOJ Time-Series Data Search API/statistical series for policy/overnight rate from metadata before enabling sync.",
    maxAgeDays: 40,
    ui: ui("centralBank", "jp-policy", "percent", "bp", "BoJ rate", "policyRate", 2),
  },
  {
    provider: "e-Stat",
    status: "unresolved",
    code: "JP_CPI_YOY",
    name: "Japan National CPI YoY",
    category: MacroCategory.INFLATION,
    country: "JP",
    unit: "%",
    sourceUrl: "https://www.e-stat.go.jp/en/api/",
    discoveryHint: "Resolve the official e-Stat CPI annual-rate statsDataId/series from metadata before enabling sync. E_STAT_APP_ID is required.",
    maxAgeDays: 70,
    ui: ui("inflation", "jp-cpi", "percent", "pp", "CPI YoY", "inflation", 1),
  },
  {
    provider: "e-Stat",
    status: "unresolved",
    code: "JP_UNEMPLOYMENT",
    name: "Japan Unemployment Rate",
    category: MacroCategory.LABOR,
    country: "JP",
    unit: "%",
    sourceUrl: "https://www.e-stat.go.jp/en/api/",
    discoveryHint: "Resolve the official e-Stat unemployment-rate statsDataId/series from metadata before enabling sync. E_STAT_APP_ID is required.",
    maxAgeDays: 70,
    ui: ui("labour", "jp-unemployment", "percent", "pp", "Unemployment", "unemployment", 1),
  },
  {
    provider: "BOJ",
    status: "unresolved",
    code: "JP_FX_PROXY",
    name: "JPY Effective Exchange Rate Index",
    category: MacroCategory.OTHER,
    country: "JP",
    unit: "index",
    sourceUrl: "https://www.stat-search.boj.or.jp/",
    discoveryHint: "Resolve the official BOJ effective exchange-rate index or approved USDJPY proxy from metadata before enabling sync.",
    maxAgeDays: 40,
    ui: ui("ratesMarkets", "jp-fx", "index", "value", "JPY FX proxy", "marketProxy", 2),
  },
];
