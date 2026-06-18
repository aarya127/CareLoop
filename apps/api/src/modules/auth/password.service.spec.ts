import { describe, it, expect } from 'vitest';
import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const svc = new PasswordService();

  it('hashes a password to an argon2id string that does not leak the plaintext', async () => {
    const hash = await svc.hash('s3cret-password');
    expect(hash).toMatch(/^\$argon2id\$/);
    expect(hash).not.toContain('s3cret-password');
  });

  it('verifies a correct password', async () => {
    const hash = await svc.hash('correct horse battery staple');
    expect(await svc.verify(hash, 'correct horse battery staple')).toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await svc.hash('correct horse battery staple');
    expect(await svc.verify(hash, 'wrong horse battery staple')).toBe(false);
  });

  it('returns false (does not throw) on a malformed hash', async () => {
    expect(await svc.verify('not-a-valid-argon2-hash', 'whatever')).toBe(false);
  });

  it('produces a unique hash per call for identical input (random salt)', async () => {
    const a = await svc.hash('same-input');
    const b = await svc.hash('same-input');
    expect(a).not.toBe(b);
    // ...but both must still verify against the original plaintext.
    expect(await svc.verify(a, 'same-input')).toBe(true);
    expect(await svc.verify(b, 'same-input')).toBe(true);
  });
});
