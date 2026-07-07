import "dotenv/config";

import { syncBoeSeries } from "../src/lib/data/boe";
import { syncBojSeries } from "../src/lib/data/boj";
import { syncDbnomicsSeries } from "../src/lib/data/dbnomics";
import { fetchEcbSeries } from "../src/lib/data/ecb";
import { fetchFredObservations, parseFredObservations } from "../src/lib/data/fred";
import { OFFICIAL_GLOBAL_SERIES, type DerivedGlobalSeriesConfig, type EcbGlobalSeriesConfig, type FredGlobalSeriesConfig, type OfficialGlobalSeriesConfig } from "../src/lib/data/global-series";
import { prepareGlobalObservations } from "../src/lib/data/global-validation";
import { replaceMacroSeries } from "../src/lib/data/macroStore";
import { syncOnsSeries } from "../src/lib/data/ons";
import { syncSnbSeries } from "../src/lib/data/snb";

type SyncResult = { code: string; source: string; valueCount: number; latestDate?: Date };
type SyncFailure = { code: string; provider: string; message: string };

async function syncFredGlobalSeries(config: FredGlobalSeriesConfig): Promise<SyncResult> {
  const raw = await fetchFredObservations(config.seriesId);
  const observations = prepareGlobalObservations(config, parseFredObservations(raw));
  return replaceMacroSeries({
    code: config.code,
    name: config.name,
    category: config.category,
    country: config.country,
    unit: config.unit,
    source: config.provider,
    providerUpdatedAt: null,
    observations,
  });
}

async function syncEcbGlobalSeries(config: EcbGlobalSeriesConfig): Promise<SyncResult> {
  const result = await fetchEcbSeries(config.seriesKey, { lastNObservations: config.lastNObservations });
  const observations = prepareGlobalObservations(config, result.observations);
  return replaceMacroSeries({
    code: config.code,
    name: config.name,
    category: config.category,
    country: config.country,
    unit: config.unit,
    source: "ECB",
    providerUpdatedAt: result.providerUpdatedAt,
    observations,
  });
}
async function syncDerivedSeries(config: DerivedGlobalSeriesConfig): Promise<SyncResult> {
  const { prisma } = await import("../src/lib/prisma");
  const [left, right] = await Promise.all([
    prisma.macroIndicator.findUnique({
      where: { code: config.leftCode },
      include: { values: { orderBy: { date: "asc" } } },
    }),
    prisma.macroIndicator.findUnique({
      where: { code: config.rightCode },
      include: { values: { orderBy: { date: "asc" } } },
    }),
  ]);

  if (!left?.values.length || !right?.values.length) {
    throw new Error(`Missing source series for ${config.code}: ${config.leftCode} or ${config.rightCode}.`);
  }

  const rightByMonth = new Map(
    right.values.map((value) => [value.date.toISOString().slice(0, 7), value.value.toNumber()]),
  );
  const raw = left.values.flatMap((leftValue) => {
    const rightValue = rightByMonth.get(leftValue.date.toISOString().slice(0, 7));
    if (rightValue === undefined) return [];
    return [{ date: leftValue.date, value: leftValue.value.toNumber() - rightValue }];
  });
  const observations = prepareGlobalObservations(config, raw);

  return replaceMacroSeries({
    code: config.code,
    name: config.name,
    category: config.category,
    country: config.country,
    unit: config.unit,
    source: "Calculated",
    providerUpdatedAt: null,
    observations,
  });
}
async function syncSeries(config: OfficialGlobalSeriesConfig): Promise<SyncResult> {
  if (config.provider === "BoE") return syncBoeSeries(config);
  if (config.provider === "ONS") return syncOnsSeries(config);
  if (config.provider === "SNB") return syncSnbSeries(config);
  if (config.provider === "BOJ") return syncBojSeries(config);
  if (config.provider === "DBnomics") return syncDbnomicsSeries(config);
  if (config.provider === "ECB") return syncEcbGlobalSeries(config);
  if (config.provider === "Calculated") return syncDerivedSeries(config);
  return syncFredGlobalSeries(config);
}

async function main() {
  const results: SyncResult[] = [];
  const failures: SyncFailure[] = [];

  for (const config of OFFICIAL_GLOBAL_SERIES) {
    try {
      const result = await syncSeries(config);
      results.push(result);
      console.log(
        `[global macro] ${config.code}: ${result.valueCount} values from ${result.source}` +
          (result.latestDate ? ` latest=${result.latestDate.toISOString().slice(0, 10)}` : ""),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown provider error";
      failures.push({ code: config.code, provider: config.provider, message });
      console.warn(`[global macro] ${config.code}: preserved existing DB values (${config.provider}) - ${message}`);
    }
  }

  const byProvider = new Map<string, { updated: number; errors: number }>();
  for (const config of OFFICIAL_GLOBAL_SERIES) {
    const current = byProvider.get(config.provider) ?? { updated: 0, errors: 0 };
    if (results.some((result) => result.code === config.code)) current.updated += 1;
    if (failures.some((failure) => failure.code === config.code)) current.errors += 1;
    byProvider.set(config.provider, current);
  }

  console.log("\nGlobal macro sync summary");
  for (const [provider, stats] of byProvider) {
    console.log(`- ${provider}: updated=${stats.updated}, errors=${stats.errors}`);
  }

  const { prisma } = await import("../src/lib/prisma");
  await prisma.$disconnect();

  if (results.length === 0) process.exitCode = 1;
}

main().catch(async (error: unknown) => {
  console.error(error instanceof Error ? error.message : "Global macro sync failed.");
  process.exitCode = 1;
  try {
    const { prisma } = await import("../src/lib/prisma");
    await prisma.$disconnect();
  } catch {
    // Prisma may not have initialized.
  }
});
