/**
 * POST /api/voice/telephony/webhook
 *
 * Entry point for all inbound Twilio calls.
 *
 * Flow:
 *   1. Twilio calls this endpoint when a caller dials the Twilio number
 *   2. We synthesize a greeting via ElevenLabs
 *   3. We serve the audio via a signed URL to /api/voice/telephony/audio/[id]
 *   4. We respond with TwiML: <Play> the greeting + <Gather> the caller's speech
 *
 * Twilio expects a TwiML response (text/xml) within 10 seconds.
 */

import { NextRequest } from "next/server";
import { childLogger } from "@/lib/utils/logger";
import { synthesizeWithElevenLabs } from "@/lib/services/elevenlabs";
import {
  buildPlayAndGatherTwiml,
  buildSayAndGatherTwiml,
} from "@/lib/services/twilio";
import { storeAudioBuffer, getAudioUrl } from "@/lib/voice/audio-store";

const log = childLogger("telephony/webhook");

const GREETING =
  "Hello, thank you for calling CareLoop Dental. I'm your AI assistant. " +
  "I can help you with appointment scheduling, check-up reminders, and patient records. " +
  "How can I help you today?";

export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => new FormData());
  const callSid = formData.get("CallSid")?.toString() ?? "unknown";
  const from = formData.get("From")?.toString() ?? "";
  const to = formData.get("To")?.toString() ?? "";

  log.info({ callSid, from, to }, "inbound call received");

  const baseUrl = process.env.BASE_URL ?? process.env.APP_BASE_URL ?? "http://localhost:3000";
  const gatherUrl = `${baseUrl}/api/voice/telephony/gather`;

  try {
    // Synthesize greeting audio
    const audio = await synthesizeWithElevenLabs({ text: GREETING });
    const audioId = storeAudioBuffer(audio);
    const audioUrl = getAudioUrl(baseUrl, audioId);

    const twiml = buildPlayAndGatherTwiml({
      audioUrl,
      gatherUrl,
      timeoutSeconds: 10,
      speechTimeout: "auto",
    });

    log.info({ callSid, audioId }, "greeting ready, returning TwiML");
    return new Response(twiml, {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  } catch (err) {
    log.error({ callSid, err: String(err) }, "greeting synthesis failed — falling back to Twilio TTS");

    // Fallback: use Twilio's built-in TTS (Polly) so the call still connects
    const twiml = buildSayAndGatherTwiml({ text: GREETING, gatherUrl });
    return new Response(twiml, {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }
}
