-- CreateEnum
CREATE TYPE "DailyTrend" AS ENUM ('BULLISH', 'BEARISH', 'RANGE');

-- CreateEnum
CREATE TYPE "EntryZone" AS ENUM ('EMA50_PULLBACK', 'SUPPORT_RESISTANCE', 'FIB_RETRACEMENT', 'NONE');

-- CreateEnum
CREATE TYPE "EntrySignal" AS ENUM ('ENGULFING', 'PIN_BAR', 'RSI_OVERSOLD', 'RSI_OVERBOUGHT', 'NONE');

-- AlterTable
ALTER TABLE "Trade"
  ADD COLUMN "strategyCode" TEXT,
  ADD COLUMN "dailyTrend" "DailyTrend",
  ADD COLUMN "entryZone" "EntryZone",
  ADD COLUMN "entrySignal" "EntrySignal",
  ADD COLUMN "setupValid" BOOLEAN NOT NULL DEFAULT false;
