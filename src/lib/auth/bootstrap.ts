import { AssetType, UserRole } from "@prisma/client";
import { writeFile } from "node:fs/promises";
import path from "node:path";

import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";

// Same curated catalog as prisma/seed.ts's `assets` list — kept in sync manually since
// this one also has to run unattended on a fresh Docker deployment (seed.ts is a personal
// dev script with real emails and isn't safe to run automatically).
const STARTER_ASSETS = [
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

const CREDENTIALS_NOTE = `Private Macro Desk — initial accounts (created automatically on first boot)

The login form asks for an email, not a username:

  Email: user1@private-macro-desk.local   Password: user1   (owner)
  Email: user2@private-macro-desk.local   Password: user2   (member)

Change both passwords immediately from Settings after your first login.
This file is written once, at first boot, and is never updated afterwards —
it will still show these values even after you've changed the passwords.
`;

export async function ensureDefaultUsers() {
  const userCount = await prisma.user.count();
  if (userCount > 0) return;

  const owner = await prisma.user.create({
    data: {
      name: "User 1",
      email: "user1@private-macro-desk.local",
      passwordHash: hashPassword("user1"),
      role: UserRole.OWNER,
    },
  });

  await prisma.user.create({
    data: {
      name: "User 2",
      email: "user2@private-macro-desk.local",
      passwordHash: hashPassword("user2"),
      role: UserRole.MEMBER,
    },
  });

  const watchlist = await prisma.watchlist.create({
    data: { name: "Main Watchlist", userId: owner.id },
  });

  for (const asset of STARTER_ASSETS) {
    const seededAsset = await prisma.asset.upsert({
      where: { symbol_type: { symbol: asset.symbol, type: asset.type } },
      update: {},
      create: asset,
    });
    await prisma.watchlistItem.create({
      data: { watchlistId: watchlist.id, assetId: seededAsset.id },
    });
  }

  try {
    await writeFile(path.join(process.cwd(), "CREDENTIALS.txt"), CREDENTIALS_NOTE, "utf-8");
  } catch (error) {
    console.warn("[Bootstrap] Could not write CREDENTIALS.txt (read-only filesystem?):", error);
  }

  console.log(
    "[Bootstrap] No users found — created default accounts (login uses email, not username): " +
      "user1@private-macro-desk.local / user1 (owner) and user2@private-macro-desk.local / user2 (member). " +
      `Also created a starter Main Watchlist (${STARTER_ASSETS.length} assets) and wrote CREDENTIALS.txt.`,
  );
}
