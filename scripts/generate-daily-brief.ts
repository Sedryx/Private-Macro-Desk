import "dotenv/config";

import { generateDailyBriefIfStale } from "../src/lib/ai/dailyBrief";

async function main() {
  const result = await generateDailyBriefIfStale(true);
  const { prisma } = await import("../src/lib/prisma");
  await prisma.$disconnect();

  console.log(`Daily macro brief: ${result.status}.`);
  if (result.status === "failed") process.exitCode = 1;
}

main().catch(async (error: unknown) => {
  console.error(error instanceof Error ? error.message : "Daily macro brief generation failed.");
  process.exitCode = 1;
  try {
    const { prisma } = await import("../src/lib/prisma");
    await prisma.$disconnect();
  } catch {
    // Prisma may not have initialized.
  }
});
