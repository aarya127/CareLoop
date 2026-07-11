import { describe, it, expect } from 'vitest';
import bcrypt from 'bcrypt';
import { passwordNeedsRehash } from './auth.utils';

// The default target is BCRYPT_ROUNDS ?? 12 and the test env does not set it,
// so a cost-10 hash needs a rehash and a cost-12 hash does not.
describe('passwordNeedsRehash', () => {
  it('flags a hash whose cost differs from the configured target', () => {
    const cost10 = bcrypt.hashSync('secretpw', 10);
    expect(passwordNeedsRehash(cost10)).toBe(true);
  });

  it('does not flag a hash already at the target cost (12)', () => {
    const cost12 = bcrypt.hashSync('secretpw', 12);
    expect(passwordNeedsRehash(cost12)).toBe(false);
  });

  it('returns false for a malformed hash (never forces a rehash loop)', () => {
    expect(passwordNeedsRehash('not-a-bcrypt-hash')).toBe(false);
    expect(passwordNeedsRehash('')).toBe(false);
  });
});
