import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireUser } from '@/lib/auth/server';

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    const { id } = await ctx.params;

    // Scoped to the caller's practice so ids from other tenants 404.
    const patient = await prisma.patient.findFirst({
      where: { id, practiceId: user.practiceId },
      include: {
        insuranceRecords: {
          where: { active: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!patient) {
      return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
    }

    const insurance = patient.insuranceRecords[0];
    return NextResponse.json({
      ok: true,
      patient: {
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        dateOfBirth: patient.dateOfBirth,
        phoneE164: patient.phoneE164,
        patientType: patient.patientType,
        insurance: insurance
          ? { primary: { provider: insurance.payerName, plan: insurance.planName } }
          : null,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Response) return error;
    console.error('[patients/[id]] failed:', error);
    return NextResponse.json({ ok: false, error: 'failed' }, { status: 500 });
  }
}
