ALTER TABLE "EconomicEvent"
ADD COLUMN "externalId" TEXT,
ADD COLUMN "provider" TEXT,
ADD COLUMN "currency" TEXT;

CREATE UNIQUE INDEX "EconomicEvent_provider_externalId_key"
ON "EconomicEvent"("provider", "externalId");
