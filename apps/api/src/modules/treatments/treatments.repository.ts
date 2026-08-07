import { Injectable } from '@nestjs/common';
import { Prisma, prisma } from '@careloop/db';

export interface TreatmentFilter {
  practiceId?: string;
  patientId?: string;
  providerId?: string;
  appointmentId?: string;
  status?: string;
  from?: string;
  to?: string;
}

@Injectable()
export class TreatmentsRepository {
  findAll(filter: TreatmentFilter) {
    const where: Prisma.TreatmentRecordWhereInput = {};
    if (filter.practiceId) where.practiceId = filter.practiceId;
    if (filter.patientId) where.patientId = filter.patientId;
    if (filter.providerId) where.providerId = filter.providerId;
    if (filter.appointmentId) where.appointmentId = filter.appointmentId;
    if (filter.status) where.status = filter.status;
    if (filter.from || filter.to) {
      where.createdAt = {};
      if (filter.from) where.createdAt.gte = new Date(filter.from);
      if (filter.to) where.createdAt.lte = new Date(filter.to);
    }
    return prisma.treatmentRecord.findMany({
      where,
      include: { provider: { select: { id: true, name: true, specialty: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    return prisma.treatmentRecord.findUnique({
      where: { id },
      include: { provider: { select: { id: true, name: true, specialty: true } } },
    });
  }

  async findInvalidReferences(
    practiceId: string,
    patientId: string,
    refs: { appointmentId?: string; providerId?: string },
  ): Promise<string[]> {
    const [patient, appointment, provider] = await Promise.all([
      prisma.patient.findFirst({
        where: { id: patientId, practiceId },
        select: { id: true },
      }),
      refs.appointmentId
        ? prisma.appointment.findFirst({
            where: { id: refs.appointmentId, practiceId },
            select: { id: true, patientId: true },
          })
        : Promise.resolve(null),
      refs.providerId
        ? prisma.provider.findFirst({
            where: { id: refs.providerId, practiceId, isActive: true },
            select: { id: true },
          })
        : Promise.resolve({ id: 'not-requested' }),
    ]);

    return [
      ...(!patient ? ['patientId'] : []),
      ...(refs.appointmentId && !appointment ? ['appointmentId'] : []),
      ...(appointment?.patientId && appointment.patientId !== patientId
        ? ['appointmentId(patient mismatch)']
        : []),
      ...(!provider ? ['providerId'] : []),
    ];
  }

  create(data: Prisma.TreatmentRecordUncheckedCreateInput) {
    return prisma.treatmentRecord.create({ data });
  }

  update(id: string, data: Prisma.TreatmentRecordUncheckedUpdateInput) {
    return prisma.treatmentRecord.update({ where: { id }, data });
  }

  remove(id: string) {
    return prisma.treatmentRecord.delete({ where: { id } });
  }
}
