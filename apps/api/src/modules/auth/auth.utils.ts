import crypto from 'crypto';
// Native bcrypt (C++ binding) — ~10-20x faster than the pure-JS bcryptjs on
// weak CPUs (e.g. Render free tier). Verifies the same $2a/$2b hashes, so
// existing stored password hashes keep working without migration.
import bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? 12);

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function randomToken(bytes = 48): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function hashUserAgent(value: string | undefined): string {
  if (!value) return '';
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function cookieMaxAgeMs(seconds: number): number {
  return seconds * 1000;
}
