import "dotenv/config";

import { syncSecResearchDocuments } from "../src/lib/data/secResearch";

async function main() {
  const result = await syncSecResearchDocuments();
  const { prisma } = await import("../src/lib/prisma");
  await prisma.$disconnect();

  if (result.status === "skipped") {
    console.log("SEC EDGAR research sync skipped. Configure SEC_USER_AGENT to enable it.");
    return;
  }

  console.log(
    `SEC EDGAR research sync complete: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped.`,
  );
}

main().catch(async (error: unknown) => {
  console.error(error instanceof Error ? error.message : "SEC EDGAR research sync failed.");
  process.exitCode = 1;
  try {
    const { prisma } = await import("../src/lib/prisma");
    await prisma.$disconnect();
  } catch {
    // Prisma may not have initialized.
  }
});

