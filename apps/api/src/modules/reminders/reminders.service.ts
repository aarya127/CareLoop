import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '../../config/database';
import { enqueueAppointmentReminder } from '../../jobs/producers';
import { MessagingService } from '../messaging/messaging.service';
import { renderReminder } from '../messaging/templates';
import { CreateReminderDto, ReminderHistoryQueryDto } from './dto';

@Injectable()
export class RemindersService {
  constructor(private readonly messagingService: MessagingService) {}

  /** Load a reminder scoped to the caller's practice, or 404. */
  private async getOwnedReminder(practiceId: string, id: string) {
    const reminder = await prisma.reminder.findFirst({ where: { id, practiceId } });
    if (!reminder) throw new NotFoundException(`Reminder ${id} not found`);
    return reminder;
  }

  async findByPatientId(practiceId: string, patientId: string) {
    return prisma.reminder.findMany({
      where: { patientId, practiceId },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async findByAppointmentId(practiceId: string, appointmentId: string) {
    return prisma.reminder.findMany({
      where: { appointmentId, practiceId },
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

  /** History / delivery-status endpoint. practiceId is always the caller's. */
  async getHistory(practiceId: string, filter: ReminderHistoryQueryDto) {
    return prisma.reminder.findMany({
      where: {
        practiceId,
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
      take: filter.limit,
      skip: filter.offset,
    });
  }

  async create(practiceId: string, dto: CreateReminderDto) {
    const scheduledAt = new Date(dto.scheduledAt);
    const [patient, appointment] = await Promise.all([
      prisma.patient.findFirst({
        where: { id: dto.patientId, practiceId },
        select: { id: true },
      }),
      dto.appointmentId
        ? prisma.appointment.findFirst({
            where: { id: dto.appointmentId, patientId: dto.patientId, practiceId },
            select: { id: true },
          })
        : Promise.resolve({ id: 'not-requested' }),
    ]);
    if (!patient) throw new NotFoundException(`Patient ${dto.patientId} not found`);
    if (!appointment) throw new BadRequestException('Appointment is not valid for this patient');

    const validDestination =
      dto.channel === 'email'
        ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dto.to)
        : /^\+[1-9]\d{7,14}$/.test(dto.to);
    if (!validDestination) throw new BadRequestException(`Invalid ${dto.channel} destination`);

    const meta: Record<string, unknown> = { ...(dto.metadata ?? {}), to: dto.to };

    // Templated content: if the caller didn't hand-build a body, render one from
    // the reminder type + structured inputs so every reminder has real content.
    if (!meta.body) {
      const practice = await prisma.practice.findUnique({
        where: { id: practiceId },
        select: { name: true, timeZone: true },
      });
      const rendered = renderReminder(dto.type, {
        patientName: meta.patientName as string | undefined,
        practiceName: practice?.name ?? 'your dental practice',
        startsAt: meta.startsAt ? new Date(meta.startsAt as string) : scheduledAt,
        timeZone: practice?.timeZone,
        amountDueCents: meta.amountDueCents as number | undefined,
      });
      meta.subject = meta.subject ?? rendered.subject;
      meta.body = dto.channel === 'email' ? rendered.html : rendered.text;
    }

    const reminder = await prisma.reminder.create({
      data: {
        practiceId,
        patientId: dto.patientId,
        appointmentId: dto.appointmentId,
        channel: dto.channel,
        type: dto.type,
        scheduledAt,
        metadata: meta as any,
      },
    });

    // Enqueue with delay so worker fires at the right time
    const delayMs = Math.max(0, scheduledAt.getTime() - Date.now());
    await enqueueAppointmentReminder(
      {
        appointmentId: dto.appointmentId ?? '',
        patientId: dto.patientId,
        practiceId,
        reminderId: reminder.id,
        channel: dto.channel,
        to: dto.to,
        reminderType: dto.channel,
        content: (meta.body as string) ?? '',
      },
      { delay: delayMs, jobId: `reminder:${reminder.id}` },
    );

    return reminder;
  }

  /**
   * Send a reminder immediately, regardless of scheduledAt.
   * Delegates to MessagingService which routes to Twilio or email.
   */
  async sendNow(practiceId: string, id: string) {
    const reminder = await this.getOwnedReminder(practiceId, id);
    if (reminder.status === 'sent') return reminder; // already sent — idempotent

    const meta = (reminder.metadata ?? {}) as Record<string, unknown>;
    const to = (meta.to as string | undefined) ?? '';
    if (!to) throw new NotFoundException('Reminder has no destination address (metadata.to)');

    try {
      await this.messagingService.send(practiceId, {
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

  async markSent(practiceId: string, id: string) {
    await this.getOwnedReminder(practiceId, id);
    return prisma.reminder.update({
      where: { id },
      data: { status: 'sent', sentAt: new Date() },
    });
  }

  async cancel(practiceId: string, id: string) {
    await this.getOwnedReminder(practiceId, id);
    return prisma.reminder.update({
      where: { id },
      data: { status: 'cancelled' },
    });
  }
}
