/**
 * POST /api/voice/telephony/gather
 *
 * Handles the caller's speech after <Gather> fires.
 *
 * Flow:
 *   1. Twilio posts SpeechResult (transcription) + CallSid
 *   2. We run assistant intent detection + response generation
 *   3. We synthesize the response via ElevenLabs
 *   4. We return TwiML: <Play> the response + <Gather> for the next turn
 *   5. Loop continues until the caller hangs up
 *
 * Empty speech / silence: we play a "I didn't catch that" prompt and re-gather.
 */

import { NextRequest } from "next/server";
import { childLogger } from "@/lib/utils/logger";
import { runAssistantIntent } from "@/lib/voice/assistant";
import { synthesizeWithElevenLabs } from "@/lib/services/elevenlabs";
import {
  buildPlayAndGatherTwiml,
  buildSayAndGatherTwiml,
  buildSayAndHangupTwiml,
} from "@/lib/services/twilio";
import { storeAudioBuffer, getAudioUrl } from "@/lib/voice/audio-store";

const log = childLogger("telephony/gather");

const SILENCE_RESPONSE =
  "I'm sorry, I didn't quite catch that. Could you please repeat your question?";

const ERROR_RESPONSE =
  "I'm sorry, I'm having trouble right now. Please hold while I transfer you to the front desk.";

const MAX_TURNS = 20; // Safety limit — hang up after 20 turns to prevent infinite loops

export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => new FormData());

  const callSid = formData.get("CallSid")?.toString() ?? "unknown";
  const speechResult = formData.get("SpeechResult")?.toString()?.trim() ?? "";
  const confidence = formData.get("Confidence")?.toString() ?? "0";
  const turnStr = formData.get("turnCount")?.toString() ?? "0";
  const turnCount = parseInt(turnStr, 10) || 0;

  const baseUrl = process.env.BASE_URL ?? process.env.APP_BASE_URL ?? "http://localhost:3000";
  const gatherUrl = `${baseUrl}/api/voice/telephony/gather`;

  log.info(
    { callSid, speechLen: speechResult.length, confidence, turn: turnCount },
    "gather received",
  );

  // Safety: end the call after too many turns
  if (turnCount >= MAX_TURNS) {
    log.warn({ callSid, turnCount }, "max turns reached — ending call");
    const twiml = buildSayAndHangupTwiml(
      "We've reached the end of our conversation. Thank you for calling CareLoop. Goodbye!",
    );
    return new Response(twiml, {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }

  // Handle empty / silent input
  if (!speechResult) {
    log.info({ callSid }, "empty speech — prompting again");
    try {
      const audio = await synthesizeWithElevenLabs({ text: SILENCE_RESPONSE });
      const audioId = storeAudioBuffer(audio);
      const twiml = buildPlayAndGatherTwiml({
        audioUrl: getAudioUrl(baseUrl, audioId),
        gatherUrl: appendTurn(gatherUrl, turnCount + 1),
      });
      return new Response(twiml, {
        status: 200,
        headers: { "Content-Type": "text/xml" },
      });
    } catch {
      const twiml = buildSayAndGatherTwiml({
        text: SILENCE_RESPONSE,
        gatherUrl: appendTurn(gatherUrl, turnCount + 1),
      });
      return new Response(twiml, {
        status: 200,
        headers: { "Content-Type": "text/xml" },
      });
    }
  }

  // Process speech through assistant
  try {
    const { answer } = await runAssistantIntent({
      question: speechResult,
      callSid,
      lookaheadDays: 14,
    });

    const audio = await synthesizeWithElevenLabs({ text: answer });
    const audioId = storeAudioBuffer(audio);

    const twiml = buildPlayAndGatherTwiml({
      audioUrl: getAudioUrl(baseUrl, audioId),
      gatherUrl: appendTurn(gatherUrl, turnCount + 1),
    });

    log.info({ callSid, turn: turnCount + 1 }, "response delivered");
    return new Response(twiml, {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  } catch (err) {
    log.error({ callSid, err: String(err) }, "assistant or TTS failed");

    const twiml = buildSayAndHangupTwiml(ERROR_RESPONSE);
    return new Response(twiml, {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }
}

/** Appends the current turn counter as a query param so we can track it */
function appendTurn(url: string, turn: number): string {
  const u = new URL(url);
  u.searchParams.set("turnCount", String(turn));
  return u.toString();
}
