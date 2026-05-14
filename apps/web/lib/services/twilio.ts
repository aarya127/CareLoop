/**
 * TwiML builder helpers — thin wrappers so route handlers stay readable.
 * Uses plain string construction to avoid adding the twilio SDK as a dependency.
 */

function twimlResponse(body: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`;
}

export interface PlayAndGatherOptions {
  audioUrl: string;
  gatherUrl: string;
  speechTimeout?: number;
}

export function buildPlayAndGatherTwiml(opts: PlayAndGatherOptions): string {
  const timeout = opts.speechTimeout ?? 3;
  return twimlResponse(
    `<Gather input="speech" action="${opts.gatherUrl}" speechTimeout="${timeout}" method="POST">` +
      `<Play>${opts.audioUrl}</Play>` +
      `</Gather>`,
  );
}

export interface SayAndGatherOptions {
  text: string;
  gatherUrl: string;
  speechTimeout?: number;
}

export function buildSayAndGatherTwiml(opts: SayAndGatherOptions): string {
  const timeout = opts.speechTimeout ?? 3;
  return twimlResponse(
    `<Gather input="speech" action="${opts.gatherUrl}" speechTimeout="${timeout}" method="POST">` +
      `<Say>${opts.text}</Say>` +
      `</Gather>`,
  );
}

export function buildSayAndHangupTwiml(text: string): string {
  return twimlResponse(`<Say>${text}</Say><Hangup/>`);
}
