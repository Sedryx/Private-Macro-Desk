import "dotenv/config";

import { syncForexFactoryCalendar } from "../src/lib/data/forex-factory";

async function main() {
  const result = await syncForexFactoryCalendar();
  const { prisma } = await import("../src/lib/prisma");
  await prisma.$disconnect();

  console.log(
    `Forex Factory calendar: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped, ${result.deleted} deleted, ${result.ignored} invalid ignored, ${result.backfilled} actuals backfilled from FRED.`,
  );
}

main().catch(async (error: unknown) => {
  console.error(error instanceof Error ? error.message : "Calendar sync failed.");
  process.exitCode = 1;
  try {
    const { prisma } = await import("../src/lib/prisma");
    await prisma.$disconnect();
  } catch {
    // Prisma may not have initialized.
  }
});
