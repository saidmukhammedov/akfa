-- AlterTable
ALTER TABLE "workers" ADD COLUMN     "ratePerM2" DECIMAL(14,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "volume_records" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "squareMeters" DECIMAL(10,2) NOT NULL,
    "rateSnapshot" DECIMAL(14,2) NOT NULL,
    "totalAmount" DECIMAL(14,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "volume_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "volume_records_workerId_idx" ON "volume_records"("workerId");

-- CreateIndex
CREATE INDEX "volume_records_date_idx" ON "volume_records"("date");

-- AddForeignKey
ALTER TABLE "volume_records" ADD CONSTRAINT "volume_records_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "workers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
