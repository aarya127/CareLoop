import { Injectable } from '@nestjs/common';
import { prisma } from '../../config/database';
import type { IntakeDraftData } from './dto';

@Injectable()
export class IntakeRepository {
  readonly prisma = prisma;

  async createDraft(practiceId: string, tokenHash: string, expiresAt: Date): Promise<any> {
    return this.prisma.intakeDraft.create({
      data: { practiceId, tokenHash, expiresAt, data: {} },
    });
  }

  async findDraftByCapability(id: string, tokenHash: string): Promise<any> {
    return this.prisma.intakeDraft.findFirst({
      where: { id, tokenHash, expiresAt: { gt: new Date() } },
    });
  }

  async findDraftByPractice(id: string, practiceId: string): Promise<any> {
    return this.prisma.intakeDraft.findFirst({ where: { id, practiceId } });
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
