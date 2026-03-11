import { NextResponse } from "next/server";
import { synthesizeWithElevenLabs } from "@/lib/services/elevenlabs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const text = typeof body.text === "string" && body.text.trim().length > 0
    ? body.text
    : "The first move is what sets everything in motion.";
  const voiceId = typeof body.voiceId === "string" ? body.voiceId : undefined;
  const voiceName = typeof body.voiceName === "string" ? body.voiceName : undefined;
  const modelId = body.modelId || "eleven_multilingual_v2";

  try {
    const arrayBuffer = await synthesizeWithElevenLabs({ text, voiceId, voiceName, modelId });
    return new Response(arrayBuffer, {
      status: 200,
      headers: { "Content-Type": "audio/mpeg" },
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
