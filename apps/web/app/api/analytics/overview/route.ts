import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

function getRangeDays(range: string): number {
  if (range === "7d") return 7;
  if (range === "90d") return 90;
  return 30;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const range = url.searchParams.get("range") ?? "30d";
    const practiceId = url.searchParams.get("practiceId") ?? "default-practice";
    const days = getRangeDays(range);

    const from = new Date();
    from.setUTCDate(from.getUTCDate() - days);

    const rows = await prisma.practiceKPI.findMany({
      where: {
        practiceId,
        kpiDate: { gte: from },
      },
      orderBy: { kpiDate: "asc" },
    });

    const transcripts = await prisma.callTranscript.findMany({
      where: {
        practiceId,
        createdAt: { gte: from },
      },
      select: {
        id: true,
        callSid: true,
        sentimentScore: true,
        treatmentAcceptance: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 25,
    });

    const avgSentiment = rows
      .filter((r) => r.metricName === "avg_sentiment")
      .reduce((acc, r, _, arr) => acc + r.metricValue / Math.max(arr.length, 1), 0);

    const acceptanceRate = rows
      .filter((r) => r.metricName === "treatment_acceptance_rate")
      .reduce((acc, r, _, arr) => acc + r.metricValue / Math.max(arr.length, 1), 0);

    return NextResponse.json({
      ok: true,
      summary: {
        avgSentiment: Number(avgSentiment.toFixed(2)),
        acceptanceRate: Number((acceptanceRate * 100).toFixed(2)),
        totalCalls: transcripts.length,
      },
      timeline: rows,
      recentCalls: transcripts,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'failed';

    // Fall back to an empty payload so analytics UI still loads in local/dev setups
    // where DATABASE_URL is not configured.
    return NextResponse.json({
      ok: true,
      fallback: true,
      warning: message,
      summary: {
        avgSentiment: 0,
        acceptanceRate: 0,
        totalCalls: 0,
      },
      timeline: [],
      recentCalls: [],
    });
  }
}
