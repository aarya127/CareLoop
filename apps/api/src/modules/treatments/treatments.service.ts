import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TreatmentsRepository, TreatmentFilter } from './treatments.repository';
import { AuditService } from '../audit/audit.service';
import type { CreateTreatmentDto, UpdateTreatmentDto } from './dto';

@Injectable()
export class TreatmentsService {
  constructor(
    private readonly repo: TreatmentsRepository,
    private readonly audit: AuditService,
  ) {}

  findAll(filter: TreatmentFilter) {
    if (!filter.practiceId && !filter.patientId) {
      throw new BadRequestException('practiceId or patientId is required');
    }
    return this.repo.findAll(filter);
  }

  async findById(id: string) {
    const record = await this.repo.findById(id);
    if (!record) throw new NotFoundException(`Treatment ${id} not found`);
    return record;
  }

  async create(dto: CreateTreatmentDto, actorUserId?: string) {
    if (!dto.practiceId || !dto.patientId) {
      throw new BadRequestException('practiceId and patientId are required');
    }

    const record = await this.repo.create({
      practiceId: dto.practiceId,
      patientId: dto.patientId,
      appointmentId: dto.appointmentId,
      providerId: dto.providerId,
      procedureCode: dto.procedureCode,
      toothNumber: dto.toothNumber,
      surface: dto.surface,
      notes: dto.notes,
      status: dto.status ?? 'planned',
      // createdBy/updatedBy added via migration; cast avoids stale TS cache issue
      ...({ createdBy: actorUserId, updatedBy: actorUserId } as object),
    });

    void this.audit.record({
      eventType: 'treatment_created',
      outcome: 'success',
      actorUserId,
      metadata: {
        treatmentId: record.id,
        practiceId: dto.practiceId,
        patientId: dto.patientId,
        procedureCode: dto.procedureCode,
        status: record.status,
      },
    });

    return record;
  }

  async update(id: string, dto: UpdateTreatmentDto, actorUserId?: string) {
    await this.findById(id); // throws 404 if not found

    const completedAt =
      dto.status === 'completed' && dto.completedAt
        ? new Date(dto.completedAt)
        : dto.status === 'completed'
          ? new Date()
          : undefined;

    const record = await this.repo.update(id, {
      ...(dto.appointmentId !== undefined && { appointmentId: dto.appointmentId }),
      ...(dto.providerId !== undefined && { providerId: dto.providerId }),
      ...(dto.procedureCode !== undefined && { procedureCode: dto.procedureCode }),
      ...(dto.toothNumber !== undefined && { toothNumber: dto.toothNumber }),
      ...(dto.surface !== undefined && { surface: dto.surface }),
      ...(dto.notes !== undefined && { notes: dto.notes }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(completedAt && { completedAt }),
      ...({ updatedBy: actorUserId } as object),
    });

    void this.audit.record({
      eventType: 'treatment_updated',
      outcome: 'success',
      actorUserId,
      metadata: {
        treatmentId: id,
        changes: dto,
      },
    });

    return record;
  }

  async remove(id: string, actorUserId?: string) {
    await this.findById(id);
    await this.repo.remove(id);

    void this.audit.record({
      eventType: 'treatment_deleted',
      outcome: 'success',
      actorUserId,
      metadata: { treatmentId: id },
    });
  }
}
