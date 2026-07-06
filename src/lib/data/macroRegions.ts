import { MacroCategory } from "@prisma/client";

import type { MacroSectionKey } from "@/lib/macroProfiles";

export type MacroDataStatus = "live" | "not_connected" | "placeholder";
export type FredTransform =
  | "DIRECT"
  | "YOY_PERCENT"
  | "MOM_PERCENT"
  | "PERIOD_PERCENT"
  | "MONTHLY_CHANGE";
export type MacroDisplayKind =
  | "percent"
  | "billions"
  | "jobs"
  | "claims"
  | "index";
export type MacroChangeKind = "bp" | "pp" | "value";

export type MacroUiBinding = {
  section: MacroSectionKey;
  metricId: string;
  display: MacroDisplayKind;
  change: MacroChangeKind;
  snapshotLabel?: string;
  profileField?: "policyRate" | "inflation" | "unemployment" | "marketProxy";
  decimals?: number;
};

export type FredSeriesConfig = {
  code: string;
  seriesId: string;
  name: string;
  category: MacroCategory;
  country: string;
  unit: string;
  transform: FredTransform;
  scale?: number;
  maxAgeDays?: number;
  ui: MacroUiBinding;
};

export type MacroRegionConfig = {
  profileId: string;
  regionName: string;
  countryCode: string;
  centralBank: string;
  currency: string;
  dataStatus: MacroDataStatus;
  sourceLabels: string[];
  indicators: FredSeriesConfig[];
};

const usIndicators: FredSeriesConfig[] = [
  series("US", "FEDFUNDS", "FEDFUNDS", "Federal Funds Effective Rate", MacroCategory.RATES, "%", "DIRECT", ui("centralBank", "us-policy", "percent", "bp", "Fed funds", "policyRate")),
  series("US", "FED_BALANCE_SHEET", "WALCL", "Federal Reserve Balance Sheet", MacroCategory.CENTRAL_BANK, "USD billions", "DIRECT", ui("centralBank", "us-balance", "billions", "value"), { scale: 0.001 }),
  series("US", "US_CPI_YOY", "CPIAUCSL", "US CPI YoY", MacroCategory.INFLATION, "%", "YOY_PERCENT", ui("inflation", "us-cpi", "percent", "pp", "CPI YoY", "inflation")),
  series("US", "US_CORE_CPI_YOY", "CPILFESL", "US Core CPI YoY", MacroCategory.INFLATION, "%", "YOY_PERCENT", ui("inflation", "us-core-cpi", "percent", "pp")),
  series("US", "US_PCE_YOY", "PCEPI", "US PCE YoY", MacroCategory.INFLATION, "%", "YOY_PERCENT", ui("inflation", "us-pce", "percent", "pp")),
  series("US", "US_CORE_PCE_YOY", "PCEPILFE", "US Core PCE YoY", MacroCategory.INFLATION, "%", "YOY_PERCENT", ui("inflation", "us-core-pce", "percent", "pp")),
  series("US", "US_UNEMPLOYMENT", "UNRATE", "US Unemployment Rate", MacroCategory.LABOR, "%", "DIRECT", ui("labour", "us-unemployment", "percent", "pp", "Unemployment", "unemployment")),
  series("US", "US_NFP_CHANGE", "PAYEMS", "US Nonfarm Payrolls Monthly Change", MacroCategory.LABOR, "k jobs", "MONTHLY_CHANGE", ui("labour", "us-nfp", "jobs", "value")),
  series("US", "US_INITIAL_CLAIMS", "ICSA", "US Initial Jobless Claims", MacroCategory.LABOR, "claims", "DIRECT", ui("labour", "us-claims", "claims", "value")),
  series("US", "US_AVG_HOURLY_EARNINGS_YOY", "CES0500000003", "US Average Hourly Earnings YoY", MacroCategory.LABOR, "%", "YOY_PERCENT", ui("labour", "us-wages", "percent", "pp")),
  series("US", "US_REAL_GDP_GROWTH", "A191RL1Q225SBEA", "US Real GDP Growth", MacroCategory.GROWTH, "%", "DIRECT", ui("growth", "us-gdp", "percent", "pp", "Real GDP")),
  series("US", "US_RETAIL_SALES_MOM", "RSAFS", "US Retail Sales MoM", MacroCategory.GROWTH, "%", "MOM_PERCENT", ui("growth", "us-retail", "percent", "pp")),
  series("US", "US_INDUSTRIAL_PRODUCTION_YOY", "INDPRO", "US Industrial Production YoY", MacroCategory.GROWTH, "%", "YOY_PERCENT", ui("growth", "us-industrial-production", "percent", "pp")),
  series("US", "US_CONSUMER_SENTIMENT", "UMCSENT", "US Consumer Sentiment", MacroCategory.GROWTH, "index", "DIRECT", ui("growth", "us-sentiment", "index", "value")),
  series("US", "US1Y", "DGS1", "US 1Y Treasury Yield", MacroCategory.RATES, "%", "DIRECT", ui("ratesMarkets", "us-1y", "percent", "bp")),
  series("US", "US5Y", "DGS5", "US 5Y Treasury Yield", MacroCategory.RATES, "%", "DIRECT", ui("ratesMarkets", "us-5y", "percent", "bp")),
  series("US", "US10Y", "DGS10", "US 10Y Treasury Yield", MacroCategory.RATES, "%", "DIRECT", ui("ratesMarkets", "us-10y", "percent", "bp", "US 10Y")),
  series("US", "US_DOLLAR_BROAD_INDEX", "DTWEXBGS", "Nominal Broad US Dollar Index", MacroCategory.OTHER, "index", "DIRECT", ui("ratesMarkets", "us-dollar", "index", "value", "Broad USD", "marketProxy")),
];

const euroAreaIndicators: FredSeriesConfig[] = [
  series("EU", "ECB_DEPOSIT_RATE", "ECBDFR", "ECB Deposit Facility Rate", MacroCategory.CENTRAL_BANK, "%", "DIRECT", ui("centralBank", "eu-deposit", "percent", "bp", "ECB deposit", "policyRate")),
  series("EU", "ECB_MAIN_REFINANCING_RATE", "ECBMRRFR", "ECB Main Refinancing Operations Rate", MacroCategory.CENTRAL_BANK, "%", "DIRECT", ui("centralBank", "eu-mro", "percent", "bp", "Main refinancing")),
  series("EU", "EA_HICP_YOY", "CP0000EZCCM086NEST", "Euro Area HICP YoY", MacroCategory.INFLATION, "%", "YOY_PERCENT", ui("inflation", "eu-hicp", "percent", "pp", "HICP YoY", "inflation")),
  series("EU", "EA_CORE_HICP_YOY", "00XEFDEZCCM086NEST", "Euro Area Core HICP YoY", MacroCategory.INFLATION, "%", "YOY_PERCENT", ui("inflation", "eu-core-hicp", "percent", "pp", "Core HICP YoY")),
  series("EU", "EA_UNEMPLOYMENT", "LRHUTTTTEZM156S", "Euro Area Unemployment Rate", MacroCategory.LABOR, "%", "DIRECT", ui("labour", "eu-unemployment", "percent", "pp", "Unemployment", "unemployment"), { maxAgeDays: 400 }),
  series("EU", "EA_REAL_GDP_QOQ", "CLV10MNACB1GQSCAEA20Q", "Euro Area Real GDP Growth QoQ", MacroCategory.GROWTH, "%", "PERIOD_PERCENT", ui("growth", "eu-gdp", "percent", "pp", "Real GDP")),
];

export const MACRO_REGION_CONFIGS: MacroRegionConfig[] = [
  {
    profileId: "united-states",
    regionName: "United States",
    countryCode: "US",
    centralBank: "Federal Reserve",
    currency: "USD",
    dataStatus: "live",
    sourceLabels: ["FRED"],
    indicators: usIndicators,
  },
  {
    profileId: "eurozone",
    regionName: "Euro Area",
    countryCode: "EU",
    centralBank: "European Central Bank",
    currency: "EUR",
    dataStatus: "live",
    sourceLabels: ["FRED", "ECB", "Eurostat"],
    indicators: euroAreaIndicators,
  },
  {
    profileId: "switzerland",
    regionName: "Switzerland",
    countryCode: "CH",
    centralBank: "Swiss National Bank",
    currency: "CHF",
    dataStatus: "not_connected",
    sourceLabels: [],
    indicators: [],
  },
  {
    profileId: "united-kingdom",
    regionName: "United Kingdom",
    countryCode: "UK",
    centralBank: "Bank of England",
    currency: "GBP",
    dataStatus: "not_connected",
    sourceLabels: [],
    indicators: [],
  },
  {
    profileId: "japan",
    regionName: "Japan",
    countryCode: "JP",
    centralBank: "Bank of Japan",
    currency: "JPY",
    dataStatus: "not_connected",
    sourceLabels: [],
    indicators: [],
  },
];

export const FRED_SERIES = MACRO_REGION_CONFIGS.flatMap(
  (region) => region.indicators,
);

function series(
  country: string,
  code: string,
  seriesId: string,
  name: string,
  category: MacroCategory,
  unit: string,
  transform: FredTransform,
  uiBinding: MacroUiBinding,
  options: Pick<FredSeriesConfig, "scale" | "maxAgeDays"> = {},
): FredSeriesConfig {
  return {
    country,
    code,
    seriesId,
    name,
    category,
    unit,
    transform,
    ui: uiBinding,
    ...options,
  };
}

function ui(
  section: MacroSectionKey,
  metricId: string,
  display: MacroDisplayKind,
  change: MacroChangeKind,
  snapshotLabel?: string,
  profileField?: MacroUiBinding["profileField"],
): MacroUiBinding {
  return { section, metricId, display, change, snapshotLabel, profileField };
}
