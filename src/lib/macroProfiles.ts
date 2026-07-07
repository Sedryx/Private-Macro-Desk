export type MacroSectionKey =
  | "centralBank"
  | "inflation"
  | "labour"
  | "growth"
  | "ratesMarkets";

export type MacroTrendPoint = { label: string; value: number; date?: string };
export type MacroSource =
  | "Demo"
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
  description: string;
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
  summary: string;
  inflation: string;
  unemployment: string;
  marketProxy: string;
  snapshot: Array<
    Pick<MacroMetric, "label" | "value" | "change"> &
      Partial<Pick<MacroMetric, "source" | "latestDate" | "sourceUpdatedDate" | "releaseType" | "stale">>
  >;
  sections: Record<MacroSectionKey, MacroSection>;
};

export const macroSectionOrder: MacroSectionKey[] = [
  "centralBank",
  "inflation",
  "labour",
  "growth",
  "ratesMarkets",
];

const periods = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];

function metric(
  id: string,
  label: string,
  value: string,
  start: number,
  end: number,
  change?: string,
  context?: string,
): MacroMetric {
  const distance = end - start;
  const wobble = Math.max(Math.abs(distance) * 0.06, Math.abs(end) * 0.006, 0.015);
  const history = periods.map((period, index) => {
    const progress = index / (periods.length - 1);
    const variation = index === 0 || index === periods.length - 1 ? 0 : Math.sin(index * 1.9) * wobble;
    return { label: period, value: Number((start + distance * progress + variation).toFixed(3)) };
  });
  return { id, label, value, change, context, source: "Demo", history };
}

function section(title: string, shortTitle: string, description: string, indicators: MacroMetric[]): MacroSection {
  return { title, shortTitle, description, indicators };
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

function removeUnitedStatesDemoData(profile: CountryMacroProfile) {
  profile.policyRate = "Not connected yet";
  profile.nextMeeting = "Not connected yet";
  profile.stance = "Awaiting FRED sync";
  profile.stanceTone = "neutral";
  profile.summary =
    "US macro data is populated only from synchronized FRED observations or calculations based on those observations.";
  profile.inflation = "Not connected yet";
  profile.unemployment = "Not connected yet";
  profile.marketProxy = "Not connected yet";
  profile.snapshot = [
    { label: "Fed funds", value: "Not connected yet", source: "Not connected" },
    { label: "CPI YoY", value: "Not connected yet", source: "Not connected" },
    { label: "Unemployment", value: "Not connected yet", source: "Not connected" },
    { label: "Real GDP", value: "Not connected yet", source: "Not connected" },
    { label: "US 10Y", value: "Not connected yet", source: "Not connected" },
    { label: "Broad USD", value: "Not connected yet", source: "Not connected" },
  ];
  profile.sections = {
    centralBank: section(
      "Federal Reserve",
      "Central Bank",
      "Policy setting, rate trend and balance-sheet direction.",
      [
        notConnectedMetric("us-policy", "Federal Funds Effective Rate"),
        notConnectedMetric("us-balance", "Fed Balance Sheet"),
        notConnectedMetric(
          "us-policy-trend",
          "Fed Policy Trend",
          "Compared with three months earlier",
        ),
        notConnectedMetric(
          "us-balance-trend",
          "Balance Sheet Trend",
          "Compared with three months earlier",
        ),
      ],
    ),
    inflation: section(
      "US inflation pulse",
      "Inflation",
      "Headline, core and consumption-price pressure.",
      [
        notConnectedMetric("us-cpi", "US CPI YoY"),
        notConnectedMetric("us-core-cpi", "US Core CPI YoY"),
        notConnectedMetric("us-pce", "US PCE YoY"),
        notConnectedMetric("us-core-pce", "US Core PCE YoY"),
      ],
    ),
    labour: section(
      "US labour market",
      "Labour",
      "Hiring, joblessness, claims and wage momentum.",
      [
        notConnectedMetric("us-nfp", "Nonfarm Payrolls Monthly Change"),
        notConnectedMetric("us-unemployment", "Unemployment Rate"),
        notConnectedMetric("us-claims", "Initial Jobless Claims"),
        notConnectedMetric("us-wages", "Average Hourly Earnings YoY"),
      ],
    ),
    growth: section(
      "US growth & activity",
      "Growth / Activity",
      "Output, consumption, production and sentiment.",
      [
        notConnectedMetric("us-gdp", "Real GDP Growth"),
        notConnectedMetric("us-retail", "Retail Sales MoM"),
        notConnectedMetric(
          "us-industrial-production",
          "Industrial Production YoY",
        ),
        notConnectedMetric("us-sentiment", "Consumer Sentiment"),
      ],
    ),
    ratesMarkets: section(
      "US rates & markets",
      "Rates & Markets",
      "Treasury yields, curve and broad dollar index.",
      [
        notConnectedMetric("us-1y", "US 1Y Treasury Yield"),
        notConnectedMetric("us-5y", "US 5Y Treasury Yield"),
        notConnectedMetric("us-10y", "US 10Y Treasury Yield"),
        notConnectedMetric("us-dollar", "Nominal Broad US Dollar Index"),
      ],
    ),
  };
}

function markProfileAsComingSoon(profile: CountryMacroProfile) {
  profile.policyRate = "Not connected yet";
  profile.nextMeeting = "Coming soon";
  profile.stance = "Coming soon";
  profile.stanceTone = "neutral";
  profile.summary = `${profile.country} macro data is not connected yet. The country layout is ready for a future official data integration.`;
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
      context: "Static placeholder â€” official data source not connected",
      source: "Coming soon",
      history: [],
    }));
  }
}

function prepareEuroAreaProfile(profile: CountryMacroProfile) {
  profile.tabLabel = "Euro Area";
  profile.country = "Euro Area";
  profile.centralBank = "European Central Bank";
  profile.currency = "EUR";
  profile.summary =
    "Euro Area inflation, labour and growth use Eurostat first; policy rates use the ECB Data Portal. FRED is retained only as a labelled fallback.";
  profile.snapshot = [
    { label: "ECB deposit", value: "Not connected yet", source: "Not connected" },
    { label: "Main refinancing", value: "Not connected yet", source: "Not connected" },
    { label: "HICP YoY", value: "Not connected yet", source: "Not connected" },
    { label: "Core HICP YoY", value: "Not connected yet", source: "Not connected" },
    { label: "Unemployment", value: "Not connected yet", source: "Not connected" },
    { label: "Real GDP", value: "Not connected yet", source: "Not connected" },
  ];
  profile.sections = {
    centralBank: section(
      "European Central Bank",
      "Central Bank",
      "Official ECB deposit, refinancing and marginal lending facility rates.",
      [
        notConnectedMetric("eu-deposit", "ECB Deposit Facility Rate"),
        notConnectedMetric("eu-mro", "ECB Main Refinancing Operations Rate"),
        notConnectedMetric("eu-marginal", "ECB Marginal Lending Facility Rate"),
      ],
    ),
    inflation: section(
      "Euro Area inflation",
      "Inflation",
      "Official Eurostat headline and core HICP annual rates.",
      [
        notConnectedMetric("eu-hicp", "Euro Area HICP YoY"),
        notConnectedMetric("eu-core-hicp", "Euro Area Core HICP YoY"),
      ],
    ),
    labour: section(
      "Euro Area labour market",
      "Labour",
      "Official Eurostat harmonised unemployment rates.",
      [
        notConnectedMetric("eu-unemployment", "Euro Area Unemployment Rate"),
        notConnectedMetric("eu-youth-unemployment", "Euro Area Youth Unemployment Rate"),
      ],
    ),
    growth: section(
      "Euro Area growth",
      "Growth / Activity",
      "Official Eurostat quarter-on-quarter and year-on-year real GDP growth.",
      [
        notConnectedMetric("eu-gdp", "Euro Area Real GDP Growth QoQ"),
        notConnectedMetric("eu-gdp-yoy", "Euro Area Real GDP Growth YoY"),
      ],
    ),
    ratesMarkets: section(
      "Euro Area rates & markets",
      "Rates & Markets",
      "EUR/USD, national 10Y sovereign yields and France/Germany and Italy/Germany spreads.",
      [
        notConnectedMetric("eu-eurusd", "EUR/USD"),
        notConnectedMetric("eu-de-10y", "Germany 10Y Bund Yield"),
        notConnectedMetric("eu-fr-10y", "France 10Y Government Bond Yield"),
        notConnectedMetric("eu-it-10y", "Italy 10Y Government Bond Yield"),
        notConnectedMetric("eu-fr-de-spread", "France-Germany 10Y Spread"),
        notConnectedMetric("eu-it-de-spread", "Italy-Germany 10Y Spread"),
      ],
    ),
  };
}

const profiles: CountryMacroProfile[] = [];

profiles.push({
  id: "united-states",
  tabLabel: "United States",
  country: "United States",
  countryCode: "US",
  centralBank: "Federal Reserve",
  currency: "USD",
  policyRate: "4.50%",
  nextMeeting: "30 Jul Â· demo placeholder",
  stance: "Restrictive / data dependent",
  stanceTone: "tight",
  summary: "Disinflation is progressing slowly while activity and labour remain resilient enough to keep the Fed cautious.",
  inflation: "2.9%",
  unemployment: "4.1%",
  marketProxy: "DXY 104.2",
  snapshot: [
    { label: "Fed funds", value: "4.50%", change: "Hold" },
    { label: "CPI YoY", value: "2.9%", change: "-0.1 pp" },
    { label: "Unemployment", value: "4.1%", change: "+0.1 pp" },
    { label: "GDP", value: "2.1%", change: "annualised" },
    { label: "US 10Y", value: "4.35%", change: "+8 bp" },
    { label: "DXY", value: "104.2", change: "+0.4%" },
  ],
  sections: {
    centralBank: section("Federal Reserve", "Central Bank", "Policy setting, decision path and balance-sheet direction.", [
      metric("us-policy", "Policy Rate", "4.50%", 5.25, 4.5, "0 bp", "Target range midpoint proxy"),
      metric("us-decision", "Previous Decision", "Hold", 80, 49, "Unchanged", "Demo hawkishness index"),
      metric("us-balance", "Balance Sheet", "$7.2tn", 7.65, 7.2, "QT active", "Demo total-assets path"),
      metric("us-guidance", "Market Direction", "Data dependent", 75, 49, "Less restrictive", "Demo policy-pressure index"),
    ]),
    inflation: section("US inflation pulse", "Inflation", "Headline, core and consumption-price pressure.", [
      metric("us-cpi", "CPI YoY", "2.9%", 3.3, 2.9, "-0.1 pp"),
      metric("us-core-cpi", "Core CPI", "3.2%", 4.1, 3.2, "-0.1 pp"),
      metric("us-pce", "PCE", "2.6%", 3.1, 2.6, "-0.1 pp"),
      metric("us-core-pce", "Core PCE", "2.8%", 3.7, 2.8, "Flat"),
    ]),
    labour: section("US labour market", "Labour", "Hiring, joblessness, claims and wage momentum.", [
      metric("us-nfp", "Nonfarm Payrolls", "+175k", 240, 175, "-6k"),
      metric("us-unemployment", "Unemployment", "4.1%", 3.7, 4.1, "+0.1 pp"),
      metric("us-claims", "Initial Claims", "232k", 218, 232, "+4k"),
      metric("us-wages", "Average Hourly Earnings", "3.8%", 4.4, 3.8, "-0.1 pp"),
    ]),
    growth: section("US growth & activity", "Growth / Activity", "Output, consumption, surveys and confidence.", [
      metric("us-gdp", "GDP Growth", "2.1%", 2.4, 2.1, "Stable"),
      metric("us-retail", "Retail Sales", "1.4%", 2.2, 1.4, "+0.1 pp"),
      metric("us-ism-mfg", "ISM Manufacturing", "49.5", 47.8, 49.5, "+0.5"),
      metric("us-ism-services", "ISM Services", "52.1", 52.7, 52.1, "+0.2"),
      metric("us-confidence", "Consumer Confidence", "101.0", 107, 101, "-1.0"),
    ]),
    ratesMarkets: section("US rates & markets", "Rates & Markets", "One, five and ten-year Treasury yields plus the dollar proxy.", [
      metric("us-1y", "US 1Y", "4.20%", 4.8, 4.2, "+3 bp"),
      metric("us-5y", "US 5Y", "4.25%", 4.6, 4.25, "+5 bp"),
      metric("us-10y", "US 10Y", "4.35%", 4.25, 4.35, "+8 bp"),
      metric("us-dxy", "DXY", "104.2", 101.2, 104.2, "+0.4%"),
    ]),
  },
});

removeUnitedStatesDemoData(profiles[0]);

profiles.push({
  id: "eurozone",
  tabLabel: "Eurozone",
  country: "Eurozone",
  countryCode: "EU",
  centralBank: "European Central Bank",
  currency: "EUR",
  policyRate: "2.00%",
  nextMeeting: "24 Jul Â· demo placeholder",
  stance: "Gradual easing",
  stanceTone: "easing",
  summary: "Inflation is nearing target, but weak manufacturing and subdued growth keep the ECB on an easing path.",
  inflation: "2.2%",
  unemployment: "6.4%",
  marketProxy: "EUR/USD 1.09",
  snapshot: [
    { label: "ECB deposit", value: "2.00%", change: "-25 bp" },
    { label: "HICP YoY", value: "2.2%", change: "Flat" },
    { label: "Unemployment", value: "6.4%", change: "Stable" },
    { label: "GDP", value: "0.8%", change: "+0.1 pp" },
    { label: "German 10Y", value: "2.45%", change: "+6 bp" },
    { label: "EUR/USD", value: "1.09", change: "+0.3%" },
  ],
  sections: {
    centralBank: section("European Central Bank", "Central Bank", "Deposit rate, latest decision and market direction.", [
      metric("eu-policy", "Deposit Rate", "2.00%", 3.75, 2, "-25 bp"),
      metric("eu-decision", "Previous Decision", "Cut 25 bp", 80, 30, "Easing", "Demo hawkishness index"),
      metric("eu-balance", "Balance Sheet", "â‚¬6.4tn", 6.85, 6.4, "Run-off"),
    ]),
    inflation: section("Eurozone inflation pulse", "Inflation", "Headline, core and producer-price pressure.", [
      metric("eu-hicp", "HICP YoY", "2.2%", 2.9, 2.2, "Flat"),
      metric("eu-core", "Core HICP", "2.5%", 3.4, 2.5, "-0.1 pp"),
      metric("eu-ppi", "Producer Prices", "-0.8%", -3.4, -0.8, "+0.1 pp"),
    ]),
    labour: section("Eurozone labour market", "Labour", "Employment resilience, joblessness and wages.", [
      metric("eu-unemployment", "Unemployment", "6.4%", 6.6, 6.4, "Stable"),
      metric("eu-employment", "Employment Growth", "0.7%", 1.1, 0.7, "Stable"),
      metric("eu-wages", "Negotiated Wages", "3.6%", 4.5, 3.6, "-0.1 pp"),
    ]),
    growth: section("Eurozone growth & activity", "Growth / Activity", "GDP, surveys, production and confidence.", [
      metric("eu-gdp", "GDP Growth", "0.8%", 0.4, 0.8, "+0.1 pp"),
      metric("eu-pmi-mfg", "Manufacturing PMI", "47.8", 44.2, 47.8, "+0.3"),
      metric("eu-pmi-services", "Services PMI", "51.6", 50.4, 51.6, "+0.2"),
      metric("eu-production", "Industrial Production", "-1.1%", -2.4, -1.1, "+0.1 pp"),
      metric("eu-confidence", "Economic Sentiment", "96.4", 94.1, 96.4, "+0.1"),
    ]),
    ratesMarkets: section("Eurozone rates & markets", "Rates & Markets", "German sovereign curve and euro proxy.", [
      metric("eu-2y", "German 2Y", "2.10%", 3.05, 2.1, "-5 bp"),
      metric("eu-10y", "German 10Y", "2.45%", 2.38, 2.45, "+6 bp"),
      metric("eu-fx", "EUR/USD", "1.09", 1.08, 1.09, "+0.3%"),
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
  policyRate: "0.25%",
  nextMeeting: "25 Sep Â· demo placeholder",
  stance: "Easing bias / FX aware",
  stanceTone: "easing",
  summary: "Low inflation gives the SNB room to stay accommodative, with franc strength central to the reaction function.",
  inflation: "1.1%",
  unemployment: "2.8%",
  marketProxy: "USD/CHF 0.89",
  snapshot: [
    { label: "SNB rate", value: "0.25%", change: "Hold" },
    { label: "CPI YoY", value: "1.1%", change: "-0.1 pp" },
    { label: "Unemployment", value: "2.8%", change: "Stable" },
    { label: "GDP", value: "1.4%", change: "+0.1 pp" },
    { label: "Swiss 10Y", value: "0.55%", change: "+2 bp" },
    { label: "USD/CHF", value: "0.89", change: "+0.2%" },
  ],
  sections: {
    centralBank: section("Swiss National Bank", "Central Bank", "Policy rate, decision and franc-sensitive guidance.", [
      metric("ch-policy", "Policy Rate", "0.25%", 1.75, 0.25, "0 bp"),
      metric("ch-decision", "Previous Decision", "Hold", 70, 24, "Dovish", "Demo hawkishness index"),
      metric("ch-fx-policy", "FX Assessment", "Franc monitored", 52, 72, "High sensitivity", "Demo intervention-sensitivity index"),
    ]),
    inflation: section("Swiss inflation pulse", "Inflation", "Headline and underlying domestic price pressure.", [
      metric("ch-cpi", "CPI YoY", "1.1%", 1.7, 1.1, "-0.1 pp"),
      metric("ch-core", "Core CPI", "0.9%", 1.5, 0.9, "Flat"),
      metric("ch-import", "Imported Inflation", "-0.4%", 0.6, -0.4, "Flat"),
    ]),
    labour: section("Swiss labour market", "Labour", "Unemployment, employment and wage momentum.", [
      metric("ch-unemployment", "Unemployment", "2.8%", 2.4, 2.8, "Stable"),
      metric("ch-employment", "Employment Growth", "0.6%", 1.2, 0.6, "Stable"),
      metric("ch-wages", "Nominal Wages", "1.7%", 1.4, 1.7, "Stable"),
    ]),
    growth: section("Swiss growth & activity", "Growth / Activity", "GDP, spending, surveys and production.", [
      metric("ch-gdp", "GDP Growth", "1.4%", 0.9, 1.4, "+0.1 pp"),
      metric("ch-retail", "Retail Sales", "1.2%", 0.2, 1.2, "+0.2 pp"),
      metric("ch-pmi", "Manufacturing PMI", "48.9", 44.9, 48.9, "+0.2"),
      metric("ch-production", "Industrial Production", "0.5%", -1.2, 0.5, "+0.1 pp"),
      metric("ch-confidence", "Consumer Confidence", "-31", -42, -31, "+1"),
    ]),
    ratesMarkets: section("Swiss rates & markets", "Rates & Markets", "Sovereign yield and core franc crosses.", [
      metric("ch-10y", "Swiss 10Y", "0.55%", 0.72, 0.55, "+2 bp"),
      metric("ch-usd", "USD/CHF", "0.89", 0.87, 0.89, "+0.2%"),
      metric("ch-eur", "EUR/CHF", "0.97", 0.95, 0.97, "+0.1%"),
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
  policyRate: "4.25%",
  nextMeeting: "7 Aug Â· demo placeholder",
  stance: "Cautious easing",
  stanceTone: "neutral",
  summary: "Sticky services inflation and wages are slowing the pace of easing despite softer domestic demand.",
  inflation: "2.6%",
  unemployment: "4.4%",
  marketProxy: "GBP/USD 1.28",
  snapshot: [
    { label: "Bank Rate", value: "4.25%", change: "Hold" },
    { label: "CPI YoY", value: "2.6%", change: "-0.1 pp" },
    { label: "Unemployment", value: "4.4%", change: "+0.1 pp" },
    { label: "GDP", value: "1.1%", change: "+0.1 pp" },
    { label: "UK 10Y", value: "4.45%", change: "+5 bp" },
    { label: "GBP/USD", value: "1.28", change: "+0.2%" },
  ],
  sections: {
    centralBank: section("Bank of England", "Central Bank", "Bank Rate, vote balance and guidance.", [
      metric("uk-policy", "Bank Rate", "4.25%", 5.25, 4.25, "0 bp"),
      metric("uk-vote", "MPC Vote", "7â€“2 hold", 90, 43, "Split", "Demo hawkishness index"),
      metric("uk-guidance", "Policy Direction", "Gradual cuts", 72, 38, "Easing bias"),
    ]),
    inflation: section("UK inflation pulse", "Inflation", "Headline, core and services-price pressure.", [
      metric("uk-cpi", "CPI YoY", "2.6%", 4, 2.6, "-0.1 pp"),
      metric("uk-core", "Core CPI", "3.4%", 5.1, 3.4, "-0.1 pp"),
      metric("uk-services", "Services CPI", "4.9%", 6.5, 4.9, "-0.1 pp"),
    ]),
    labour: section("UK labour market", "Labour", "Unemployment, payroll change and wage pressure.", [
      metric("uk-unemployment", "Unemployment", "4.4%", 4, 4.4, "Stable"),
      metric("uk-payrolls", "Payroll Change", "-18k", 24, -18, "-2k"),
      metric("uk-wages", "Regular Pay", "5.2%", 7.1, 5.2, "-0.1 pp"),
    ]),
    growth: section("UK growth & activity", "Growth / Activity", "GDP, retail activity, surveys and confidence.", [
      metric("uk-gdp", "GDP Growth", "1.1%", 0.3, 1.1, "+0.1 pp"),
      metric("uk-retail", "Retail Sales", "0.8%", -0.8, 0.8, "+0.1 pp"),
      metric("uk-pmi-mfg", "Manufacturing PMI", "49.2", 46.8, 49.2, "+0.1"),
      metric("uk-pmi-services", "Services PMI", "52.4", 50.8, 52.4, "+0.2"),
      metric("uk-confidence", "Consumer Confidence", "-16", -28, -16, "+1"),
    ]),
    ratesMarkets: section("UK rates & markets", "Rates & Markets", "Gilt curve and sterling proxy.", [
      metric("uk-2y", "UK 2Y", "4.10%", 4.8, 4.1, "-2 bp"),
      metric("uk-10y", "UK 10Y", "4.45%", 4.28, 4.45, "+5 bp"),
      metric("uk-fx", "GBP/USD", "1.28", 1.24, 1.28, "+0.2%"),
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
  policyRate: "0.50%",
  nextMeeting: "31 Jul Â· demo placeholder",
  stance: "Gradual normalisation",
  stanceTone: "neutral",
  summary: "The BoJ is normalising carefully as inflation and wages hold above the old regime, while yen sensitivity remains high.",
  inflation: "3.0%",
  unemployment: "2.6%",
  marketProxy: "USD/JPY 148.0",
  snapshot: [
    { label: "BoJ rate", value: "0.50%", change: "Hold" },
    { label: "CPI YoY", value: "3.0%", change: "+0.1 pp" },
    { label: "Unemployment", value: "2.6%", change: "Stable" },
    { label: "GDP", value: "0.7%", change: "+0.2 pp" },
    { label: "JGB 10Y", value: "1.45%", change: "+7 bp" },
    { label: "USD/JPY", value: "148.0", change: "-0.5%" },
  ],
  sections: {
    centralBank: section("Bank of Japan", "Central Bank", "Policy rate, purchase pace and normalisation signal.", [
      metric("jp-policy", "Policy Rate", "0.50%", -0.1, 0.5, "0 bp"),
      metric("jp-purchases", "JGB Purchases", "Â¥4.1tn / month", 5.7, 4.1, "Tapering"),
      metric("jp-guidance", "Policy Direction", "Normalising", 20, 57, "Gradual", "Demo hawkishness index"),
    ]),
    inflation: section("Japan inflation pulse", "Inflation", "National, core and Tokyo price momentum.", [
      metric("jp-cpi", "CPI YoY", "3.0%", 2.8, 3, "+0.1 pp"),
      metric("jp-core", "Core CPI", "2.7%", 2.6, 2.7, "Flat"),
      metric("jp-tokyo", "Tokyo CPI", "2.9%", 2.5, 2.9, "+0.1 pp"),
    ]),
    labour: section("Japan labour market", "Labour", "Joblessness, employment and wage momentum.", [
      metric("jp-unemployment", "Unemployment", "2.6%", 2.5, 2.6, "Stable"),
      metric("jp-employment", "Employment Growth", "0.4%", 0.2, 0.4, "Stable"),
      metric("jp-wages", "Cash Earnings", "2.5%", 1.4, 2.5, "+0.1 pp"),
    ]),
    growth: section("Japan growth & activity", "Growth / Activity", "GDP, spending, surveys and industrial output.", [
      metric("jp-gdp", "GDP Growth", "0.7%", -0.4, 0.7, "+0.2 pp"),
      metric("jp-retail", "Retail Sales", "2.2%", 1, 2.2, "+0.1 pp"),
      metric("jp-pmi", "Manufacturing PMI", "49.8", 48.2, 49.8, "+0.1"),
      metric("jp-production", "Industrial Production", "-1.0%", -3.2, -1, "+0.2 pp"),
      metric("jp-confidence", "Consumer Confidence", "36.8", 34.5, 36.8, "+0.2"),
    ]),
    ratesMarkets: section("Japan rates & markets", "Rates & Markets", "JGB curve and yen pressure proxy.", [
      metric("jp-2y", "JGB 2Y", "0.70%", 0.25, 0.7, "+4 bp"),
      metric("jp-10y", "JGB 10Y", "1.45%", 0.88, 1.45, "+7 bp"),
      metric("jp-fx", "USD/JPY", "148.0", 152, 148, "-0.5%"),
    ]),
  },
});

for (const profile of profiles) {
  if (profile.id !== "united-states") {
    markProfileAsComingSoon(profile);
  }
}

const euroAreaProfile = profiles.find((profile) => profile.id === "eurozone");
if (euroAreaProfile) {
  prepareEuroAreaProfile(euroAreaProfile);
}

export const countryMacroProfiles = profiles;


