export type AiTestPatientRecord = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phoneE164: string;
  email: string;
  insurance: {
    payerName: string;
    planName: string;
    coveragePercent: number;
  };
  upcomingAppointment: {
    start: string;
    end: string;
    title: string;
    status: string;
  } | null;
  medical: {
    allergies: string[];
    currentMedications: string[];
    conditions: string[];
    outstandingBalance: number;
    radiographCount: number;
    lastCleaningDate: string;
    notes: string[];
  };
};

export const AI_TEST_PATIENTS: AiTestPatientRecord[] = [
  {
    id: "ai-test-001",
    firstName: "Tom",
    lastName: "Ivers",
    dateOfBirth: "1991-04-22",
    phoneE164: "+16195559876",
    email: "tom.ivers+aitest@example.com",
    insurance: {
      payerName: "BlueShield Dental",
      planName: "Plus PPO 80/20",
      coveragePercent: 80,
    },
    upcomingAppointment: {
      start: "2026-03-19T15:00:00.000Z",
      end: "2026-03-19T15:30:00.000Z",
      title: "Recall Exam and Cleaning",
      status: "confirmed",
    },
    medical: {
      allergies: ["Latex"],
      currentMedications: ["Levothyroxine 50mcg daily"],
      conditions: ["Hypothyroidism"],
      outstandingBalance: 46.25,
      radiographCount: 6,
      lastCleaningDate: "2025-09-12",
      notes: [
        "Prefers afternoon appointments.",
        "Sensitive to cold on lower right molars.",
        "Floss compliance improved over last 2 visits.",
      ],
    },
  },
  {
    id: "ai-test-002",
    firstName: "Ethan",
    lastName: "Cole",
    dateOfBirth: "1984-11-03",
    phoneE164: "+16195558765",
    email: "ethan.cole+aitest@example.com",
    insurance: {
      payerName: "Delta Dental",
      planName: "Premier Gold",
      coveragePercent: 70,
    },
    upcomingAppointment: null,
    medical: {
      allergies: [],
      currentMedications: ["Atorvastatin 20mg nightly"],
      conditions: ["Mild bruxism"],
      outstandingBalance: 0,
      radiographCount: 4,
      lastCleaningDate: "2025-08-28",
      notes: [
        "Night guard adjusted in last visit.",
        "Interested in whitening consult.",
      ],
    },
  },
];

export function getAiTestPatientById(patientId: string): AiTestPatientRecord | null {
  return AI_TEST_PATIENTS.find((patient) => patient.id === patientId) || null;
}

export function getDefaultAiTestPatient(): AiTestPatientRecord {
  return AI_TEST_PATIENTS[0];
}
