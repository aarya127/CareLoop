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

  /**
   * Serialize bookings for one practice/provider with a transaction-scoped
   * PostgreSQL advisory lock. The conflict read and insert then form one atomic
   * decision, preventing two concurrent requests from both booking the slot.
   */
  async createIfAvailable(data: Prisma.AppointmentUncheckedCreateInput) {
    return prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${data.practiceId}), hashtext(${data.providerId}))`;
      const conflict = await tx.appointment.findFirst({
        where: {
          practiceId: data.practiceId,
          providerId: data.providerId,
          status: { not: 'cancelled' },
          AND: [{ start: { lt: data.end } }, { end: { gt: data.start } }],
        },
        select: { id: true },
      });
      if (conflict) return null;
      return tx.appointment.create({ data });
    });
  }

  async rescheduleIfAvailable(
    practiceId: string,
    id: string,
    providerId: string,
    start: Date,
    end: Date,
    data: Prisma.AppointmentUncheckedUpdateInput,
  ) {
    return prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${practiceId}), hashtext(${providerId}))`;
      const conflict = await tx.appointment.findFirst({
        where: {
          practiceId,
          providerId,
          id: { not: id },
          status: { not: 'cancelled' },
          AND: [{ start: { lt: end } }, { end: { gt: start } }],
        },
        select: { id: true },
      });
      if (conflict) return null;
      return tx.appointment.update({ where: { id }, data });
    });
  }

  async findInvalidReferences(
    practiceId: string,
    refs: { userId: string; providerId: string; patientId?: string; roomId?: string },
  ): Promise<string[]> {
    const [user, provider, patient, room] = await Promise.all([
      prisma.user.findFirst({
        where: { id: refs.userId, practiceId, status: 'active', deletedAt: null },
        select: { id: true },
      }),
      prisma.provider.findFirst({
        where: { id: refs.providerId, practiceId, isActive: true },
        select: { id: true },
      }),
      refs.patientId
        ? prisma.patient.findFirst({
            where: { id: refs.patientId, practiceId },
            select: { id: true },
          })
        : Promise.resolve({ id: 'not-requested' }),
      refs.roomId
        ? prisma.room.findFirst({
            where: { id: refs.roomId, practiceId, isActive: true },
            select: { id: true },
          })
        : Promise.resolve({ id: 'not-requested' }),
    ]);

    return [
      ...(!user ? ['userId'] : []),
      ...(!provider ? ['providerId'] : []),
      ...(!patient ? ['patientId'] : []),
      ...(!room ? ['roomId'] : []),
    ];
  }

  // ── Conflict detection ────────────────────────────────────────────────────

  /** Returns appointments for providerId that overlap [start, end), excluding excludeId. */
  async findConflicting(
    practiceId: string,
    providerId: string,
    start: Date,
    end: Date,
    excludeId?: string,
  ) {
    return prisma.appointment.findMany({
      where: {
        practiceId,
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
