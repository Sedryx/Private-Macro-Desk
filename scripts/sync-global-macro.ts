import "dotenv/config";

import { OFFICIAL_GLOBAL_SERIES } from "../src/lib/data/global-series";
import { syncGlobalSeries, type GlobalSyncResult } from "../src/lib/data/globalSync";

type SyncFailure = { code: string; provider: string; message: string };

async function main() {
  const results: GlobalSyncResult[] = [];
  const failures: SyncFailure[] = [];

  for (const config of OFFICIAL_GLOBAL_SERIES) {
    try {
      const result = await syncGlobalSeries(config);
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
