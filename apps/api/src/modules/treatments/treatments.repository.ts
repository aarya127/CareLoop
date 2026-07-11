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
