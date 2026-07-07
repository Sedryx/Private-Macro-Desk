import "dotenv/config";

import { OFFICIAL_GLOBAL_SERIES } from "../src/lib/data/global-series";
import { prisma } from "../src/lib/prisma";

const CORE_BY_COUNTRY: Record<string, string[]> = {
  EU: ["EU_EURUSD", "EU_DE_10Y"],
  CH: ["CH_POLICY_RATE", "CH_CPI_YOY", "CH_UNEMPLOYMENT", "CH_GDP", "CH_10Y", "CH_USDCHF"],
  UK: ["UK_POLICY_RATE", "UK_CPI_YOY", "UK_UNEMPLOYMENT", "UK_FX_PROXY"],
  JP: ["JP_POLICY_RATE", "JP_CPI_YOY", "JP_UNEMPLOYMENT", "JP_GDP", "JP_10Y", "JP_FX_PROXY"],
};

const RANGE_BY_KIND = {
  rate: { min: -10, max: 30 },
  yield: { min: -10, max: 30 },
  inflation: { min: -20, max: 50 },
  unemployment: { min: 0, max: 50 },
  gdp_qoq: { min: -40, max: 40 },
  fx: { min: 0, max: Number.POSITIVE_INFINITY },
  index: { min: 0, max: Number.POSITIVE_INFINITY },
  spread: { min: -10, max: 30 },
};

async function main() {
  const errors: string[] = [];
  const rows: Array<{
    code: string;
    uiCode: string;
    dbCode: string;
    provider: string;
    count: number;
    latestDate: string;
    latestValue: string;
    status: string;
  }> = [];

  const uiCodes = new Set<string>();
  const sourceIds = new Map<string, string[]>();

  for (const config of OFFICIAL_GLOBAL_SERIES) {
    uiCodes.add(config.ui.metricId);
    const sourceId = getSourceId(config);
    sourceIds.set(sourceId, [...(sourceIds.get(sourceId) ?? []), config.code]);

    const indicator = await prisma.macroIndicator.findUnique({
      where: { code: config.code },
      include: { values: { orderBy: { date: "asc" } } },
    });
    const values = indicator?.values ?? [];
    const latest = values.at(-1);
    const duplicateDates = values.length - new Set(values.map((value) => value.date.toISOString().slice(0, 10))).size;
    const range = RANGE_BY_KIND[config.valueKind];
    const invalid = values.find((value) => Number(value.value) < range.min || Number(value.value) > range.max);

    let status = values.length > 0 ? "OK" : "MISSING";
    if (values.length === 1) status = "TOO_FEW_VALUES";
    if (duplicateDates > 0) status = "DUPLICATE_DATES";
    if (invalid) status = "INVALID_RANGE";

    if (values.length === 1) errors.push(`${config.code} has fewer than 2 finite values.`);
    if (duplicateDates > 0) errors.push(`${config.code} has duplicate dates.`);
    if (invalid) errors.push(`${config.code} has invalid range value ${invalid.value} on ${invalid.date.toISOString().slice(0, 10)}.`);
    if (config.country === "CH" && values.length === 0) errors.push(`${config.code} is a CH connected metric with zero values.`);
    if (indicator && indicator.code !== config.code) errors.push(`${config.code} registry code differs from DB code ${indicator.code}.`);

    rows.push({
      code: config.code,
      uiCode: config.ui.metricId,
      dbCode: indicator?.code ?? "—",
      provider: config.provider,
      count: values.length,
      latestDate: latest ? latest.date.toISOString().slice(0, 10) : "—",
      latestValue: latest ? Number(latest.value).toFixed(4) : "—",
      status,
    });
  }

  const ch10y = OFFICIAL_GLOBAL_SERIES.find((series) => series.code === "CH_10Y");
  if (!ch10y || !("dimensions" in ch10y) || ch10y.dimensions.D0 !== "10J0") {
    errors.push("CH_10Y must use SNB rendoblid D0=10J0.");
  }

  const ukFx = OFFICIAL_GLOBAL_SERIES.find((series) => series.code === "UK_FX_PROXY");
  if (!ukFx || !("seriesCode" in ukFx) || ukFx.seriesCode === "XUDLERS" || ukFx.name.toLowerCase().includes("eur")) {
    errors.push("UK_FX_PROXY is still mapped/labeled like GBP/EUR instead of GBP/USD XUDLUSS.");
  }

  for (const code of ["JP_GDP", "JP_10Y", "JP_FX_PROXY"]) {
    const config = OFFICIAL_GLOBAL_SERIES.find((series) => series.code === code);
    if (!config?.ui.metricId.startsWith("jp-")) errors.push(`${code} is not bound to the Japan UI.`);
  }

  for (const code of ["EU_DE_10Y", "EU_FR_10Y", "EU_IT_10Y", "EU_FR_DE_10Y_SPREAD", "EU_IT_DE_10Y_SPREAD"]) {
    if (!OFFICIAL_GLOBAL_SERIES.some((series) => series.code === code)) errors.push(`${code} missing from registry.`);
  }

  for (const [sourceId, codes] of sourceIds) {
    if (sourceId !== "derived" && codes.length > 1 && codes.some((code) => /_1Y|_5Y|_10Y/.test(code))) {
      errors.push(`One source series is reused for multiple sovereign maturities: ${sourceId} -> ${codes.join(", ")}.`);
    }
  }

  for (const [country, codes] of Object.entries(CORE_BY_COUNTRY)) {
    const connected = rows.filter((row) => codes.includes(row.code) && row.count > 0);
    if (connected.length > 0 && connected.length < codes.length) {
      errors.push(`${country} is partial: missing core metrics ${codes.filter((code) => !connected.some((row) => row.code === code)).join(", ")}.`);
    }
  }

  console.table(rows);

  if (errors.length > 0) {
    console.error("\nGlobal macro verification failed:");
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log("\nGlobal macro verification passed.");
  }

  await prisma.$disconnect();
}

function getSourceId(config: (typeof OFFICIAL_GLOBAL_SERIES)[number]) {
  if ("seriesId" in config) return `${config.provider}:${config.seriesId}`;
  if ("seriesCode" in config) return `${config.provider}:${config.seriesCode}`;
  if ("seriesPath" in config) return `${config.provider}:${config.seriesPath}`;
  if ("seriesKey" in config) return `${config.provider}:${config.seriesKey}`;
  if ("cubeId" in config) return `${config.provider}:${config.cubeId}:${config.dimensions.D0}:${config.dimensions.D1 ?? ""}`;
  return "derived";
}

main().catch(async (error: unknown) => {
  console.error(error instanceof Error ? error.message : "Global macro verification failed.");
  process.exitCode = 1;
  await prisma.$disconnect();
});
