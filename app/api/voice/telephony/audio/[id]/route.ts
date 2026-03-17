/**
 * GET /api/voice/telephony/audio/[id]
 *
 * Serves a synthesized audio buffer stored in the in-memory audio store.
 * Twilio's <Play> verb fetches audio from this endpoint.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAudioBuffer } from "@/lib/voice/audio-store";
import { childLogger } from "@/lib/utils/logger";

const log = childLogger("telephony/audio");

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const buffer = getAudioBuffer(id);
  if (!buffer) {
    log.warn({ id }, "audio not found or expired");
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  log.debug({ id, bytes: buffer.byteLength }, "serving audio");

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": String(buffer.byteLength),
      "Cache-Control": "no-store",
    },
  });
}
