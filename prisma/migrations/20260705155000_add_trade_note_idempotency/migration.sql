-- AlterTable
ALTER TABLE "TradeNote" ADD COLUMN "clientRequestId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "TradeNote_clientRequestId_key" ON "TradeNote"("clientRequestId");
