-- AlterTable
ALTER TABLE "TradeNote" ADD COLUMN     "screenshotUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
