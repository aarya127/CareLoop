import { describe, expect, it } from 'vitest';
import {
  IntakeTokenService,
  createPracticeLinkToken,
  hashDraftToken,
  verifyPracticeLinkToken,
} from './intake-token.service';

const secret = 'a-test-secret-that-is-at-least-32-characters';
const now = Date.UTC(2026, 7, 7, 12, 0, 0);

describe('intake capability tokens', () => {
  it('round-trips a signed practice link', () => {
    const { token } = createPracticeLinkToken('practice-A', secret, now);
    expect(verifyPracticeLinkToken(token, secret, now)).toMatchObject({
      type: 'intake_link',
      practiceId: 'practice-A',
    });
  });

  it('rejects tampered and expired practice links', () => {
    const { token, expiresAt } = createPracticeLinkToken('practice-A', secret, now);
    expect(verifyPracticeLinkToken(`${token}x`, secret, now)).toBeNull();
    expect(verifyPracticeLinkToken(token, secret, expiresAt.getTime())).toBeNull();
  });

  it('issues high-entropy draft tokens and stores only their hashes', () => {
    const previous = process.env.INTAKE_TOKEN_SECRET;
    process.env.INTAKE_TOKEN_SECRET = secret;
    try {
      const service = new IntakeTokenService();
      const first = service.createDraftCapability();
      const second = service.createDraftCapability();
      expect(first.accessToken).not.toBe(second.accessToken);
      expect(first.tokenHash).toBe(hashDraftToken(first.accessToken));
      expect(first.tokenHash).not.toContain(first.accessToken);
    } finally {
      if (previous === undefined) delete process.env.INTAKE_TOKEN_SECRET;
      else process.env.INTAKE_TOKEN_SECRET = previous;
    }
  });
});
