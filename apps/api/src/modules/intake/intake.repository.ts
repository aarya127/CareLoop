import { Injectable } from '@nestjs/common';
import { prisma } from '../../config/database';
import type { IntakeDraftData } from './dto';

@Injectable()
export class IntakeRepository {
  readonly prisma = prisma;

  async createDraft(practiceId: string): Promise<any> {
    return this.prisma.intakeDraft.create({
      data: { practiceId, data: {} },
    });
  }

  async findDraftById(id: string): Promise<any> {
    return this.prisma.intakeDraft.findUnique({ where: { id } });
  }

  async updateDraft(id: string, data: IntakeDraftData): Promise<any> {
    return this.prisma.intakeDraft.update({
      where: { id },
      data: { data: data as object },
    });
  }

  async markSubmitted(id: string, patientId: string, idempotencyKey: string): Promise<any> {
    return this.prisma.intakeDraft.update({
      where: { id },
      data: {
        status: 'submitted',
        patientId,
        idempotencyKey,
        submittedAt: new Date(),
      },
    });
  }
}
