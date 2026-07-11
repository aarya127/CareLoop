import { Injectable, NotFoundException } from '@nestjs/common';
import crypto from 'crypto';
import { prisma } from '../../config/database';
import { CoverageSummaryDto, remainingBenefitCents } from './dto';

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

  /**
   * Structured coverage for a patient's active insurance, with computed benefit
   * remaining. Scoped through the patient's practice.
   */
  async getCoverage(practiceId: string, patientId: string) {
    const record = await prisma.patientInsurance.findFirst({
      where: { patientId, active: true, patient: { practiceId } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        payerName: true,
        planName: true,
        coverageSummary: true,
        verifiedAt: true,
      },
    });
    if (!record) return { hasCoverage: false as const };

    const coverage = (record.coverageSummary ?? {}) as CoverageSummaryDto;
    return {
      hasCoverage: true as const,
      insuranceId: record.id,
      payerName: record.payerName,
      planName: record.planName,
      verifiedAt: record.verifiedAt,
      coverage,
      remainingBenefitCents: remainingBenefitCents(coverage),
    };
  }

  /** Set structured coverage and mark the record verified (front office). */
  async updateCoverage(practiceId: string, id: string, coverage: CoverageSummaryDto) {
    const existing = await prisma.patientInsurance.findFirst({
      where: { id, patient: { practiceId } },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException(`Insurance record ${id} not found`);

    return prisma.patientInsurance.update({
      where: { id },
      data: { coverageSummary: coverage as object, verifiedAt: new Date() },
      select: { id: true, coverageSummary: true, verifiedAt: true },
    });
  }
}
