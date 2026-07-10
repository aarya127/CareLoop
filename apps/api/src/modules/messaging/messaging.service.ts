import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '../../config/database';
import { enqueueAppointmentReminder } from '../../jobs/producers';
import { TwilioService } from './twilio.service';
import { EmailService } from './email.service';
import type { SendMessageDto, ScheduleReminderDto, ConversationEntry } from './dto';

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);

  constructor(
    private readonly twilioService: TwilioService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Get message history for a patient (Reminder records in any terminal state).
   */
  async getConversation(practiceId: string, patientId: string): Promise<ConversationEntry[]> {
    const records = await prisma.reminder.findMany({
      where: { patientId, practiceId },
      orderBy: { scheduledAt: 'desc' },
      take: 100,
    });
    return records.map((r) => ({
      id: r.id,
      channel: r.channel,
      type: r.type,
      status: r.status,
      scheduledAt: r.scheduledAt.toISOString(),
      sentAt: r.sentAt?.toISOString() ?? null,
      metadata: r.metadata,
    }));
  }

  /**
   * Send a message immediately.
   * Updates the linked Reminder status if reminderId is provided.
   */
  async send(practiceId: string, dto: SendMessageDto): Promise<{ messageId: string }> {
    let messageId: string;

    if (dto.channel === 'sms') {
      messageId = await this.twilioService.sendSms(dto.to, dto.body);
    } else {
      messageId = await this.emailService.send({
        to: dto.to,
        subject: dto.subject ?? 'Message from CareLoop',
        html: dto.body,
      });
    }

    if (dto.reminderId) {
      // Scope the status update to this practice so a reminderId from another
      // tenant can't be flipped to "sent".
      await prisma.reminder
        .updateMany({
          where: { id: dto.reminderId, practiceId },
          data: { status: 'sent', sentAt: new Date() },
        })
        .catch((err) => this.logger.warn(`Failed to mark reminder sent: ${err}`));
    }

    return { messageId };
  }

  /**
   * Schedule a reminder: create the Reminder row and enqueue a BullMQ job.
   * The job fires at scheduledAt; the worker handles actual send.
   */
  async scheduleReminder(practiceId: string, dto: ScheduleReminderDto) {
    const scheduledAt = new Date(dto.scheduledAt);
    const delayMs = Math.max(0, scheduledAt.getTime() - Date.now());

    const reminder = await prisma.reminder.create({
      data: {
        practiceId,
        patientId: dto.patientId,
        appointmentId: dto.appointmentId,
        channel: dto.channel,
        type: dto.type,
        scheduledAt,
        metadata: (dto.metadata ?? {}) as any,
      },
    });

    await enqueueAppointmentReminder({
      appointmentId: dto.appointmentId ?? '',
      patientId: dto.patientId,
      practiceId,
      reminderId: reminder.id,
      channel: dto.channel,
      to: dto.to,
      reminderType: dto.channel, // backward compat
      content: dto.body,
    }, { delay: delayMs });

    this.logger.log(`Reminder ${reminder.id} scheduled for ${dto.scheduledAt} via ${dto.channel}`);
    return reminder;
  }
}
