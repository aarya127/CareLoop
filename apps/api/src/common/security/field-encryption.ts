import crypto from 'crypto';

const VERSION_PREFIX = 'v1:';

function encryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) throw new Error('ENCRYPTION_KEY is required');
  return crypto.createHash('sha256').update(secret).digest();
}

export function encryptSensitiveField(plainText: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const payload = Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64');
  return `${VERSION_PREFIX}${payload}`;
}

export function decryptSensitiveField(cipherText: string): string {
  if (!cipherText.startsWith(VERSION_PREFIX)) return cipherText;
  const payload = Buffer.from(cipherText.slice(VERSION_PREFIX.length), 'base64');
  if (payload.length < 29) throw new Error('Encrypted field is malformed');
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), payload.subarray(0, 12));
  decipher.setAuthTag(payload.subarray(12, 28));
  return Buffer.concat([decipher.update(payload.subarray(28)), decipher.final()]).toString('utf8');
}

export function isEncryptedSensitiveField(value: string): boolean {
  return value.startsWith(VERSION_PREFIX);
}
