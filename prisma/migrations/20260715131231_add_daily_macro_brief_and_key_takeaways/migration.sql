-- AlterTable
ALTER TABLE "ResearchDocument" ADD COLUMN     "keyTakeaways" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "DailyMacroBrief" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "recap" TEXT NOT NULL,
    "drivers" JSONB NOT NULL,
    "scenarios" JSONB NOT NULL,
    "riskSentimentScore" INTEGER NOT NULL,
    "sourceDocumentIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sourceEventCount" INTEGER NOT NULL DEFAULT 0,
    "model" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyMacroBrief_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyMacroBrief_date_key" ON "DailyMacroBrief"("date");
