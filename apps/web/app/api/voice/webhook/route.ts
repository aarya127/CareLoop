import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { extractKpisFromTranscript } from "@/lib/services/analytics-engine";

const webhookSchema = z.object({
  event: z.enum(["call.completed", "call.segment"]),
  callSid: z.string(),
  practiceId: z.string().default("default-practice"),
  payload: z.record(z.unknown()).default({}),
});

export async function POST(req: NextRequest) {
  try {
    const body = webhookSchema.parse(await req.json());

    if (body.event !== "call.completed") {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const transcript = await prisma.callTranscript.findUnique({ where: { callSid: body.callSid } });
    if (!transcript) {
      return NextResponse.json({ ok: false, error: "transcript_not_found" }, { status: 404 });
    }

    const kpis = extractKpisFromTranscript(transcript.fullTranscript ?? "");

    await prisma.analyticsResult.upsert({
      where: { transcriptId: transcript.id },
      update: {
        sentimentScore: kpis.sentimentScore,
        satisfactionByProvider: kpis.satisfactionByProvider,
        treatmentAcceptance: kpis.treatmentAcceptance,
        riskFlags: kpis.riskFlags,
      },
      create: {
        transcriptId: transcript.id,
        sentimentScore: kpis.sentimentScore,
        satisfactionByProvider: kpis.satisfactionByProvider,
        treatmentAcceptance: kpis.treatmentAcceptance,
        riskFlags: kpis.riskFlags,
      },
    });

    await prisma.callTranscript.update({
      where: { id: transcript.id },
      data: {
        sentimentScore: kpis.sentimentScore,
        treatmentAcceptance: kpis.treatmentAcceptance.accepted,
      },
    });

    const today = new Date();
    const midnightUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

    await prisma.practiceKPI.createMany({
      data: [
        {
          practiceId: body.practiceId,
          kpiDate: midnightUtc,
          metricName: "avg_sentiment",
          metricValue: kpis.sentimentScore,
          dimensions: { source: "voice_call" },
          transcriptId: transcript.id,
        },
        {
          practiceId: body.practiceId,
          kpiDate: midnightUtc,
          metricName: "treatment_acceptance_rate",
          metricValue: kpis.treatmentAcceptance.accepted ? 1 : 0,
          dimensions: { procedure: kpis.treatmentAcceptance.procedure ?? "unknown" },
          transcriptId: transcript.id,
        },
        {
          practiceId: body.practiceId,
          kpiDate: midnightUtc,
          metricName: "provider_satisfaction_dentist",
          metricValue: kpis.satisfactionByProvider.dentist,
          dimensions: { providerRole: "dentist" },
          transcriptId: transcript.id,
        },
        {
          practiceId: body.practiceId,
          kpiDate: midnightUtc,
          metricName: "provider_satisfaction_hygienist",
          metricValue: kpis.satisfactionByProvider.hygienist,
          dimensions: { providerRole: "hygienist" },
          transcriptId: transcript.id,
        },
      ],
    });

    return NextResponse.json({ ok: true, kpis });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
