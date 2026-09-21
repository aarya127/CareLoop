import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { prisma } from '@careloop/db';
import { EmailService } from '../messaging/email.service';
import { renderPatientPortalInvite } from '../messaging/templates';
import {
  hashPassword,
  hashToken,
  passwordNeedsRehash,
  randomToken,
  verifyPassword,
} from '../auth/auth.utils';
import { PatientSessionService } from './patient-session.service';
import {
  PATIENT_AUTH_ERRORS,
  PATIENT_AUTH_LIMITS,
  PATIENT_INVITE_TTL_MS,
} from './patient-auth.constants';
import type {
  AcceptPatientInvitationDto,
  CreatePatientInvitationDto,
  PatientLoginDto,
} from './dto';

type SafePatientPrincipal = {
  id: string;
  patientId: string;
  practiceId: string;
  email: string;
  firstName: string;
  lastName: string;
};

@Injectable()
export class PatientAuthService {
  private readonly logger = new Logger(PatientAuthService.name);

  constructor(
    @Inject(PatientSessionService) private readonly sessions: PatientSessionService,
    @Inject(EmailService) private readonly email: EmailService,
  ) {}

  private appBaseUrl(): string {
    return process.env.APP_BASE_URL ?? process.env.WEB_URL ?? 'http://localhost:3000';
  }

  private nowMs(): number {
    return Date.now();
  }

  /** Staff (scoped to their own practice) invites an existing Patient to the portal. */
  async invite(practiceId: string, invitedByUserId: string, dto: CreatePatientInvitationDto) {
    const patient = await prisma.patient.findFirst({
      where: { id: dto.patientId, practiceId },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!patient) {
      throw new NotFoundException(`Patient ${dto.patientId} not found`);
    }

    const email = dto.email.trim().toLowerCase();

    const existingCredential = await prisma.patientCredential.findUnique({
      where: { email },
      select: { patientId: true },
    });
    if (existingCredential && existingCredential.patientId !== patient.id) {
      throw new ConflictException('This email is already used by another portal account');
    }
    if (existingCredential && existingCredential.patientId === patient.id) {
      throw new ConflictException('This patient already has a portal account — ask them to log in');
    }

    await prisma.patientInvitation.updateMany({
      where: { practiceId, patientId: patient.id, status: 'pending' },
      data: { status: 'revoked' },
    });

    const rawToken = randomToken();
    const invite = await prisma.patientInvitation.create({
      data: {
        practiceId,
        patientId: patient.id,
        email,
        tokenHash: hashToken(rawToken),
        invitedByUserId,
        expiresAt: new Date(this.nowMs() + PATIENT_INVITE_TTL_MS),
      },
      select: { id: true, email: true, status: true, expiresAt: true },
    });

    const acceptUrl = `${this.appBaseUrl()}/portal/join/${rawToken}`;

    let emailSent = false;
    try {
      const practice = await prisma.practice.findUnique({
        where: { id: practiceId },
        select: { name: true },
      });
      const msg = renderPatientPortalInvite({
        practiceName: practice?.name ?? 'your dental practice',
        patientName: `${patient.firstName} ${patient.lastName}`.trim(),
        acceptUrl,
      });
      await this.email.send({ to: email, subject: msg.subject, html: msg.html, text: msg.text });
      emailSent = true;
    } catch (err) {
      this.logger.warn(
        `Patient portal invite email to ${email} not sent: ${err instanceof Error ? err.message : err}`,
      );
    }

    return { ...invite, acceptUrl, emailSent };
  }

  private async loadValidInvite(rawToken: string) {
    const invite = await prisma.patientInvitation.findUnique({
      where: { tokenHash: hashToken(rawToken) },
      include: { practice: { select: { name: true } }, patient: { select: { firstName: true, lastName: true } } },
    });
    if (!invite || invite.status === 'revoked' || invite.status === 'accepted') {
      throw new NotFoundException('Invitation not found');
    }
    if (invite.expiresAt.getTime() <= this.nowMs()) {
      if (invite.status !== 'expired') {
        await prisma.patientInvitation.update({
          where: { id: invite.id },
          data: { status: 'expired' },
        });
      }
      throw new GoneException('This invitation has expired');
    }
    return invite;
  }

  /** Public: what the accept page shows before the patient sets a password. */
  async preview(rawToken: string) {
    const invite = await this.loadValidInvite(rawToken);
    return {
      email: invite.email,
      practiceName: invite.practice.name,
      patientName: `${invite.patient.firstName} ${invite.patient.lastName}`.trim(),
    };
  }

  /** Public: create the patient's credential, mark the invite accepted, start a session. */
  async accept(
    rawToken: string,
    dto: AcceptPatientInvitationDto,
    context: { ip?: string; userAgent?: string },
  ) {
    const invite = await this.loadValidInvite(rawToken);

    const existing = await prisma.patientCredential.findUnique({
      where: { email: invite.email },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('A portal account with this email already exists');
    }

    const passwordHash = await hashPassword(dto.password);

    const patientId = await prisma.$transaction(async (tx) => {
      await tx.patientCredential.create({
        data: {
          patientId: invite.patientId,
          practiceId: invite.practiceId,
          email: invite.email,
          passwordHash,
          passwordAlgo: 'bcrypt',
        },
      });

      const consumed = await tx.patientInvitation.updateMany({
        where: { id: invite.id, status: 'pending' },
        data: { status: 'accepted', acceptedAt: new Date() },
      });
      if (consumed.count !== 1) {
        throw new BadRequestException('Invitation is no longer valid');
      }

      return invite.patientId;
    });

    const { rawToken: sessionToken } = await this.sessions.createSession({
      patientId,
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return {
      sessionToken,
      patient: await this.toSafePrincipal(patientId),
    };
  }

  async login(
    dto: PatientLoginDto,
    context: { ip?: string; userAgent?: string },
  ): Promise<{ sessionToken: string; patient: SafePatientPrincipal }> {
    const email = dto.email.trim().toLowerCase();
    const credential = await prisma.patientCredential.findUnique({
      where: { email },
      select: {
        id: true,
        patientId: true,
        passwordHash: true,
        status: true,
        lockedUntil: true,
        failedLoginCount: true,
      },
    });

    if (!credential || credential.status !== 'active') {
      throw new UnauthorizedException(PATIENT_AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    if (credential.lockedUntil && credential.lockedUntil.getTime() > this.nowMs()) {
      throw new ForbiddenException(PATIENT_AUTH_ERRORS.ACCOUNT_LOCKED);
    }

    const valid = await verifyPassword(dto.password, credential.passwordHash);
    if (!valid) {
      const failed = await prisma.patientCredential.update({
        where: { id: credential.id },
        data: { failedLoginCount: { increment: 1 } },
        select: { failedLoginCount: true },
      });
      if (failed.failedLoginCount >= PATIENT_AUTH_LIMITS.LOGIN_ACCOUNT_MAX_ATTEMPTS) {
        await prisma.patientCredential.update({
          where: { id: credential.id },
          data: {
            failedLoginCount: 0,
            lockedUntil: new Date(this.nowMs() + PATIENT_AUTH_LIMITS.LOGIN_ACCOUNT_LOCK_MS),
          },
        });
      }
      throw new UnauthorizedException(PATIENT_AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    await prisma.patientCredential.update({
      where: { id: credential.id },
      data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    if (passwordNeedsRehash(credential.passwordHash)) {
      void hashPassword(dto.password)
        .then((newHash) =>
          prisma.patientCredential.update({
            where: { id: credential.id },
            data: { passwordHash: newHash },
          }),
        )
        .catch(() => undefined);
    }

    const { rawToken } = await this.sessions.createSession({
      patientId: credential.patientId,
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return { sessionToken: rawToken, patient: await this.toSafePrincipal(credential.patientId) };
  }

  async logout(sessionToken: string | undefined): Promise<void> {
    if (!sessionToken) return;
    await this.sessions.revokeSession(sessionToken, 'logout');
  }

  private async toSafePrincipal(patientId: string): Promise<SafePatientPrincipal> {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        practiceId: true,
        firstName: true,
        lastName: true,
        portalCredential: { select: { email: true } },
      },
    });
    if (!patient?.portalCredential) {
      throw new UnauthorizedException(PATIENT_AUTH_ERRORS.INVALID_CREDENTIALS);
    }
    return {
      id: patient.id,
      patientId: patient.id,
      practiceId: patient.practiceId,
      email: patient.portalCredential.email,
      firstName: patient.firstName,
      lastName: patient.lastName,
    };
  }

  async getSession(sessionToken: string | undefined): Promise<{ patient: SafePatientPrincipal } | null> {
    if (!sessionToken) return null;
    try {
      const session = await this.sessions.validateSession(sessionToken);
      return { patient: await this.toSafePrincipal(session.patientId) };
    } catch {
      return null;
    }
  }
}
