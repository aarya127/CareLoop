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
import { LlmService } from '../ai/llm.service';
import { redactPhi } from '../ai/phi-redact';
import { ENCOUNTER_TYPES, type DraftFromTranscriptDto } from './dto';
import type {
  CreateAllergyDto,
  CreateConditionDto,
  CreateEncounterDto,
  CreateMedicationDto,
  CreatePeriodontalExamDto,
  CreateTreatmentPlanDto,
  EmrActor,
  TreatmentPlanItemInputDto,
  UpdateAllergyDto,
  UpdateConditionDto,
  UpdateEncounterDto,
  UpdateMedicationDto,
  UpdateTreatmentPlanDto,
  UpdateTreatmentPlanItemDto,
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
    @Inject(LlmService) private readonly llm: LlmService,
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

  /**
   * AI Scribe: turn a visit transcript into a DRAFT SOAP encounter for the
   * clinician to review, edit, and sign. PHI is redacted before it leaves the
   * server. Gated behind AI_ENABLED (LlmService throws 503 when disabled).
   */
  async draftEncounterFromTranscript(
    actor: EmrActor,
    patientId: string,
    dto: DraftFromTranscriptDto,
  ) {
    await this.assertPatientInPractice(actor, patientId);

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { firstName: true, lastName: true, phoneE164: true },
    });

    // Source transcript: explicit text, a specific call, or the latest call.
    let transcript = dto.transcript?.trim();
    if (!transcript) {
      // callSid lookups are still scoped to the caller's practice — a bare
      // findUnique would let any authenticated user pull another tenant's
      // transcript by knowing its callSid.
      const t = dto.callSid
        ? await prisma.callTranscript.findFirst({
            where: { callSid: dto.callSid, practiceId: actor.practiceId },
          })
        : await prisma.callTranscript.findFirst({
            where: { practiceId: actor.practiceId, patientId, fullTranscript: { not: null } },
            orderBy: { createdAt: 'desc' },
          });
      transcript = t?.fullTranscript ?? undefined;
    }
    if (!transcript) {
      throw new BadRequestException('No transcript available for this patient');
    }

    const redacted = redactPhi(transcript, {
      firstName: patient?.firstName,
      lastName: patient?.lastName,
      phone: patient?.phoneE164,
    });

    const system =
      'You are a dental clinical scribe. Convert the visit transcript into a concise SOAP note. ' +
      'Do not invent facts not present in the transcript. Respond with ONLY a JSON object with keys: ' +
      '"type" (one of exam, cleaning, consult, procedure, followup), "chiefComplaint", ' +
      '"subjective", "objective", "assessment", "plan". Use empty strings for unknown fields.';
    const raw = await this.llm.completeJson(system, `Visit transcript:\n${redacted}`);
    const soap = this.parseSoap(raw);

    const encounter = await prisma.encounter.create({
      data: {
        practiceId: actor.practiceId,
        patientId,
        authorId: actor.id,
        type: ENCOUNTER_TYPES.includes(soap.type) ? soap.type : 'exam',
        encounterDate: new Date(),
        chiefComplaint: soap.chiefComplaint,
        subjective: soap.subjective,
        objective: soap.objective,
        assessment: soap.assessment,
        plan: soap.plan,
        status: 'draft',
      },
    });

    this.audify('encounter_ai_drafted', actor, { encounterId: encounter.id, patientId });
    return encounter;
  }

  private parseSoap(raw: string): {
    type: string;
    chiefComplaint?: string;
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
  } {
    // Tolerate code fences / prose around the JSON.
    const match = raw.match(/\{[\s\S]*\}/);
    let obj: Record<string, unknown> = {};
    try {
      obj = JSON.parse(match ? match[0] : raw);
    } catch {
      // Fall back to putting the whole reply in the assessment field.
      return { type: 'exam', assessment: raw.slice(0, 2000) };
    }
    const str = (v: unknown) => (typeof v === 'string' ? v : undefined);
    return {
      type: str(obj.type) ?? 'exam',
      chiefComplaint: str(obj.chiefComplaint),
      subjective: str(obj.subjective),
      objective: str(obj.objective),
      assessment: str(obj.assessment),
      plan: str(obj.plan),
    };
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

  // ── Patient timeline (chronological clinical activity feed) ────────────────
  async getTimeline(actor: EmrActor, patientId: string) {
    await this.assertPatientInPractice(actor, patientId);
    const where = { practiceId: actor.practiceId, patientId };
    const [encounters, treatments, documents, appointments] = await Promise.all([
      prisma.encounter.findMany({ where, orderBy: { encounterDate: 'desc' }, take: 100 }),
      prisma.treatmentRecord.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 }),
      prisma.document.findMany({
        where: { ...where, status: 'active' },
        orderBy: { uploadedAt: 'desc' },
        take: 100,
      }),
      prisma.appointment.findMany({ where, orderBy: { start: 'desc' }, take: 100 }),
    ]);

    const events = [
      ...encounters.map((e) => ({
        id: e.id,
        type: 'encounter' as const,
        date: e.encounterDate,
        title: `${e.type} note`,
        detail: e.chiefComplaint ?? e.assessment ?? undefined,
        status: e.status,
      })),
      ...treatments.map((t) => ({
        id: t.id,
        type: 'treatment' as const,
        date: t.createdAt,
        title: t.procedureCode ? `Procedure ${t.procedureCode}` : 'Treatment',
        detail: t.notes ?? undefined,
        status: t.status,
      })),
      ...documents.map((d) => ({
        id: d.id,
        type: 'document' as const,
        date: d.uploadedAt,
        title: d.fileName,
        detail: d.category,
        status: undefined as string | undefined,
      })),
      ...appointments.map((a) => ({
        id: a.id,
        type: 'appointment' as const,
        date: a.start,
        title: a.title,
        detail: a.notes ?? undefined,
        status: a.status,
      })),
    ];

    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return events;
  }

  // ── Treatment Plans ────────────────────────────────────────────────────────
  private planEstimate(items: { feeCents?: number | null }[]): number {
    return items.reduce((sum, i) => sum + (i.feeCents ?? 0), 0);
  }

  private async recomputePlanEstimate(planId: string): Promise<void> {
    const items = await prisma.treatmentPlanItem.findMany({
      where: { planId },
      select: { feeCents: true },
    });
    await prisma.treatmentPlan.update({
      where: { id: planId },
      data: { estimatedCostCents: this.planEstimate(items) },
    });
  }

  async listTreatmentPlans(actor: EmrActor, patientId: string) {
    await this.assertPatientInPractice(actor, patientId);
    return prisma.treatmentPlan.findMany({
      where: { practiceId: actor.practiceId, patientId },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTreatmentPlan(actor: EmrActor, patientId: string, dto: CreateTreatmentPlanDto) {
    await this.assertPatientInPractice(actor, patientId);
    const items = dto.items ?? [];
    const plan = await prisma.treatmentPlan.create({
      data: {
        practiceId: actor.practiceId,
        patientId,
        providerId: dto.providerId,
        title: dto.title ?? 'Treatment Plan',
        notes: dto.notes,
        insuranceEstimateCents: dto.insuranceEstimateCents ?? 0,
        estimatedCostCents: this.planEstimate(items),
        createdBy: actor.id,
        status: 'draft',
        items: {
          create: items.map((it: TreatmentPlanItemInputDto, idx: number) => ({
            description: it.description,
            toothNumber: it.toothNumber,
            surface: it.surface,
            procedureCode: it.procedureCode,
            feeCents: it.feeCents ?? 0,
            status: it.status ?? 'planned',
            sortOrder: it.sortOrder ?? idx,
          })),
        },
      },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });
    this.audify('treatment_plan_created', actor, { planId: plan.id, patientId });
    return plan;
  }

  async getTreatmentPlan(actor: EmrActor, id: string) {
    const plan = await prisma.treatmentPlan.findUnique({
      where: { id },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });
    this.assertSamePractice(actor, plan, 'TreatmentPlan');
    return plan;
  }

  async updateTreatmentPlan(actor: EmrActor, id: string, dto: UpdateTreatmentPlanDto) {
    const existing = await prisma.treatmentPlan.findUnique({ where: { id } });
    this.assertSamePractice(actor, existing, 'TreatmentPlan');
    const plan = await prisma.treatmentPlan.update({
      where: { id },
      data: {
        title: dto.title,
        status: dto.status,
        notes: dto.notes,
        providerId: dto.providerId,
        insuranceEstimateCents: dto.insuranceEstimateCents,
      },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });
    this.audify('treatment_plan_updated', actor, { planId: id });
    return plan;
  }

  async acceptTreatmentPlan(actor: EmrActor, id: string) {
    const existing = await prisma.treatmentPlan.findUnique({ where: { id } });
    this.assertSamePractice(actor, existing, 'TreatmentPlan');
    const plan = await prisma.treatmentPlan.update({
      where: { id },
      data: { status: 'accepted', acceptedAt: new Date(), acceptedBy: actor.id },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });
    this.audify('treatment_plan_accepted', actor, { planId: id });
    return plan;
  }

  async addPlanItem(actor: EmrActor, planId: string, dto: TreatmentPlanItemInputDto) {
    const plan = await prisma.treatmentPlan.findUnique({ where: { id: planId } });
    this.assertSamePractice(actor, plan, 'TreatmentPlan');
    const count = await prisma.treatmentPlanItem.count({ where: { planId } });
    const item = await prisma.treatmentPlanItem.create({
      data: {
        planId,
        description: dto.description,
        toothNumber: dto.toothNumber,
        surface: dto.surface,
        procedureCode: dto.procedureCode,
        feeCents: dto.feeCents ?? 0,
        status: dto.status ?? 'planned',
        sortOrder: dto.sortOrder ?? count,
      },
    });
    await this.recomputePlanEstimate(planId);
    this.audify('treatment_plan_item_added', actor, { planId, itemId: item.id });
    return item;
  }

  async updatePlanItem(actor: EmrActor, itemId: string, dto: UpdateTreatmentPlanItemDto) {
    const item = await prisma.treatmentPlanItem.findUnique({
      where: { id: itemId },
      include: { plan: true },
    });
    if (!item) throw new NotFoundException('TreatmentPlanItem not found');
    this.assertSamePractice(actor, item.plan, 'TreatmentPlan');

    // Completing an item creates a linked TreatmentRecord (once).
    let treatmentRecordId = item.treatmentRecordId;
    if (dto.status === 'completed' && !item.treatmentRecordId) {
      const tr = await prisma.treatmentRecord.create({
        data: {
          practiceId: item.plan.practiceId,
          patientId: item.plan.patientId,
          providerId: item.plan.providerId ?? undefined,
          procedureCode: item.procedureCode ?? undefined,
          toothNumber: item.toothNumber ?? undefined,
          surface: item.surface ?? undefined,
          notes: item.description,
          status: 'completed',
          completedAt: new Date(),
          ...({ createdBy: actor.id } as object),
        },
      });
      treatmentRecordId = tr.id;
    }

    const updated = await prisma.treatmentPlanItem.update({
      where: { id: itemId },
      data: {
        description: dto.description,
        toothNumber: dto.toothNumber,
        surface: dto.surface,
        procedureCode: dto.procedureCode,
        feeCents: dto.feeCents,
        status: dto.status,
        sortOrder: dto.sortOrder,
        treatmentRecordId,
      },
    });
    await this.recomputePlanEstimate(item.planId);
    this.audify('treatment_plan_item_updated', actor, { itemId, status: dto.status });
    return updated;
  }

  async deletePlanItem(actor: EmrActor, itemId: string) {
    const item = await prisma.treatmentPlanItem.findUnique({
      where: { id: itemId },
      include: { plan: true },
    });
    if (!item) throw new NotFoundException('TreatmentPlanItem not found');
    this.assertSamePractice(actor, item.plan, 'TreatmentPlan');
    await prisma.treatmentPlanItem.delete({ where: { id: itemId } });
    await this.recomputePlanEstimate(item.planId);
    this.audify('treatment_plan_item_deleted', actor, { itemId });
  }
}
