-- CreateTable
CREATE TABLE "Claim" (
    "id" TEXT NOT NULL,
    "practiceId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "insuranceId" TEXT,
    "treatmentId" TEXT,
    "invoiceId" TEXT,
    "claimNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "totalChargedCents" INTEGER NOT NULL DEFAULT 0,
    "approvedAmountCents" INTEGER,
    "rejectionCode" TEXT,
    "notes" TEXT,
    "submittedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Claim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimLine" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "procedureCode" TEXT NOT NULL,
    "description" TEXT,
    "toothNumber" INTEGER,
    "chargedCents" INTEGER NOT NULL DEFAULT 0,
    "allowedCents" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClaimLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimStatusEvent" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "code" TEXT,
    "note" TEXT,
    "actorUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClaimStatusEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Claim_practiceId_status_idx" ON "Claim"("practiceId", "status");

-- CreateIndex
CREATE INDEX "Claim_patientId_idx" ON "Claim"("patientId");

-- CreateIndex
CREATE INDEX "ClaimLine_claimId_idx" ON "ClaimLine"("claimId");

-- CreateIndex
CREATE INDEX "ClaimStatusEvent_claimId_createdAt_idx" ON "ClaimStatusEvent"("claimId", "createdAt");

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "Practice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimLine" ADD CONSTRAINT "ClaimLine_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimStatusEvent" ADD CONSTRAINT "ClaimStatusEvent_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE CASCADE ON UPDATE CASCADE;
