import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import crypto from 'crypto';
import { prisma } from '../../config/database';
import type { IntakeDraftData } from './dto';
import { encryptSensitiveField } from '../../common/security/field-encryption';

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

  async submitDraft(
    id: string,
    practiceId: string,
    data: IntakeDraftData,
    dateOfBirth: Date,
    idempotencyKey: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRawUnsafe<
        Array<{ id: string; practiceId: string; status: string }>
      >(`SELECT "id", "practiceId", "status" FROM "IntakeDraft" WHERE "id" = $1 FOR UPDATE`, id);
      const lockedDraft = rows[0];
      if (!lockedDraft || lockedDraft.practiceId !== practiceId) {
        throw new NotFoundException(`IntakeDraft ${id} not found`);
      }
      if (lockedDraft.status !== 'draft') {
        throw new ConflictException('Draft already submitted');
      }

      const demographics = data.demographics!;
      const emergencyContact = data.emergencyContact;
      const insurance = data.insurance;
      const patient = await tx.patient.create({
        data: {
          practiceId,
          firstName: demographics.firstName!.trim(),
          lastName: demographics.lastName!.trim(),
          dateOfBirth,
          phoneE164: demographics.phone?.trim() || null,
          patientType: 'new',
          emergencyContactName: emergencyContact?.name?.trim() || null,
          emergencyContactRelationship: emergencyContact?.relationship?.trim() || null,
          emergencyContactPhone: emergencyContact?.phone?.trim() || null,
        },
      });

      const insuranceRecord =
        insurance?.payerName && insurance.memberId
          ? await tx.patientInsurance.create({
              data: {
                patientId: patient.id,
                payerName: insurance.payerName.trim(),
                planName: insurance.planName?.trim() || null,
                memberIdEnc: encryptSensitiveField(insurance.memberId),
                memberIdHash: crypto.createHash('sha256').update(insurance.memberId).digest('hex'),
                groupNumberEnc: insurance.groupNumber
                  ? encryptSensitiveField(insurance.groupNumber)
                  : undefined,
                coverageSummary: {},
              },
            })
          : null;

      const submission = await tx.intakeSubmission.create({
        data: {
          practiceId,
          patientId: patient.id,
          formType: 'new_patient',
          status: 'pending',
          data: data as object,
        },
      });

      await tx.intakeDraft.update({
        where: { id },
        data: {
          status: 'submitted',
          patientId: patient.id,
          idempotencyKey,
          submittedAt: new Date(),
        },
      });

      return { patient, insurance: insuranceRecord, submission };
    });
  }
}
