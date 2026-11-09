-- A cancelled or expired order keeps its items for history; the edition can be ordered again.
DROP INDEX "OrderItem_editionId_key";
CREATE INDEX "OrderItem_editionId_idx" ON "OrderItem"("editionId");
