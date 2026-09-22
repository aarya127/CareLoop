import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { PatientSessionService } from './patient-session.service';
import { PATIENT_SESSION_COOKIE } from './patient-auth.constants';

// Deliberately separate from SessionAuthGuard: reads only the patient cookie
// (or a Bearer token, needed for the web BFF's server-to-server calls — same
// dual support SessionAuthGuard has for staff) and sets req.patient (never
// req.user), following the same "distinct request property per principal type"
// convention as ServiceAccountGuard's req.serviceAccount. This guard must never
// be able to authenticate a staff session, and SessionAuthGuard must never be
// able to authenticate a patient one — there is no shared fallback between them.
@Injectable()
export class PatientAuthGuard implements CanActivate {
  constructor(@Inject(PatientSessionService) private readonly sessions: PatientSessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context
      .switchToHttp()
      .getRequest<FastifyRequest & { patient?: unknown; patientSessionToken?: string }>();

    const cookieToken: string | undefined = ((req as any).cookies as Record<string, string>)?.[
      PATIENT_SESSION_COOKIE
    ];
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    const token = cookieToken ?? bearerToken;
    if (!token) throw new UnauthorizedException('No patient session cookie');

    const session = await this.sessions.validateSession(token);

    req.patient = {
      id: session.patientId,
      patientId: session.patientId,
      practiceId: session.practiceId,
      sessionId: session.sessionId,
    };
    req.patientSessionToken = token;

    return true;
  }
}
