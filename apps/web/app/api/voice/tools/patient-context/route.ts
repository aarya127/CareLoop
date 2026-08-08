import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { requireUser } from '@/lib/auth/server';
import { decrypt } from '@/lib/crypto/crypto';
import { routeError } from '@/lib/http/route-error';

const schema = z.object({
  patientId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const body = schema.parse(await req.json());

    const patient = await prisma.patient.findFirst({
      where: { id: body.patientId, practiceId: user.practiceId },
      include: {
        insuranceRecords: {
          where: { active: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!patient) {
      return NextResponse.json({ ok: false, error: 'patient_not_found' }, { status: 404 });
    }

    const insuranceRecord = patient.insuranceRecords[0];
    const memberId = insuranceRecord ? decrypt(insuranceRecord.memberIdEnc) : null;
    const insurance = insuranceRecord
      ? {
          payerName: insuranceRecord.payerName,
          planName: insuranceRecord.planName,
          memberIdMasked: memberId ? `••••${memberId.slice(-4)}` : null,
          hasGroupNumber: Boolean(insuranceRecord.groupNumberEnc),
          coverageSummary: insuranceRecord.coverageSummary,
          verifiedAt: insuranceRecord.verifiedAt,
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
    return routeError(error);
  }
}
