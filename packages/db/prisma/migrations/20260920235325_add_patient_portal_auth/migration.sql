-- CreateTable
CREATE TABLE "PatientCredential" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "practiceId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "passwordAlgo" TEXT NOT NULL DEFAULT 'bcrypt',
    "status" TEXT NOT NULL DEFAULT 'active',
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientSession" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "sessionTokenHash" TEXT NOT NULL,
    "csrfSecretHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "idleExpiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "revokeReason" TEXT,
    "createdByIp" TEXT,
    "createdByUserAgentHash" TEXT,

    CONSTRAINT "PatientSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientInvitation" (
    "id" TEXT NOT NULL,
    "practiceId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "invitedByUserId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PatientCredential_patientId_key" ON "PatientCredential"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "PatientCredential_email_key" ON "PatientCredential"("email");

-- CreateIndex
CREATE INDEX "PatientCredential_practiceId_status_lockedUntil_idx" ON "PatientCredential"("practiceId", "status", "lockedUntil");

-- CreateIndex
CREATE UNIQUE INDEX "PatientSession_sessionTokenHash_key" ON "PatientSession"("sessionTokenHash");

-- CreateIndex
CREATE INDEX "PatientSession_patientId_revokedAt_idx" ON "PatientSession"("patientId", "revokedAt");

-- CreateIndex
CREATE INDEX "PatientSession_expiresAt_idx" ON "PatientSession"("expiresAt");

-- CreateIndex
CREATE INDEX "PatientSession_idleExpiresAt_idx" ON "PatientSession"("idleExpiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PatientInvitation_tokenHash_key" ON "PatientInvitation"("tokenHash");

-- CreateIndex
CREATE INDEX "PatientInvitation_practiceId_status_idx" ON "PatientInvitation"("practiceId", "status");

-- CreateIndex
CREATE INDEX "PatientInvitation_patientId_status_idx" ON "PatientInvitation"("patientId", "status");

-- AddForeignKey
ALTER TABLE "PatientCredential" ADD CONSTRAINT "PatientCredential_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientCredential" ADD CONSTRAINT "PatientCredential_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "Practice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientSession" ADD CONSTRAINT "PatientSession_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientInvitation" ADD CONSTRAINT "PatientInvitation_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "Practice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientInvitation" ADD CONSTRAINT "PatientInvitation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
