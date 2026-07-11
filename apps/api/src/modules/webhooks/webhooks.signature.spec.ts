import { describe, it, expect } from 'vitest';
import { createHmac } from 'crypto';
import { WebhooksService } from './webhooks.service';
import type { TwilioService } from '../messaging/twilio.service';
import type { EmailService } from '../messaging/email.service';

/**
 * Stripe webhook signature verification (Stripe's `t=..,v1=..` HMAC scheme with
 * a 5-minute replay window). Guards against forged payment webhooks.
 */
const SECRET = 'whsec_test_secret';

function makeService() {
  return new WebhooksService({} as unknown as TwilioService, {} as unknown as EmailService);
}

// verifyStripeSignature is private; call it directly for a focused unit test.
function verify(svc: WebhooksService, rawBody: string, header: string): boolean {
  return (svc as any).verifyStripeSignature(rawBody, header, SECRET) as boolean;
}

function sign(rawBody: string, timestamp: number, secret = SECRET): string {
  const v1 = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`, 'utf8').digest('hex');
  return `t=${timestamp},v1=${v1}`;
}

describe('WebhooksService.verifyStripeSignature', () => {
  const body = JSON.stringify({ id: 'evt_1', type: 'payment_intent.succeeded' });
  const now = () => Math.floor(Date.now() / 1000);

  it('accepts a correctly signed recent payload', () => {
    const svc = makeService();
    expect(verify(svc, body, sign(body, now()))).toBe(true);
  });

  it('rejects a payload signed with the wrong secret', () => {
    const svc = makeService();
    expect(verify(svc, body, sign(body, now(), 'whsec_wrong'))).toBe(false);
  });

  it('rejects a tampered body', () => {
    const svc = makeService();
    const header = sign(body, now());
    expect(verify(svc, body + 'tampered', header)).toBe(false);
  });

  it('rejects a stale timestamp beyond the tolerance window', () => {
    const svc = makeService();
    const old = now() - 600; // 10 minutes ago > 5 min tolerance
    expect(verify(svc, body, sign(body, old))).toBe(false);
  });

  it('rejects a malformed signature header', () => {
    const svc = makeService();
    expect(verify(svc, body, 'not-a-valid-header')).toBe(false);
  });
});
