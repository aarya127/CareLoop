CREATE TABLE IF NOT EXISTS "PatientMedicalHistory" (
    "patientId" TEXT NOT NULL,
    "history" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PatientMedicalHistory_pkey" PRIMARY KEY ("patientId")
);

CREATE TABLE IF NOT EXISTS "PatientRecordSectionsKv" (
    "patientId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PatientRecordSectionsKv_pkey" PRIMARY KEY ("patientId", "section")
);

DO $$ BEGIN
  ALTER TABLE "PatientMedicalHistory"
    ADD CONSTRAINT "PatientMedicalHistory_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "Patient"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "PatientRecordSectionsKv"
    ADD CONSTRAINT "PatientRecordSectionsKv_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "Patient"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
