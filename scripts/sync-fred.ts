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

  for (const series of FRED_SERIES) {
    const result = await syncFredSeries(series, apiKey);
    const latestDate = result.latestDate?.toISOString().slice(0, 10) ?? "unknown";
    console.log(
      `✓ ${result.code} ← ${result.seriesId}: ${result.valueCount} values (latest ${latestDate})`,
    );
  }

  const { prisma } = await import("../src/lib/prisma");
  await prisma.$disconnect();
  console.log("FRED sync complete.");
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
