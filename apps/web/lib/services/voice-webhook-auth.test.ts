import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { signVoiceWebhook, validateVoiceWebhookSignature } from './voice-webhook-auth';

const secret = 'test-secret-with-sufficient-entropy';
const nowMs = Date.UTC(2026, 7, 7, 12, 0, 0);
const timestamp = String(Math.floor(nowMs / 1000));
const body = JSON.stringify({ event: 'call.completed', callSid: 'CA123' });

describe('voice webhook authentication', () => {
  it('accepts an authentic, current payload', () => {
    const signature = signVoiceWebhook(body, timestamp, secret);
    assert.equal(
      validateVoiceWebhookSignature(body, timestamp, `sha256=${signature}`, secret, nowMs),
      true,
    );
  });

  it('rejects payload tampering', () => {
    const signature = signVoiceWebhook(body, timestamp, secret);
    assert.equal(
      validateVoiceWebhookSignature(`${body} `, timestamp, signature, secret, nowMs),
      false,
    );
  });

  it('rejects replayed and malformed signatures', () => {
    const oldTimestamp = String(Number(timestamp) - 301);
    const oldSignature = signVoiceWebhook(body, oldTimestamp, secret);
    assert.equal(
      validateVoiceWebhookSignature(body, oldTimestamp, oldSignature, secret, nowMs),
      false,
    );
    assert.equal(validateVoiceWebhookSignature(body, timestamp, 'invalid', secret, nowMs), false);
  });
});
