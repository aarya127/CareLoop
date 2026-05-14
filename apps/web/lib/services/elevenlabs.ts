/**
 * Thin wrapper around the ElevenLabs Text-to-Speech REST API.
 *
 * Required env var: ELEVENLABS_API_KEY
 * Optional env var: ELEVENLABS_DEFAULT_VOICE_ID  (fallback voice when none is specified)
 *
 * Returns raw audio bytes as an ArrayBuffer (content-type audio/mpeg from ElevenLabs).
 * Callers that need WAV should wrap the buffer — ElevenLabs returns mp3 by default
 * but we keep the raw bytes and let the response Content-Type guide the client.
 */

const ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1";

// A recognisable public voice that works without any cloning quota.
const FALLBACK_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; // "Bella" (multilingual)

export interface SynthesizeOptions {
  text: string;
  /** ElevenLabs voice ID. Takes precedence over voiceName. */
  voiceId?: string;
  /**
   * Human-readable voice name used only for logging/debugging.
   * The API itself requires an ID; this field is ignored by the HTTP call.
   */
  voiceName?: string;
  /** ElevenLabs model ID. Defaults to eleven_multilingual_v2. */
  modelId?: string;
}

/**
 * Synthesize speech with ElevenLabs and return the raw audio as an ArrayBuffer.
 *
 * Throws if ELEVENLABS_API_KEY is not set or if the ElevenLabs API returns a non-2xx
 * status, so callers should wrap in try/catch and return a graceful error response.
 */
export async function synthesizeWithElevenLabs(
  options: SynthesizeOptions,
): Promise<ArrayBuffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ELEVENLABS_API_KEY is not set. Add it to your .env file to enable TTS.",
    );
  }

  const voiceId =
    options.voiceId ||
    process.env.ELEVENLABS_DEFAULT_VOICE_ID ||
    FALLBACK_VOICE_ID;

  const modelId = options.modelId ?? "eleven_multilingual_v2";

  const url = `${ELEVENLABS_API_BASE}/text-to-speech/${encodeURIComponent(voiceId)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: options.text,
      model_id: modelId,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => response.statusText);
    throw new Error(
      `ElevenLabs TTS error ${response.status}: ${detail}`,
    );
  }

  return response.arrayBuffer();
}
