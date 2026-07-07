import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { IntakeRepository } from './intake.repository';
import { AuditService } from '../audit/audit.service';
import { PatientsService } from '../patients/patients.service';
import { InsuranceService } from '../insurance/insurance.service';
import { IdempotencyService } from '../../common/services/idempotency.service';
import { prisma } from '../../config/database';
import type {
  CreateDraftDto,
  UpdateDraftDto,
  IntakeDraftData,
  DemographicsData,
} from './dto';

@Injectable()
export class IntakeService {
  constructor(
    private readonly intakeRepository: IntakeRepository,
    private readonly auditService: AuditService,
    private readonly patientsService: PatientsService,
    private readonly insuranceService: InsuranceService,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  async createDraft(dto: CreateDraftDto, actorUserId?: string): Promise<any> {
    const draft = await this.intakeRepository.createDraft(dto.practiceId);

    void this.auditService.record({
      eventType: 'intake_draft_created',
      outcome: 'success',
      actorUserId,
      metadata: { draftId: draft.id, practiceId: dto.practiceId },
    });

    return draft;
  }

  async findDraft(id: string): Promise<any> {
    const draft = await this.intakeRepository.findDraftById(id);
    if (!draft) throw new NotFoundException(`IntakeDraft ${id} not found`);
    return draft;
  }

  async updateDraft(
    id: string,
    dto: UpdateDraftDto,
    actorUserId?: string,
  ): Promise<any> {
    const existing = await this.intakeRepository.findDraftById(id);
    if (!existing) throw new NotFoundException(`IntakeDraft ${id} not found`);
    if (existing.status === 'submitted') {
      throw new BadRequestException('Cannot update a submitted draft');
    }

    // Merge incoming section data with existing
    const current = (existing.data as IntakeDraftData) ?? {};
    const merged: IntakeDraftData = {
      ...current,
      ...(dto.demographics !== undefined ? { demographics: dto.demographics } : {}),
      ...(dto.emergencyContact !== undefined ? { emergencyContact: dto.emergencyContact } : {}),
      ...(dto.insurance !== undefined ? { insurance: dto.insurance } : {}),
      ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
    };

    const draft = await this.intakeRepository.updateDraft(id, merged);

    void this.auditService.record({
      eventType: 'intake_draft_updated',
      outcome: 'success',
      actorUserId,
      metadata: { draftId: id },
    });

    return draft;
  }

  async submitDraft(
    id: string,
    idempotencyKey: string,
    actorUserId?: string,
  ): Promise<any> {
    // 1. Idempotency check — return cached result on replay
    const cached = await this.idempotencyService.claim(idempotencyKey);
    if (cached) return cached.body;

    try {
      // 2. Load and validate the draft
      const draft = await this.intakeRepository.findDraftById(id);
      if (!draft) throw new NotFoundException(`IntakeDraft ${id} not found`);
      if (draft.status === 'submitted') {
        throw new ConflictException('Draft already submitted');
      }

      const data = (draft.data as IntakeDraftData) ?? {};
      this.validateDraftData(data);

      const { demographics, insurance } = data;

      // 3. Create the patient record. Tenancy comes from the draft's practiceId
      // (intake is a public, session-less flow), not from client input at submit.
      const patient = await this.patientsService.create(draft.practiceId, {
        firstName: demographics!.firstName,
        lastName: demographics!.lastName,
        dateOfBirth: demographics!.dateOfBirth,
        phone: demographics!.phone,
        patientType: 'new',
      });

      if (!patient) {
        throw new BadRequestException('Failed to create patient record');
      }

      // 4. Create insurance policy (when insurance section is complete)
      let insuranceRecord: any = null;
      if (insurance?.payerName && insurance?.memberId) {
        insuranceRecord = await this.insuranceService.create({
          patientId: patient.id,
          payerName: insurance.payerName,
          planName: insurance.planName,
          memberIdEnc: insurance.memberId,
          groupNumberEnc: insurance.groupNumber,
          coverageSummary: {},
        });
      }

      // 5. Create the intake submission record
      const submission = await prisma.intakeSubmission.create({
        data: {
          practiceId: draft.practiceId,
          patientId: patient.id,
          formType: 'new_patient',
          status: 'pending',
          data: draft.data as object,
        },
      });

      // 6. Mark draft as submitted
      await this.intakeRepository.markSubmitted(id, patient.id, idempotencyKey);

      const result = { patient, insurance: insuranceRecord, submission };

      // 7. Audit
      void this.auditService.record({
        eventType: 'intake_submitted',
        outcome: 'success',
        actorUserId,
        metadata: {
          draftId: id,
          patientId: patient.id,
          submissionId: submission.id,
        },
      });

      // 8. Persist idempotency result
      await this.idempotencyService.complete(idempotencyKey, 201, result);

      return result;
    } catch (err) {
      // Release key so the caller can retry on transient errors
      await this.idempotencyService.release(idempotencyKey);
      throw err;
    }
  }

  // ── Legacy shims kept for backward compat ──────────────────────────────────

  async create(dto: any): Promise<any> {
    return this.createDraft({
      practiceId: String(dto?.practiceId ?? 'demo-practice'),
    });
  }

  async findById(id: string): Promise<any> {
    return this.findDraft(id);
  }

  // ── Validation ─────────────────────────────────────────────────────────────

  private validateDraftData(data: IntakeDraftData): void {
    const d: DemographicsData = data.demographics ?? {};

    if (!d.firstName?.trim()) throw new BadRequestException('First name is required');
    if (!d.lastName?.trim()) throw new BadRequestException('Last name is required');
    if (!d.dateOfBirth) throw new BadRequestException('Date of birth is required');
    if (!d.email?.trim() && !d.phone?.trim()) {
      throw new BadRequestException('At least one of email or phone is required');
    }

    const ins = data.insurance;
    if (ins && (ins.payerName || ins.memberId)) {
      if (!ins.payerName?.trim()) {
        throw new BadRequestException('Insurance payer name is required');
      }
      if (!ins.memberId?.trim()) {
        throw new BadRequestException('Insurance member ID is required');
      }
    }
  }
}
