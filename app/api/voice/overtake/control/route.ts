import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/server";
import { activateStaff, endCall, requestHandoff, resumeAi } from "@/lib/services/manual-overtake";

const schema = z.object({
  callId: z.string().min(3),
  action: z.enum(["handoff.request", "handoff.accept", "handoff.resume_ai", "call.end"]),
});

export async function POST(req: NextRequest) {
  try {
    const user = requireUser(req);
    const body = schema.parse(await req.json());

    let state;
    if (body.action === "handoff.request") state = requestHandoff(body.callId, user.id);
    else if (body.action === "handoff.accept") state = activateStaff(body.callId, user.id);
    else if (body.action === "handoff.resume_ai") state = resumeAi(body.callId, user.id);
    else state = endCall(body.callId, user.id);

    return NextResponse.json({ ok: true, state });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
