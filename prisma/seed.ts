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
  { symbol: "DJI", name: "Dow Jones", type: AssetType.INDEX, currency: "USD", country: "US" },
  { symbol: "RUSSELL2000", name: "Russell 2000", type: AssetType.INDEX, currency: "USD", country: "US" },
  { symbol: "DAX", name: "DAX 40", type: AssetType.INDEX, currency: "EUR", country: "DE" },
  { symbol: "CAC40", name: "CAC 40", type: AssetType.INDEX, currency: "EUR", country: "FR" },
  { symbol: "FTSE100", name: "FTSE 100", type: AssetType.INDEX, currency: "GBP", country: "UK" },
  { symbol: "NIKKEI225", name: "Nikkei 225", type: AssetType.INDEX, currency: "JPY", country: "JP" },
  { symbol: "EURUSD", name: "EUR/USD", type: AssetType.FOREX, currency: "USD" },
  { symbol: "GBPUSD", name: "GBP/USD", type: AssetType.FOREX, currency: "USD" },
  { symbol: "USDJPY", name: "USD/JPY", type: AssetType.FOREX, currency: "JPY" },
  { symbol: "USDCHF", name: "USD/CHF", type: AssetType.FOREX, currency: "CHF" },
  { symbol: "EURCHF", name: "EUR/CHF", type: AssetType.FOREX, currency: "CHF" },
  { symbol: "AUDUSD", name: "AUD/USD", type: AssetType.FOREX, currency: "USD" },
  { symbol: "USDCAD", name: "USD/CAD", type: AssetType.FOREX, currency: "CAD" },
  { symbol: "XAUUSD", name: "Gold", type: AssetType.COMMODITY, currency: "USD" },
  { symbol: "XAGUSD", name: "Silver", type: AssetType.COMMODITY, currency: "USD" },
  { symbol: "WTI", name: "WTI Crude Oil", type: AssetType.COMMODITY, currency: "USD" },
  { symbol: "BRENT", name: "Brent Crude Oil", type: AssetType.COMMODITY, currency: "USD" },
  { symbol: "NATGAS", name: "Natural Gas", type: AssetType.COMMODITY, currency: "USD" },
  { symbol: "BTCUSD", name: "Bitcoin", type: AssetType.CRYPTO, currency: "USD" },
  { symbol: "ETHUSD", name: "Ethereum", type: AssetType.CRYPTO, currency: "USD" },
  { symbol: "SOLUSD", name: "Solana", type: AssetType.CRYPTO, currency: "USD" },
  { symbol: "US2Y", name: "US 2Y Yield", type: AssetType.RATE, currency: "USD", country: "US" },
  { symbol: "US10Y", name: "US 10Y Yield", type: AssetType.RATE, currency: "USD", country: "US" },
  { symbol: "DE10Y", name: "German 10Y Bund", type: AssetType.RATE, currency: "EUR", country: "DE" },
  { symbol: "CH10Y", name: "Swiss 10Y Yield", type: AssetType.RATE, currency: "CHF", country: "CH" },
  { symbol: "AAPL", name: "Apple", type: AssetType.STOCK, currency: "USD", country: "US", exchange: "NASDAQ" },
  { symbol: "MSFT", name: "Microsoft", type: AssetType.STOCK, currency: "USD", country: "US", exchange: "NASDAQ" },
  { symbol: "NVDA", name: "Nvidia", type: AssetType.STOCK, currency: "USD", country: "US", exchange: "NASDAQ" },
  { symbol: "TSLA", name: "Tesla", type: AssetType.STOCK, currency: "USD", country: "US", exchange: "NASDAQ" },
  { symbol: "META", name: "Meta Platforms", type: AssetType.STOCK, currency: "USD", country: "US", exchange: "NASDAQ" },
  { symbol: "AMZN", name: "Amazon", type: AssetType.STOCK, currency: "USD", country: "US", exchange: "NASDAQ" },
  { symbol: "GOOGL", name: "Alphabet", type: AssetType.STOCK, currency: "USD", country: "US", exchange: "NASDAQ" },
] as const;

const starterAssetKeys = new Set([
  "SPX:INDEX",
  "NDX:INDEX",
  "EURUSD:FOREX",
  "XAUUSD:COMMODITY",
  "BTCUSD:CRYPTO",
  "US10Y:RATE",
]);

const indicators = [
  { code: "SNB_POLICY_RATE", name: "SNB Policy Rate", country: "CH", category: MacroCategory.CENTRAL_BANK, unit: "%", source: "Demo seed - not live" },
] as const;

const macroSeries: Record<(typeof indicators)[number]["code"], number[]> = {
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

  for (const asset of seededAssets.filter((item) =>
    starterAssetKeys.has(`${item.symbol}:${item.type}`),
  )) {
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
