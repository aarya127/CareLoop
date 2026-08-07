import { createHmac, timingSafeEqual } from 'node:crypto';

const MAX_TIMESTAMP_SKEW_SECONDS = 5 * 60;

export function signVoiceWebhook(rawBody: string, timestamp: string, secret: string): string {
  return createHmac('sha256', secret).update(`${timestamp}.${rawBody}`, 'utf8').digest('hex');
}

export function validateVoiceWebhookSignature(
  rawBody: string,
  timestamp: string,
  signatureHeader: string,
  secret: string,
  nowMs = Date.now(),
): boolean {
  if (!rawBody || !timestamp || !signatureHeader || !secret) return false;

  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds)) return false;
  if (Math.abs(Math.floor(nowMs / 1000) - timestampSeconds) > MAX_TIMESTAMP_SKEW_SECONDS) {
    return false;
  }

  const suppliedHex = signatureHeader.startsWith('sha256=')
    ? signatureHeader.slice('sha256='.length)
    : signatureHeader;
  if (!/^[a-f0-9]{64}$/i.test(suppliedHex)) return false;

  const expected = Buffer.from(signVoiceWebhook(rawBody, timestamp, secret), 'hex');
  const supplied = Buffer.from(suppliedHex, 'hex');
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

/**
 * Authenticate the internal voice-provider callback. Both timestamp and body
 * are signed so captured requests expire and payloads cannot be altered.
 */
export function requireVoiceWebhookRequest(req: Request, rawBody: string): Response | null {
  const secret = process.env.VOICE_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json({ error: 'voice_webhook_not_configured' }, { status: 503 });
  }

  const timestamp = req.headers.get('x-careloop-timestamp') ?? '';
  const signature = req.headers.get('x-careloop-signature') ?? '';
  if (!validateVoiceWebhookSignature(rawBody, timestamp, signature, secret)) {
    return Response.json({ error: 'invalid_voice_webhook_signature' }, { status: 401 });
  }
  return null;
}
