import { syncBoeSeries } from "@/lib/data/boe";
import { syncBojSeries } from "@/lib/data/boj";
import { syncBundesbankSeries } from "@/lib/data/bundesbank";
import { syncDbnomicsSeries } from "@/lib/data/dbnomics";
import { fetchEcbSeries } from "@/lib/data/ecb";
import { fetchFredObservations, parseFredObservations } from "@/lib/data/fred";
import type {
  DerivedGlobalSeriesConfig,
  EcbGlobalSeriesConfig,
  FredGlobalSeriesConfig,
  OfficialGlobalSeriesConfig,
} from "@/lib/data/global-series";
import { prepareGlobalObservations } from "@/lib/data/global-validation";
import { replaceMacroSeries } from "@/lib/data/macroStore";
import { syncMofSeries } from "@/lib/data/mof";
import { syncOnsSeries } from "@/lib/data/ons";
import { syncSnbSeries } from "@/lib/data/snb";

export type GlobalSyncResult = { code: string; source: string; valueCount: number; latestDate?: Date };

async function syncFredGlobalSeries(config: FredGlobalSeriesConfig): Promise<GlobalSyncResult> {
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

async function syncEcbGlobalSeries(config: EcbGlobalSeriesConfig): Promise<GlobalSyncResult> {
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

async function syncDerivedSeries(config: DerivedGlobalSeriesConfig): Promise<GlobalSyncResult> {
  const { prisma } = await import("@/lib/prisma");
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

  const matchKeyLength = config.frequency === "daily" ? 10 : 7;
  const rightByPeriod = new Map(
    right.values.map((value) => [value.date.toISOString().slice(0, matchKeyLength), value.value.toNumber()]),
  );
  const raw = left.values.flatMap((leftValue) => {
    const rightValue = rightByPeriod.get(leftValue.date.toISOString().slice(0, matchKeyLength));
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

export async function syncGlobalSeries(config: OfficialGlobalSeriesConfig): Promise<GlobalSyncResult> {
  if (config.provider === "BoE") return syncBoeSeries(config);
  if (config.provider === "ONS") return syncOnsSeries(config);
  if (config.provider === "SNB") return syncSnbSeries(config);
  if (config.provider === "BOJ") return syncBojSeries(config);
  if (config.provider === "DBnomics") return syncDbnomicsSeries(config);
  if (config.provider === "ECB") return syncEcbGlobalSeries(config);
  if (config.provider === "Bundesbank") return syncBundesbankSeries(config);
  if (config.provider === "MOF") return syncMofSeries(config);
  if (config.provider === "Calculated") return syncDerivedSeries(config);
  return syncFredGlobalSeries(config);
}
