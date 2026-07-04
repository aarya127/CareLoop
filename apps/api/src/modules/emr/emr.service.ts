import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, prisma } from '@careloop/db';
import { AuditService } from '../audit/audit.service';
import { IdempotencyService } from '../../common/services/idempotency.service';
import type {
  CreateAllergyDto,
  CreateConditionDto,
  CreateEncounterDto,
  CreateMedicationDto,
  CreatePeriodontalExamDto,
  EmrActor,
  UpdateAllergyDto,
  UpdateConditionDto,
  UpdateEncounterDto,
  UpdateMedicationDto,
  UpsertToothChartEntryDto,
} from './dto';

/**
 * EMR service — first-class clinical records. Tenancy (practiceId) and the
 * acting clinician are always taken from the authenticated session, never from
 * client input. Every write is audited.
 */
@Injectable()
export class EmrService {
  // Explicit @Inject tokens — the tsx/esbuild dev runtime drops design:paramtypes
  // metadata, so plain constructor injection resolves to undefined.
  constructor(
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(IdempotencyService) private readonly idempotency: IdempotencyService,
  ) {}

  // ── tenancy helpers ──────────────────────────────────────────────────────
  private async assertPatientInPractice(actor: EmrActor, patientId: string) {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true, practiceId: true },
    });
    if (!patient) throw new NotFoundException(`Patient ${patientId} not found`);
    if (patient.practiceId !== actor.practiceId) {
      throw new ForbiddenException('Patient belongs to a different practice');
    }
  }

  private assertSamePractice(actor: EmrActor, record: { practiceId: string } | null, label: string) {
    if (!record) throw new NotFoundException(`${label} not found`);
    if (record.practiceId !== actor.practiceId) {
      throw new ForbiddenException(`${label} belongs to a different practice`);
    }
  }

  private audify(eventType: string, actor: EmrActor, metadata: Record<string, unknown>) {
    void this.audit.record({ eventType, outcome: 'success', actorUserId: actor.id, metadata });
  }

  // ── Encounters ───────────────────────────────────────────────────────────
  async listEncounters(actor: EmrActor, patientId: string) {
    await this.assertPatientInPractice(actor, patientId);
    return prisma.encounter.findMany({
      where: { practiceId: actor.practiceId, patientId },
      orderBy: { encounterDate: 'desc' },
    });
  }

  async createEncounter(
    actor: EmrActor,
    patientId: string,
    dto: CreateEncounterDto,
    idempotencyKey?: string,
  ) {
    await this.assertPatientInPractice(actor, patientId);

    if (idempotencyKey) {
      const cached = await this.idempotency.claim(idempotencyKey);
      if (cached) return cached.body;
    }

    const encounter = await prisma.encounter.create({
      data: {
        practiceId: actor.practiceId,
        patientId,
        authorId: actor.id,
        type: dto.type ?? 'exam',
        encounterDate: dto.encounterDate ? new Date(dto.encounterDate) : new Date(),
        appointmentId: dto.appointmentId,
        providerId: dto.providerId,
        chiefComplaint: dto.chiefComplaint,
        subjective: dto.subjective,
        objective: dto.objective,
        assessment: dto.assessment,
        plan: dto.plan,
        status: 'draft',
      },
    });

    this.audify('encounter_created', actor, { encounterId: encounter.id, patientId });
    if (idempotencyKey) await this.idempotency.complete(idempotencyKey, 201, encounter);
    return encounter;
  }

  async getEncounter(actor: EmrActor, id: string) {
    const encounter = await prisma.encounter.findUnique({ where: { id } });
    this.assertSamePractice(actor, encounter, 'Encounter');
    return encounter;
  }

  async updateEncounter(actor: EmrActor, id: string, dto: UpdateEncounterDto) {
    const existing = await prisma.encounter.findUnique({ where: { id } });
    this.assertSamePractice(actor, existing, 'Encounter');
    if (existing!.status !== 'draft') {
      throw new BadRequestException('A signed encounter is immutable; create an amendment instead');
    }
    const encounter = await prisma.encounter.update({
      where: { id },
      data: {
        type: dto.type,
        encounterDate: dto.encounterDate ? new Date(dto.encounterDate) : undefined,
        appointmentId: dto.appointmentId,
        providerId: dto.providerId,
        chiefComplaint: dto.chiefComplaint,
        subjective: dto.subjective,
        objective: dto.objective,
        assessment: dto.assessment,
        plan: dto.plan,
      },
    });
    this.audify('encounter_updated', actor, { encounterId: id });
    return encounter;
  }

  async signEncounter(actor: EmrActor, id: string) {
    const existing = await prisma.encounter.findUnique({ where: { id } });
    this.assertSamePractice(actor, existing, 'Encounter');
    if (existing!.status === 'signed') return existing;
    const encounter = await prisma.encounter.update({
      where: { id },
      data: { status: 'signed', signedAt: new Date(), signedBy: actor.id },
    });
    this.audify('encounter_signed', actor, { encounterId: id });
    return encounter;
  }

  // ── Allergies ────────────────────────────────────────────────────────────
  async listAllergies(actor: EmrActor, patientId: string) {
    await this.assertPatientInPractice(actor, patientId);
    return prisma.allergy.findMany({
      where: { practiceId: actor.practiceId, patientId },
      orderBy: { notedAt: 'desc' },
    });
  }

  async createAllergy(actor: EmrActor, patientId: string, dto: CreateAllergyDto) {
    await this.assertPatientInPractice(actor, patientId);
    const allergy = await prisma.allergy.create({
      data: {
        practiceId: actor.practiceId,
        patientId,
        allergen: dto.allergen,
        severity: dto.severity ?? 'moderate',
        reaction: dto.reaction,
        status: dto.status ?? 'active',
        recordedBy: actor.id,
      },
    });
    this.audify('allergy_created', actor, { allergyId: allergy.id, patientId });
    return allergy;
  }

  async updateAllergy(actor: EmrActor, id: string, dto: UpdateAllergyDto) {
    const existing = await prisma.allergy.findUnique({ where: { id } });
    this.assertSamePractice(actor, existing, 'Allergy');
    const allergy = await prisma.allergy.update({ where: { id }, data: dto });
    this.audify('allergy_updated', actor, { allergyId: id });
    return allergy;
  }

  async deleteAllergy(actor: EmrActor, id: string) {
    const existing = await prisma.allergy.findUnique({ where: { id } });
    this.assertSamePractice(actor, existing, 'Allergy');
    await prisma.allergy.delete({ where: { id } });
    this.audify('allergy_deleted', actor, { allergyId: id });
  }

  // ── Medications ──────────────────────────────────────────────────────────
  async listMedications(actor: EmrActor, patientId: string) {
    await this.assertPatientInPractice(actor, patientId);
    return prisma.medication.findMany({
      where: { practiceId: actor.practiceId, patientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createMedication(actor: EmrActor, patientId: string, dto: CreateMedicationDto) {
    await this.assertPatientInPractice(actor, patientId);
    const medication = await prisma.medication.create({
      data: {
        practiceId: actor.practiceId,
        patientId,
        name: dto.name,
        dosage: dto.dosage,
        frequency: dto.frequency,
        route: dto.route,
        status: dto.status ?? 'active',
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        prescribedBy: dto.prescribedBy,
        notes: dto.notes,
      },
    });
    this.audify('medication_created', actor, { medicationId: medication.id, patientId });
    return medication;
  }

  async updateMedication(actor: EmrActor, id: string, dto: UpdateMedicationDto) {
    const existing = await prisma.medication.findUnique({ where: { id } });
    this.assertSamePractice(actor, existing, 'Medication');
    const medication = await prisma.medication.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
    this.audify('medication_updated', actor, { medicationId: id });
    return medication;
  }

  async deleteMedication(actor: EmrActor, id: string) {
    const existing = await prisma.medication.findUnique({ where: { id } });
    this.assertSamePractice(actor, existing, 'Medication');
    await prisma.medication.delete({ where: { id } });
    this.audify('medication_deleted', actor, { medicationId: id });
  }

  // ── Conditions (problem list) ────────────────────────────────────────────
  async listConditions(actor: EmrActor, patientId: string) {
    await this.assertPatientInPractice(actor, patientId);
    return prisma.condition.findMany({
      where: { practiceId: actor.practiceId, patientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCondition(actor: EmrActor, patientId: string, dto: CreateConditionDto) {
    await this.assertPatientInPractice(actor, patientId);
    const condition = await prisma.condition.create({
      data: {
        practiceId: actor.practiceId,
        patientId,
        name: dto.name,
        code: dto.code,
        status: dto.status ?? 'active',
        onsetDate: dto.onsetDate ? new Date(dto.onsetDate) : undefined,
        resolvedDate: dto.resolvedDate ? new Date(dto.resolvedDate) : undefined,
        notes: dto.notes,
        recordedBy: actor.id,
      },
    });
    this.audify('condition_created', actor, { conditionId: condition.id, patientId });
    return condition;
  }

  async updateCondition(actor: EmrActor, id: string, dto: UpdateConditionDto) {
    const existing = await prisma.condition.findUnique({ where: { id } });
    this.assertSamePractice(actor, existing, 'Condition');
    const condition = await prisma.condition.update({
      where: { id },
      data: {
        ...dto,
        onsetDate: dto.onsetDate ? new Date(dto.onsetDate) : undefined,
        resolvedDate: dto.resolvedDate ? new Date(dto.resolvedDate) : undefined,
      },
    });
    this.audify('condition_updated', actor, { conditionId: id });
    return condition;
  }

  async deleteCondition(actor: EmrActor, id: string) {
    const existing = await prisma.condition.findUnique({ where: { id } });
    this.assertSamePractice(actor, existing, 'Condition');
    await prisma.condition.delete({ where: { id } });
    this.audify('condition_deleted', actor, { conditionId: id });
  }

  // ── Tooth chart ──────────────────────────────────────────────────────────
  async getToothChart(actor: EmrActor, patientId: string) {
    await this.assertPatientInPractice(actor, patientId);
    return prisma.toothChartEntry.findMany({
      where: { practiceId: actor.practiceId, patientId },
      orderBy: { toothNumber: 'asc' },
    });
  }

  async upsertToothEntry(
    actor: EmrActor,
    patientId: string,
    toothNumber: number,
    dto: UpsertToothChartEntryDto,
  ) {
    await this.assertPatientInPractice(actor, patientId);
    const entry = await prisma.toothChartEntry.upsert({
      where: {
        practiceId_patientId_toothNumber: {
          practiceId: actor.practiceId,
          patientId,
          toothNumber,
        },
      },
      create: {
        practiceId: actor.practiceId,
        patientId,
        toothNumber,
        condition: dto.condition,
        surfaces: dto.surfaces ?? [],
        status: dto.status ?? 'active',
        notes: dto.notes,
        chartedBy: actor.id,
      },
      update: {
        condition: dto.condition,
        surfaces: dto.surfaces ?? [],
        status: dto.status ?? 'active',
        notes: dto.notes,
        chartedBy: actor.id,
        chartedAt: new Date(),
      },
    });
    this.audify('tooth_chart_updated', actor, { patientId, toothNumber });
    return entry;
  }

  // ── Periodontal exams ────────────────────────────────────────────────────
  async listPeriodontalExams(actor: EmrActor, patientId: string) {
    await this.assertPatientInPractice(actor, patientId);
    return prisma.periodontalExam.findMany({
      where: { practiceId: actor.practiceId, patientId },
      orderBy: { examDate: 'desc' },
    });
  }

  async createPeriodontalExam(actor: EmrActor, patientId: string, dto: CreatePeriodontalExamDto) {
    await this.assertPatientInPractice(actor, patientId);
    const exam = await prisma.periodontalExam.create({
      data: {
        practiceId: actor.practiceId,
        patientId,
        examDate: dto.examDate ? new Date(dto.examDate) : new Date(),
        examinedBy: actor.id,
        measurements: (dto.measurements ?? undefined) as Prisma.InputJsonValue | undefined,
        summary: dto.summary,
      },
    });
    this.audify('periodontal_exam_created', actor, { examId: exam.id, patientId });
    return exam;
  }

  async getPeriodontalExam(actor: EmrActor, id: string) {
    const exam = await prisma.periodontalExam.findUnique({ where: { id } });
    this.assertSamePractice(actor, exam, 'PeriodontalExam');
    return exam;
  }
}
