/*
  Warnings:

  - You are about to drop the column `ipAddress` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `isRevoked` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `lastUsedAt` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `token` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `userAgent` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[sessionTokenHash]` on the table `Session` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `csrfSecretHash` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idleExpiresAt` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sessionTokenHash` to the `Session` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Session_token_idx";

-- DropIndex
DROP INDEX "Session_token_key";

-- DropIndex
DROP INDEX "Session_userId_idx";

-- DropIndex
DROP INDEX "User_email_idx";

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "ipAddress",
DROP COLUMN "isRevoked",
DROP COLUMN "lastUsedAt",
DROP COLUMN "token",
DROP COLUMN "userAgent",
ADD COLUMN     "createdByIp" TEXT,
ADD COLUMN     "createdByUserAgentHash" TEXT,
ADD COLUMN     "csrfSecretHash" TEXT NOT NULL,
ADD COLUMN     "idleExpiresAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "revokeReason" TEXT,
ADD COLUMN     "revokedAt" TIMESTAMP(3),
ADD COLUMN     "rotatedAt" TIMESTAMP(3),
ADD COLUMN     "sessionTokenHash" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "isActive",
DROP COLUMN "role",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "lockedUntil" TIMESTAMP(3),
ADD COLUMN     "passwordAlgo" TEXT NOT NULL DEFAULT 'bcrypt',
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ALTER COLUMN "firstName" DROP NOT NULL,
ALTER COLUMN "firstName" DROP DEFAULT,
ALTER COLUMN "lastName" DROP NOT NULL,
ALTER COLUMN "lastName" DROP DEFAULT;

-- DropEnum
DROP TYPE "UserRole";

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "userId" TEXT NOT NULL,
    "roleId" INTEGER NOT NULL,
    "assignedBy" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "ServiceAccount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientSecretHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "rotatedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "ServiceAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" BIGSERIAL NOT NULL,
    "eventTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorUserId" TEXT,
    "actorServiceAccountId" TEXT,
    "eventType" TEXT NOT NULL,
    "authMethod" TEXT,
    "outcome" TEXT NOT NULL,
    "targetUserId" TEXT,
    "sessionId" TEXT,
    "ip" TEXT,
    "userAgentHash" TEXT,
    "requestId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthIdentity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerSubject" TEXT NOT NULL,
    "providerEmail" TEXT,
    "providerEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceAccount_clientId_key" ON "ServiceAccount"("clientId");

-- CreateIndex
CREATE INDEX "AuditLog_eventTime_idx" ON "AuditLog"("eventTime");

-- CreateIndex
CREATE INDEX "AuditLog_eventType_eventTime_idx" ON "AuditLog"("eventType", "eventTime");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_eventTime_idx" ON "AuditLog"("actorUserId", "eventTime");

-- CreateIndex
CREATE INDEX "AuditLog_targetUserId_eventTime_idx" ON "AuditLog"("targetUserId", "eventTime");

-- CreateIndex
CREATE INDEX "AuthIdentity_userId_idx" ON "AuthIdentity"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AuthIdentity_provider_providerSubject_key" ON "AuthIdentity"("provider", "providerSubject");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionTokenHash_key" ON "Session"("sessionTokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_revokedAt_idx" ON "Session"("userId", "revokedAt");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "Session_idleExpiresAt_idx" ON "Session"("idleExpiresAt");

-- CreateIndex
CREATE INDEX "User_status_lockedUntil_idx" ON "User"("status", "lockedUntil");

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorServiceAccountId_fkey" FOREIGN KEY ("actorServiceAccountId") REFERENCES "ServiceAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthIdentity" ADD CONSTRAINT "AuthIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
