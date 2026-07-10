import {
  BadRequestException,
  ConflictException,
  GoneException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { prisma } from '@careloop/db';
import { AuditService } from '../audit/audit.service';
import { SessionService } from '../auth/session.service';
import { EmailService } from '../messaging/email.service';
import { renderInvite } from '../messaging/templates';
import { hashPassword, hashToken, randomToken } from '../auth/auth.utils';
import type { AcceptInvitationDto, CreateInvitationDto } from './dto';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

@Injectable()
export class InvitationsService {
  private readonly logger = new Logger(InvitationsService.name);

  constructor(
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(SessionService) private readonly sessionService: SessionService,
    @Inject(EmailService) private readonly email: EmailService,
  ) {}

  private appBaseUrl(): string {
    return process.env.APP_BASE_URL ?? process.env.WEB_URL ?? 'http://localhost:3000';
  }

  /** Admin/manager invites someone to their practice. Returns the shareable accept link. */
  async create(practiceId: string, invitedByUserId: string, dto: CreateInvitationDto) {
    const email = dto.email.trim().toLowerCase();

    // If they already have an account, they should just log in — don't invite.
    const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    // Supersede any prior pending invite for this email in this practice.
    await prisma.invitation.updateMany({
      where: { practiceId, email, status: 'pending' },
      data: { status: 'revoked' },
    });

    const rawToken = randomToken();
    const invite = await prisma.invitation.create({
      data: {
        practiceId,
        email,
        role: dto.role,
        tokenHash: hashToken(rawToken),
        invitedByUserId,
        expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      },
      select: { id: true, email: true, role: true, status: true, expiresAt: true },
    });

    const acceptUrl = `${this.appBaseUrl()}/join/${rawToken}`;

    // Best-effort email delivery — the invite stands even if SMTP is unset/down;
    // the caller still gets the shareable link back.
    let emailSent = false;
    try {
      const practice = await prisma.practice.findUnique({
        where: { id: practiceId },
        select: { name: true },
      });
      const msg = renderInvite({
        practiceName: practice?.name ?? 'your dental practice',
        role: dto.role,
        acceptUrl,
      });
      await this.email.send({ to: email, subject: msg.subject, html: msg.html, text: msg.text });
      emailSent = true;
    } catch (err) {
      this.logger.warn(`Invite email to ${email} not sent: ${err instanceof Error ? err.message : err}`);
    }

    void this.audit.record({
      eventType: 'invitation_created',
      outcome: 'success',
      actorUserId: invitedByUserId,
      metadata: { invitationId: invite.id, email, role: dto.role, practiceId, emailSent },
    });

    // The raw token is returned exactly once (never stored) so the caller can
    // share the link directly too.
    return { ...invite, acceptUrl, emailSent };
  }

  async list(practiceId: string) {
    return prisma.invitation.findMany({
      where: { practiceId, status: 'pending' },
      select: { id: true, email: true, role: true, status: true, expiresAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revoke(practiceId: string, id: string) {
    const invite = await prisma.invitation.findFirst({
      where: { id, practiceId },
      select: { id: true, status: true },
    });
    if (!invite) throw new NotFoundException(`Invitation ${id} not found`);
    if (invite.status === 'pending') {
      await prisma.invitation.update({ where: { id }, data: { status: 'revoked' } });
    }
    return { id, status: 'revoked' };
  }

  /** Load a valid pending invite by its raw token. Marks expired invites as such. */
  private async loadValidInvite(rawToken: string) {
    const invite = await prisma.invitation.findUnique({
      where: { tokenHash: hashToken(rawToken) },
      include: { practice: { select: { name: true } } },
    });
    if (!invite || invite.status === 'revoked' || invite.status === 'accepted') {
      throw new NotFoundException('Invitation not found');
    }
    if (invite.expiresAt.getTime() <= Date.now()) {
      if (invite.status !== 'expired') {
        await prisma.invitation.update({ where: { id: invite.id }, data: { status: 'expired' } });
      }
      throw new GoneException('This invitation has expired');
    }
    return invite;
  }

  /** Public: what the accept page shows before the user sets a password. */
  async preview(rawToken: string) {
    const invite = await this.loadValidInvite(rawToken);
    return { email: invite.email, role: invite.role, practiceName: invite.practice.name };
  }

  /** Public: create the invited user, mark the invite accepted, and start a session. */
  async accept(
    rawToken: string,
    dto: AcceptInvitationDto,
    context: { ip?: string; userAgent?: string },
  ) {
    const invite = await this.loadValidInvite(rawToken);

    // Guard against a race where the email got registered after the invite.
    const existing = await prisma.user.findUnique({ where: { email: invite.email }, select: { id: true } });
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const passwordHash = await hashPassword(dto.password);

    const userId = await prisma.$transaction(async (tx) => {
      const role = await tx.role.upsert({
        where: { name: invite.role },
        update: {},
        create: { name: invite.role, description: `${invite.role} role` },
        select: { id: true },
      });

      const user = await tx.user.create({
        data: {
          email: invite.email,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          passwordHash,
          passwordAlgo: 'bcrypt',
          practiceId: invite.practiceId,
          status: 'active',
        },
        select: { id: true },
      });

      await tx.userRole.create({ data: { userId: user.id, roleId: role.id } });

      // Consume the invite atomically — a second accept with the same token
      // will fail loadValidInvite (status = accepted).
      const consumed = await tx.invitation.updateMany({
        where: { id: invite.id, status: 'pending' },
        data: { status: 'accepted', acceptedAt: new Date(), acceptedUserId: user.id },
      });
      if (consumed.count !== 1) {
        throw new BadRequestException('Invitation is no longer valid');
      }

      return user.id;
    });

    const { rawToken: sessionToken, sessionId } = await this.sessionService.createSession({
      userId,
      ip: context.ip,
      userAgent: context.userAgent,
    });

    void this.audit.record({
      eventType: 'invitation_accepted',
      outcome: 'success',
      actorUserId: userId,
      targetUserId: userId,
      sessionId,
      metadata: { invitationId: invite.id, practiceId: invite.practiceId, role: invite.role },
    });

    return {
      sessionToken,
      user: {
        id: userId,
        email: invite.email,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        roles: [invite.role],
      },
    };
  }
}
