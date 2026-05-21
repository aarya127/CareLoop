--
-- PostgreSQL database dump
--

\restrict pZqW2gdScDTOpHLpGTSah8l3rZWNaSg6GAjLqHVVaHNNJj2RpO7zp5mMh9R3e3U

-- Dumped from database version 17.10 (322a063)
-- Dumped by pg_dump version 18.3 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AIPromptVersion; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."AIPromptVersion" (
    id text NOT NULL,
    "practiceId" text NOT NULL,
    version integer NOT NULL,
    "systemPrompt" text NOT NULL,
    "isActive" boolean DEFAULT false NOT NULL,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AIPromptVersion" OWNER TO neondb_owner;

--
-- Name: AlertThreshold; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."AlertThreshold" (
    id text NOT NULL,
    "practiceId" text NOT NULL,
    "sentimentMin" integer DEFAULT 4 NOT NULL,
    "escalateOnTreatmentDecline" boolean DEFAULT true NOT NULL,
    "notifyChannel" jsonb,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."AlertThreshold" OWNER TO neondb_owner;

--
-- Name: AnalyticsResult; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."AnalyticsResult" (
    id text NOT NULL,
    "transcriptId" text NOT NULL,
    "sentimentScore" integer NOT NULL,
    "satisfactionByProvider" jsonb NOT NULL,
    "treatmentAcceptance" jsonb NOT NULL,
    "riskFlags" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "generatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AnalyticsResult" OWNER TO neondb_owner;

--
-- Name: Appointment; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Appointment" (
    id text NOT NULL,
    "practiceId" text NOT NULL,
    "userId" text NOT NULL,
    "providerId" text NOT NULL,
    "roomId" text,
    title text NOT NULL,
    notes text,
    start timestamp(3) without time zone NOT NULL,
    "end" timestamp(3) without time zone NOT NULL,
    "timeZone" text DEFAULT 'America/New_York'::text NOT NULL,
    "patientId" text,
    "procedureCode" text,
    "googleEventId" text,
    "calendarId" text,
    status text DEFAULT 'confirmed'::text NOT NULL,
    source text DEFAULT 'manual'::text NOT NULL,
    "createdBy" text DEFAULT 'system'::text NOT NULL,
    extended jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Appointment" OWNER TO neondb_owner;

--
-- Name: AppointmentHold; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."AppointmentHold" (
    id text NOT NULL,
    "practiceId" text NOT NULL,
    "providerId" text,
    "roomId" text,
    start timestamp(3) without time zone NOT NULL,
    "end" timestamp(3) without time zone NOT NULL,
    "patientId" text,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text NOT NULL,
    reason text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AppointmentHold" OWNER TO neondb_owner;

--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."AuditLog" (
    id bigint NOT NULL,
    "eventTime" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "actorUserId" text,
    "actorServiceAccountId" text,
    "eventType" text NOT NULL,
    "authMethod" text,
    outcome text NOT NULL,
    "targetUserId" text,
    "sessionId" text,
    ip text,
    "userAgentHash" text,
    "requestId" text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public."AuditLog" OWNER TO neondb_owner;

--
-- Name: AuditLog_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public."AuditLog_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."AuditLog_id_seq" OWNER TO neondb_owner;

--
-- Name: AuditLog_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public."AuditLog_id_seq" OWNED BY public."AuditLog".id;


--
-- Name: AuthIdentity; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."AuthIdentity" (
    id text NOT NULL,
    "userId" text NOT NULL,
    provider text NOT NULL,
    "providerSubject" text NOT NULL,
    "providerEmail" text,
    "providerEmailVerified" boolean DEFAULT false NOT NULL,
    "linkedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."AuthIdentity" OWNER TO neondb_owner;

--
-- Name: AvailabilityBlock; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."AvailabilityBlock" (
    id text NOT NULL,
    "practiceId" text NOT NULL,
    "providerId" text,
    "roomId" text,
    start timestamp(3) without time zone NOT NULL,
    "end" timestamp(3) without time zone NOT NULL,
    reason text NOT NULL,
    source text DEFAULT 'manual'::text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."AvailabilityBlock" OWNER TO neondb_owner;

--
-- Name: CallTranscript; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."CallTranscript" (
    id text NOT NULL,
    "practiceId" text NOT NULL,
    "patientId" text,
    "appointmentId" text,
    "callSid" text NOT NULL,
    orchestrator text NOT NULL,
    "startedAt" timestamp(3) without time zone NOT NULL,
    "endedAt" timestamp(3) without time zone,
    "fullTranscript" text,
    "transcriptEmbedding" text,
    "sentimentScore" double precision,
    "treatmentAcceptance" boolean,
    "handoffOccurred" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."CallTranscript" OWNER TO neondb_owner;

--
-- Name: CallTranscriptSegment; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."CallTranscriptSegment" (
    id integer NOT NULL,
    "transcriptId" text NOT NULL,
    speaker text NOT NULL,
    text text NOT NULL,
    "startedAt" timestamp(3) without time zone NOT NULL,
    "endedAt" timestamp(3) without time zone,
    confidence double precision,
    meta jsonb
);


ALTER TABLE public."CallTranscriptSegment" OWNER TO neondb_owner;

--
-- Name: CallTranscriptSegment_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public."CallTranscriptSegment_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."CallTranscriptSegment_id_seq" OWNER TO neondb_owner;

--
-- Name: CallTranscriptSegment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public."CallTranscriptSegment_id_seq" OWNED BY public."CallTranscriptSegment".id;


--
-- Name: Conversation; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Conversation" (
    id text NOT NULL,
    "practiceId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Conversation" OWNER TO neondb_owner;

--
-- Name: Document; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Document" (
    id text NOT NULL,
    "practiceId" text NOT NULL,
    "patientId" text,
    "uploadedBy" text,
    category text NOT NULL,
    "fileName" text NOT NULL,
    "mimeType" text NOT NULL,
    "storageKey" text NOT NULL,
    "sizeBytes" integer,
    status text DEFAULT 'uploading'::text NOT NULL,
    "uploadedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "checksumSha256" text
);


ALTER TABLE public."Document" OWNER TO neondb_owner;

--
-- Name: FailedJob; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."FailedJob" (
    id text NOT NULL,
    queue text NOT NULL,
    "jobId" text NOT NULL,
    "jobName" text NOT NULL,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    "failReason" text NOT NULL,
    "attemptsMade" integer DEFAULT 0 NOT NULL,
    "practiceId" text,
    "failedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "retriedAt" timestamp(3) without time zone
);


ALTER TABLE public."FailedJob" OWNER TO neondb_owner;

--
-- Name: GoogleCalendarConnection; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."GoogleCalendarConnection" (
    id text NOT NULL,
    "practiceId" text NOT NULL,
    "userId" text NOT NULL,
    provider text DEFAULT 'google'::text NOT NULL,
    "calendarId" text NOT NULL,
    "accessToken" text NOT NULL,
    "refreshToken" text NOT NULL,
    "tokenExpiry" timestamp(3) without time zone NOT NULL,
    "syncToken" text,
    "resourceId" text,
    "channelId" text,
    "channelExpiry" timestamp(3) without time zone,
    "timeZone" text NOT NULL,
    color text
);


ALTER TABLE public."GoogleCalendarConnection" OWNER TO neondb_owner;

--
-- Name: IntakeDraft; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."IntakeDraft" (
    id text NOT NULL,
    "practiceId" text NOT NULL,
    token text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    "patientId" text,
    "idempotencyKey" text,
    "submittedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."IntakeDraft" OWNER TO neondb_owner;

--
-- Name: IntakeSubmission; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."IntakeSubmission" (
    id text NOT NULL,
    "practiceId" text NOT NULL,
    "patientId" text,
    "formType" text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    data jsonb NOT NULL,
    "submittedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "reviewedAt" timestamp(3) without time zone,
    "reviewedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."IntakeSubmission" OWNER TO neondb_owner;

--
-- Name: Invoice; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Invoice" (
    id text NOT NULL,
    "practiceId" text NOT NULL,
    "patientId" text NOT NULL,
    "treatmentId" text,
    status text DEFAULT 'draft'::text NOT NULL,
    "totalAmountCents" integer NOT NULL,
    "dueDate" timestamp(3) without time zone,
    "issuedAt" timestamp(3) without time zone,
    "paidAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text,
    "lineItems" jsonb,
    notes text,
    "payerType" text DEFAULT 'patient'::text NOT NULL,
    "updatedBy" text
);


ALTER TABLE public."Invoice" OWNER TO neondb_owner;

--
-- Name: Message; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Message" (
    id text NOT NULL,
    "conversationId" text NOT NULL,
    "senderId" text NOT NULL,
    content text NOT NULL,
    "sentAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Message" OWNER TO neondb_owner;

--
-- Name: Participant; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Participant" (
    id text NOT NULL,
    "conversationId" text NOT NULL,
    "userId" text,
    "patientId" text,
    "joinedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Participant" OWNER TO neondb_owner;

--
-- Name: Patient; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Patient" (
    id text NOT NULL,
    "practiceId" text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    "dateOfBirth" timestamp(3) without time zone,
    "phoneE164" text,
    "patientType" text DEFAULT 'existing'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Patient" OWNER TO neondb_owner;

--
-- Name: PatientInsurance; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."PatientInsurance" (
    id text NOT NULL,
    "patientId" text NOT NULL,
    "payerName" text NOT NULL,
    "planName" text,
    "memberIdEnc" text NOT NULL,
    "groupNumberEnc" text,
    "coverageSummary" jsonb,
    active boolean DEFAULT true NOT NULL,
    "verifiedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "memberIdHash" text
);


ALTER TABLE public."PatientInsurance" OWNER TO neondb_owner;

--
-- Name: PatientSensitiveNote; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."PatientSensitiveNote" (
    id text NOT NULL,
    "practiceId" text NOT NULL,
    "patientId" text NOT NULL,
    "authorId" text,
    "noteType" text DEFAULT 'clinical'::text NOT NULL,
    content text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PatientSensitiveNote" OWNER TO neondb_owner;

--
-- Name: PaymentRecord; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."PaymentRecord" (
    id text NOT NULL,
    "practiceId" text NOT NULL,
    "invoiceId" text NOT NULL,
    "patientId" text NOT NULL,
    method text NOT NULL,
    "amountCents" integer NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    "transactionRef" text,
    "paidAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text,
    "payerType" text DEFAULT 'patient'::text NOT NULL
);


ALTER TABLE public."PaymentRecord" OWNER TO neondb_owner;

--
-- Name: Practice; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Practice" (
    id text NOT NULL,
    name text NOT NULL,
    address text,
    "timeZone" text DEFAULT 'America/New_York'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Practice" OWNER TO neondb_owner;

--
-- Name: PracticeKPI; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."PracticeKPI" (
    id integer NOT NULL,
    "practiceId" text NOT NULL,
    "kpiDate" timestamp(3) without time zone NOT NULL,
    "metricName" text NOT NULL,
    "metricValue" double precision NOT NULL,
    dimensions jsonb,
    "transcriptId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PracticeKPI" OWNER TO neondb_owner;

--
-- Name: PracticeKPI_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public."PracticeKPI_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."PracticeKPI_id_seq" OWNER TO neondb_owner;

--
-- Name: PracticeKPI_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public."PracticeKPI_id_seq" OWNED BY public."PracticeKPI".id;


--
-- Name: Provider; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Provider" (
    id text NOT NULL,
    "practiceId" text NOT NULL,
    name text NOT NULL,
    license text,
    specialty text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Provider" OWNER TO neondb_owner;

--
-- Name: ProviderSchedule; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."ProviderSchedule" (
    id text NOT NULL,
    "practiceId" text NOT NULL,
    "providerId" text NOT NULL,
    "dayOfWeek" integer NOT NULL,
    "startMin" integer NOT NULL,
    "endMin" integer NOT NULL,
    "effectiveFrom" timestamp(3) without time zone,
    "effectiveTo" timestamp(3) without time zone,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ProviderSchedule" OWNER TO neondb_owner;

--
-- Name: Reminder; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Reminder" (
    id text NOT NULL,
    "practiceId" text NOT NULL,
    "patientId" text NOT NULL,
    "appointmentId" text,
    channel text NOT NULL,
    type text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    "scheduledAt" timestamp(3) without time zone NOT NULL,
    "sentAt" timestamp(3) without time zone,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "failReason" text,
    "retryCount" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."Reminder" OWNER TO neondb_owner;

--
-- Name: Role; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Role" (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Role" OWNER TO neondb_owner;

--
-- Name: Role_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public."Role_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Role_id_seq" OWNER TO neondb_owner;

--
-- Name: Role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public."Role_id_seq" OWNED BY public."Role".id;


--
-- Name: Room; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Room" (
    id text NOT NULL,
    "practiceId" text NOT NULL,
    name text NOT NULL,
    capacity integer DEFAULT 1 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Room" OWNER TO neondb_owner;

--
-- Name: RoutingPolicy; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."RoutingPolicy" (
    id text NOT NULL,
    "practiceId" text NOT NULL,
    "patientType" text NOT NULL,
    mode text NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."RoutingPolicy" OWNER TO neondb_owner;

--
-- Name: ServiceAccount; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."ServiceAccount" (
    id text NOT NULL,
    name text NOT NULL,
    "clientId" text NOT NULL,
    "clientSecretHash" text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    scopes text[] DEFAULT ARRAY[]::text[],
    "lastUsedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "rotatedAt" timestamp(3) without time zone,
    "revokedAt" timestamp(3) without time zone
);


ALTER TABLE public."ServiceAccount" OWNER TO neondb_owner;

--
-- Name: Session; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Session" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdByIp" text,
    "createdByUserAgentHash" text,
    "csrfSecretHash" text NOT NULL,
    "idleExpiresAt" timestamp(3) without time zone NOT NULL,
    "lastSeenAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "revokeReason" text,
    "revokedAt" timestamp(3) without time zone,
    "rotatedAt" timestamp(3) without time zone,
    "sessionTokenHash" text NOT NULL
);


ALTER TABLE public."Session" OWNER TO neondb_owner;

--
-- Name: TreatmentRecord; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."TreatmentRecord" (
    id text NOT NULL,
    "practiceId" text NOT NULL,
    "patientId" text NOT NULL,
    "appointmentId" text,
    "providerId" text,
    "procedureCode" text,
    "toothNumber" integer,
    surface text,
    notes text,
    status text DEFAULT 'planned'::text NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text,
    "updatedBy" text
);


ALTER TABLE public."TreatmentRecord" OWNER TO neondb_owner;

--
-- Name: User; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    "practiceId" text NOT NULL,
    "deletedReason" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "firstName" text,
    "lastName" text,
    "passwordHash" text,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "emailVerifiedAt" timestamp(3) without time zone,
    "failedLoginCount" integer DEFAULT 0 NOT NULL,
    "lastLoginAt" timestamp(3) without time zone,
    "lockedUntil" timestamp(3) without time zone,
    "passwordAlgo" text DEFAULT 'bcrypt'::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL
);


ALTER TABLE public."User" OWNER TO neondb_owner;

--
-- Name: UserRole; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."UserRole" (
    "userId" text NOT NULL,
    "roleId" integer NOT NULL,
    "assignedBy" text,
    "assignedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."UserRole" OWNER TO neondb_owner;

--
-- Name: WebhookLog; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."WebhookLog" (
    id text NOT NULL,
    provider text NOT NULL,
    event text NOT NULL,
    "idempotencyKey" text NOT NULL,
    "rawPayload" jsonb DEFAULT '{}'::jsonb NOT NULL,
    status text DEFAULT 'received'::text NOT NULL,
    "processedAt" timestamp(3) without time zone,
    error text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."WebhookLog" OWNER TO neondb_owner;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO neondb_owner;

--
-- Name: AuditLog id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."AuditLog" ALTER COLUMN id SET DEFAULT nextval('public."AuditLog_id_seq"'::regclass);


--
-- Name: CallTranscriptSegment id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."CallTranscriptSegment" ALTER COLUMN id SET DEFAULT nextval('public."CallTranscriptSegment_id_seq"'::regclass);


--
-- Name: PracticeKPI id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."PracticeKPI" ALTER COLUMN id SET DEFAULT nextval('public."PracticeKPI_id_seq"'::regclass);


--
-- Name: Role id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Role" ALTER COLUMN id SET DEFAULT nextval('public."Role_id_seq"'::regclass);


--
-- Data for Name: AIPromptVersion; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AIPromptVersion" (id, "practiceId", version, "systemPrompt", "isActive", "createdBy", "createdAt") FROM stdin;
cmp50iqum000v8qhh895uivmm	demo-practice	1	You are a helpful dental office AI assistant. Be concise, professional, and HIPAA-aware. Never reveal protected health information to unauthorized callers.	t	user-admin	2026-05-14 04:52:53.998
\.


--
-- Data for Name: AlertThreshold; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AlertThreshold" (id, "practiceId", "sentimentMin", "escalateOnTreatmentDecline", "notifyChannel", "updatedAt") FROM stdin;
cmp50ir4d000x8qhhe6gd2crw	demo-practice	4	t	{"type": "slack", "webhookEnvVar": "SLACK_WEBHOOK_URL"}	2026-05-14 04:52:54.349
\.


--
-- Data for Name: AnalyticsResult; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AnalyticsResult" (id, "transcriptId", "sentimentScore", "satisfactionByProvider", "treatmentAcceptance", "riskFlags", "generatedAt") FROM stdin;
\.


--
-- Data for Name: Appointment; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Appointment" (id, "practiceId", "userId", "providerId", "roomId", title, notes, start, "end", "timeZone", "patientId", "procedureCode", "googleEventId", "calendarId", status, source, "createdBy", extended, "createdAt", "updatedAt") FROM stdin;
appt-3	demo-practice	user-admin	cmp50ioes00038qhhpof0l12r	cmp50iopd00078qhhlvuglpzr	New Patient Exam: Carol Smith	\N	2026-05-14 10:52:52.516	2026-05-14 11:52:52.516	America/New_York	patient-3	D0150	\N	\N	scheduled	ai_booked	system	\N	2026-05-14 04:52:53.623	2026-05-14 04:52:53.623
appt-1	demo-practice	user-admin	cmp50ioes00028qhhru9j269d	cmp50iopd00078qhhlvuglpzr	Routine Exam: Alice Johnson	\N	2026-05-14 05:52:52.516	2026-05-14 06:22:52.516	America/New_York	patient-1	D0120	\N	\N	confirmed	manual	system	\N	2026-05-14 04:52:53.622	2026-05-14 04:52:53.622
appt-2	demo-practice	user-admin	cmp50ioes00028qhhru9j269d	cmp50iopd00068qhh41pn5fzt	Crown Prep: Bob Martinez	\N	2026-05-14 07:52:52.516	2026-05-14 09:22:52.516	America/New_York	patient-2	D2710	\N	\N	confirmed	ai_booked	system	\N	2026-05-14 04:52:53.622	2026-05-14 04:52:53.622
\.


--
-- Data for Name: AppointmentHold; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AppointmentHold" (id, "practiceId", "providerId", "roomId", start, "end", "patientId", "expiresAt", "createdBy", reason, "createdAt") FROM stdin;
\.


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AuditLog" (id, "eventTime", "actorUserId", "actorServiceAccountId", "eventType", "authMethod", outcome, "targetUserId", "sessionId", ip, "userAgentHash", "requestId", metadata) FROM stdin;
1	2026-05-14 05:17:27.94	user-dev	\N	login_success	password	success	user-dev	cmp51ec4d00014jej2e9hjxl9	127.0.0.1	node	\N	{}
3	2026-05-14 16:10:47.175	user-dev	\N	login_success	password	success	user-dev	cmp5oqig00003138odsre58wd	127.0.0.1	node	\N	{}
2	2026-05-14 16:10:47.174	user-dev	\N	login_success	password	success	user-dev	cmp5oqifz0001138o7h2zt853	127.0.0.1	node	\N	{}
4	2026-05-14 18:45:26.592	user-dev	\N	login_success	password	success	user-dev	cmp5u9ehm0001m1eemylcpt43	127.0.0.1	node	\N	{}
5	2026-05-14 23:04:09.702	user-dev	\N	login_success	password	success	user-dev	cmp63i46z0001jee82qxqkxg2	127.0.0.1	node	\N	{}
6	2026-05-14 23:04:25.444	user-dev	\N	login_success	password	success	user-dev	cmp63igd00003jee8hna0rghe	127.0.0.1	node	\N	{}
7	2026-05-15 02:07:25.29	user-dev	\N	login_success	password	success	user-dev	cmp6a1sgg00013kapm7sc4zmj	127.0.0.1	node	\N	{}
8	2026-05-15 02:37:10.332	user-dev	\N	login_success	password	success	user-dev	cmp6b41sp0001dqh8lqrnf3ww	127.0.0.1	node	\N	{}
9	2026-05-15 03:41:01.851	user-dev	\N	login_success	password	success	user-dev	cmp6de6700001hezewlo8v3is	127.0.0.1	node	\N	{}
10	2026-05-15 04:21:24.22	user-dev	\N	login_success	password	success	user-dev	cmp6eu3aw0001dvf4emj6twyb	127.0.0.1	node	\N	{}
11	2026-05-15 04:39:36.035	\N	\N	login_failed	password	failure	user-dev	\N	127.0.0.1	node	\N	{}
12	2026-05-15 04:52:17.454	user-dev	\N	login_success	password	success	user-dev	cmp6fxtan0001exvdq2alx47f	127.0.0.1	node	\N	{}
13	2026-05-20 04:57:21.874	user-dev	\N	login_success	password	success	user-dev	cmpdlblfz0001cucxzqwz8ckd	127.0.0.1	node	\N	{}
14	2026-05-20 04:57:21.874	user-dev	\N	login_success	password	success	user-dev	cmpdlblip0003cucxihs094v2	127.0.0.1	node	\N	{}
15	2026-05-21 15:47:47.547	user-dev	\N	login_success	password	success	user-dev	cmpfnzwkx00016dx34hib7xuu	127.0.0.1	node	\N	{}
16	2026-05-21 15:47:57.098	user-dev	\N	login_success	password	success	user-dev	cmpfo03yy00036dx3y4xcnul2	127.0.0.1	node	\N	{}
17	2026-05-21 19:29:59.109	user-dev	\N	login_success	password	success	user-dev	cmpfvxnaj000198bmawk6ojz9	127.0.0.1	node	\N	{}
18	2026-05-21 19:30:05.175	user-dev	\N	login_success	password	success	user-dev	cmpfvxrze000398bmgyold7n0	127.0.0.1	node	\N	{}
19	2026-05-21 19:33:14.375	user-dev	\N	login_success	password	success	user-dev	cmpfw1tyy000598bms0m96rr7	127.0.0.1	node	\N	{}
\.


--
-- Data for Name: AuthIdentity; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AuthIdentity" (id, "userId", provider, "providerSubject", "providerEmail", "providerEmailVerified", "linkedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AvailabilityBlock; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AvailabilityBlock" (id, "practiceId", "providerId", "roomId", start, "end", reason, source, "isActive", "createdAt", "updatedAt") FROM stdin;
cmp50ipqp000t8qhh6ur2ppqk	demo-practice	\N	\N	2026-05-14 16:00:00	2026-05-14 17:00:00	Lunch Block	manual	t	2026-05-14 04:52:52.561	2026-05-14 04:52:52.561
\.


--
-- Data for Name: CallTranscript; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."CallTranscript" (id, "practiceId", "patientId", "appointmentId", "callSid", orchestrator, "startedAt", "endedAt", "fullTranscript", "transcriptEmbedding", "sentimentScore", "treatmentAcceptance", "handoffOccurred", "createdAt") FROM stdin;
\.


--
-- Data for Name: CallTranscriptSegment; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."CallTranscriptSegment" (id, "transcriptId", speaker, text, "startedAt", "endedAt", confidence, meta) FROM stdin;
\.


--
-- Data for Name: Conversation; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Conversation" (id, "practiceId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Document; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Document" (id, "practiceId", "patientId", "uploadedBy", category, "fileName", "mimeType", "storageKey", "sizeBytes", status, "uploadedAt", "createdAt", "updatedAt", "checksumSha256") FROM stdin;
\.


--
-- Data for Name: FailedJob; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."FailedJob" (id, queue, "jobId", "jobName", data, "failReason", "attemptsMade", "practiceId", "failedAt", "retriedAt") FROM stdin;
\.


--
-- Data for Name: GoogleCalendarConnection; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."GoogleCalendarConnection" (id, "practiceId", "userId", provider, "calendarId", "accessToken", "refreshToken", "tokenExpiry", "syncToken", "resourceId", "channelId", "channelExpiry", "timeZone", color) FROM stdin;
\.


--
-- Data for Name: IntakeDraft; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."IntakeDraft" (id, "practiceId", token, status, data, "patientId", "idempotencyKey", "submittedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: IntakeSubmission; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."IntakeSubmission" (id, "practiceId", "patientId", "formType", status, data, "submittedAt", "reviewedAt", "reviewedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Invoice; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Invoice" (id, "practiceId", "patientId", "treatmentId", status, "totalAmountCents", "dueDate", "issuedAt", "paidAt", "createdAt", "updatedAt", "createdBy", "lineItems", notes, "payerType", "updatedBy") FROM stdin;
\.


--
-- Data for Name: Message; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Message" (id, "conversationId", "senderId", content, "sentAt") FROM stdin;
\.


--
-- Data for Name: Participant; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Participant" (id, "conversationId", "userId", "patientId", "joinedAt") FROM stdin;
\.


--
-- Data for Name: Patient; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Patient" (id, "practiceId", "firstName", "lastName", "dateOfBirth", "phoneE164", "patientType", "createdAt", "updatedAt") FROM stdin;
patient-1	demo-practice	Alice	Johnson	1985-03-14 00:00:00	+14155551000	existing	2026-05-14 04:52:52.668	2026-05-14 04:52:52.668
patient-2	demo-practice	Bob	Martinez	1972-07-22 00:00:00	+14155551001	existing	2026-05-14 04:52:52.668	2026-05-14 04:52:52.668
patient-3	demo-practice	Carol	Smith	1993-11-05 00:00:00	+14155551002	new	2026-05-14 04:52:52.668	2026-05-14 04:52:52.668
\.


--
-- Data for Name: PatientInsurance; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."PatientInsurance" (id, "patientId", "payerName", "planName", "memberIdEnc", "groupNumberEnc", "coverageSummary", active, "verifiedAt", "createdAt", "memberIdHash") FROM stdin;
ins-1	patient-1	Delta Dental	PPO Plus	DEMO_ENC_MEMBER_001	DEMO_ENC_GROUP_001	{"basic": "80%", "major": "50%", "ortho": "not covered", "preventive": "100%"}	t	\N	2026-05-14 04:52:53.059	\N
ins-2	patient-2	Cigna Dental	DPPO	DEMO_ENC_MEMBER_002	DEMO_ENC_GROUP_002	{"basic": "70%", "major": "50%", "preventive": "100%"}	t	\N	2026-05-14 04:52:53.405	\N
\.


--
-- Data for Name: PatientSensitiveNote; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."PatientSensitiveNote" (id, "practiceId", "patientId", "authorId", "noteType", content, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PaymentRecord; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."PaymentRecord" (id, "practiceId", "invoiceId", "patientId", method, "amountCents", status, "transactionRef", "paidAt", "createdAt", "updatedAt", "createdBy", "payerType") FROM stdin;
\.


--
-- Data for Name: Practice; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Practice" (id, name, address, "timeZone", "createdAt", "updatedAt") FROM stdin;
demo-practice	Demo Dental Practice	123 Main St, Springfield	America/New_York	2026-05-14 04:52:47.392	2026-05-14 04:52:47.392
\.


--
-- Data for Name: PracticeKPI; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."PracticeKPI" (id, "practiceId", "kpiDate", "metricName", "metricValue", dimensions, "transcriptId", "createdAt") FROM stdin;
1	demo-practice	2026-05-08 04:00:00	scheduled_count	11.4504	{"source": "seed"}	\N	2026-05-14 04:52:55.174
2	demo-practice	2026-05-08 04:00:00	no_show_rate	0.0785	{"source": "seed"}	\N	2026-05-14 04:52:55.174
3	demo-practice	2026-05-08 04:00:00	treatment_acceptance_rate	0.7084	{"source": "seed"}	\N	2026-05-14 04:52:55.174
4	demo-practice	2026-05-09 04:00:00	scheduled_count	11.057	{"source": "seed"}	\N	2026-05-14 04:52:55.174
5	demo-practice	2026-05-09 04:00:00	no_show_rate	0.082	{"source": "seed"}	\N	2026-05-14 04:52:55.174
6	demo-practice	2026-05-09 04:00:00	treatment_acceptance_rate	0.7784	{"source": "seed"}	\N	2026-05-14 04:52:55.174
7	demo-practice	2026-05-10 04:00:00	scheduled_count	11.7368	{"source": "seed"}	\N	2026-05-14 04:52:55.174
8	demo-practice	2026-05-10 04:00:00	no_show_rate	0.0869	{"source": "seed"}	\N	2026-05-14 04:52:55.174
9	demo-practice	2026-05-10 04:00:00	treatment_acceptance_rate	0.6888	{"source": "seed"}	\N	2026-05-14 04:52:55.174
10	demo-practice	2026-05-11 04:00:00	scheduled_count	12.7778	{"source": "seed"}	\N	2026-05-14 04:52:55.174
11	demo-practice	2026-05-11 04:00:00	no_show_rate	0.0869	{"source": "seed"}	\N	2026-05-14 04:52:55.174
12	demo-practice	2026-05-11 04:00:00	treatment_acceptance_rate	0.6976	{"source": "seed"}	\N	2026-05-14 04:52:55.174
13	demo-practice	2026-05-12 04:00:00	scheduled_count	11.615	{"source": "seed"}	\N	2026-05-14 04:52:55.174
14	demo-practice	2026-05-12 04:00:00	no_show_rate	0.0841	{"source": "seed"}	\N	2026-05-14 04:52:55.174
15	demo-practice	2026-05-12 04:00:00	treatment_acceptance_rate	0.7167	{"source": "seed"}	\N	2026-05-14 04:52:55.174
16	demo-practice	2026-05-13 04:00:00	scheduled_count	12.5435	{"source": "seed"}	\N	2026-05-14 04:52:55.174
17	demo-practice	2026-05-13 04:00:00	no_show_rate	0.0801	{"source": "seed"}	\N	2026-05-14 04:52:55.174
18	demo-practice	2026-05-13 04:00:00	treatment_acceptance_rate	0.6794	{"source": "seed"}	\N	2026-05-14 04:52:55.174
19	demo-practice	2026-05-14 04:00:00	scheduled_count	12.8687	{"source": "seed"}	\N	2026-05-14 04:52:55.174
20	demo-practice	2026-05-14 04:00:00	no_show_rate	0.076	{"source": "seed"}	\N	2026-05-14 04:52:55.174
21	demo-practice	2026-05-14 04:00:00	treatment_acceptance_rate	0.6998	{"source": "seed"}	\N	2026-05-14 04:52:55.174
\.


--
-- Data for Name: Provider; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Provider" (id, "practiceId", name, license, specialty, "isActive", "createdAt", "updatedAt") FROM stdin;
cmp50ioes00038qhhpof0l12r	demo-practice	Dr. Jones	\N	Orthodontics	t	2026-05-14 04:52:50.834	2026-05-14 04:52:50.834
cmp50ioes00028qhhru9j269d	demo-practice	Dr. Smith	\N	General Dentistry	t	2026-05-14 04:52:50.834	2026-05-14 04:52:50.834
\.


--
-- Data for Name: ProviderSchedule; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ProviderSchedule" (id, "practiceId", "providerId", "dayOfWeek", "startMin", "endMin", "effectiveFrom", "effectiveTo", "isActive", "createdAt", "updatedAt") FROM stdin;
cmp50ip2200098qhhjve6husz	demo-practice	cmp50ioes00028qhhru9j269d	1	540	1020	\N	\N	t	2026-05-14 04:52:51.674	2026-05-14 04:52:51.674
cmp50ip5r000b8qhh8puttzcr	demo-practice	cmp50ioes00028qhhru9j269d	2	540	1020	\N	\N	t	2026-05-14 04:52:51.807	2026-05-14 04:52:51.807
cmp50ip7v000d8qhhw8qmh7oa	demo-practice	cmp50ioes00028qhhru9j269d	3	540	1020	\N	\N	t	2026-05-14 04:52:51.883	2026-05-14 04:52:51.883
cmp50ipa6000f8qhhsv506zb1	demo-practice	cmp50ioes00028qhhru9j269d	4	540	1020	\N	\N	t	2026-05-14 04:52:51.966	2026-05-14 04:52:51.966
cmp50ipco000h8qhh6szkce4z	demo-practice	cmp50ioes00028qhhru9j269d	5	540	1020	\N	\N	t	2026-05-14 04:52:52.056	2026-05-14 04:52:52.056
cmp50ipf0000j8qhhf95upm4r	demo-practice	cmp50ioes00038qhhpof0l12r	1	540	1020	\N	\N	t	2026-05-14 04:52:52.141	2026-05-14 04:52:52.141
cmp50ipha000l8qhhzvv657db	demo-practice	cmp50ioes00038qhhpof0l12r	2	540	1020	\N	\N	t	2026-05-14 04:52:52.222	2026-05-14 04:52:52.222
cmp50ipjl000n8qhhnqz62pkv	demo-practice	cmp50ioes00038qhhpof0l12r	3	540	1020	\N	\N	t	2026-05-14 04:52:52.305	2026-05-14 04:52:52.305
cmp50iplv000p8qhh6wddn4sx	demo-practice	cmp50ioes00038qhhpof0l12r	4	540	1020	\N	\N	t	2026-05-14 04:52:52.387	2026-05-14 04:52:52.387
cmp50ipo9000r8qhh53tovl3r	demo-practice	cmp50ioes00038qhhpof0l12r	5	540	1020	\N	\N	t	2026-05-14 04:52:52.473	2026-05-14 04:52:52.473
\.


--
-- Data for Name: Reminder; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Reminder" (id, "practiceId", "patientId", "appointmentId", channel, type, status, "scheduledAt", "sentAt", metadata, "createdAt", "updatedAt", "failReason", "retryCount") FROM stdin;
\.


--
-- Data for Name: Role; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Role" (id, name, description, "createdAt", "updatedAt") FROM stdin;
1	ADMIN	ADMIN	2026-05-14 04:52:48.315	2026-05-14 04:52:48.315
2	PROVIDER	PROVIDER	2026-05-14 04:52:49.029	2026-05-14 04:52:49.029
3	HYGIENIST	HYGIENIST	2026-05-14 04:52:49.474	2026-05-14 04:52:49.474
4	STAFF	STAFF	2026-05-14 04:52:49.907	2026-05-14 04:52:49.907
\.


--
-- Data for Name: Room; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Room" (id, "practiceId", name, capacity, "isActive", "createdAt", "updatedAt") FROM stdin;
cmp50iopd00068qhh41pn5fzt	demo-practice	Room B	1	t	2026-05-14 04:52:51.217	2026-05-14 04:52:51.217
cmp50iopd00078qhhlvuglpzr	demo-practice	Room A	1	t	2026-05-14 04:52:51.217	2026-05-14 04:52:51.217
\.


--
-- Data for Name: RoutingPolicy; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."RoutingPolicy" (id, "practiceId", "patientType", mode, "updatedAt") FROM stdin;
cmp50iree00108qhh2iw0v0zh	demo-practice	existing	human_first	2026-05-14 04:52:54.711
cmp50iree00118qhhg4iqpbe1	demo-practice	new	ai_first	2026-05-14 04:52:54.711
\.


--
-- Data for Name: ServiceAccount; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ServiceAccount" (id, name, "clientId", "clientSecretHash", status, scopes, "lastUsedAt", "createdAt", "updatedAt", "rotatedAt", "revokedAt") FROM stdin;
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Session" (id, "userId", "expiresAt", "createdAt", "createdByIp", "createdByUserAgentHash", "csrfSecretHash", "idleExpiresAt", "lastSeenAt", "revokeReason", "revokedAt", "rotatedAt", "sessionTokenHash") FROM stdin;
cmp51ec4d00014jej2e9hjxl9	user-dev	2026-05-15 05:17:27.9	2026-05-14 05:17:27.902	127.0.0.1	545ea538461003efdc8c81c244531b003f6f26cfccf6c0073b3239fdedf49446	50b8e5b56133e1bfd44fef7f690ca7fdf3ebd6eb897c8c6cfb512a904d21a470	2026-05-14 05:48:27.695	2026-05-14 05:18:27.695	\N	\N	\N	365af3e7ad5635fb47c9c1d95c70e1d0b90620ab618b99d5f8f02fbb5fa9fbc3
cmp5oqig00003138odsre58wd	user-dev	2026-05-15 16:10:47.135	2026-05-14 16:10:47.136	127.0.0.1	545ea538461003efdc8c81c244531b003f6f26cfccf6c0073b3239fdedf49446	d9b46943ca098767c2e950519604785811c9b965437333d2b8993832b36c3d57	2026-05-14 16:40:47.135	2026-05-14 16:10:47.136	\N	\N	\N	78de87852d064a33ad728d9b3f9e2b42b7267598c0467b15c5ca8d9782669b37
cmp5oqifz0001138o7h2zt853	user-dev	2026-05-15 16:10:47.134	2026-05-14 16:10:47.136	127.0.0.1	545ea538461003efdc8c81c244531b003f6f26cfccf6c0073b3239fdedf49446	887a2890c3fc33c2324b9c2f0f505941419ef3a641a613564b993eae183145f9	2026-05-14 16:40:47.134	2026-05-14 16:10:47.136	\N	\N	\N	0d9ca93b6b1ee955126b439086025d26d3052d868511c1a3668b81586115ea43
cmp63i46z0001jee82qxqkxg2	user-dev	2026-05-15 23:04:09.658	2026-05-14 23:04:09.659	127.0.0.1	545ea538461003efdc8c81c244531b003f6f26cfccf6c0073b3239fdedf49446	11762ea97545f92dd2a0a4b69acf4ddd40db7ef5d5c2110c68c5a5bf6b576396	2026-05-14 23:34:09.658	2026-05-14 23:04:09.659	\N	\N	\N	9dc998a40df3ea9fae370a14b59c67c4c83ac2be51632032aea1b2724bf724f8
cmp63igd00003jee8hna0rghe	user-dev	2026-05-15 23:04:25.427	2026-05-14 23:04:25.428	127.0.0.1	545ea538461003efdc8c81c244531b003f6f26cfccf6c0073b3239fdedf49446	8b34f5e58c56ccbe18080788728d662399c95d58fee7b3816a8b48fab386f4f5	2026-05-14 23:39:22.478	2026-05-14 23:09:22.478	\N	\N	\N	3c3092588c212af184c337d1baa85e636cdf8bd4c484828234af9035938c0701
cmp5u9ehm0001m1eemylcpt43	user-dev	2026-05-15 18:45:26.554	2026-05-14 18:45:26.555	127.0.0.1	545ea538461003efdc8c81c244531b003f6f26cfccf6c0073b3239fdedf49446	1d4cadd1a0508ce445b546159803a8e33432deffb913a3fd5cfac50983e25eb9	2026-05-14 19:15:26.554	2026-05-14 18:45:26.555	expired	2026-05-15 02:07:24.837	\N	b00280d0d6ae44eb3d27deb07346813e2d4b2da8de6b926577838169b9007567
cmp6a1sgg00013kapm7sc4zmj	user-dev	2026-05-16 02:07:25.264	2026-05-15 02:07:25.265	127.0.0.1	545ea538461003efdc8c81c244531b003f6f26cfccf6c0073b3239fdedf49446	9b4c88f95173eefc0efcac21a8e0d276bd39870d31aceddfa0c20edff87db271	2026-05-15 02:37:25.264	2026-05-15 02:07:25.265	\N	\N	\N	31c9257817564db8d24f41f41b501a4a959acd62e40ab328a3cf8d99842301d1
cmp6b41sp0001dqh8lqrnf3ww	user-dev	2026-05-16 02:37:10.247	2026-05-15 02:37:10.297	127.0.0.1	545ea538461003efdc8c81c244531b003f6f26cfccf6c0073b3239fdedf49446	9f886a14848d30b7ab32799b9a7d297633aac4900599b4c696c68c0ed3e47fcb	2026-05-15 03:16:50.441	2026-05-15 02:46:50.441	expired	2026-05-15 03:41:01.351	\N	864cb4064accdb90fa3a488ce43b749ed7ebfc8ad77fbaec4ec9b0f784bfc96b
cmp6de6700001hezewlo8v3is	user-dev	2026-05-16 03:41:01.787	2026-05-15 03:41:01.789	127.0.0.1	545ea538461003efdc8c81c244531b003f6f26cfccf6c0073b3239fdedf49446	0833931f7b5958673f63dd01470b28027c62731176be1e9e769bfcc11ccd77fb	2026-05-15 04:51:23.72	2026-05-15 04:21:24.463	\N	\N	\N	6a6695cf8f1c3fb410182ff191fdf44e44da43a36a31f86f7d9dbc00d7d6c038
cmp6eu3aw0001dvf4emj6twyb	user-dev	2026-05-16 04:21:24.151	2026-05-15 04:21:24.152	127.0.0.1	545ea538461003efdc8c81c244531b003f6f26cfccf6c0073b3239fdedf49446	c5549d0f9c202da72f532ba167f181369cb2241481fcb5b81c2915127bba86ce	2026-05-15 05:21:23.022	2026-05-15 04:51:23.022	\N	\N	\N	3e5f0008c388b9bd2175507fba54863e94c9d999985a97c6971982ec905d628e
cmp6fxtan0001exvdq2alx47f	user-dev	2026-05-16 04:52:17.423	2026-05-15 04:52:17.424	127.0.0.1	545ea538461003efdc8c81c244531b003f6f26cfccf6c0073b3239fdedf49446	71224b3a3424c324268ee6936fdc4072a2e44e52ca3eb1e75f34eb5b58bbcb87	2026-05-15 05:31:40.685	2026-05-15 05:01:40.685	\N	\N	\N	ab90fb344a7c392ec0f4a8509a59544367ce26a1d58b3b0abed0bdbf58a89d6e
cmpdlblfz0001cucxzqwz8ckd	user-dev	2026-05-21 04:57:21.742	2026-05-20 04:57:21.743	127.0.0.1	545ea538461003efdc8c81c244531b003f6f26cfccf6c0073b3239fdedf49446	7c46e3490d3d5898fbf01277b7c72462991eba9a8f2bd2c5c483c67732089cda	2026-05-20 05:27:21.742	2026-05-20 04:57:21.743	\N	\N	\N	2b30321c45eede90d666060899b8fbd18a4469f0de196a0e99ac235ec031eb1a
cmpdlblip0003cucxihs094v2	user-dev	2026-05-21 04:57:21.743	2026-05-20 04:57:21.842	127.0.0.1	545ea538461003efdc8c81c244531b003f6f26cfccf6c0073b3239fdedf49446	85ed36aa0152187e0f6e3e415f3805442575160cf4046fbd9c04261c8e1ae758	2026-05-20 05:27:21.743	2026-05-20 04:57:21.842	\N	\N	\N	b17bc63ee2be474cad510a20fb020a61f140f84c64d60886d5053f55b48180ee
cmpfnzwkx00016dx34hib7xuu	user-dev	2026-05-22 15:47:47.504	2026-05-21 15:47:47.505	127.0.0.1	545ea538461003efdc8c81c244531b003f6f26cfccf6c0073b3239fdedf49446	f6aa12963e6534667de3d2d040fbc5ab9b06629e5a9a9bf482dfbdddddcbb5a3	2026-05-21 16:17:47.504	2026-05-21 15:47:47.505	\N	\N	\N	91197f4ef3f79c03fd9a7ad2dd7a6ece9ccdbbe24c9f71330dfb49923ad3ace4
cmpfo03yy00036dx3y4xcnul2	user-dev	2026-05-22 15:47:57.082	2026-05-21 15:47:57.082	127.0.0.1	545ea538461003efdc8c81c244531b003f6f26cfccf6c0073b3239fdedf49446	176a7c1de01acc873108c4bbf87b7e4975cd62ead2fd6c002fc0368f994387fe	2026-05-21 16:17:57.082	2026-05-21 15:47:57.082	expired	2026-05-21 19:29:58.651	\N	0abe6d19ea01ead508f51cb43ecceed116c38c8e0d55c560f4472dcda2533e5f
cmpfvxnaj000198bmawk6ojz9	user-dev	2026-05-22 19:29:59.082	2026-05-21 19:29:59.083	127.0.0.1	545ea538461003efdc8c81c244531b003f6f26cfccf6c0073b3239fdedf49446	db8ec7a6b826c25b01eff0ea0b31eb53472cfa2d9da4c4e03634b14c03e053e1	2026-05-21 19:59:59.082	2026-05-21 19:29:59.083	\N	\N	\N	8cb41e2d927aa8eb5762385ef03e99956ecf50bff1fcb3282bf9d7224fd876a1
cmpfvxrze000398bmgyold7n0	user-dev	2026-05-22 19:30:05.162	2026-05-21 19:30:05.163	127.0.0.1	545ea538461003efdc8c81c244531b003f6f26cfccf6c0073b3239fdedf49446	0a12aeae6aff05706d588847d61906ea98c758dcca271cfc9e944ca56b2b16cc	2026-05-21 20:03:03.869	2026-05-21 19:33:03.869	\N	\N	\N	2f40c12aa532d1be4176c160a35d94072404a0af7aad46b36ce4794a86b0f4ba
cmpfw1tyy000598bms0m96rr7	user-dev	2026-05-22 19:33:14.362	2026-05-21 19:33:14.362	127.0.0.1	545ea538461003efdc8c81c244531b003f6f26cfccf6c0073b3239fdedf49446	c293568bf9264592b2a9ec38ca6f3439c5abab53b452c1dd791c46fb8cbd4105	2026-05-21 20:03:14.362	2026-05-21 19:33:14.362	\N	\N	\N	f9c6ee1ecf641562b44f6cc22bd45d180fbf797c9cfaf488306dc370362e36a2
\.


--
-- Data for Name: TreatmentRecord; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."TreatmentRecord" (id, "practiceId", "patientId", "appointmentId", "providerId", "procedureCode", "toothNumber", surface, notes, status, "completedAt", "createdAt", "updatedAt", "createdBy", "updatedBy") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."User" (id, email, "practiceId", "deletedReason", "createdAt", "firstName", "lastName", "passwordHash", "updatedAt", "deletedAt", "emailVerifiedAt", "failedLoginCount", "lastLoginAt", "lockedUntil", "passwordAlgo", status) FROM stdin;
user-doctor	doctor@careloop.demo	demo-practice	\N	2026-05-14 04:52:47.807	Doctor	Demo	$2a$10$L1iVNEbNip76XftiA7wEUuK5yRR8u2/h2wGRHSnr/Vh/sDhsIpd.S	2026-05-14 04:52:47.807	\N	\N	0	\N	\N	bcrypt	active
user-receptionist	receptionist@careloop.demo	demo-practice	\N	2026-05-14 04:52:47.807	Receptionist	Demo	$2a$10$L1iVNEbNip76XftiA7wEUuK5yRR8u2/h2wGRHSnr/Vh/sDhsIpd.S	2026-05-14 04:52:47.807	\N	\N	0	\N	\N	bcrypt	active
user-admin	admin@careloop.demo	demo-practice	\N	2026-05-14 04:52:47.807	Admin	User	$2a$10$L1iVNEbNip76XftiA7wEUuK5yRR8u2/h2wGRHSnr/Vh/sDhsIpd.S	2026-05-14 04:52:47.807	\N	\N	0	\N	\N	bcrypt	active
user-hygienist	hygienist@careloop.demo	demo-practice	\N	2026-05-14 04:52:47.807	Hygienist	Demo	$2a$10$L1iVNEbNip76XftiA7wEUuK5yRR8u2/h2wGRHSnr/Vh/sDhsIpd.S	2026-05-14 04:52:47.807	\N	\N	0	\N	\N	bcrypt	active
user-dev	demo@careloop.dev	demo-practice	\N	2026-05-14 04:52:47.807	Dev	Admin	$2a$10$8gPwKxZ1Q6kH/RhruTNvxegHwzpRyVCQeRijJr6nuHbXblewDJbhW	2026-05-21 19:33:14.349	\N	\N	0	2026-05-21 19:33:14.348	\N	bcrypt	active
\.


--
-- Data for Name: UserRole; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."UserRole" ("userId", "roleId", "assignedBy", "assignedAt") FROM stdin;
user-admin	1	user-admin	2026-05-14 04:52:48.658
user-doctor	2	user-admin	2026-05-14 04:52:49.242
user-hygienist	3	user-admin	2026-05-14 04:52:49.708
user-receptionist	4	user-admin	2026-05-14 04:52:50.127
user-dev	1	user-admin	2026-05-14 04:52:50.627
\.


--
-- Data for Name: WebhookLog; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."WebhookLog" (id, provider, event, "idempotencyKey", "rawPayload", status, "processedAt", error, "createdAt") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
83913453-9a1d-436c-9136-7108726f031c	be05807d63f99c673cee8d3bf34616cd3ae94b1207d8373861dcfcf4f8b72ff0	2026-05-14 02:45:13.963753+00	1_init	\N	\N	2026-05-14 02:45:13.516292+00	1
306a9c5a-7766-4c4e-9ed6-1906b46df316	7042a99cdeaf6875699cad7bcd946c1f159dc7c45deeb38a4fbbfb1eb51005ef	2026-05-14 02:45:14.248668+00	20260406100000_add_deleted_reason_to_user	\N	\N	2026-05-14 02:45:14.04359+00	1
09fae8ed-dd7b-4a26-8134-c29d4ea3095c	21b61749d34456f5cd8d5e1a3e33bf6604399226c0da3c321aa103dd83b5d68b	2026-05-14 02:45:14.556884+00	20260507052308_add_auth_fields_and_sessions	\N	\N	2026-05-14 02:45:14.329425+00	1
2fb9bf69-ed1b-4f34-83c3-380ccbb8a0bd	e9c34e9146297cde4747c42e3ee5808a770c28d507876016bea5783a01a45a46	2026-05-14 02:45:14.909608+00	20260507061023_auth_schema	\N	\N	2026-05-14 02:45:14.63821+00	1
996c2c6c-7fd5-4fa8-b5a3-553834dfb17c	b56920816394368f9e3aeb92c8c6d8d04eccd08ac9f8c0bba981e38451a50d97	2026-05-14 02:45:15.287431+00	20260508225913_add_clinical_tables	\N	\N	2026-05-14 02:45:14.993388+00	1
5533ff69-e25c-4e2a-82a3-da95ef80a628	62c2ec2ab05efe876d7b62af43c7ad407995f4c2ebc1427505fdbaab5d86241d	2026-05-14 02:45:15.629042+00	20260509000713_add_fts_indexes	\N	\N	2026-05-14 02:45:15.371326+00	1
83a7d2c5-5cf7-4f22-876f-92ca836ef1b5	e64df2e97b85c2a466571f68d9d76e2ed3ffc87b304f1b9d6bfc630c6fb95d12	2026-05-14 02:45:15.946252+00	20260509120000_add_intake_draft	\N	\N	2026-05-14 02:45:15.721819+00	1
\.


--
-- Name: AuditLog_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public."AuditLog_id_seq"', 19, true);


--
-- Name: CallTranscriptSegment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public."CallTranscriptSegment_id_seq"', 1, false);


--
-- Name: PracticeKPI_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public."PracticeKPI_id_seq"', 21, true);


--
-- Name: Role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public."Role_id_seq"', 4, true);


--
-- Name: AIPromptVersion AIPromptVersion_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."AIPromptVersion"
    ADD CONSTRAINT "AIPromptVersion_pkey" PRIMARY KEY (id);


--
-- Name: AlertThreshold AlertThreshold_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."AlertThreshold"
    ADD CONSTRAINT "AlertThreshold_pkey" PRIMARY KEY (id);


--
-- Name: AnalyticsResult AnalyticsResult_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."AnalyticsResult"
    ADD CONSTRAINT "AnalyticsResult_pkey" PRIMARY KEY (id);


--
-- Name: AppointmentHold AppointmentHold_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."AppointmentHold"
    ADD CONSTRAINT "AppointmentHold_pkey" PRIMARY KEY (id);


--
-- Name: Appointment Appointment_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Appointment"
    ADD CONSTRAINT "Appointment_pkey" PRIMARY KEY (id);


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: AuthIdentity AuthIdentity_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."AuthIdentity"
    ADD CONSTRAINT "AuthIdentity_pkey" PRIMARY KEY (id);


--
-- Name: AvailabilityBlock AvailabilityBlock_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."AvailabilityBlock"
    ADD CONSTRAINT "AvailabilityBlock_pkey" PRIMARY KEY (id);


--
-- Name: CallTranscriptSegment CallTranscriptSegment_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."CallTranscriptSegment"
    ADD CONSTRAINT "CallTranscriptSegment_pkey" PRIMARY KEY (id);


--
-- Name: CallTranscript CallTranscript_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."CallTranscript"
    ADD CONSTRAINT "CallTranscript_pkey" PRIMARY KEY (id);


--
-- Name: Conversation Conversation_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Conversation"
    ADD CONSTRAINT "Conversation_pkey" PRIMARY KEY (id);


--
-- Name: Document Document_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_pkey" PRIMARY KEY (id);


--
-- Name: FailedJob FailedJob_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."FailedJob"
    ADD CONSTRAINT "FailedJob_pkey" PRIMARY KEY (id);


--
-- Name: GoogleCalendarConnection GoogleCalendarConnection_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."GoogleCalendarConnection"
    ADD CONSTRAINT "GoogleCalendarConnection_pkey" PRIMARY KEY (id);


--
-- Name: IntakeDraft IntakeDraft_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."IntakeDraft"
    ADD CONSTRAINT "IntakeDraft_pkey" PRIMARY KEY (id);


--
-- Name: IntakeSubmission IntakeSubmission_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."IntakeSubmission"
    ADD CONSTRAINT "IntakeSubmission_pkey" PRIMARY KEY (id);


--
-- Name: Invoice Invoice_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_pkey" PRIMARY KEY (id);


--
-- Name: Message Message_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_pkey" PRIMARY KEY (id);


--
-- Name: Participant Participant_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Participant"
    ADD CONSTRAINT "Participant_pkey" PRIMARY KEY (id);


--
-- Name: PatientInsurance PatientInsurance_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."PatientInsurance"
    ADD CONSTRAINT "PatientInsurance_pkey" PRIMARY KEY (id);


--
-- Name: PatientSensitiveNote PatientSensitiveNote_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."PatientSensitiveNote"
    ADD CONSTRAINT "PatientSensitiveNote_pkey" PRIMARY KEY (id);


--
-- Name: Patient Patient_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Patient"
    ADD CONSTRAINT "Patient_pkey" PRIMARY KEY (id);


--
-- Name: PaymentRecord PaymentRecord_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."PaymentRecord"
    ADD CONSTRAINT "PaymentRecord_pkey" PRIMARY KEY (id);


--
-- Name: PracticeKPI PracticeKPI_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."PracticeKPI"
    ADD CONSTRAINT "PracticeKPI_pkey" PRIMARY KEY (id);


--
-- Name: Practice Practice_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Practice"
    ADD CONSTRAINT "Practice_pkey" PRIMARY KEY (id);


--
-- Name: ProviderSchedule ProviderSchedule_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ProviderSchedule"
    ADD CONSTRAINT "ProviderSchedule_pkey" PRIMARY KEY (id);


--
-- Name: Provider Provider_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Provider"
    ADD CONSTRAINT "Provider_pkey" PRIMARY KEY (id);


--
-- Name: Reminder Reminder_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Reminder"
    ADD CONSTRAINT "Reminder_pkey" PRIMARY KEY (id);


--
-- Name: Role Role_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Role"
    ADD CONSTRAINT "Role_pkey" PRIMARY KEY (id);


--
-- Name: Room Room_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Room"
    ADD CONSTRAINT "Room_pkey" PRIMARY KEY (id);


--
-- Name: RoutingPolicy RoutingPolicy_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."RoutingPolicy"
    ADD CONSTRAINT "RoutingPolicy_pkey" PRIMARY KEY (id);


--
-- Name: ServiceAccount ServiceAccount_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ServiceAccount"
    ADD CONSTRAINT "ServiceAccount_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: TreatmentRecord TreatmentRecord_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."TreatmentRecord"
    ADD CONSTRAINT "TreatmentRecord_pkey" PRIMARY KEY (id);


--
-- Name: UserRole UserRole_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."UserRole"
    ADD CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId", "roleId");


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: WebhookLog WebhookLog_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."WebhookLog"
    ADD CONSTRAINT "WebhookLog_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: AIPromptVersion_practiceId_isActive_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "AIPromptVersion_practiceId_isActive_idx" ON public."AIPromptVersion" USING btree ("practiceId", "isActive");


--
-- Name: AIPromptVersion_practiceId_version_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "AIPromptVersion_practiceId_version_key" ON public."AIPromptVersion" USING btree ("practiceId", version);


--
-- Name: AlertThreshold_practiceId_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "AlertThreshold_practiceId_key" ON public."AlertThreshold" USING btree ("practiceId");


--
-- Name: AnalyticsResult_transcriptId_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "AnalyticsResult_transcriptId_key" ON public."AnalyticsResult" USING btree ("transcriptId");


--
-- Name: AppointmentHold_practiceId_start_end_expiresAt_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "AppointmentHold_practiceId_start_end_expiresAt_idx" ON public."AppointmentHold" USING btree ("practiceId", start, "end", "expiresAt");


--
-- Name: AppointmentHold_providerId_start_end_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "AppointmentHold_providerId_start_end_idx" ON public."AppointmentHold" USING btree ("providerId", start, "end");


--
-- Name: Appointment_practiceId_calendarId_googleEventId_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Appointment_practiceId_calendarId_googleEventId_key" ON public."Appointment" USING btree ("practiceId", "calendarId", "googleEventId");


--
-- Name: Appointment_practiceId_patientId_start_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Appointment_practiceId_patientId_start_idx" ON public."Appointment" USING btree ("practiceId", "patientId", start);


--
-- Name: Appointment_practiceId_providerId_start_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Appointment_practiceId_providerId_start_idx" ON public."Appointment" USING btree ("practiceId", "providerId", start);


--
-- Name: Appointment_practiceId_userId_start_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Appointment_practiceId_userId_start_idx" ON public."Appointment" USING btree ("practiceId", "userId", start);


--
-- Name: AuditLog_actorUserId_eventTime_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "AuditLog_actorUserId_eventTime_idx" ON public."AuditLog" USING btree ("actorUserId", "eventTime");


--
-- Name: AuditLog_eventTime_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "AuditLog_eventTime_idx" ON public."AuditLog" USING btree ("eventTime");


--
-- Name: AuditLog_eventType_eventTime_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "AuditLog_eventType_eventTime_idx" ON public."AuditLog" USING btree ("eventType", "eventTime");


--
-- Name: AuditLog_targetUserId_eventTime_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "AuditLog_targetUserId_eventTime_idx" ON public."AuditLog" USING btree ("targetUserId", "eventTime");


--
-- Name: AuthIdentity_provider_providerSubject_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "AuthIdentity_provider_providerSubject_key" ON public."AuthIdentity" USING btree (provider, "providerSubject");


--
-- Name: AuthIdentity_userId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "AuthIdentity_userId_idx" ON public."AuthIdentity" USING btree ("userId");


--
-- Name: AvailabilityBlock_practiceId_start_end_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "AvailabilityBlock_practiceId_start_end_idx" ON public."AvailabilityBlock" USING btree ("practiceId", start, "end");


--
-- Name: AvailabilityBlock_providerId_start_end_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "AvailabilityBlock_providerId_start_end_idx" ON public."AvailabilityBlock" USING btree ("providerId", start, "end");


--
-- Name: AvailabilityBlock_roomId_start_end_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "AvailabilityBlock_roomId_start_end_idx" ON public."AvailabilityBlock" USING btree ("roomId", start, "end");


--
-- Name: CallTranscriptSegment_transcriptId_startedAt_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "CallTranscriptSegment_transcriptId_startedAt_idx" ON public."CallTranscriptSegment" USING btree ("transcriptId", "startedAt");


--
-- Name: CallTranscript_callSid_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "CallTranscript_callSid_key" ON public."CallTranscript" USING btree ("callSid");


--
-- Name: CallTranscript_practiceId_appointmentId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "CallTranscript_practiceId_appointmentId_idx" ON public."CallTranscript" USING btree ("practiceId", "appointmentId");


--
-- Name: CallTranscript_practiceId_patientId_createdAt_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "CallTranscript_practiceId_patientId_createdAt_idx" ON public."CallTranscript" USING btree ("practiceId", "patientId", "createdAt");


--
-- Name: Conversation_practiceId_updatedAt_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Conversation_practiceId_updatedAt_idx" ON public."Conversation" USING btree ("practiceId", "updatedAt");


--
-- Name: Document_practiceId_category_uploadedAt_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Document_practiceId_category_uploadedAt_idx" ON public."Document" USING btree ("practiceId", category, "uploadedAt");


--
-- Name: Document_practiceId_patientId_uploadedAt_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Document_practiceId_patientId_uploadedAt_idx" ON public."Document" USING btree ("practiceId", "patientId", "uploadedAt");


--
-- Name: Document_practiceId_uploadedAt_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Document_practiceId_uploadedAt_idx" ON public."Document" USING btree ("practiceId", "uploadedAt");


--
-- Name: FailedJob_practiceId_failedAt_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "FailedJob_practiceId_failedAt_idx" ON public."FailedJob" USING btree ("practiceId", "failedAt");


--
-- Name: FailedJob_queue_failedAt_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "FailedJob_queue_failedAt_idx" ON public."FailedJob" USING btree (queue, "failedAt");


--
-- Name: GoogleCalendarConnection_practiceId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "GoogleCalendarConnection_practiceId_idx" ON public."GoogleCalendarConnection" USING btree ("practiceId");


--
-- Name: GoogleCalendarConnection_practiceId_userId_provider_calenda_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "GoogleCalendarConnection_practiceId_userId_provider_calenda_key" ON public."GoogleCalendarConnection" USING btree ("practiceId", "userId", provider, "calendarId");


--
-- Name: IntakeDraft_idempotencyKey_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "IntakeDraft_idempotencyKey_key" ON public."IntakeDraft" USING btree ("idempotencyKey");


--
-- Name: IntakeDraft_practiceId_status_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IntakeDraft_practiceId_status_idx" ON public."IntakeDraft" USING btree ("practiceId", status);


--
-- Name: IntakeDraft_token_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IntakeDraft_token_idx" ON public."IntakeDraft" USING btree (token);


--
-- Name: IntakeDraft_token_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "IntakeDraft_token_key" ON public."IntakeDraft" USING btree (token);


--
-- Name: IntakeSubmission_patientId_submittedAt_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IntakeSubmission_patientId_submittedAt_idx" ON public."IntakeSubmission" USING btree ("patientId", "submittedAt");


--
-- Name: IntakeSubmission_practiceId_status_submittedAt_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IntakeSubmission_practiceId_status_submittedAt_idx" ON public."IntakeSubmission" USING btree ("practiceId", status, "submittedAt");


--
-- Name: Invoice_practiceId_patientId_createdAt_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Invoice_practiceId_patientId_createdAt_idx" ON public."Invoice" USING btree ("practiceId", "patientId", "createdAt");


--
-- Name: Invoice_practiceId_status_dueDate_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Invoice_practiceId_status_dueDate_idx" ON public."Invoice" USING btree ("practiceId", status, "dueDate");


--
-- Name: Invoice_treatmentId_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Invoice_treatmentId_key" ON public."Invoice" USING btree ("treatmentId");


--
-- Name: Message_conversationId_sentAt_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Message_conversationId_sentAt_idx" ON public."Message" USING btree ("conversationId", "sentAt");


--
-- Name: Participant_conversationId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Participant_conversationId_idx" ON public."Participant" USING btree ("conversationId");


--
-- Name: PatientInsurance_memberIdHash_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "PatientInsurance_memberIdHash_idx" ON public."PatientInsurance" USING btree ("memberIdHash");


--
-- Name: PatientInsurance_patientId_active_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "PatientInsurance_patientId_active_idx" ON public."PatientInsurance" USING btree ("patientId", active);


--
-- Name: PatientSensitiveNote_practiceId_patientId_createdAt_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "PatientSensitiveNote_practiceId_patientId_createdAt_idx" ON public."PatientSensitiveNote" USING btree ("practiceId", "patientId", "createdAt");


--
-- Name: Patient_practiceId_lastName_firstName_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Patient_practiceId_lastName_firstName_idx" ON public."Patient" USING btree ("practiceId", "lastName", "firstName");


--
-- Name: Patient_practiceId_phoneE164_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Patient_practiceId_phoneE164_key" ON public."Patient" USING btree ("practiceId", "phoneE164");


--
-- Name: PaymentRecord_invoiceId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "PaymentRecord_invoiceId_idx" ON public."PaymentRecord" USING btree ("invoiceId");


--
-- Name: PaymentRecord_practiceId_patientId_createdAt_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "PaymentRecord_practiceId_patientId_createdAt_idx" ON public."PaymentRecord" USING btree ("practiceId", "patientId", "createdAt");


--
-- Name: PaymentRecord_practiceId_status_createdAt_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "PaymentRecord_practiceId_status_createdAt_idx" ON public."PaymentRecord" USING btree ("practiceId", status, "createdAt");


--
-- Name: PracticeKPI_metricName_kpiDate_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "PracticeKPI_metricName_kpiDate_idx" ON public."PracticeKPI" USING btree ("metricName", "kpiDate");


--
-- Name: PracticeKPI_practiceId_kpiDate_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "PracticeKPI_practiceId_kpiDate_idx" ON public."PracticeKPI" USING btree ("practiceId", "kpiDate");


--
-- Name: Practice_name_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Practice_name_idx" ON public."Practice" USING btree (name);


--
-- Name: ProviderSchedule_practiceId_providerId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "ProviderSchedule_practiceId_providerId_idx" ON public."ProviderSchedule" USING btree ("practiceId", "providerId");


--
-- Name: ProviderSchedule_providerId_dayOfWeek_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "ProviderSchedule_providerId_dayOfWeek_idx" ON public."ProviderSchedule" USING btree ("providerId", "dayOfWeek");


--
-- Name: ProviderSchedule_providerId_dayOfWeek_startMin_endMin_effec_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "ProviderSchedule_providerId_dayOfWeek_startMin_endMin_effec_key" ON public."ProviderSchedule" USING btree ("providerId", "dayOfWeek", "startMin", "endMin", "effectiveFrom");


--
-- Name: Provider_practiceId_isActive_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Provider_practiceId_isActive_idx" ON public."Provider" USING btree ("practiceId", "isActive");


--
-- Name: Provider_practiceId_name_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Provider_practiceId_name_key" ON public."Provider" USING btree ("practiceId", name);


--
-- Name: Reminder_appointmentId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Reminder_appointmentId_idx" ON public."Reminder" USING btree ("appointmentId");


--
-- Name: Reminder_patientId_scheduledAt_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Reminder_patientId_scheduledAt_idx" ON public."Reminder" USING btree ("patientId", "scheduledAt");


--
-- Name: Reminder_practiceId_status_scheduledAt_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Reminder_practiceId_status_scheduledAt_idx" ON public."Reminder" USING btree ("practiceId", status, "scheduledAt");


--
-- Name: Role_name_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Role_name_key" ON public."Role" USING btree (name);


--
-- Name: Room_practiceId_isActive_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Room_practiceId_isActive_idx" ON public."Room" USING btree ("practiceId", "isActive");


--
-- Name: Room_practiceId_name_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Room_practiceId_name_key" ON public."Room" USING btree ("practiceId", name);


--
-- Name: RoutingPolicy_practiceId_patientType_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "RoutingPolicy_practiceId_patientType_key" ON public."RoutingPolicy" USING btree ("practiceId", "patientType");


--
-- Name: ServiceAccount_clientId_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "ServiceAccount_clientId_key" ON public."ServiceAccount" USING btree ("clientId");


--
-- Name: Session_expiresAt_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Session_expiresAt_idx" ON public."Session" USING btree ("expiresAt");


--
-- Name: Session_idleExpiresAt_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Session_idleExpiresAt_idx" ON public."Session" USING btree ("idleExpiresAt");


--
-- Name: Session_sessionTokenHash_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Session_sessionTokenHash_key" ON public."Session" USING btree ("sessionTokenHash");


--
-- Name: Session_userId_revokedAt_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Session_userId_revokedAt_idx" ON public."Session" USING btree ("userId", "revokedAt");


--
-- Name: TreatmentRecord_patientId_procedureCode_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "TreatmentRecord_patientId_procedureCode_idx" ON public."TreatmentRecord" USING btree ("patientId", "procedureCode");


--
-- Name: TreatmentRecord_practiceId_patientId_createdAt_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "TreatmentRecord_practiceId_patientId_createdAt_idx" ON public."TreatmentRecord" USING btree ("practiceId", "patientId", "createdAt");


--
-- Name: TreatmentRecord_practiceId_status_createdAt_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "TreatmentRecord_practiceId_status_createdAt_idx" ON public."TreatmentRecord" USING btree ("practiceId", status, "createdAt");


--
-- Name: UserRole_roleId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "UserRole_roleId_idx" ON public."UserRole" USING btree ("roleId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_practiceId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "User_practiceId_idx" ON public."User" USING btree ("practiceId");


--
-- Name: User_status_lockedUntil_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "User_status_lockedUntil_idx" ON public."User" USING btree (status, "lockedUntil");


--
-- Name: WebhookLog_idempotencyKey_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "WebhookLog_idempotencyKey_key" ON public."WebhookLog" USING btree ("idempotencyKey");


--
-- Name: WebhookLog_provider_event_createdAt_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "WebhookLog_provider_event_createdAt_idx" ON public."WebhookLog" USING btree (provider, event, "createdAt");


--
-- Name: AIPromptVersion AIPromptVersion_practiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."AIPromptVersion"
    ADD CONSTRAINT "AIPromptVersion_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES public."Practice"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AlertThreshold AlertThreshold_practiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."AlertThreshold"
    ADD CONSTRAINT "AlertThreshold_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES public."Practice"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AnalyticsResult AnalyticsResult_transcriptId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."AnalyticsResult"
    ADD CONSTRAINT "AnalyticsResult_transcriptId_fkey" FOREIGN KEY ("transcriptId") REFERENCES public."CallTranscript"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AppointmentHold AppointmentHold_practiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."AppointmentHold"
    ADD CONSTRAINT "AppointmentHold_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES public."Practice"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AppointmentHold AppointmentHold_providerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."AppointmentHold"
    ADD CONSTRAINT "AppointmentHold_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES public."Provider"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AppointmentHold AppointmentHold_roomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."AppointmentHold"
    ADD CONSTRAINT "AppointmentHold_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES public."Room"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Appointment Appointment_practiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Appointment"
    ADD CONSTRAINT "Appointment_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES public."Practice"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Appointment Appointment_providerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Appointment"
    ADD CONSTRAINT "Appointment_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES public."Provider"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Appointment Appointment_roomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Appointment"
    ADD CONSTRAINT "Appointment_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES public."Room"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Appointment Appointment_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Appointment"
    ADD CONSTRAINT "Appointment_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AuditLog AuditLog_actorServiceAccountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_actorServiceAccountId_fkey" FOREIGN KEY ("actorServiceAccountId") REFERENCES public."ServiceAccount"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AuditLog AuditLog_actorUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AuditLog AuditLog_sessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES public."Session"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AuditLog AuditLog_targetUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AuthIdentity AuthIdentity_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."AuthIdentity"
    ADD CONSTRAINT "AuthIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AvailabilityBlock AvailabilityBlock_practiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."AvailabilityBlock"
    ADD CONSTRAINT "AvailabilityBlock_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES public."Practice"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AvailabilityBlock AvailabilityBlock_providerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."AvailabilityBlock"
    ADD CONSTRAINT "AvailabilityBlock_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES public."Provider"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AvailabilityBlock AvailabilityBlock_roomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."AvailabilityBlock"
    ADD CONSTRAINT "AvailabilityBlock_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES public."Room"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CallTranscriptSegment CallTranscriptSegment_transcriptId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."CallTranscriptSegment"
    ADD CONSTRAINT "CallTranscriptSegment_transcriptId_fkey" FOREIGN KEY ("transcriptId") REFERENCES public."CallTranscript"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CallTranscript CallTranscript_appointmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."CallTranscript"
    ADD CONSTRAINT "CallTranscript_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES public."Appointment"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CallTranscript CallTranscript_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."CallTranscript"
    ADD CONSTRAINT "CallTranscript_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."Patient"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CallTranscript CallTranscript_practiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."CallTranscript"
    ADD CONSTRAINT "CallTranscript_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES public."Practice"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Conversation Conversation_practiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Conversation"
    ADD CONSTRAINT "Conversation_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES public."Practice"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Document Document_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."Patient"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Document Document_practiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES public."Practice"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Document Document_uploadedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: GoogleCalendarConnection GoogleCalendarConnection_practiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."GoogleCalendarConnection"
    ADD CONSTRAINT "GoogleCalendarConnection_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES public."Practice"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: GoogleCalendarConnection GoogleCalendarConnection_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."GoogleCalendarConnection"
    ADD CONSTRAINT "GoogleCalendarConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: IntakeDraft IntakeDraft_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."IntakeDraft"
    ADD CONSTRAINT "IntakeDraft_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."Patient"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: IntakeDraft IntakeDraft_practiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."IntakeDraft"
    ADD CONSTRAINT "IntakeDraft_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES public."Practice"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: IntakeSubmission IntakeSubmission_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."IntakeSubmission"
    ADD CONSTRAINT "IntakeSubmission_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."Patient"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: IntakeSubmission IntakeSubmission_practiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."IntakeSubmission"
    ADD CONSTRAINT "IntakeSubmission_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES public."Practice"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Invoice Invoice_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."Patient"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Invoice Invoice_practiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES public."Practice"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Invoice Invoice_treatmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_treatmentId_fkey" FOREIGN KEY ("treatmentId") REFERENCES public."TreatmentRecord"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Message Message_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public."Conversation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Participant Participant_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Participant"
    ADD CONSTRAINT "Participant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public."Conversation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Participant Participant_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Participant"
    ADD CONSTRAINT "Participant_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."Patient"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Participant Participant_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Participant"
    ADD CONSTRAINT "Participant_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PatientInsurance PatientInsurance_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."PatientInsurance"
    ADD CONSTRAINT "PatientInsurance_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."Patient"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PatientSensitiveNote PatientSensitiveNote_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."PatientSensitiveNote"
    ADD CONSTRAINT "PatientSensitiveNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PatientSensitiveNote PatientSensitiveNote_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."PatientSensitiveNote"
    ADD CONSTRAINT "PatientSensitiveNote_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."Patient"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PatientSensitiveNote PatientSensitiveNote_practiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."PatientSensitiveNote"
    ADD CONSTRAINT "PatientSensitiveNote_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES public."Practice"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Patient Patient_practiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Patient"
    ADD CONSTRAINT "Patient_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES public."Practice"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PaymentRecord PaymentRecord_invoiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."PaymentRecord"
    ADD CONSTRAINT "PaymentRecord_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES public."Invoice"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PaymentRecord PaymentRecord_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."PaymentRecord"
    ADD CONSTRAINT "PaymentRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."Patient"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PaymentRecord PaymentRecord_practiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."PaymentRecord"
    ADD CONSTRAINT "PaymentRecord_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES public."Practice"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PracticeKPI PracticeKPI_practiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."PracticeKPI"
    ADD CONSTRAINT "PracticeKPI_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES public."Practice"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PracticeKPI PracticeKPI_transcriptId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."PracticeKPI"
    ADD CONSTRAINT "PracticeKPI_transcriptId_fkey" FOREIGN KEY ("transcriptId") REFERENCES public."CallTranscript"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ProviderSchedule ProviderSchedule_practiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ProviderSchedule"
    ADD CONSTRAINT "ProviderSchedule_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES public."Practice"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProviderSchedule ProviderSchedule_providerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ProviderSchedule"
    ADD CONSTRAINT "ProviderSchedule_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES public."Provider"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Provider Provider_practiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Provider"
    ADD CONSTRAINT "Provider_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES public."Practice"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Reminder Reminder_appointmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Reminder"
    ADD CONSTRAINT "Reminder_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES public."Appointment"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Reminder Reminder_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Reminder"
    ADD CONSTRAINT "Reminder_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."Patient"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Reminder Reminder_practiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Reminder"
    ADD CONSTRAINT "Reminder_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES public."Practice"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Room Room_practiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Room"
    ADD CONSTRAINT "Room_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES public."Practice"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RoutingPolicy RoutingPolicy_practiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."RoutingPolicy"
    ADD CONSTRAINT "RoutingPolicy_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES public."Practice"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Session Session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TreatmentRecord TreatmentRecord_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."TreatmentRecord"
    ADD CONSTRAINT "TreatmentRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."Patient"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TreatmentRecord TreatmentRecord_practiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."TreatmentRecord"
    ADD CONSTRAINT "TreatmentRecord_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES public."Practice"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TreatmentRecord TreatmentRecord_providerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."TreatmentRecord"
    ADD CONSTRAINT "TreatmentRecord_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES public."Provider"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserRole UserRole_assignedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."UserRole"
    ADD CONSTRAINT "UserRole_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserRole UserRole_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."UserRole"
    ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserRole UserRole_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."UserRole"
    ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: User User_practiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES public."Practice"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

\unrestrict pZqW2gdScDTOpHLpGTSah8l3rZWNaSg6GAjLqHVVaHNNJj2RpO7zp5mMh9R3e3U

