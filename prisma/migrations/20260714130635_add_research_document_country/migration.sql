-- AlterTable
ALTER TABLE "ResearchDocument" ADD COLUMN     "country" TEXT;

-- CreateIndex
CREATE INDEX "ResearchDocument_country_idx" ON "ResearchDocument"("country");
