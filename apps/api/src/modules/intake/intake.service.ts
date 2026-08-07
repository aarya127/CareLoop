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
import type { CreateDraftDto, UpdateDraftDto, IntakeDraftData, DemographicsData } from './dto';
import { hashDraftToken, IntakeTokenService } from './intake-token.service';

@Injectable()
export class IntakeService {
  constructor(
    private readonly intakeRepository: IntakeRepository,
    private readonly auditService: AuditService,
    private readonly patientsService: PatientsService,
    private readonly insuranceService: InsuranceService,
    private readonly idempotencyService: IdempotencyService,
    private readonly intakeTokenService: IntakeTokenService,
  ) {}

  async createDraft(dto: CreateDraftDto, actorUserId?: string): Promise<any> {
    const capability = this.intakeTokenService.createDraftCapability();
    const draft = await this.intakeRepository.createDraft(
      dto.practiceId,
      capability.tokenHash,
      capability.expiresAt,
    );

    void this.auditService.record({
      practiceId: dto.practiceId,
      eventType: 'intake_draft_created',
      outcome: 'success',
      actorUserId,
      metadata: { draftId: draft.id, practiceId: dto.practiceId },
    });

    return { ...this.presentDraft(draft), accessToken: capability.accessToken };
  }

  async createDraftFromLink(linkToken: string): Promise<any> {
    const { practiceId } = this.intakeTokenService.verifyPracticeLink(linkToken);
    return this.createDraft({ practiceId });
  }

  createPracticeLink(practiceId: string) {
    const link = this.intakeTokenService.createPracticeLink(practiceId);
    const webUrl = (process.env.WEB_URL ?? 'http://localhost:3000').replace(/\/$/, '');
    return {
      ...link,
      url: `${webUrl}/intake/new?token=${encodeURIComponent(link.token)}`,
    };
  }

  async findDraft(id: string, accessToken: string): Promise<any> {
    const draft = await this.authorizedDraft(id, accessToken);
    if (!draft) throw new NotFoundException(`IntakeDraft ${id} not found`);
    if (draft.status === 'submitted') throw new NotFoundException(`IntakeDraft ${id} not found`);
    return this.presentDraft(draft);
  }

  async updateDraft(
    id: string,
    accessToken: string,
    dto: UpdateDraftDto,
    actorUserId?: string,
  ): Promise<any> {
    const existing = await this.authorizedDraft(id, accessToken);
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
      practiceId: existing.practiceId,
      eventType: 'intake_draft_updated',
      outcome: 'success',
      actorUserId,
      metadata: { draftId: id },
    });

    return this.presentDraft(draft);
  }

  async submitDraft(
    id: string,
    accessToken: string,
    idempotencyKey: string,
    actorUserId?: string,
  ): Promise<any> {
    // Authorize before claiming a key so anonymous callers cannot poison the
    // global idempotency store. Namespace the key to this draft.
    const authorized = await this.authorizedDraft(id, accessToken);
    if (!authorized) throw new NotFoundException(`IntakeDraft ${id} not found`);
    const scopedIdempotencyKey = `intake:${id}:${idempotencyKey}`;

    // 1. Idempotency check — return cached result on replay
    const cached = await this.idempotencyService.claim(scopedIdempotencyKey);
    if (cached) return cached.body;

    try {
      // 2. Load and validate the draft
      const draft = authorized;
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
        insuranceRecord = await this.insuranceService.create(draft.practiceId, {
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
      await this.intakeRepository.markSubmitted(id, patient.id, scopedIdempotencyKey);

      const result = { patient, insurance: insuranceRecord, submission };

      // 7. Audit
      void this.auditService.record({
        practiceId: draft.practiceId,
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
      await this.idempotencyService.complete(scopedIdempotencyKey, 201, result);

      return result;
    } catch (err) {
      // Release key so the caller can retry on transient errors
      await this.idempotencyService.release(scopedIdempotencyKey);
      throw err;
    }
  }

  async findById(practiceId: string, id: string): Promise<any> {
    const draft = await this.intakeRepository.findDraftByPractice(id, practiceId);
    if (!draft) throw new NotFoundException(`IntakeDraft ${id} not found`);
    return this.presentDraft(draft);
  }

  private authorizedDraft(id: string, accessToken: string) {
    if (!accessToken?.trim()) return null;
    return this.intakeRepository.findDraftByCapability(id, hashDraftToken(accessToken));
  }

  private presentDraft(draft: any): any {
    const { tokenHash: _tokenHash, ...safeDraft } = draft;
    return safeDraft;
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
