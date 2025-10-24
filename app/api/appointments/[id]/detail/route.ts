import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  // TODO: join Appointment + Patient + Provider + Room from DB
  return NextResponse.json({
    ok: true,
    appointment: {
      id: ctx.params.id,
      title: 'Cleaning',
      status: 'confirmed',
      start: new Date().toISOString(),
      end: new Date(Date.now() + 3600_000).toISOString(),
      provider: { id: 'dr-1', name: 'Dr. Nguyen' },
      room: { id: 'chair-2', label: 'Chair 2' },
      patient: {
        id: 'p-1',
        firstName: 'Demo',
        lastName: 'Patient',
        insurance: { primary: { provider: 'Delta Dental', coveragePercent: 80 } },
      },
    },
  });
}
