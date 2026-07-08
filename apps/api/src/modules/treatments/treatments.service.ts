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

  findAll(practiceId: string, filter: TreatmentFilter) {
    // Tenancy always from the session — override any client-supplied practiceId.
    return this.repo.findAll({ ...filter, practiceId });
  }

  async findById(practiceId: string, id: string) {
    const record = await this.repo.findById(id);
    if (!record || record.practiceId !== practiceId) {
      throw new NotFoundException(`Treatment ${id} not found`);
    }
    return record;
  }

  async create(practiceId: string, dto: CreateTreatmentDto, actorUserId?: string) {
    if (!dto.patientId) {
      throw new BadRequestException('patientId is required');
    }

    const record = await this.repo.create({
      practiceId,
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
        practiceId,
        patientId: dto.patientId,
        procedureCode: dto.procedureCode,
        status: record.status,
      },
    });

    return record;
  }

  async update(practiceId: string, id: string, dto: UpdateTreatmentDto, actorUserId?: string) {
    await this.findById(practiceId, id); // throws 404 if not found or cross-tenant

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

  async remove(practiceId: string, id: string, actorUserId?: string) {
    await this.findById(practiceId, id);
    await this.repo.remove(id);

    void this.audit.record({
      eventType: 'treatment_deleted',
      outcome: 'success',
      actorUserId,
      metadata: { treatmentId: id },
    });
  }
}
