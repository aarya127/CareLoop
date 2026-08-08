import crypto from 'crypto';

function getKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error('Missing ENCRYPTION_KEY');
  // Derive 32-byte key from arbitrary string
  return crypto.createHash('sha256').update(key).digest();
}

export function encrypt(plain: string): string {
  const iv = crypto.randomBytes(12);
  const key = getKey();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

export function decrypt(encoded: string): string {
  const versioned = encoded.startsWith('v1:');
  const payload = versioned ? encoded.slice(3) : encoded;
  const buf = Buffer.from(payload, 'base64');
  if (buf.length < 29) {
    if (!versioned) return encoded; // legacy plaintext insurance value
    throw new Error('Encrypted value is malformed');
  }
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const key = getKey();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  try {
    const dec = Buffer.concat([decipher.update(data), decipher.final()]);
    return dec.toString('utf8');
  } catch (error) {
    if (!versioned) return encoded; // pre-encryption legacy insurance value
    throw error;
  }
}
