import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  // TODO: replace with real DB lookup; returning a minimal demo shape
  return NextResponse.json({
    ok: true,
    patient: {
      id,
      firstName: 'Demo',
      lastName: 'Patient',
      insurance: { primary: { provider: 'Delta Dental', coveragePercent: 80 } },
      tags: ['demo'],
      alerts: ['peanut allergy'],
    },
  });
}
