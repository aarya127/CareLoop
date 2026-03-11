import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";
import { getDemoPatient } from "@/lib/demo/sample-data";
import { getDentalRecordById } from "@/lib/data/mock-dental-records";
import { synthesizeWithElevenLabs } from "@/lib/services/elevenlabs";
import { getAiTestPatientById, getDefaultAiTestPatient } from "@/ai_test/patient-random-data";

const schema = z.object({
  question: z.string().min(3),
  patientId: z.string().optional(),
  includeVoice: z.boolean().default(false),
  voiceId: z.string().optional(),
  voiceName: z.string().optional(),
  modelId: z.string().optional(),
  lookaheadDays: z.number().int().min(1).max(60).default(14),
  timeZone: z.string().default("America/Toronto"),
});

type AssistantIntent = "availability" | "records" | "next_checkup" | "general";

type AvailabilitySlot = {
  start: string;
  end: string;
};

function detectIntent(question: string): AssistantIntent {
  const q = question.toLowerCase();
  if (q.includes("availability") || q.includes("available") || q.includes("schedule") || q.includes("appointment")) {
    return "availability";
  }
  if (q.includes("check up") || q.includes("checkup") || q.includes("check-up") || q.includes("cleaning") || q.includes("next visit")) {
    return "next_checkup";
  }
  if (
    q.includes("record") ||
    q.includes("medical") ||
    q.includes("history") ||
    q.includes("allerg") ||
    q.includes("insurance") ||
    q.includes("x-ray") ||
    q.includes("xray")
  ) {
    return "records";
  }
  return "general";
}

function toBase64(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString("base64");
}

function asDateIso(date: Date): string {
  return new Date(date).toISOString();
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function generateCandidateSlots(startAt: Date, days: number): AvailabilitySlot[] {
  const slots: AvailabilitySlot[] = [];
  const openingHour = 9;
  const closingHour = 17;
  const slotMinutes = 30;

  for (let offset = 0; offset < days; offset += 1) {
    const day = new Date(startAt);
    day.setDate(startAt.getDate() + offset);

    const dayOfWeek = day.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    for (let hour = openingHour; hour < closingHour; hour += 1) {
      for (let minute = 0; minute < 60; minute += slotMinutes) {
        const slotStart = new Date(day);
        slotStart.setHours(hour, minute, 0, 0);
        const slotEnd = new Date(slotStart.getTime() + slotMinutes * 60 * 1000);
        if (slotStart > startAt) {
          slots.push({ start: asDateIso(slotStart), end: asDateIso(slotEnd) });
        }
      }
    }
  }

  return slots;
}

async function getNextAvailability(userId: string, lookaheadDays: number): Promise<AvailabilitySlot[]> {
  const now = new Date();
  const until = new Date(now);
  until.setDate(now.getDate() + lookaheadDays);

  let busy: Array<{ start: Date; end: Date }> = [];
  try {
    busy = await prisma.appointment.findMany({
      where: {
        userId,
        status: { in: ["scheduled", "confirmed", "in_progress"] },
        start: { gte: now },
        end: { lte: until },
      },
      select: {
        start: true,
        end: true,
      },
      orderBy: { start: "asc" },
    });
  } catch {
    // If DB is unavailable (for local demo), continue with empty busy slots.
    busy = [];
  }

  const candidates = generateCandidateSlots(now, lookaheadDays);
  const open = candidates.filter((slot) => {
    const start = new Date(slot.start);
    const end = new Date(slot.end);
    return !busy.some((b) => overlaps(start, end, b.start, b.end));
  });

  return open.slice(0, 5);
}

async function getDbPatientSummary(patientId: string) {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      insuranceRecords: {
        where: { active: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      transcripts: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!patient) return null;

  const upcoming = await prisma.appointment.findFirst({
    where: { patientId, start: { gte: new Date() } },
    orderBy: { start: "asc" },
  });

  return {
    source: "db" as const,
    patientName: `${patient.firstName} ${patient.lastName}`,
    dateOfBirth: patient.dateOfBirth?.toISOString() || null,
    patientType: patient.patientType,
    phoneE164: patient.phoneE164,
    insurancePayer: patient.insuranceRecords[0]?.payerName || null,
    insurancePlan: patient.insuranceRecords[0]?.planName || null,
    upcomingAppointment: upcoming
      ? {
          start: upcoming.start.toISOString(),
          end: upcoming.end.toISOString(),
          title: upcoming.title,
          status: upcoming.status,
        }
      : null,
    latestTranscriptAt: patient.transcripts[0]?.createdAt?.toISOString() || null,
  };
}

function getDemoPatientSummary(patientId: string) {
  const demo = getDemoPatient(patientId);
  if (!demo) return null;

  const record = getDentalRecordById(patientId);

  return {
    source: "demo" as const,
    patientName: `${demo.first_name} ${demo.last_name}`,
    dateOfBirth: demo.date_of_birth,
    patientType: "demo",
    phoneE164: demo.phone,
    insurancePayer: record?.insurance?.provider_name || null,
    insurancePlan: record?.insurance?.plan_id || null,
    upcomingAppointment: record?.next_appointment
      ? {
          start: `${record.next_appointment.date}T${record.next_appointment.time}:00.000Z`,
          end: null,
          title: record.next_appointment.procedure_type,
          status: record.next_appointment.status,
        }
      : null,
    latestTranscriptAt: null,
    medicalHighlights: {
      outstandingBalance: record?.financial?.outstanding_balance ?? null,
      allergyFlag: demo.has_allergies ?? null,
      radiographCount: record?.radiographic_records?.length ?? 0,
    },
  };
}

function getAiTestPatientSummary(patientId?: string) {
  const record = patientId ? getAiTestPatientById(patientId) : getDefaultAiTestPatient();
  if (!record) return null;

  return {
    source: "ai_test" as const,
    patientName: `${record.firstName} ${record.lastName}`,
    dateOfBirth: record.dateOfBirth,
    patientType: "ai_test",
    phoneE164: record.phoneE164,
    insurancePayer: record.insurance.payerName,
    insurancePlan: record.insurance.planName,
    upcomingAppointment: record.upcomingAppointment,
    latestTranscriptAt: null,
    medicalHighlights: {
      outstandingBalance: record.medical.outstandingBalance,
      allergyFlag: record.medical.allergies.length > 0,
      radiographCount: record.medical.radiographCount,
      conditions: record.medical.conditions,
      medications: record.medical.currentMedications,
      notes: record.medical.notes,
      lastCleaningDate: record.medical.lastCleaningDate,
    },
  };
}

function composeAnswer(input: {
  intent: AssistantIntent;
  question: string;
  patientSummary: any;
  availability: AvailabilitySlot[];
}): string {
  const { intent, patientSummary, availability } = input;

  if (!patientSummary && (intent === "records" || intent === "next_checkup")) {
    return "I can answer detailed record and check-up questions once you provide a patient ID. I can still share next open appointment slots right now.";
  }

  if (intent === "next_checkup") {
    if (patientSummary?.upcomingAppointment?.start) {
      return `Your next recorded visit is ${new Date(patientSummary.upcomingAppointment.start).toLocaleString()} for ${patientSummary.upcomingAppointment.title || "a dental appointment"}. If you want, I can propose earlier open slots as well.`;
    }
    if (availability.length > 0) {
      return `I do not see a specific upcoming check-up on file, but the next open slots are ${availability
        .map((slot) => new Date(slot.start).toLocaleString())
        .slice(0, 3)
        .join(", ")}.`;
    }
    return "I could not find an upcoming check-up or open slot in the selected window. Try widening the lookahead period.";
  }

  if (intent === "availability") {
    if (availability.length === 0) {
      return "I could not find free appointment slots in the selected lookahead range.";
    }
    return `The next available appointment times are ${availability
      .map((slot) => new Date(slot.start).toLocaleString())
      .join(", ")}.`;
  }

  if (intent === "records") {
    const details: string[] = [];
    details.push(`Patient: ${patientSummary.patientName}.`);

    if (patientSummary.upcomingAppointment?.start) {
      details.push(`Next appointment: ${new Date(patientSummary.upcomingAppointment.start).toLocaleString()}.`);
    }
    if (patientSummary.insurancePayer) {
      details.push(`Insurance: ${patientSummary.insurancePayer}${patientSummary.insurancePlan ? ` (${patientSummary.insurancePlan})` : ""}.`);
    }
    if (patientSummary.medicalHighlights?.outstandingBalance !== null && patientSummary.medicalHighlights?.outstandingBalance !== undefined) {
      details.push(`Outstanding balance: $${Number(patientSummary.medicalHighlights.outstandingBalance).toFixed(2)}.`);
    }
    if (patientSummary.medicalHighlights?.allergyFlag === true) {
      details.push("Allergy flag: yes.");
    }
    if (typeof patientSummary.medicalHighlights?.radiographCount === "number") {
      details.push(`Radiographs on file: ${patientSummary.medicalHighlights.radiographCount}.`);
    }
    if (Array.isArray(patientSummary.medicalHighlights?.conditions) && patientSummary.medicalHighlights.conditions.length > 0) {
      details.push(`Conditions: ${patientSummary.medicalHighlights.conditions.join(", ")}.`);
    }
    if (Array.isArray(patientSummary.medicalHighlights?.medications) && patientSummary.medicalHighlights.medications.length > 0) {
      details.push(`Current medications: ${patientSummary.medicalHighlights.medications.join(", ")}.`);
    }
    if (patientSummary.medicalHighlights?.lastCleaningDate) {
      details.push(`Last cleaning: ${new Date(patientSummary.medicalHighlights.lastCleaningDate).toLocaleDateString()}.`);
    }

    details.push("I can provide more details if you ask about a specific area such as insurance, x-rays, or upcoming visits.");
    return details.join(" ");
  }

  return "I can help with appointment availability, next check-up timing, and available patient records. Ask me things like 'When is my next check-up?' or 'What records do you have for demo-p-001?'";
}

export async function POST(req: NextRequest) {
  try {
    const user = requireUser(req);
    const body = schema.parse(await req.json());

    const intent = detectIntent(body.question);

    let patientSummary = null;
    if (!body.patientId) {
      patientSummary = getAiTestPatientSummary();
    } else if (body.patientId.startsWith("ai-test-")) {
      patientSummary = getAiTestPatientSummary(body.patientId);
    } else {
      try {
        patientSummary =
          (await getDbPatientSummary(body.patientId)) ||
          getDemoPatientSummary(body.patientId) ||
          getAiTestPatientSummary(body.patientId);
      } catch {
        // Local fallback when DB is not configured.
        patientSummary = getDemoPatientSummary(body.patientId) || getAiTestPatientSummary(body.patientId);
      }
    }

    const availability = await getNextAvailability(user.id, body.lookaheadDays);
    const answer = composeAnswer({
      intent,
      question: body.question,
      patientSummary,
      availability,
    });

    let audioBase64: string | undefined;
    if (body.includeVoice) {
      const audio = await synthesizeWithElevenLabs({
        text: answer,
        voiceId: body.voiceId,
        voiceName: body.voiceName,
        modelId: body.modelId,
      });
      audioBase64 = toBase64(audio);
    }

    return NextResponse.json({
      ok: true,
      intent,
      answer,
      patientSummary,
      availability,
      audioBase64,
      audioMimeType: audioBase64 ? "audio/mpeg" : undefined,
      metadata: {
        lookaheadDays: body.lookaheadDays,
        timeZone: body.timeZone,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Response) {
      const status = error.status || 500;
      const explicit = status === 401 ? "unauthorized" : "request_failed";
      return NextResponse.json({ ok: false, error: explicit }, { status });
    }
    const message = error instanceof Error ? error.message : "failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
