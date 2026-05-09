import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '../../config/database';

@Injectable()
export class RemindersService {
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

  async create(dto: {
    practiceId: string;
    patientId: string;
    appointmentId?: string;
    channel: string;
    type: string;
    scheduledAt: string | Date;
    metadata?: Record<string, unknown>;
  }) {
    return prisma.reminder.create({
      data: {
        practiceId: dto.practiceId,
        patientId: dto.patientId,
        appointmentId: dto.appointmentId,
        channel: dto.channel,
        type: dto.type,
        scheduledAt: new Date(dto.scheduledAt),
        metadata: (dto.metadata ?? {}) as any,
      },
    });
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
