import crypto from 'crypto';

// Must stay byte-compatible with apps/api/src/common/security/field-encryption.ts,
// which decrypts these values: AES-256-GCM, key = SHA-256(ENCRYPTION_KEY),
// payload = base64(iv[12] | authTag[16] | ciphertext), prefixed with "v1:".
export const ENCRYPTED_PREFIX = 'v1:';

export function encryptField(value: string, secret: string): string {
  const key = crypto.createHash('sha256').update(secret).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const data = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return `${ENCRYPTED_PREFIX}${Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64')}`;
}

/** Hex SHA-256, used for indexed lookups of encrypted identifiers (memberIdHash). */
export function sha256Hex(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}
