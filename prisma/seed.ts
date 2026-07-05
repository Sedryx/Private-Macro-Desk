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
  { code: "FEDFUNDS", name: "Federal Funds Rate", country: "US", category: MacroCategory.RATES, unit: "%", source: "Demo seed - not live" },
  { code: "US_CPI", name: "US CPI Inflation (YoY)", country: "US", category: MacroCategory.INFLATION, unit: "%", source: "Demo seed - not live" },
  { code: "US_UNEMPLOYMENT", name: "US Unemployment Rate", country: "US", category: MacroCategory.LABOR, unit: "%", source: "Demo seed - not live" },
  { code: "ECB_DEPOSIT_RATE", name: "ECB Deposit Facility Rate", country: "EU", category: MacroCategory.CENTRAL_BANK, unit: "%", source: "Demo seed - not live" },
  { code: "SNB_POLICY_RATE", name: "SNB Policy Rate", country: "CH", category: MacroCategory.CENTRAL_BANK, unit: "%", source: "Demo seed - not live" },
] as const;

const macroSeries: Record<(typeof indicators)[number]["code"], number[]> = {
  FEDFUNDS: [5.25, 5.25, 5.25, 5.0, 4.75, 4.75, 4.5, 4.5, 4.25, 4.25, 4.0, 4.0, 3.75, 3.75, 3.5, 3.5, 3.25, 3.25],
  US_CPI: [3.4, 3.2, 3.1, 3.0, 2.9, 3.0, 2.8, 2.7, 2.6, 2.5, 2.6, 2.4, 2.3, 2.4, 2.2, 2.1, 2.0, 2.1],
  US_UNEMPLOYMENT: [3.7, 3.8, 3.8, 3.9, 4.0, 4.0, 4.1, 4.1, 4.2, 4.1, 4.2, 4.2, 4.1, 4.1, 4.0, 4.0, 3.9, 3.9],
  ECB_DEPOSIT_RATE: [4.0, 4.0, 3.75, 3.75, 3.5, 3.5, 3.25, 3.25, 3.0, 3.0, 2.75, 2.75, 2.5, 2.5, 2.25, 2.25, 2.0, 2.0],
  SNB_POLICY_RATE: [1.75, 1.75, 1.5, 1.5, 1.25, 1.25, 1.0, 1.0, 0.75, 0.75, 0.5, 0.5, 0.5, 0.25, 0.25, 0.25, 0.25, 0.25],
};

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
    const seededIndicator = await prisma.macroIndicator.upsert({
      where: { code: indicator.code },
      update: indicator,
      create: indicator,
    });

    await prisma.macroValue.deleteMany({
      where: { indicatorId: seededIndicator.id },
    });

    await prisma.macroValue.createMany({
      data: macroSeries[indicator.code].map((value, monthIndex) => ({
        indicatorId: seededIndicator.id,
        date: new Date(Date.UTC(2025, monthIndex, 1)),
        value,
      })),
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
