import { Injectable } from '@nestjs/common';
import { Prisma, prisma } from '@careloop/db';

@Injectable()
export class AppointmentsRepository {
  // ── Appointment CRUD ──────────────────────────────────────────────────────

  async findById(id: string) {
    return prisma.appointment.findUnique({ where: { id } });
  }

  async findAll(query: {
    practiceId: string;
    providerId?: string;
    patientId?: string;
    from?: Date;
    to?: Date;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: Prisma.AppointmentWhereInput = {
      practiceId: query.practiceId,
    };
    if (query.providerId) where.providerId = query.providerId;
    if (query.patientId) where.patientId = query.patientId;
    if (query.status) where.status = query.status;
    if (query.from || query.to) {
      where.start = {
        ...(query.from ? { gte: query.from } : {}),
        ...(query.to ? { lte: query.to } : {}),
      };
    }
    return prisma.appointment.findMany({
      where,
      orderBy: { start: 'asc' },
      take: query.limit ?? 200,
      skip: query.offset ?? 0,
    });
  }

  async create(data: Prisma.AppointmentUncheckedCreateInput) {
    return prisma.appointment.create({ data });
  }

  async update(id: string, data: Prisma.AppointmentUncheckedUpdateInput) {
    return prisma.appointment.update({ where: { id }, data });
  }

  // ── Conflict detection ────────────────────────────────────────────────────

  /** Returns appointments for providerId that overlap [start, end), excluding excludeId. */
  async findConflicting(providerId: string, start: Date, end: Date, excludeId?: string) {
    return prisma.appointment.findMany({
      where: {
        providerId,
        status: { not: 'cancelled' },
        ...(excludeId ? { id: { not: excludeId } } : {}),
        AND: [{ start: { lt: end } }, { end: { gt: start } }],
      },
    });
  }

  // ── Availability data ────────────────────────────────────────────────────

  async findSchedule(
    practiceId: string,
    providerId: string,
    dayOfWeek: number,
    dayStart: Date,
    dayEnd: Date,
  ) {
    return prisma.providerSchedule.findMany({
      where: {
        practiceId,
        providerId,
        dayOfWeek,
        isActive: true,
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: dayStart } }],
        AND: [
          {
            OR: [{ effectiveFrom: null }, { effectiveFrom: { lt: dayEnd } }],
          },
        ],
      },
    });
  }

  async findBlocks(practiceId: string, providerId: string, start: Date, end: Date) {
    return prisma.availabilityBlock.findMany({
      where: {
        practiceId,
        providerId,
        isActive: true,
        AND: [{ start: { lt: end } }, { end: { gt: start } }],
      },
    });
  }

  async findHolds(practiceId: string, providerId: string, start: Date, end: Date) {
    return prisma.appointmentHold.findMany({
      where: {
        practiceId,
        providerId,
        expiresAt: { gt: new Date() },
        AND: [{ start: { lt: end } }, { end: { gt: start } }],
      },
    });
  }

  async findAppointmentsForDay(
    practiceId: string,
    providerId: string,
    dayStart: Date,
    dayEnd: Date,
  ) {
    return prisma.appointment.findMany({
      where: {
        practiceId,
        providerId,
        status: { not: 'cancelled' },
        AND: [{ start: { lt: dayEnd } }, { end: { gt: dayStart } }],
      },
      orderBy: { start: 'asc' },
    });
  }

  async findPracticeTimeZone(practiceId: string): Promise<string | null> {
    const practice = await prisma.practice.findUnique({
      where: { id: practiceId },
      select: { timeZone: true },
    });
    return practice?.timeZone ?? null;
  }
}
