import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import {
  AssetType,
  MacroCategory,
  PrismaClient,
  UserRole,
} from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const assets = [
  { symbol: "SPX", name: "S&P 500", type: AssetType.INDEX, currency: "USD", country: "US" },
  { symbol: "NDX", name: "Nasdaq 100", type: AssetType.INDEX, currency: "USD", country: "US" },
  { symbol: "EURUSD", name: "EUR/USD", type: AssetType.FOREX },
  { symbol: "XAUUSD", name: "Gold", type: AssetType.COMMODITY, currency: "USD" },
  { symbol: "BTCUSD", name: "Bitcoin", type: AssetType.CRYPTO, currency: "USD" },
  { symbol: "US10Y", name: "US 10Y Yield", type: AssetType.RATE, currency: "USD", country: "US" },
] as const;

const indicators = [
  { code: "FEDFUNDS", name: "Federal Funds Rate", country: "US", category: MacroCategory.RATES, unit: "%" },
  { code: "US_CPI", name: "US Consumer Price Index", country: "US", category: MacroCategory.INFLATION, unit: "index" },
  { code: "US_UNEMPLOYMENT", name: "US Unemployment Rate", country: "US", category: MacroCategory.LABOR, unit: "%" },
  { code: "ECB_DEPOSIT_RATE", name: "ECB Deposit Facility Rate", country: "EU", category: MacroCategory.CENTRAL_BANK, unit: "%" },
  { code: "SNB_POLICY_RATE", name: "SNB Policy Rate", country: "CH", category: MacroCategory.CENTRAL_BANK, unit: "%" },
] as const;

async function main() {
  const joachim = await prisma.user.upsert({
    where: { email: "joachim@private-macro-desk.local" },
    update: { name: "Joachim", role: UserRole.OWNER },
    create: {
      name: "Joachim",
      email: "joachim@private-macro-desk.local",
      role: UserRole.OWNER,
    },
  });

  await prisma.user.upsert({
    where: { email: "friend@private-macro-desk.local" },
    update: { name: "Friend", role: UserRole.MEMBER },
    create: {
      name: "Friend",
      email: "friend@private-macro-desk.local",
      role: UserRole.MEMBER,
    },
  });

  const seededAssets = [];

  for (const asset of assets) {
    const seededAsset = await prisma.asset.upsert({
      where: { symbol_type: { symbol: asset.symbol, type: asset.type } },
      update: asset,
      create: asset,
    });

    seededAssets.push(seededAsset);
  }

  const mainWatchlist =
    (await prisma.watchlist.findFirst({
      where: { name: "Main Watchlist", userId: joachim.id },
    })) ??
    (await prisma.watchlist.create({
      data: { name: "Main Watchlist", userId: joachim.id },
    }));

  for (const asset of seededAssets) {
    await prisma.watchlistItem.upsert({
      where: {
        watchlistId_assetId: {
          watchlistId: mainWatchlist.id,
          assetId: asset.id,
        },
      },
      update: {},
      create: {
        watchlistId: mainWatchlist.id,
        assetId: asset.id,
      },
    });
  }

  for (const indicator of indicators) {
    await prisma.macroIndicator.upsert({
      where: { code: indicator.code },
      update: indicator,
      create: indicator,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
