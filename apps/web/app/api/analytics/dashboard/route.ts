import { NextRequest, NextResponse } from 'next/server';

function getRangeDays(range: string): number {
  if (range === '7d') return 7;
  if (range === '90d') return 90;
  return 30;
}

function resolveApiBase(): string {
  const configured =
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    '';
  if (!configured) return 'https://careloop-tf2l.onrender.com';
  const normalized = configured.replace(/\/$/, '');
  if (
    normalized.includes('localhost:3000') ||
    normalized.includes('127.0.0.1:3000') ||
    normalized === '/'
  ) {
    return 'https://careloop-tf2l.onrender.com';
  }
  return normalized;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const range = url.searchParams.get('range') ?? '30d';
    const practiceId = url.searchParams.get('practiceId') ?? 'demo-practice';
    const rangeDays = getRangeDays(range);
    const apiBase = resolveApiBase();

    // Forward the caller's session cookie to the API. This is a server-side
    // fetch, so `credentials: 'include'` does nothing — we must pass the cookie
    // explicitly. The API guards read `cl_session` from the Cookie header.
    const sessionToken = req.cookies.get('cl_session')?.value;
    const authHeaders: Record<string, string> = sessionToken
      ? { Cookie: `cl_session=${sessionToken}` }
      : {};

    const [dashboardRes, adminRes] = await Promise.all([
      fetch(`${apiBase}/analytics/dashboard?practiceId=${practiceId}&rangeDays=${rangeDays}`, {
        headers: authHeaders,
      }),
      fetch(`${apiBase}/auth/admin-overview?practiceId=${practiceId}`, { headers: authHeaders }),
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
