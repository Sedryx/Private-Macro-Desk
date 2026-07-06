ALTER TABLE "ResearchDocument"
ADD COLUMN "secItems" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "exhibits" JSONB,
ADD COLUMN "importance" TEXT,
ADD COLUMN "category" TEXT,
ADD COLUMN "summary" TEXT;

CREATE INDEX "ResearchDocument_formType_idx" ON "ResearchDocument"("formType");
CREATE INDEX "ResearchDocument_importance_idx" ON "ResearchDocument"("importance");
