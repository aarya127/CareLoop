-- EMR module: first-class clinical models (Encounter, Allergy, Medication,
-- Condition, ToothChartEntry, PeriodontalExam) + additive DocumentCategory
-- values. Purely additive — does not touch existing tables, the FTS
-- search_vector columns, or any pre-existing schema drift.

-- AlterEnum (guarded): the DocumentCategory enum may not exist in databases
-- where Document.category is still a TEXT column (pre-existing drift). Only
-- extend the enum when it actually exists; category validation is also enforced
-- at the application layer (ALLOWED_DOCUMENT_CATEGORIES).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DocumentCategory') THEN
    ALTER TYPE "DocumentCategory" ADD VALUE IF NOT EXISTS 'radiograph';
    ALTER TYPE "DocumentCategory" ADD VALUE IF NOT EXISTS 'clinical_photo';
    ALTER TYPE "DocumentCategory" ADD VALUE IF NOT EXISTS 'treatment_plan';
  END IF;
END
$$;

-- CreateTable
CREATE TABLE "Encounter" (
    "id" TEXT NOT NULL,
    "practiceId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "providerId" TEXT,
    "authorId" TEXT,
    "encounterDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL DEFAULT 'exam',
    "chiefComplaint" TEXT,
    "subjective" TEXT,
    "objective" TEXT,
    "assessment" TEXT,
    "plan" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "signedAt" TIMESTAMP(3),
    "signedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Encounter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Allergy" (
    "id" TEXT NOT NULL,
    "practiceId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "allergen" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'moderate',
    "reaction" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "recordedBy" TEXT,
    "notedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Allergy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medication" (
    "id" TEXT NOT NULL,
    "practiceId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dosage" TEXT,
    "frequency" TEXT,
    "route" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "prescribedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Medication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Condition" (
    "id" TEXT NOT NULL,
    "practiceId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "onsetDate" TIMESTAMP(3),
    "resolvedDate" TIMESTAMP(3),
    "notes" TEXT,
    "recordedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Condition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToothChartEntry" (
    "id" TEXT NOT NULL,
    "practiceId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "toothNumber" INTEGER NOT NULL,
    "surfaces" TEXT[],
    "condition" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "chartedBy" TEXT,
    "chartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ToothChartEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeriodontalExam" (
    "id" TEXT NOT NULL,
    "practiceId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "examDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "examinedBy" TEXT,
    "measurements" JSONB,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PeriodontalExam_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Encounter_practiceId_patientId_encounterDate_idx" ON "Encounter"("practiceId", "patientId", "encounterDate");

-- CreateIndex
CREATE INDEX "Encounter_practiceId_status_encounterDate_idx" ON "Encounter"("practiceId", "status", "encounterDate");

-- CreateIndex
CREATE INDEX "Allergy_practiceId_patientId_status_idx" ON "Allergy"("practiceId", "patientId", "status");

-- CreateIndex
CREATE INDEX "Medication_practiceId_patientId_status_idx" ON "Medication"("practiceId", "patientId", "status");

-- CreateIndex
CREATE INDEX "Condition_practiceId_patientId_status_idx" ON "Condition"("practiceId", "patientId", "status");

-- CreateIndex
CREATE INDEX "ToothChartEntry_practiceId_patientId_idx" ON "ToothChartEntry"("practiceId", "patientId");

-- CreateIndex
CREATE UNIQUE INDEX "ToothChartEntry_practiceId_patientId_toothNumber_key" ON "ToothChartEntry"("practiceId", "patientId", "toothNumber");

-- CreateIndex
CREATE INDEX "PeriodontalExam_practiceId_patientId_examDate_idx" ON "PeriodontalExam"("practiceId", "patientId", "examDate");

-- AddForeignKey
ALTER TABLE "Encounter" ADD CONSTRAINT "Encounter_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "Practice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Encounter" ADD CONSTRAINT "Encounter_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allergy" ADD CONSTRAINT "Allergy_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "Practice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allergy" ADD CONSTRAINT "Allergy_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medication" ADD CONSTRAINT "Medication_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "Practice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medication" ADD CONSTRAINT "Medication_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Condition" ADD CONSTRAINT "Condition_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "Practice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Condition" ADD CONSTRAINT "Condition_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToothChartEntry" ADD CONSTRAINT "ToothChartEntry_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "Practice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToothChartEntry" ADD CONSTRAINT "ToothChartEntry_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeriodontalExam" ADD CONSTRAINT "PeriodontalExam_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "Practice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeriodontalExam" ADD CONSTRAINT "PeriodontalExam_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
