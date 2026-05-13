import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '../../config/database';
import { enqueueAppointmentReminder } from '../../jobs/producers';
import { MessagingService } from '../messaging/messaging.service';

@Injectable()
export class RemindersService {
  constructor(private readonly messagingService: MessagingService) {}

  async findByPatientId(patientId: string) {
    return prisma.reminder.findMany({
      where: { patientId },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async findByAppointmentId(appointmentId: string) {
    return prisma.reminder.findMany({
      where: { appointmentId },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async findPending(practiceId: string) {
    const now = new Date();
    return prisma.reminder.findMany({
      where: {
        practiceId,
        status: 'pending',
        scheduledAt: { lte: now },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  /** History endpoint — filter by practiceId/patientId/channel/status */
  async getHistory(filter: {
    practiceId: string;
    patientId?: string;
    channel?: string;
    status?: string;
    from?: string;
    to?: string;
  }) {
    return prisma.reminder.findMany({
      where: {
        practiceId: filter.practiceId,
        ...(filter.patientId && { patientId: filter.patientId }),
        ...(filter.channel && { channel: filter.channel }),
        ...(filter.status && { status: filter.status }),
        ...(filter.from || filter.to
          ? {
              scheduledAt: {
                ...(filter.from && { gte: new Date(filter.from) }),
                ...(filter.to && { lte: new Date(filter.to) }),
              },
            }
          : {}),
      },
      orderBy: { scheduledAt: 'desc' },
      take: 200,
    });
  }

  async create(dto: {
    practiceId: string;
    patientId: string;
    appointmentId?: string;
    channel: string;
    type: string;
    scheduledAt: string | Date;
    to?: string;
    metadata?: Record<string, unknown>;
  }) {
    const scheduledAt = new Date(dto.scheduledAt);
    const reminder = await prisma.reminder.create({
      data: {
        practiceId: dto.practiceId,
        patientId: dto.patientId,
        appointmentId: dto.appointmentId,
        channel: dto.channel,
        type: dto.type,
        scheduledAt,
        metadata: (dto.metadata ?? {}) as any,
      },
    });

    // Enqueue with delay so worker fires at the right time
    if (dto.to) {
      const delayMs = Math.max(0, scheduledAt.getTime() - Date.now());
      await enqueueAppointmentReminder({
        appointmentId: dto.appointmentId ?? '',
        patientId: dto.patientId,
        practiceId: dto.practiceId,
        reminderId: reminder.id,
        channel: dto.channel as 'sms' | 'email',
        to: dto.to,
        reminderType: dto.channel as 'sms' | 'email',
        content: (dto.metadata as any)?.body ?? '',
      }, { delay: delayMs });
    }

    return reminder;
  }

  /**
   * Send a reminder immediately, regardless of scheduledAt.
   * Delegates to MessagingService which routes to Twilio or email.
   */
  async sendNow(id: string) {
    const reminder = await prisma.reminder.findUnique({ where: { id } });
    if (!reminder) throw new NotFoundException(`Reminder ${id} not found`);
    if (reminder.status === 'sent') return reminder; // already sent — idempotent

    const meta = (reminder.metadata ?? {}) as Record<string, unknown>;
    const to = (meta.to as string | undefined) ?? '';
    if (!to) throw new NotFoundException('Reminder has no destination address (metadata.to)');

    try {
      await this.messagingService.send({
        practiceId: reminder.practiceId,
        patientId: reminder.patientId,
        channel: reminder.channel as 'sms' | 'email',
        to,
        subject: meta.subject as string | undefined,
        body: (meta.body as string | undefined) ?? '',
        reminderId: id,
      });
      return prisma.reminder.findUnique({ where: { id } });
    } catch (err) {
      await prisma.reminder.update({
        where: { id },
        data: {
          status: 'failed',
          failReason: err instanceof Error ? err.message : String(err),
          retryCount: { increment: 1 },
        },
      });
      throw err;
    }
  }

  async markSent(id: string) {
    return prisma.reminder.update({
      where: { id },
      data: { status: 'sent', sentAt: new Date() },
    });
  }

  async cancel(id: string) {
    const reminder = await prisma.reminder.findUnique({ where: { id } });
    if (!reminder) throw new NotFoundException(`Reminder ${id} not found`);
    return prisma.reminder.update({
      where: { id },
      data: { status: 'cancelled' },
    });
  }
}
