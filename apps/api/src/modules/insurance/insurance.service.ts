import { Injectable, NotFoundException } from '@nestjs/common';
import crypto from 'crypto';
import { prisma } from '../../config/database';

function hashMemberId(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

/**
 * Insurance records have no practiceId column — tenancy is reached through the
 * owning Patient (`patient.practiceId`). Every query is scoped through that
 * relation so no practice can read or mutate another's insurance/PHI by id.
 */
@Injectable()
export class InsuranceService {
  async findByPatientId(practiceId: string, patientId: string) {
    return prisma.patientInsurance.findMany({
      where: { patientId, patient: { practiceId } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByMemberId(practiceId: string, rawMemberId: string) {
    return prisma.patientInsurance.findMany({
      where: { memberIdHash: hashMemberId(rawMemberId), patient: { practiceId } },
    });
  }

  async create(
    practiceId: string,
    dto: {
      patientId: string;
      payerName: string;
      planName?: string;
      memberIdEnc: string;
      groupNumberEnc?: string;
      coverageSummary?: object;
    },
  ) {
    // Confirm the target patient belongs to the caller's practice.
    const patient = await prisma.patient.findFirst({
      where: { id: dto.patientId, practiceId },
      select: { id: true },
    });
    if (!patient) throw new NotFoundException(`Patient ${dto.patientId} not found`);

    return prisma.patientInsurance.create({
      data: {
        patientId: dto.patientId,
        payerName: dto.payerName,
        planName: dto.planName,
        memberIdEnc: dto.memberIdEnc,
        memberIdHash: hashMemberId(dto.memberIdEnc),
        groupNumberEnc: dto.groupNumberEnc,
        coverageSummary: dto.coverageSummary ?? {},
      },
    });
  }

  async update(
    practiceId: string,
    id: string,
    dto: {
      payerName?: string;
      planName?: string;
      memberIdEnc?: string;
      groupNumberEnc?: string;
      coverageSummary?: object;
      active?: boolean;
    },
  ) {
    const existing = await prisma.patientInsurance.findFirst({
      where: { id, patient: { practiceId } },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException(`Insurance record ${id} not found`);

    return prisma.patientInsurance.update({
      where: { id },
      data: {
        ...dto,
        // Recompute hash whenever memberIdEnc changes
        ...(dto.memberIdEnc ? { memberIdHash: hashMemberId(dto.memberIdEnc) } : {}),
      },
    });
  }

  async remove(practiceId: string, id: string) {
    const existing = await prisma.patientInsurance.findFirst({
      where: { id, patient: { practiceId } },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException(`Insurance record ${id} not found`);
    await prisma.patientInsurance.delete({ where: { id } });
  }
}
