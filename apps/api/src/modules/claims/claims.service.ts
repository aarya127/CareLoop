import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@careloop/db';
import type { CreateClaimDto, UpdateClaimStatusDto } from './dto';

const TERMINAL = new Set(['paid', 'rejected', 'void']);

@Injectable()
export class ClaimsService {
  private async getOwnedClaim(practiceId: string, id: string) {
    const claim = await prisma.claim.findFirst({
      where: { id, practiceId },
      include: { lines: true, events: { orderBy: { createdAt: 'asc' } } },
    });
    if (!claim) throw new NotFoundException(`Claim ${id} not found`);
    return claim;
  }

  async create(practiceId: string, actorUserId: string, dto: CreateClaimDto) {
    // Confirm the patient belongs to the caller's practice.
    const patient = await prisma.patient.findFirst({
      where: { id: dto.patientId, practiceId },
      select: { id: true },
    });
    if (!patient) throw new NotFoundException(`Patient ${dto.patientId} not found`);

    if (!dto.lines?.length) {
      throw new BadRequestException('A claim needs at least one line item');
    }
    const totalChargedCents = dto.lines.reduce((sum, l) => sum + (l.chargedCents ?? 0), 0);

    return prisma.$transaction(async (tx) => {
      const claim = await tx.claim.create({
        data: {
          practiceId,
          patientId: dto.patientId,
          insuranceId: dto.insuranceId,
          treatmentId: dto.treatmentId,
          invoiceId: dto.invoiceId,
          status: 'draft',
          totalChargedCents,
          notes: dto.notes,
          createdBy: actorUserId,
          lines: {
            create: dto.lines.map((l) => ({
              procedureCode: l.procedureCode,
              description: l.description,
              toothNumber: l.toothNumber,
              chargedCents: l.chargedCents,
            })),
          },
          events: { create: { status: 'draft', actorUserId } },
        },
        include: { lines: true, events: true },
      });
      return claim;
    });
  }

  async list(practiceId: string, filter: { patientId?: string; status?: string }) {
    return prisma.claim.findMany({
      where: {
        practiceId,
        ...(filter.patientId && { patientId: filter.patientId }),
        ...(filter.status && { status: filter.status }),
      },
      include: { lines: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async get(practiceId: string, id: string) {
    return this.getOwnedClaim(practiceId, id);
  }

  /** draft → submitted. Records a status event. */
  async submit(practiceId: string, id: string, actorUserId: string) {
    const claim = await this.getOwnedClaim(practiceId, id);
    if (claim.status !== 'draft') {
      throw new BadRequestException(`Only draft claims can be submitted (current: ${claim.status})`);
    }
    return prisma.$transaction(async (tx) => {
      await tx.claimStatusEvent.create({ data: { claimId: id, status: 'submitted', actorUserId } });
      return tx.claim.update({
        where: { id },
        data: { status: 'submitted', submittedAt: new Date() },
        include: { lines: true, events: { orderBy: { createdAt: 'asc' } } },
      });
    });
  }

  /** Record an adjudication outcome (accepted/rejected/paid/void) with a code + trail. */
  async updateStatus(practiceId: string, id: string, actorUserId: string, dto: UpdateClaimStatusDto) {
    const claim = await this.getOwnedClaim(practiceId, id);

    if (claim.status === 'draft' && dto.status !== 'void') {
      throw new BadRequestException('Submit the claim before recording an adjudication outcome');
    }
    if (TERMINAL.has(claim.status)) {
      throw new BadRequestException(`Claim is already ${claim.status} and cannot change`);
    }

    const resolved = TERMINAL.has(dto.status);
    return prisma.$transaction(async (tx) => {
      await tx.claimStatusEvent.create({
        data: { claimId: id, status: dto.status, code: dto.code, note: dto.note, actorUserId },
      });
      return tx.claim.update({
        where: { id },
        data: {
          status: dto.status,
          rejectionCode: dto.status === 'rejected' ? (dto.code ?? null) : null,
          approvedAmountCents: dto.approvedAmountCents ?? claim.approvedAmountCents,
          resolvedAt: resolved ? new Date() : null,
        },
        include: { lines: true, events: { orderBy: { createdAt: 'asc' } } },
      });
    });
  }
}
