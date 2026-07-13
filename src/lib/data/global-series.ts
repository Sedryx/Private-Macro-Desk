import { MacroCategory } from "@prisma/client";

import type { MacroUiBinding } from "@/lib/data/macroRegions";

export type GlobalProvider =
  | "SNB"
  | "ONS"
  | "BoE"
  | "BOJ"
  | "DBnomics"
  | "FRED/OECD"
  | "FRED / Japan Cabinet Office"
  | "ECB"
  | "Bundesbank"
  | "MOF"
  | "Calculated";

export type GlobalCountry = "CH" | "UK" | "JP" | "EU";
export type GlobalFrequency = "daily" | "monthly" | "quarterly";
export type GlobalValueKind =
  | "rate"
  | "yield"
  | "inflation"
  | "unemployment"
  | "gdp_qoq"
  | "fx"
  | "index"
  | "spread";
export type GlobalTransform = "DIRECT" | "QOQ_PERCENT";

type BaseGlobalSeries = {
  code: string;
  name: string;
  category: MacroCategory;
  country: GlobalCountry;
  unit: string;
  provider: GlobalProvider;
  sourceUrl: string;
  maxAgeDays: number;
  frequency: GlobalFrequency;
  valueKind: GlobalValueKind;
  transform: GlobalTransform;
  ui: MacroUiBinding;
};

export type SnbSeriesConfig = BaseGlobalSeries & {
  provider: "SNB";
  cubeId: string;
  dimensions: { D0: string; D1?: string };
};

export type BoeSeriesConfig = BaseGlobalSeries & {
  provider: "BoE";
  seriesCode: string;
};

export type OnsSeriesConfig = BaseGlobalSeries & {
  provider: "ONS";
  datasetId: string;
  timeseriesId: string;
  generatorUri: string;
};

export type BojCsvSeriesConfig = BaseGlobalSeries & {
  provider: "BOJ";
  mode: "csv";
  csvUrl: string;
  seriesCode: string;
};

export type BojApiSeriesConfig = BaseGlobalSeries & {
  provider: "BOJ";
  mode: "api";
  database: string;
  seriesCode: string;
};

export type DbnomicsSeriesConfig = BaseGlobalSeries & {
  provider: "DBnomics";
  seriesPath: string;
};

export type FredGlobalSeriesConfig = BaseGlobalSeries & {
  provider: "FRED/OECD" | "FRED / Japan Cabinet Office";
  seriesId: string;
};

export type EcbGlobalSeriesConfig = BaseGlobalSeries & {
  provider: "ECB";
  seriesKey: string;
  lastNObservations?: number;
};

export type BundesbankSeriesConfig = BaseGlobalSeries & {
  provider: "Bundesbank";
  seriesKey: string;
};

export type MofSeriesConfig = BaseGlobalSeries & {
  provider: "MOF";
  csvUrl: string;
  seriesCode: string;
};

export type DerivedGlobalSeriesConfig = BaseGlobalSeries & {
  provider: "Calculated";
  formula: "SUBTRACT";
  leftCode: string;
  rightCode: string;
};

export type OfficialGlobalSeriesConfig =
  | SnbSeriesConfig
  | BoeSeriesConfig
  | OnsSeriesConfig
  | BojCsvSeriesConfig
  | BojApiSeriesConfig
  | DbnomicsSeriesConfig
  | FredGlobalSeriesConfig
  | EcbGlobalSeriesConfig
  | BundesbankSeriesConfig
  | MofSeriesConfig
  | DerivedGlobalSeriesConfig;

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
    code: "CH_POLICY_RATE",
    name: "SNB Policy Rate",
    category: MacroCategory.CENTRAL_BANK,
    country: "CH",
    unit: "%",
    cubeId: "snbgwdzid",
    dimensions: { D0: "LZ" },
    sourceUrl: "https://data.snb.ch/api/cube/snbgwdzid/data/csv/en?dimSel=D0(LZ)",
    maxAgeDays: 10,
    frequency: "daily",
    valueKind: "rate",
    transform: "DIRECT",
    ui: ui("centralBank", "ch-policy", "percent", "bp", "SNB rate", "policyRate", 2),
  },
  {
    provider: "SNB",
    code: "CH_CPI_YOY",
    name: "Switzerland CPI YoY",
    category: MacroCategory.INFLATION,
    country: "CH",
    unit: "%",
    cubeId: "plkopr",
    dimensions: { D0: "VVP" },
    sourceUrl: "https://data.snb.ch/api/cube/plkopr/data/csv/en?dimSel=D0(VVP)",
    maxAgeDays: 100,
    frequency: "monthly",
    valueKind: "inflation",
    transform: "DIRECT",
    ui: ui("inflation", "ch-cpi", "percent", "pp", "CPI YoY", "inflation", 1),
  },
  {
    provider: "SNB",
    code: "CH_CORE_CPI",
    name: "Switzerland Core CPI YoY",
    category: MacroCategory.INFLATION,
    country: "CH",
    unit: "%",
    cubeId: "plkoprinfla",
    dimensions: { D0: "KGM" },
    sourceUrl: "https://data.snb.ch/api/cube/plkoprinfla/data/csv/en?dimSel=D0(KGM)",
    maxAgeDays: 100,
    frequency: "monthly",
    valueKind: "inflation",
    transform: "DIRECT",
    ui: ui("inflation", "ch-core", "percent", "pp", "Core CPI", undefined, 1),
  },  {
    provider: "SNB",
    code: "CH_UNEMPLOYMENT",
    name: "Switzerland Registered Unemployment Rate (SECO)",
    category: MacroCategory.LABOR,
    country: "CH",
    unit: "%",
    cubeId: "amarbma",
    dimensions: { D0: "T1" },
    sourceUrl: "https://data.snb.ch/api/cube/amarbma/data/csv/en?dimSel=D0(T1)",
    maxAgeDays: 100,
    frequency: "monthly",
    valueKind: "unemployment",
    transform: "DIRECT",
    ui: ui("labour", "ch-unemployment", "percent", "pp", "Registered unemployment", "unemployment", 1),
  },
  {
    provider: "SNB",
    code: "CH_GDP",
    name: "Swiss Real GDP Growth q/q",
    category: MacroCategory.GROWTH,
    country: "CH",
    unit: "%",
    cubeId: "gdprpq",
    dimensions: { D0: "VVK", D1: "BBIPS" },
    sourceUrl: "https://data.snb.ch/api/cube/gdprpq/data/csv/en?dimSel=D0(VVK),D1(BBIPS)",
    maxAgeDays: 200,
    frequency: "quarterly",
    valueKind: "gdp_qoq",
    transform: "DIRECT",
    ui: ui("growth", "ch-gdp", "percent", "pp", "Real GDP", undefined, 1),
  },
  {
    provider: "SNB",
    code: "CH_1Y",
    name: "Swiss Confederation 1Y Yield",
    category: MacroCategory.RATES,
    country: "CH",
    unit: "%",
    cubeId: "rendoblid",
    dimensions: { D0: "1J" },
    sourceUrl: "https://data.snb.ch/api/cube/rendoblid/data/csv/en?dimSel=D0(1J)",
    maxAgeDays: 10,
    frequency: "daily",
    valueKind: "yield",
    transform: "DIRECT",
    ui: ui("ratesMarkets", "ch-1y", "percent", "bp", "CH 1Y", undefined, 2),
  },
  {
    provider: "SNB",
    code: "CH_5Y",
    name: "Swiss Confederation 5Y Yield",
    category: MacroCategory.RATES,
    country: "CH",
    unit: "%",
    cubeId: "rendoblid",
    dimensions: { D0: "5J" },
    sourceUrl: "https://data.snb.ch/api/cube/rendoblid/data/csv/en?dimSel=D0(5J)",
    maxAgeDays: 10,
    frequency: "daily",
    valueKind: "yield",
    transform: "DIRECT",
    ui: ui("ratesMarkets", "ch-5y", "percent", "bp", "CH 5Y", undefined, 2),
  },
  {
    provider: "SNB",
    code: "CH_10Y",
    name: "Swiss Confederation 10Y Yield",
    category: MacroCategory.RATES,
    country: "CH",
    unit: "%",
    cubeId: "rendoblid",
    dimensions: { D0: "10J0" },
    sourceUrl: "https://data.snb.ch/api/cube/rendoblid/data/csv/en?dimSel=D0(10J0)",
    maxAgeDays: 10,
    frequency: "daily",
    valueKind: "yield",
    transform: "DIRECT",
    ui: ui("ratesMarkets", "ch-10y", "percent", "bp", "CH 10Y", undefined, 2),
  },
  {
    provider: "SNB",
    code: "CH_USDCHF",
    name: "USD/CHF",
    category: MacroCategory.OTHER,
    country: "CH",
    unit: "CHF per USD",
    cubeId: "devkum",
    dimensions: { D0: "M0", D1: "USD1" },
    sourceUrl: "https://data.snb.ch/api/cube/devkum/data/csv/en?dimSel=D0(M0),D1(USD1)",
    maxAgeDays: 100,
    frequency: "monthly",
    valueKind: "fx",
    transform: "DIRECT",
    ui: ui("ratesMarkets", "ch-usd", "index", "value", "USD/CHF", "marketProxy", 4),
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
    maxAgeDays: 10,
    frequency: "daily",
    valueKind: "rate",
    transform: "DIRECT",
    ui: ui("centralBank", "uk-policy", "percent", "bp", "Bank Rate", "policyRate", 2),
  },
  {
    provider: "ONS",
    code: "UK_CPI_YOY",
    name: "UK CPI YoY",
    category: MacroCategory.INFLATION,
    country: "UK",
    unit: "%",
    datasetId: "MM23",
    timeseriesId: "D7G7",
    generatorUri: "/economy/inflationandpriceindices/timeseries/d7g7/mm23",
    sourceUrl: "https://www.ons.gov.uk/economy/inflationandpriceindices/timeseries/d7g7/mm23",
    maxAgeDays: 100,
    frequency: "monthly",
    valueKind: "inflation",
    transform: "DIRECT",
    ui: ui("inflation", "uk-cpi", "percent", "pp", "CPI YoY", "inflation", 1),
  },
  {
    provider: "ONS",
    code: "UK_UNEMPLOYMENT",
    name: "UK Unemployment Rate",
    category: MacroCategory.LABOR,
    country: "UK",
    unit: "%",
    datasetId: "LMS",
    timeseriesId: "MGSX",
    generatorUri: "/employmentandlabourmarket/peoplenotinwork/unemployment/timeseries/mgsx/lms",
    sourceUrl: "https://www.ons.gov.uk/employmentandlabourmarket/peoplenotinwork/unemployment/timeseries/mgsx/lms",
    maxAgeDays: 100,
    frequency: "monthly",
    valueKind: "unemployment",
    transform: "DIRECT",
    ui: ui("labour", "uk-unemployment", "percent", "pp", "Unemployment", "unemployment", 1),
  },
  {
    provider: "ONS",
    code: "UK_GDP",
    name: "UK Real GDP Growth q/q",
    category: MacroCategory.GROWTH,
    country: "UK",
    unit: "%",
    datasetId: "PN2",
    timeseriesId: "ABMI",
    generatorUri: "/economy/grossdomesticproductgdp/timeseries/abmi/pn2",
    sourceUrl: "https://www.ons.gov.uk/economy/grossdomesticproductgdp/timeseries/abmi/pn2",
    maxAgeDays: 200,
    frequency: "quarterly",
    valueKind: "gdp_qoq",
    transform: "QOQ_PERCENT",
    ui: ui("growth", "uk-gdp", "percent", "pp", "Real GDP", undefined, 1),
  },
  {
    provider: "BoE",
    code: "UK_5Y",
    name: "UK 5Y Gilt Yield",
    category: MacroCategory.RATES,
    country: "UK",
    unit: "%",
    seriesCode: "IUDSNPY",
    sourceUrl: "https://www.bankofengland.co.uk/boeapps/database/",
    maxAgeDays: 10,
    frequency: "daily",
    valueKind: "yield",
    transform: "DIRECT",
    ui: ui("ratesMarkets", "uk-5y", "percent", "bp", "UK 5Y", undefined, 2),
  },
  {
    provider: "BoE",
    code: "UK_10Y",
    name: "UK 10Y Gilt Yield",
    category: MacroCategory.RATES,
    country: "UK",
    unit: "%",
    seriesCode: "IUDMNPY",
    sourceUrl: "https://www.bankofengland.co.uk/boeapps/database/",
    maxAgeDays: 10,
    frequency: "daily",
    valueKind: "yield",
    transform: "DIRECT",
    ui: ui("ratesMarkets", "uk-10y", "percent", "bp", "UK 10Y", undefined, 2),
  },
  {
    provider: "BoE",
    code: "UK_FX_PROXY",
    name: "GBP/USD",
    category: MacroCategory.OTHER,
    country: "UK",
    unit: "USD per GBP",
    seriesCode: "XUDLUSS",
    sourceUrl: "https://www.bankofengland.co.uk/boeapps/database/",
    maxAgeDays: 10,
    frequency: "daily",
    valueKind: "fx",
    transform: "DIRECT",
    ui: ui("ratesMarkets", "uk-fx", "index", "value", "GBP/USD", "marketProxy", 4),
  },
  {
    provider: "BOJ",
    mode: "csv",
    code: "JP_POLICY_RATE",
    name: "BOJ Uncollateralized Overnight Call Rate",
    category: MacroCategory.CENTRAL_BANK,
    country: "JP",
    unit: "%",
    csvUrl: "https://www.stat-search.boj.or.jp/ssi/mtshtml/csv/fm01_d_1_en.csv",
    seriesCode: "FM01'STRDCLUCON",
    sourceUrl: "https://www.stat-search.boj.or.jp/ssi/mtshtml/fm01_d_1_en.html",
    maxAgeDays: 10,
    frequency: "daily",
    valueKind: "rate",
    transform: "DIRECT",
    ui: ui("centralBank", "jp-policy", "percent", "bp", "BoJ rate", "policyRate", 2),
  },
  {
    provider: "DBnomics",
    code: "JP_CPI_YOY",
    name: "Japan National CPI YoY",
    category: MacroCategory.INFLATION,
    country: "JP",
    unit: "%",
    seriesPath: "OECD/DSD_PRICES_COICOP2018@DF_PRICES_C2018_ALL/JPN.M.N.CPI.PA._T.N.GY",
    sourceUrl: "https://db.nomics.world/OECD/DSD_PRICES_COICOP2018@DF_PRICES_C2018_ALL/JPN.M.N.CPI.PA._T.N.GY",
    maxAgeDays: 100,
    frequency: "monthly",
    valueKind: "inflation",
    transform: "DIRECT",
    ui: ui("inflation", "jp-cpi", "percent", "pp", "CPI YoY", "inflation", 1),
  },
  {
    provider: "FRED/OECD",
    code: "JP_UNEMPLOYMENT",
    name: "Japan Unemployment Rate",
    category: MacroCategory.LABOR,
    country: "JP",
    unit: "%",
    seriesId: "LRUNTTTTJPM156S",
    sourceUrl: "https://fred.stlouisfed.org/series/LRUNTTTTJPM156S",
    maxAgeDays: 100,
    frequency: "monthly",
    valueKind: "unemployment",
    transform: "DIRECT",
    ui: ui("labour", "jp-unemployment", "percent", "pp", "Unemployment", "unemployment", 1),
  },
  {
    provider: "FRED / Japan Cabinet Office",
    code: "JP_GDP",
    name: "Japan Real GDP Growth q/q",
    category: MacroCategory.GROWTH,
    country: "JP",
    unit: "%",
    seriesId: "JPNRGDPEXP",
    sourceUrl: "https://fred.stlouisfed.org/series/JPNRGDPEXP",
    maxAgeDays: 200,
    frequency: "quarterly",
    valueKind: "gdp_qoq",
    transform: "QOQ_PERCENT",
    ui: ui("growth", "jp-gdp", "percent", "pp", "Real GDP", undefined, 1),
  },
  {
    provider: "MOF",
    code: "JP_1Y",
    name: "Japan 1Y Government Bond Yield",
    category: MacroCategory.RATES,
    country: "JP",
    unit: "%",
    csvUrl: "https://www.mof.go.jp/english/policy/jgbs/reference/interest_rate/historical/jgbcme_all.csv",
    seriesCode: "1Y",
    sourceUrl: "https://www.mof.go.jp/english/policy/jgbs/reference/interest_rate/index.htm",
    maxAgeDays: 10,
    frequency: "daily",
    valueKind: "yield",
    transform: "DIRECT",
    ui: ui("ratesMarkets", "jp-1y", "percent", "bp", "JP 1Y", undefined, 2),
  },
  {
    provider: "MOF",
    code: "JP_5Y",
    name: "Japan 5Y Government Bond Yield",
    category: MacroCategory.RATES,
    country: "JP",
    unit: "%",
    csvUrl: "https://www.mof.go.jp/english/policy/jgbs/reference/interest_rate/historical/jgbcme_all.csv",
    seriesCode: "5Y",
    sourceUrl: "https://www.mof.go.jp/english/policy/jgbs/reference/interest_rate/index.htm",
    maxAgeDays: 10,
    frequency: "daily",
    valueKind: "yield",
    transform: "DIRECT",
    ui: ui("ratesMarkets", "jp-5y", "percent", "bp", "JP 5Y", undefined, 2),
  },
  {
    provider: "FRED/OECD",
    code: "JP_10Y",
    name: "Japan 10Y Government Bond Yield",
    category: MacroCategory.RATES,
    country: "JP",
    unit: "%",
    seriesId: "IRLTLT01JPM156N",
    sourceUrl: "https://fred.stlouisfed.org/series/IRLTLT01JPM156N",
    maxAgeDays: 100,
    frequency: "monthly",
    valueKind: "yield",
    transform: "DIRECT",
    ui: ui("ratesMarkets", "jp-10y", "percent", "bp", "JP 10Y", undefined, 2),
  },
  {
    provider: "BOJ",
    mode: "csv",
    code: "JP_FX_PROXY",
    name: "USD/JPY",
    category: MacroCategory.OTHER,
    country: "JP",
    unit: "JPY per USD",
    csvUrl: "https://www.stat-search.boj.or.jp/ssi/mtshtml/csv/fm08_m_1_en.csv",
    seriesCode: "FM08'FXERM07",
    sourceUrl: "https://www.stat-search.boj.or.jp/ssi/mtshtml/fm08_m_1_en.html",
    maxAgeDays: 100,
    frequency: "monthly",
    valueKind: "fx",
    transform: "DIRECT",
    ui: ui("ratesMarkets", "jp-fx", "index", "value", "USD/JPY", "marketProxy", 2),
  },
  {
    provider: "ECB",
    code: "EU_EURUSD",
    name: "EUR/USD",
    category: MacroCategory.OTHER,
    country: "EU",
    unit: "USD per EUR",
    seriesKey: "EXR.D.USD.EUR.SP00.A",
    lastNObservations: 1500,
    sourceUrl: "https://data.ecb.europa.eu/data/datasets/EXR/EXR.D.USD.EUR.SP00.A",
    maxAgeDays: 10,
    frequency: "daily",
    valueKind: "fx",
    transform: "DIRECT",
    ui: ui("ratesMarkets", "eu-eurusd", "index", "value", "EUR/USD", "marketProxy", 4),
  },
  {
    provider: "Bundesbank",
    code: "EU_DE_1Y",
    name: "Germany 1Y Bund Yield",
    category: MacroCategory.RATES,
    country: "EU",
    unit: "%",
    seriesKey: "D.I.ZAR.ZI.EUR.S1311.B.A604.R01XX.R.A.A._Z._Z.A",
    sourceUrl: "https://www.bundesbank.de/en/statistics/money-and-capital-markets/interest-rates-and-yields/daily-term-structure-of-interest-rates-on-listed-federal-securities-650724",
    maxAgeDays: 10,
    frequency: "daily",
    valueKind: "yield",
    transform: "DIRECT",
    ui: ui("ratesMarkets", "eu-de-1y", "percent", "bp", "Germany 1Y", undefined, 2),
  },
  {
    provider: "Bundesbank",
    code: "EU_DE_5Y",
    name: "Germany 5Y Bund Yield",
    category: MacroCategory.RATES,
    country: "EU",
    unit: "%",
    seriesKey: "D.I.ZAR.ZI.EUR.S1311.B.A604.R05XX.R.A.A._Z._Z.A",
    sourceUrl: "https://www.bundesbank.de/en/statistics/money-and-capital-markets/interest-rates-and-yields/daily-term-structure-of-interest-rates-on-listed-federal-securities-650724",
    maxAgeDays: 10,
    frequency: "daily",
    valueKind: "yield",
    transform: "DIRECT",
    ui: ui("ratesMarkets", "eu-de-5y", "percent", "bp", "Germany 5Y", undefined, 2),
  },
  {
    provider: "FRED/OECD",
    code: "EU_DE_10Y",
    name: "Germany 10Y Bund Yield",
    category: MacroCategory.RATES,
    country: "EU",
    unit: "%",
    seriesId: "IRLTLT01DEM156N",
    sourceUrl: "https://fred.stlouisfed.org/series/IRLTLT01DEM156N",
    maxAgeDays: 100,
    frequency: "monthly",
    valueKind: "yield",
    transform: "DIRECT",
    ui: ui("ratesMarkets", "eu-de-10y", "percent", "bp", "Germany 10Y", undefined, 2),
  },
  {
    provider: "FRED/OECD",
    code: "EU_FR_10Y",
    name: "France 10Y Government Bond Yield",
    category: MacroCategory.RATES,
    country: "EU",
    unit: "%",
    seriesId: "IRLTLT01FRM156N",
    sourceUrl: "https://fred.stlouisfed.org/series/IRLTLT01FRM156N",
    maxAgeDays: 100,
    frequency: "monthly",
    valueKind: "yield",
    transform: "DIRECT",
    ui: ui("ratesMarkets", "eu-fr-10y", "percent", "bp", "France 10Y", undefined, 2),
  },
  {
    provider: "FRED/OECD",
    code: "EU_IT_10Y",
    name: "Italy 10Y Government Bond Yield",
    category: MacroCategory.RATES,
    country: "EU",
    unit: "%",
    seriesId: "IRLTLT01ITM156N",
    sourceUrl: "https://fred.stlouisfed.org/series/IRLTLT01ITM156N",
    maxAgeDays: 100,
    frequency: "monthly",
    valueKind: "yield",
    transform: "DIRECT",
    ui: ui("ratesMarkets", "eu-it-10y", "percent", "bp", "Italy 10Y", undefined, 2),
  },
  {
    provider: "Calculated",
    code: "EU_FR_DE_10Y_SPREAD",
    name: "France-Germany 10Y Spread",
    category: MacroCategory.RATES,
    country: "EU",
    unit: "pp",
    formula: "SUBTRACT",
    leftCode: "EU_FR_10Y",
    rightCode: "EU_DE_10Y",
    sourceUrl: "Calculated from FRED/OECD IRLTLT01FRM156N minus IRLTLT01DEM156N",
    maxAgeDays: 100,
    frequency: "monthly",
    valueKind: "spread",
    transform: "DIRECT",
    ui: ui("ratesMarkets", "eu-fr-de-spread", "percent", "bp", "FR-DE spread", undefined, 2),
  },
  {
    provider: "Calculated",
    code: "EU_IT_DE_10Y_SPREAD",
    name: "Italy-Germany 10Y Spread",
    category: MacroCategory.RATES,
    country: "EU",
    unit: "pp",
    formula: "SUBTRACT",
    leftCode: "EU_IT_10Y",
    rightCode: "EU_DE_10Y",
    sourceUrl: "Calculated from FRED/OECD IRLTLT01ITM156N minus IRLTLT01DEM156N",
    maxAgeDays: 100,
    frequency: "monthly",
    valueKind: "spread",
    transform: "DIRECT",
    ui: ui("ratesMarkets", "eu-it-de-spread", "percent", "bp", "IT-DE spread", undefined, 2),
  },];
