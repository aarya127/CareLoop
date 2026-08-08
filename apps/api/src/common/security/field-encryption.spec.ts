import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { decryptSensitiveField, encryptSensitiveField } from './field-encryption';

describe('sensitive field encryption', () => {
  const originalKey = process.env.ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = 'test-only-key-with-sufficient-entropy';
  });

  afterEach(() => {
    process.env.ENCRYPTION_KEY = originalKey;
  });

  it('round-trips with randomized authenticated ciphertext', () => {
    const first = encryptSensitiveField('MEMBER-123');
    const second = encryptSensitiveField('MEMBER-123');
    expect(first).toMatch(/^v1:/);
    expect(first).not.toBe(second);
    expect(decryptSensitiveField(first)).toBe('MEMBER-123');
  });

  it('rejects tampered ciphertext', () => {
    const encrypted = encryptSensitiveField('MEMBER-123');
    expect(() => decryptSensitiveField(`${encrypted.slice(0, -2)}AA`)).toThrow();
  });
});
