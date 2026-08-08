import { NextRequest, NextResponse } from 'next/server';
import { requireRole, requireUser } from '@/lib/auth/server';
import { SERVER_API_URL } from '@/lib/config/api-server';

const ANALYTICS_ROLES = ['admin', 'manager'] as const;

function getRangeDays(range: string): number {
  if (range === '7d') return 7;
  if (range === '90d') return 90;
  return 30;
}

export async function GET(req: NextRequest) {
  try {
    requireRole(await requireUser(req), ANALYTICS_ROLES);
    const url = new URL(req.url);
    const range = url.searchParams.get('range') ?? '30d';
    const rangeDays = getRangeDays(range);

    // Forward the caller's session cookie to the API. This is a server-side
    // fetch, so `credentials: 'include'` does nothing — we must pass the cookie
    // explicitly. The API guards read `cl_session` from the Cookie header.
    const sessionToken = req.cookies.get('cl_session')?.value;
    const authHeaders: Record<string, string> = sessionToken
      ? { Cookie: `cl_session=${sessionToken}` }
      : {};

    const [dashboardRes, adminRes] = await Promise.all([
      fetch(`${SERVER_API_URL}/analytics/dashboard?rangeDays=${rangeDays}`, {
        headers: authHeaders,
      }),
      fetch(`${SERVER_API_URL}/auth/admin-overview`, { headers: authHeaders }),
    ]);

    const dashboardJson = dashboardRes.ok ? await dashboardRes.json() : null;
    const adminJson = adminRes.ok ? await adminRes.json() : null;

    if (!dashboardJson?.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: 'Unable to load analytics dashboard payload.',
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      summary: dashboardJson.summary,
      timeline: dashboardJson.timeline,
      recentCalls: dashboardJson.recentCalls,
      phaseOverview: {
        phase: dashboardJson.phase,
        rangeDays: dashboardJson.rangeDays,
        metrics: dashboardJson.metrics,
        decisions: dashboardJson.decisions,
      },
      phaseRoadmap: dashboardJson.roadmap,
      overview: adminJson,
      generatedAt: dashboardJson.generatedAt,
    });
  } catch (error: unknown) {
    if (error instanceof Response) return error;
    const message = error instanceof Error ? error.message : 'failed';
    return NextResponse.json(
      {
        ok: false,
        message,
      },
      { status: 500 },
    );
  }
}
