import "dotenv/config";

import { syncFxVolatilitySeries } from "../src/lib/data/fxVolatility";

async function main() {
  const results = await syncFxVolatilitySeries();
  const { prisma } = await import("../src/lib/prisma");
  await prisma.$disconnect();

  for (const result of results) {
    console.log(`✓ ${result.code} ← ${result.seriesId}: ${result.valueCount} values`);
  }
}

main().catch(async (error: unknown) => {
  console.error(error instanceof Error ? error.message : "FX volatility sync failed.");
  process.exitCode = 1;
  try {
    const { prisma } = await import("../src/lib/prisma");
    await prisma.$disconnect();
  } catch {
    // Prisma may not have initialized.
  }
});
