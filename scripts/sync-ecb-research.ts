import "dotenv/config";

import { syncEcbResearchDocuments } from "../src/lib/data/ecbResearch";

async function main() {
  const result = await syncEcbResearchDocuments();
  const { prisma } = await import("../src/lib/prisma");
  await prisma.$disconnect();

  console.log(`ECB research sync complete: ${result.created} created, ${result.updated} updated.`);
}

main().catch(async (error: unknown) => {
  console.error(error instanceof Error ? error.message : "ECB research sync failed.");
  process.exitCode = 1;
  try {
    const { prisma } = await import("../src/lib/prisma");
    await prisma.$disconnect();
  } catch {
    // Prisma may not have initialized.
  }
});
