import "dotenv/config";

import { syncFedResearchDocuments } from "../src/lib/data/fedResearch";

async function main() {
  const result = await syncFedResearchDocuments();
  const { prisma } = await import("../src/lib/prisma");
  await prisma.$disconnect();

  console.log(`Fed research sync complete: ${result.created} created, ${result.updated} updated.`);
}

main().catch(async (error: unknown) => {
  console.error(error instanceof Error ? error.message : "Fed research sync failed.");
  process.exitCode = 1;
  try {
    const { prisma } = await import("../src/lib/prisma");
    await prisma.$disconnect();
  } catch {
    // Prisma may not have initialized.
  }
});
