import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/server";
import { startVoiceCall } from "@/lib/services/voice-orchestrator";

const schema = z.object({
  orchestrator: z.enum(["vapi", "retell", "pipecat"]).default("vapi"),
  to: z.string().min(7),
  patientId: z.string().optional(),
  practiceId: z.string().default("default-practice"),
});

export async function POST(req: NextRequest) {
  try {
    requireUser(req);
    const body = schema.parse(await req.json());
    const started = await startVoiceCall(body);
    return NextResponse.json({ ok: true, call: started });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
