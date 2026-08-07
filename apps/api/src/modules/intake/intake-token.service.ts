import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const LINK_TTL_SECONDS = 7 * 24 * 60 * 60;
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

interface IntakeLinkPayload {
  type: 'intake_link';
  practiceId: string;
  exp: number;
}

function signature(data: string, secret: string): Buffer {
  return createHmac('sha256', secret).update(data, 'utf8').digest();
}

export function createPracticeLinkToken(
  practiceId: string,
  secret: string,
  nowMs = Date.now(),
): { token: string; expiresAt: Date } {
  const expiresAt = new Date(nowMs + LINK_TTL_SECONDS * 1000);
  const payload: IntakeLinkPayload = {
    type: 'intake_link',
    practiceId,
    exp: Math.floor(expiresAt.getTime() / 1000),
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signed = signature(`v1.${encoded}`, secret).toString('base64url');
  return { token: `v1.${encoded}.${signed}`, expiresAt };
}

export function verifyPracticeLinkToken(
  token: string,
  secret: string,
  nowMs = Date.now(),
): IntakeLinkPayload | null {
  const [version, encoded, suppliedSignature, ...extra] = token.split('.');
  if (version !== 'v1' || !encoded || !suppliedSignature || extra.length > 0) return null;

  const expected = signature(`${version}.${encoded}`, secret);
  let supplied: Buffer;
  try {
    supplied = Buffer.from(suppliedSignature, 'base64url');
  } catch {
    return null;
  }
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8'),
    ) as Partial<IntakeLinkPayload>;
    if (
      payload.type !== 'intake_link' ||
      typeof payload.practiceId !== 'string' ||
      !payload.practiceId ||
      typeof payload.exp !== 'number' ||
      payload.exp <= Math.floor(nowMs / 1000)
    ) {
      return null;
    }
    return payload as IntakeLinkPayload;
  } catch {
    return null;
  }
}

export function hashDraftToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

@Injectable()
export class IntakeTokenService {
  private secret(): string {
    const secret = process.env.INTAKE_TOKEN_SECRET;
    if (!secret || secret.length < 32) {
      throw new ServiceUnavailableException('Patient intake links are not configured');
    }
    return secret;
  }

  createPracticeLink(practiceId: string) {
    return createPracticeLinkToken(practiceId, this.secret());
  }

  verifyPracticeLink(token: string): IntakeLinkPayload {
    const payload = verifyPracticeLinkToken(token, this.secret());
    if (!payload) throw new UnauthorizedException('Invalid or expired intake link');
    return payload;
  }

  createDraftCapability(): { accessToken: string; tokenHash: string; expiresAt: Date } {
    const accessToken = randomBytes(32).toString('base64url');
    return {
      accessToken,
      tokenHash: hashDraftToken(accessToken),
      expiresAt: new Date(Date.now() + DRAFT_TTL_MS),
    };
  }
}
