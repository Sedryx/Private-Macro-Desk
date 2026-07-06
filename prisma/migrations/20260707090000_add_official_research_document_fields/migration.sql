ALTER TABLE "ResearchDocument"
ADD COLUMN "externalId" TEXT,
ADD COLUMN "provider" TEXT,
ADD COLUMN "ticker" TEXT,
ADD COLUMN "companyName" TEXT,
ADD COLUMN "formType" TEXT,
ADD COLUMN "filedAt" TIMESTAMP(3),
ADD COLUMN "reportDate" TIMESTAMP(3),
ADD COLUMN "sourceUrl" TEXT;

CREATE INDEX "ResearchDocument_provider_idx" ON "ResearchDocument"("provider");
CREATE INDEX "ResearchDocument_ticker_idx" ON "ResearchDocument"("ticker");
CREATE INDEX "ResearchDocument_filedAt_idx" ON "ResearchDocument"("filedAt");
CREATE UNIQUE INDEX "ResearchDocument_provider_externalId_key" ON "ResearchDocument"("provider", "externalId");
