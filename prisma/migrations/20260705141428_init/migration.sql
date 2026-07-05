-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'MEMBER');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('STOCK', 'ETF', 'INDEX', 'FOREX', 'CRYPTO', 'COMMODITY', 'RATE');

-- CreateEnum
CREATE TYPE "Bias" AS ENUM ('BULLISH', 'BEARISH', 'NEUTRAL');

-- CreateEnum
CREATE TYPE "TradeDirection" AS ENUM ('LONG', 'SHORT');

-- CreateEnum
CREATE TYPE "TradeStatus" AS ENUM ('PLANNED', 'OPEN', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MacroCategory" AS ENUM ('RATES', 'INFLATION', 'LABOR', 'GROWTH', 'PMI', 'CENTRAL_BANK', 'OTHER');

-- CreateEnum
CREATE TYPE "EventImportance" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('PDF', 'FILING', 'NOTE', 'ARTICLE', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AssetType" NOT NULL,
    "exchange" TEXT,
    "currency" TEXT,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Watchlist" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Watchlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchlistItem" (
    "id" TEXT NOT NULL,
    "watchlistId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "bias" "Bias",
    "notes" TEXT,
    "importantLevel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WatchlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "direction" "TradeDirection" NOT NULL,
    "status" "TradeStatus" NOT NULL DEFAULT 'PLANNED',
    "entryPrice" DECIMAL(65,30),
    "stopLoss" DECIMAL(65,30),
    "takeProfit" DECIMAL(65,30),
    "riskPercent" DECIMAL(65,30),
    "thesis" TEXT NOT NULL,
    "invalidation" TEXT,
    "result" TEXT,
    "mistakeTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "openedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeNote" (
    "id" TEXT NOT NULL,
    "tradeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TradeNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MacroIndicator" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT,
    "category" "MacroCategory" NOT NULL,
    "unit" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MacroIndicator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MacroValue" (
    "id" TEXT NOT NULL,
    "indicatorId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "value" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MacroValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EconomicEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "country" TEXT,
    "importance" "EventImportance" NOT NULL,
    "eventTime" TIMESTAMP(3) NOT NULL,
    "previousValue" TEXT,
    "forecastValue" TEXT,
    "actualValue" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EconomicEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchDocument" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "source" TEXT,
    "fileUrl" TEXT,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchChunk" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "pageNumber" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResearchChunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Asset_symbol_idx" ON "Asset"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_symbol_type_key" ON "Asset"("symbol", "type");

-- CreateIndex
CREATE UNIQUE INDEX "WatchlistItem_watchlistId_assetId_key" ON "WatchlistItem"("watchlistId", "assetId");

-- CreateIndex
CREATE INDEX "Trade_userId_idx" ON "Trade"("userId");

-- CreateIndex
CREATE INDEX "Trade_assetId_idx" ON "Trade"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "MacroIndicator_code_key" ON "MacroIndicator"("code");

-- CreateIndex
CREATE INDEX "MacroValue_date_idx" ON "MacroValue"("date");

-- CreateIndex
CREATE UNIQUE INDEX "MacroValue_indicatorId_date_key" ON "MacroValue"("indicatorId", "date");

-- CreateIndex
CREATE INDEX "EconomicEvent_eventTime_idx" ON "EconomicEvent"("eventTime");

-- CreateIndex
CREATE INDEX "ResearchChunk_documentId_idx" ON "ResearchChunk"("documentId");

-- AddForeignKey
ALTER TABLE "Watchlist" ADD CONSTRAINT "Watchlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchlistItem" ADD CONSTRAINT "WatchlistItem_watchlistId_fkey" FOREIGN KEY ("watchlistId") REFERENCES "Watchlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchlistItem" ADD CONSTRAINT "WatchlistItem_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeNote" ADD CONSTRAINT "TradeNote_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeNote" ADD CONSTRAINT "TradeNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MacroValue" ADD CONSTRAINT "MacroValue_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "MacroIndicator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchDocument" ADD CONSTRAINT "ResearchDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchChunk" ADD CONSTRAINT "ResearchChunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "ResearchDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
