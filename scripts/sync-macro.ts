import "dotenv/config";

import { syncMacroIfStale } from "../src/lib/data/fredScheduler";

async function main() {
  const result = await syncMacroIfStale(true);
  const { prisma } = await import("../src/lib/prisma");
  await prisma.$disconnect();

  if (result.failures.length > 0) {
    console.error(`Macro sync completed with failures: ${result.failures.join(", ")}`);
    process.exitCode = 1;
  } else {
    console.log("Macro sync complete.");
  }
}

main().catch(async (error: unknown) => {
  console.error(error instanceof Error ? error.message : "Macro sync failed.");
  process.exitCode = 1;
  try {
    const { prisma } = await import("../src/lib/prisma");
    await prisma.$disconnect();
  } catch {
    // Prisma may not have initialized.
  }
});
