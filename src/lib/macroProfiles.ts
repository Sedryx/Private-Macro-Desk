export type MacroSectionKey =
  | "centralBank"
  | "inflation"
  | "labour"
  | "growth"
  | "ratesMarkets";

export type MacroTrendPoint = { label: string; value: number; date?: string };
export type MacroSource =
  | "FRED"
  | "FRED / calculated"
  | "FRED fallback"
  | "Eurostat"
  | "Eurostat flash"
  | "ECB"
  | "SNB"
  | "BFS"
  | "ONS"
  | "BoE"
  | "BOJ"
  | "DBnomics"
  | "FRED/OECD"
  | "FRED / Japan Cabinet Office"
  | "Bundesbank"
  | "MOF"
  | "Calculated"
  | "e-Stat"
  | "Not connected"
  | "Data unavailable"
  | "Coming soon"
  | "Live data";

export type MacroMetric = {
  id: string;
  label: string;
  value: string;
  change?: string;
  context?: string;
  source: MacroSource;
  latestDate?: string;
  sourceUpdatedDate?: string;
  releaseType?: string;
  stale?: boolean;
  history: MacroTrendPoint[];
};

export type MacroSection = {
  title: string;
  shortTitle: string;
  indicators: MacroMetric[];
};

export type CountryMacroProfile = {
  id: string;
  tabLabel: string;
  country: string;
  countryCode: string;
  centralBank: string;
  currency: string;
  policyRate: string;
  nextMeeting: string;
  stance: string;
  stanceTone: "tight" | "neutral" | "easing";
  inflation: string;
  unemployment: string;
  marketProxy: string;
  snapshot: Array<
    Pick<MacroMetric, "label" | "value" | "change"> &
      Partial<Pick<MacroMetric, "source" | "latestDate" | "sourceUpdatedDate" | "releaseType" | "stale">>
  >;
  sections: Record<MacroSectionKey, MacroSection>;
};

const LIVE_MACRO_SOURCES: MacroSource[] = [
  "FRED",
  "FRED / calculated",
  "FRED fallback",
  "Eurostat",
  "Eurostat flash",
  "ECB",
  "SNB",
  "BFS",
  "ONS",
  "BoE",
  "BOJ",
  "DBnomics",
  "FRED/OECD",
  "FRED / Japan Cabinet Office",
  "Bundesbank",
  "MOF",
  "Calculated",
  "e-Stat",
];

export function isLiveMacroSource(source: MacroSource): boolean {
  return LIVE_MACRO_SOURCES.includes(source);
}

export const macroSectionOrder: MacroSectionKey[] = [
  "centralBank",
  "inflation",
  "labour",
  "growth",
  "ratesMarkets",
];

function section(title: string, shortTitle: string, indicators: MacroMetric[]): MacroSection {
  return { title, shortTitle, indicators };
}

function notConnectedMetric(
  id: string,
  label: string,
  context?: string,
): MacroMetric {
  return {
    id,
    label,
    value: "Not connected yet",
    context,
    source: "Not connected",
    history: [],
  };
}

function notConnectedSnapshot(label: string): CountryMacroProfile["snapshot"][number] {
  return { label, value: "Not connected yet", source: "Not connected" };
}

function markProfileAsComingSoon(profile: CountryMacroProfile) {
  profile.policyRate = "Not connected yet";
  profile.nextMeeting = "Coming soon";
  profile.stance = "Coming soon";
  profile.stanceTone = "neutral";
  profile.inflation = "Not connected yet";
  profile.unemployment = "Not connected yet";
  profile.marketProxy = "Not connected yet";
  profile.snapshot = profile.snapshot.map((item) => ({
    label: item.label,
    value: "Not connected yet",
    source: "Coming soon",
  }));

  for (const macroSection of Object.values(profile.sections)) {
    macroSection.indicators = macroSection.indicators.map((indicator) => ({
      id: indicator.id,
      label: indicator.label,
      value: "Not connected yet",
      context: "Static placeholder — official data source not connected",
      source: "Coming soon",
      history: [],
    }));
  }
}

const profiles: CountryMacroProfile[] = [];

profiles.push({
  id: "united-states",
  tabLabel: "United States",
  country: "United States",
  countryCode: "US",
  centralBank: "Federal Reserve",
  currency: "USD",
  policyRate: "Not connected yet",
  nextMeeting: "Not connected yet",
  stance: "Awaiting FRED sync",
  stanceTone: "neutral",
  inflation: "Not connected yet",
  unemployment: "Not connected yet",
  marketProxy: "Not connected yet",
  snapshot: [
    notConnectedSnapshot("Fed funds"),
    notConnectedSnapshot("CPI YoY"),
    notConnectedSnapshot("Unemployment"),
    notConnectedSnapshot("Real GDP"),
    notConnectedSnapshot("US 10Y"),
    notConnectedSnapshot("Broad USD"),
  ],
  sections: {
    centralBank: section("Federal Reserve", "Central Bank", [
      notConnectedMetric("us-policy", "Federal Funds Effective Rate"),
      notConnectedMetric("us-balance", "Fed Balance Sheet"),
      notConnectedMetric("us-policy-trend", "Fed Policy Trend", "Compared with three months earlier"),
      notConnectedMetric("us-balance-trend", "Balance Sheet Trend", "Compared with three months earlier"),
    ]),
    inflation: section("US inflation pulse", "Inflation", [
      notConnectedMetric("us-cpi", "US CPI YoY"),
      notConnectedMetric("us-core-cpi", "US Core CPI YoY"),
      notConnectedMetric("us-pce", "US PCE YoY"),
      notConnectedMetric("us-core-pce", "US Core PCE YoY"),
    ]),
    labour: section("US labour market", "Labour", [
      notConnectedMetric("us-nfp", "Nonfarm Payrolls Monthly Change"),
      notConnectedMetric("us-unemployment", "Unemployment Rate"),
      notConnectedMetric("us-claims", "Initial Jobless Claims"),
      notConnectedMetric("us-wages", "Average Hourly Earnings YoY"),
    ]),
    growth: section("US growth & activity", "Growth / Activity", [
      notConnectedMetric("us-gdp", "Real GDP Growth"),
      notConnectedMetric("us-retail", "Retail Sales MoM"),
      notConnectedMetric("us-industrial-production", "Industrial Production YoY"),
      notConnectedMetric("us-sentiment", "Consumer Sentiment"),
    ]),
    ratesMarkets: section("US rates & markets", "Rates & Markets", [
      notConnectedMetric("us-1y", "US 1Y Treasury Yield"),
      notConnectedMetric("us-5y", "US 5Y Treasury Yield"),
      notConnectedMetric("us-10y", "US 10Y Treasury Yield"),
      notConnectedMetric("us-dollar", "Nominal Broad US Dollar Index"),
    ]),
  },
});

profiles.push({
  id: "eurozone",
  tabLabel: "Euro Area",
  country: "Euro Area",
  countryCode: "EU",
  centralBank: "European Central Bank",
  currency: "EUR",
  policyRate: "Not connected yet",
  nextMeeting: "Coming soon",
  stance: "Coming soon",
  stanceTone: "neutral",
  inflation: "Not connected yet",
  unemployment: "Not connected yet",
  marketProxy: "Not connected yet",
  snapshot: [
    notConnectedSnapshot("ECB deposit"),
    notConnectedSnapshot("Main refinancing"),
    notConnectedSnapshot("HICP YoY"),
    notConnectedSnapshot("Core HICP YoY"),
    notConnectedSnapshot("Unemployment"),
    notConnectedSnapshot("Real GDP"),
  ],
  sections: {
    centralBank: section("European Central Bank", "Central Bank", [
      notConnectedMetric("eu-deposit", "ECB Deposit Facility Rate"),
      notConnectedMetric("eu-mro", "ECB Main Refinancing Operations Rate"),
      notConnectedMetric("eu-marginal", "ECB Marginal Lending Facility Rate"),
    ]),
    inflation: section("Euro Area inflation", "Inflation", [
      notConnectedMetric("eu-hicp", "Euro Area HICP YoY"),
      notConnectedMetric("eu-core-hicp", "Euro Area Core HICP YoY"),
    ]),
    labour: section("Euro Area labour market", "Labour", [
      notConnectedMetric("eu-unemployment", "Euro Area Unemployment Rate"),
      notConnectedMetric("eu-youth-unemployment", "Euro Area Youth Unemployment Rate"),
    ]),
    growth: section("Euro Area growth", "Growth / Activity", [
      notConnectedMetric("eu-gdp", "Euro Area Real GDP Growth QoQ"),
      notConnectedMetric("eu-gdp-yoy", "Euro Area Real GDP Growth YoY"),
    ]),
    ratesMarkets: section("Euro Area rates & markets", "Rates & Markets", [
      notConnectedMetric("eu-eurusd", "EUR/USD"),
      notConnectedMetric("eu-de-1y", "Germany 1Y Bund Yield"),
      notConnectedMetric("eu-de-5y", "Germany 5Y Bund Yield"),
      notConnectedMetric("eu-de-10y", "Germany 10Y Bund Yield"),
      notConnectedMetric("eu-fr-10y", "France 10Y Government Bond Yield"),
      notConnectedMetric("eu-it-10y", "Italy 10Y Government Bond Yield"),
      notConnectedMetric("eu-fr-de-spread", "France-Germany 10Y Spread"),
      notConnectedMetric("eu-it-de-spread", "Italy-Germany 10Y Spread"),
    ]),
  },
});

profiles.push({
  id: "switzerland",
  tabLabel: "Switzerland",
  country: "Switzerland",
  countryCode: "CH",
  centralBank: "Swiss National Bank",
  currency: "CHF",
  policyRate: "Not connected yet",
  nextMeeting: "Coming soon",
  stance: "Coming soon",
  stanceTone: "neutral",
  inflation: "Not connected yet",
  unemployment: "Not connected yet",
  marketProxy: "Not connected yet",
  snapshot: [
    notConnectedSnapshot("SNB rate"),
    notConnectedSnapshot("CPI YoY"),
    notConnectedSnapshot("Unemployment"),
    notConnectedSnapshot("GDP"),
    notConnectedSnapshot("Swiss 10Y"),
    notConnectedSnapshot("USD/CHF"),
  ],
  sections: {
    centralBank: section("Swiss National Bank", "Central Bank", [
      notConnectedMetric("ch-policy", "Policy Rate"),
    ]),
    inflation: section("Swiss inflation pulse", "Inflation", [
      notConnectedMetric("ch-cpi", "CPI YoY"),
      notConnectedMetric("ch-core", "Core CPI"),
    ]),
    labour: section("Swiss labour market", "Labour", [
      notConnectedMetric("ch-unemployment", "Unemployment"),
    ]),
    growth: section("Swiss growth & activity", "Growth / Activity", [
      notConnectedMetric("ch-gdp", "GDP Growth"),
    ]),
    ratesMarkets: section("Swiss rates & markets", "Rates & Markets", [
      notConnectedMetric("ch-1y", "Swiss 1Y"),
      notConnectedMetric("ch-5y", "Swiss 5Y"),
      notConnectedMetric("ch-10y", "Swiss 10Y"),
      notConnectedMetric("ch-usd", "USD/CHF"),
    ]),
  },
});

profiles.push({
  id: "united-kingdom",
  tabLabel: "United Kingdom",
  country: "United Kingdom",
  countryCode: "UK",
  centralBank: "Bank of England",
  currency: "GBP",
  policyRate: "Not connected yet",
  nextMeeting: "Coming soon",
  stance: "Coming soon",
  stanceTone: "neutral",
  inflation: "Not connected yet",
  unemployment: "Not connected yet",
  marketProxy: "Not connected yet",
  snapshot: [
    notConnectedSnapshot("Bank Rate"),
    notConnectedSnapshot("CPI YoY"),
    notConnectedSnapshot("Unemployment"),
    notConnectedSnapshot("GDP"),
    notConnectedSnapshot("UK 10Y"),
    notConnectedSnapshot("GBP/USD"),
  ],
  sections: {
    centralBank: section("Bank of England", "Central Bank", [
      notConnectedMetric("uk-policy", "Bank Rate"),
    ]),
    inflation: section("UK inflation pulse", "Inflation", [
      notConnectedMetric("uk-cpi", "CPI YoY"),
    ]),
    labour: section("UK labour market", "Labour", [
      notConnectedMetric("uk-unemployment", "Unemployment"),
    ]),
    growth: section("UK growth & activity", "Growth / Activity", [
      notConnectedMetric("uk-gdp", "GDP Growth"),
    ]),
    ratesMarkets: section("UK rates & markets", "Rates & Markets", [
      notConnectedMetric("uk-5y", "UK 5Y"),
      notConnectedMetric("uk-10y", "UK 10Y"),
      notConnectedMetric("uk-fx", "GBP/USD"),
    ]),
  },
});

profiles.push({
  id: "japan",
  tabLabel: "Japan",
  country: "Japan",
  countryCode: "JP",
  centralBank: "Bank of Japan",
  currency: "JPY",
  policyRate: "Not connected yet",
  nextMeeting: "Coming soon",
  stance: "Coming soon",
  stanceTone: "neutral",
  inflation: "Not connected yet",
  unemployment: "Not connected yet",
  marketProxy: "Not connected yet",
  snapshot: [
    notConnectedSnapshot("BoJ rate"),
    notConnectedSnapshot("CPI YoY"),
    notConnectedSnapshot("Unemployment"),
    notConnectedSnapshot("GDP"),
    notConnectedSnapshot("JGB 10Y"),
    notConnectedSnapshot("USD/JPY"),
  ],
  sections: {
    centralBank: section("Bank of Japan", "Central Bank", [
      notConnectedMetric("jp-policy", "Policy Rate"),
    ]),
    inflation: section("Japan inflation pulse", "Inflation", [
      notConnectedMetric("jp-cpi", "CPI YoY"),
    ]),
    labour: section("Japan labour market", "Labour", [
      notConnectedMetric("jp-unemployment", "Unemployment"),
    ]),
    growth: section("Japan growth & activity", "Growth / Activity", [
      notConnectedMetric("jp-gdp", "GDP Growth"),
    ]),
    ratesMarkets: section("Japan rates & markets", "Rates & Markets", [
      notConnectedMetric("jp-1y", "JGB 1Y"),
      notConnectedMetric("jp-5y", "JGB 5Y"),
      notConnectedMetric("jp-10y", "JGB 10Y"),
      notConnectedMetric("jp-fx", "USD/JPY"),
    ]),
  },
});

for (const profile of profiles) {
  if (profile.id !== "united-states") {
    markProfileAsComingSoon(profile);
  }
}

export const countryMacroProfiles = profiles;
