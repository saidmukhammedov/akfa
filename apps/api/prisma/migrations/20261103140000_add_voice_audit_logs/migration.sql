-- CreateTable
CREATE TABLE "voice_audit_logs" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "transcript" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "resultSummary" TEXT,
    "confirmationToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voice_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "voice_audit_logs_confirmationToken_key" ON "voice_audit_logs"("confirmationToken");

-- CreateIndex
CREATE INDEX "voice_audit_logs_ownerId_idx" ON "voice_audit_logs"("ownerId");

-- CreateIndex
CREATE INDEX "voice_audit_logs_confirmationToken_idx" ON "voice_audit_logs"("confirmationToken");

-- CreateIndex
CREATE INDEX "voice_audit_logs_createdAt_idx" ON "voice_audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "voice_audit_logs" ADD CONSTRAINT "voice_audit_logs_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "owners"("id") ON DELETE CASCADE ON UPDATE CASCADE;
