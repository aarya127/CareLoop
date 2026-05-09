import { Injectable, NotFoundException } from '@nestjs/common';
import crypto from 'crypto';
import { prisma } from '../../config/database';

function hashMemberId(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

@Injectable()
export class InsuranceService {
  async findByPatientId(patientId: string) {
    return prisma.patientInsurance.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByMemberId(rawMemberId: string) {
    return prisma.patientInsurance.findMany({
      where: { memberIdHash: hashMemberId(rawMemberId) },
    });
  }

  async create(dto: {
    patientId: string;
    payerName: string;
    planName?: string;
    memberIdEnc: string;
    groupNumberEnc?: string;
    coverageSummary?: object;
  }) {
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

  async update(id: string, dto: {
    payerName?: string;
    planName?: string;
    memberIdEnc?: string;
    groupNumberEnc?: string;
    coverageSummary?: object;
    active?: boolean;
  }) {
    const existing = await prisma.patientInsurance.findUnique({ where: { id } });
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

  async remove(id: string) {
    const existing = await prisma.patientInsurance.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Insurance record ${id} not found`);
    await prisma.patientInsurance.delete({ where: { id } });
  }
}

