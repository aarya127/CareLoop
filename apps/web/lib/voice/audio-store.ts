/**
 * In-memory audio buffer store for Twilio <Play> audio serving.
 * Stores synthesized TTS audio blobs keyed by a short ID.
 */

import { randomBytes } from "node:crypto";

const store = new Map<string, Buffer>();

/** Store a buffer, auto-generate an unguessable ID, return the ID. */
export function storeAudioBuffer(buffer: Buffer | Uint8Array | ArrayBuffer): string {
  // The serving route is unauthenticated (Twilio <Play> fetches it), so the id
  // is the only access control — it must be crypto-random, not sequential.
  const id = `audio-${randomBytes(16).toString("hex")}`;
  store.set(id, Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer as ArrayBuffer));
  // Auto-expire after 5 minutes
  setTimeout(() => store.delete(id), 5 * 60 * 1000);
  return id;
}

export function getAudioBuffer(id: string): Buffer | undefined {
  return store.get(id);
}

/** Build a URL for serving an audio buffer via the telephony audio route. */
export function getAudioUrl(baseUrl: string, id: string): string {
  return `${baseUrl}/api/voice/telephony/audio/${encodeURIComponent(id)}`;
}
