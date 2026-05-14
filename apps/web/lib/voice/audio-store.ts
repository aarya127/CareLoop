/**
 * In-memory audio buffer store for Twilio <Play> audio serving.
 * Stores synthesized TTS audio blobs keyed by a short ID.
 */

const store = new Map<string, Buffer>();

export function saveAudioBuffer(id: string, buffer: Buffer): void {
  store.set(id, buffer);
  // Auto-expire after 5 minutes
  setTimeout(() => store.delete(id), 5 * 60 * 1000);
}

export function getAudioBuffer(id: string): Buffer | undefined {
  return store.get(id);
}
