import { NextRequest, NextResponse } from 'next/server';
import { synthesizeWithElevenLabs } from '@/lib/services/elevenlabs';
import { requireUser } from '@/lib/auth/server';

// Authenticated only — this endpoint spends ElevenLabs credits on arbitrary
// text, so it must never be callable anonymously. Internal telephony flows
// call synthesizeWithElevenLabs() directly server-side and don't need this route.
export async function POST(req: NextRequest) {
  try {
    await requireUser(req);
  } catch (unauthorized) {
    if (unauthorized instanceof Response) return unauthorized;
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const text =
    typeof body.text === 'string' && body.text.trim().length > 0
      ? body.text
      : 'The first move is what sets everything in motion.';
  const voiceId = typeof body.voiceId === 'string' ? body.voiceId : undefined;
  const voiceName = typeof body.voiceName === 'string' ? body.voiceName : undefined;
  const modelId = body.modelId || 'eleven_multilingual_v2';

  try {
    const arrayBuffer = await synthesizeWithElevenLabs({ text, voiceId, voiceName, modelId });
    return new Response(arrayBuffer, {
      status: 200,
      headers: { 'Content-Type': 'audio/wav' },
    });
  } catch (err: unknown) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
