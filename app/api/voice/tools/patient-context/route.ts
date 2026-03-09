import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/server";
import { decrypt } from "@/lib/crypto/crypto";

const schema = z.object({
  patientId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    requireUser(req);
    const body = schema.parse(await req.json());

    const patient = await prisma.patient.findUnique({
      where: { id: body.patientId },
      include: {
        insuranceRecords: {
          where: { active: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!patient) {
      return NextResponse.json({ ok: false, error: "patient_not_found" }, { status: 404 });
    }

    const insurance = patient.insuranceRecords[0]
      ? {
          payerName: patient.insuranceRecords[0].payerName,
          planName: patient.insuranceRecords[0].planName,
          memberId: decrypt(patient.insuranceRecords[0].memberIdEnc),
          groupNumber: patient.insuranceRecords[0].groupNumberEnc
            ? decrypt(patient.insuranceRecords[0].groupNumberEnc)
            : null,
          coverageSummary: patient.insuranceRecords[0].coverageSummary,
          verifiedAt: patient.insuranceRecords[0].verifiedAt,
        }
      : null;

    return NextResponse.json({
      ok: true,
      patient: {
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        dateOfBirth: patient.dateOfBirth,
        phoneE164: patient.phoneE164,
        patientType: patient.patientType,
      },
      insurance,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
