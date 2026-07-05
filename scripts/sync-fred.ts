import "dotenv/config";

import { FRED_SERIES, syncFredSeries } from "../src/lib/data/fred";

async function main() {
  const apiKey = process.env.FRED_API_KEY;

  if (!apiKey) {
    console.error(
      "FRED_API_KEY is missing. Add it to .env, then run npm run data:fred again.",
    );
    process.exitCode = 1;
    return;
  }

  console.log(`Syncing ${FRED_SERIES.length} FRED series...`);
  const failures: string[] = [];

  for (const series of FRED_SERIES) {
    try {
      const result = await syncFredSeries(series, apiKey);
      const latestDate = result.latestDate?.toISOString().slice(0, 10) ?? "unknown";
      console.log(
        `✓ ${result.code} ← ${result.seriesId}: ${result.valueCount} values (latest ${latestDate})`,
      );
    } catch (error) {
      failures.push(series.code);
      console.error(
        `✗ ${series.code}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  const { prisma } = await import("../src/lib/prisma");
  await prisma.$disconnect();
  if (failures.length > 0) {
    process.exitCode = 1;
    console.error(`FRED sync completed with failures: ${failures.join(", ")}`);
  } else {
    console.log("FRED sync complete.");
  }
}

main().catch(async (error: unknown) => {
  console.error(
    error instanceof Error ? `FRED sync failed: ${error.message}` : "FRED sync failed.",
  );
  process.exitCode = 1;

  try {
    const { prisma } = await import("../src/lib/prisma");
    await prisma.$disconnect();
  } catch {
    // Prisma may not have been initialized yet.
  }
});
