-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoogleCalendarConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'google',
    "calendarId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "tokenExpiry" TIMESTAMP(3) NOT NULL,
    "syncToken" TEXT,
    "resourceId" TEXT,
    "channelId" TEXT,
    "channelExpiry" TIMESTAMP(3),
    "timeZone" TEXT NOT NULL,
    "color" TEXT,

    CONSTRAINT "GoogleCalendarConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "roomId" TEXT,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "patientId" TEXT,
    "procedureCode" TEXT,
    "googleEventId" TEXT,
    "calendarId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdBy" TEXT NOT NULL DEFAULT 'system',
    "extended" JSONB,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "phoneE164" TEXT,
    "patientType" TEXT NOT NULL DEFAULT 'existing',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientInsurance" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "payerName" TEXT NOT NULL,
    "planName" TEXT,
    "memberIdEnc" TEXT NOT NULL,
    "groupNumberEnc" TEXT,
    "coverageSummary" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientInsurance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallTranscript" (
    "id" TEXT NOT NULL,
    "patientId" TEXT,
    "appointmentId" TEXT,
    "callSid" TEXT NOT NULL,
    "orchestrator" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "fullTranscript" TEXT,
    "transcriptEmbedding" TEXT,
    "sentimentScore" DOUBLE PRECISION,
    "treatmentAcceptance" BOOLEAN,
    "handoffOccurred" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallTranscript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallTranscriptSegment" (
    "id" SERIAL NOT NULL,
    "transcriptId" TEXT NOT NULL,
    "speaker" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "confidence" DOUBLE PRECISION,
    "meta" JSONB,

    CONSTRAINT "CallTranscriptSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsResult" (
    "id" TEXT NOT NULL,
    "transcriptId" TEXT NOT NULL,
    "sentimentScore" INTEGER NOT NULL,
    "satisfactionByProvider" JSONB NOT NULL,
    "treatmentAcceptance" JSONB NOT NULL,
    "riskFlags" JSONB NOT NULL DEFAULT '[]',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeKPI" (
    "id" SERIAL NOT NULL,
    "practiceId" TEXT NOT NULL,
    "kpiDate" TIMESTAMP(3) NOT NULL,
    "metricName" TEXT NOT NULL,
    "metricValue" DOUBLE PRECISION NOT NULL,
    "dimensions" JSONB,
    "transcriptId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PracticeKPI_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIPromptVersion" (
    "id" TEXT NOT NULL,
    "practiceId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIPromptVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertThreshold" (
    "id" TEXT NOT NULL,
    "practiceId" TEXT NOT NULL,
    "sentimentMin" INTEGER NOT NULL DEFAULT 4,
    "escalateOnTreatmentDecline" BOOLEAN NOT NULL DEFAULT true,
    "notifyChannel" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertThreshold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutingPolicy" (
    "id" TEXT NOT NULL,
    "practiceId" TEXT NOT NULL,
    "patientType" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoutingPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleCalendarConnection_userId_provider_calendarId_key" ON "GoogleCalendarConnection"("userId", "provider", "calendarId");

-- CreateIndex
CREATE INDEX "Appointment_patientId_start_idx" ON "Appointment"("patientId", "start");

-- CreateIndex
CREATE INDEX "Appointment_userId_start_idx" ON "Appointment"("userId", "start");

-- CreateIndex
CREATE INDEX "Patient_lastName_firstName_idx" ON "Patient"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "PatientInsurance_patientId_active_idx" ON "PatientInsurance"("patientId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "CallTranscript_callSid_key" ON "CallTranscript"("callSid");

-- CreateIndex
CREATE INDEX "CallTranscript_patientId_createdAt_idx" ON "CallTranscript"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "CallTranscript_appointmentId_idx" ON "CallTranscript"("appointmentId");

-- CreateIndex
CREATE INDEX "CallTranscriptSegment_transcriptId_startedAt_idx" ON "CallTranscriptSegment"("transcriptId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsResult_transcriptId_key" ON "AnalyticsResult"("transcriptId");

-- CreateIndex
CREATE INDEX "PracticeKPI_practiceId_kpiDate_idx" ON "PracticeKPI"("practiceId", "kpiDate");

-- CreateIndex
CREATE INDEX "PracticeKPI_metricName_kpiDate_idx" ON "PracticeKPI"("metricName", "kpiDate");

-- CreateIndex
CREATE INDEX "AIPromptVersion_practiceId_isActive_idx" ON "AIPromptVersion"("practiceId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "AIPromptVersion_practiceId_version_key" ON "AIPromptVersion"("practiceId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "AlertThreshold_practiceId_key" ON "AlertThreshold"("practiceId");

-- CreateIndex
CREATE UNIQUE INDEX "RoutingPolicy_practiceId_patientType_key" ON "RoutingPolicy"("practiceId", "patientType");

-- AddForeignKey
ALTER TABLE "GoogleCalendarConnection" ADD CONSTRAINT "GoogleCalendarConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientInsurance" ADD CONSTRAINT "PatientInsurance_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallTranscript" ADD CONSTRAINT "CallTranscript_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallTranscript" ADD CONSTRAINT "CallTranscript_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallTranscriptSegment" ADD CONSTRAINT "CallTranscriptSegment_transcriptId_fkey" FOREIGN KEY ("transcriptId") REFERENCES "CallTranscript"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsResult" ADD CONSTRAINT "AnalyticsResult_transcriptId_fkey" FOREIGN KEY ("transcriptId") REFERENCES "CallTranscript"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeKPI" ADD CONSTRAINT "PracticeKPI_transcriptId_fkey" FOREIGN KEY ("transcriptId") REFERENCES "CallTranscript"("id") ON DELETE SET NULL ON UPDATE CASCADE;

