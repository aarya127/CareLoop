-- Treatment Plans: grouped planned procedures with estimate + acceptance. Additive.

CREATE TABLE IF NOT EXISTS "TreatmentPlan" (
    "id" TEXT NOT NULL,
    "practiceId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "providerId" TEXT,
    "title" TEXT NOT NULL DEFAULT 'Treatment Plan',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "estimatedCostCents" INTEGER NOT NULL DEFAULT 0,
    "insuranceEstimateCents" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "acceptedBy" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TreatmentPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TreatmentPlanItem" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "toothNumber" INTEGER,
    "surface" TEXT,
    "procedureCode" TEXT,
    "description" TEXT NOT NULL,
    "feeCents" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "treatmentRecordId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TreatmentPlanItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "TreatmentPlan_practiceId_patientId_createdAt_idx" ON "TreatmentPlan"("practiceId", "patientId", "createdAt");
CREATE INDEX IF NOT EXISTS "TreatmentPlan_practiceId_status_idx" ON "TreatmentPlan"("practiceId", "status");
CREATE INDEX IF NOT EXISTS "TreatmentPlanItem_planId_idx" ON "TreatmentPlanItem"("planId");

DO $$ BEGIN
  ALTER TABLE "TreatmentPlan" ADD CONSTRAINT "TreatmentPlan_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "Practice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "TreatmentPlan" ADD CONSTRAINT "TreatmentPlan_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "TreatmentPlanItem" ADD CONSTRAINT "TreatmentPlanItem_planId_fkey" FOREIGN KEY ("planId") REFERENCES "TreatmentPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
