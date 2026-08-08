import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@careloop/db';
import { PatientsRepository } from './patients.repository';
import { AuditService } from '../audit/audit.service';
import { decryptSensitiveField } from '../../common/security/field-encryption';
import type { CreatePatientDto, ListPatientsQueryDto, UpdatePatientDto } from './dto';

@Injectable()
export class PatientsService {
  constructor(
    private readonly patientsRepository: PatientsRepository,
    private readonly audit: AuditService,
  ) {}

  private normalizeDateInput(value: unknown): Date | null | undefined {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }

    const raw = String(value).trim();
    if (!raw) return null;

    const asIso = raw.length === 10 ? `${raw}T00:00:00.000Z` : raw;
    const parsed = new Date(asIso);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
  }

  private birthDate(value: unknown): Date | null | undefined {
    const parsed = this.normalizeDateInput(value);
    if (
      typeof value === 'string' &&
      value.length === 10 &&
      parsed &&
      parsed.toISOString().slice(0, 10) !== value
    ) {
      throw new BadRequestException('Date of birth is not a valid calendar date');
    }
    if (parsed && parsed > new Date()) {
      throw new BadRequestException('Date of birth cannot be in the future');
    }
    return parsed;
  }

  private toAge(dateOfBirth: Date | null): number {
    if (!dateOfBirth) return 0;
    const now = new Date();
    let age = now.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = now.getMonth() - dateOfBirth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dateOfBirth.getDate())) {
      age -= 1;
    }
    return age;
  }

  /** Extract emergency-contact fields from either flat or nested dto shapes. */
  private emergencyContactData(dto: any) {
    const ec = dto?.emergency_contact ?? dto?.contact?.emergency_contact ?? {};
    const name = dto?.emergencyContactName ?? ec?.name;
    const relationship = dto?.emergencyContactRelationship ?? ec?.relationship;
    const phone = dto?.emergencyContactPhone ?? ec?.phone;
    return {
      ...(name !== undefined ? { emergencyContactName: name || null } : {}),
      ...(relationship !== undefined ? { emergencyContactRelationship: relationship || null } : {}),
      ...(phone !== undefined ? { emergencyContactPhone: phone || null } : {}),
    };
  }

  /**
   * Confirm a patient exists within the caller's practice. Tenancy is always
   * derived from the authenticated session (never client input); returns the
   * patient id when owned, otherwise null so callers can 404/no-op without
   * leaking cross-tenant existence.
   */
  private async assertPatientInPractice(practiceId: string, patientId: string): Promise<boolean> {
    const patient = await this.patientsRepository.prisma.patient.findFirst({
      where: { id: patientId, practiceId },
      select: { id: true },
    });
    return Boolean(patient);
  }

  async findAll(practiceId: string, query: ListPatientsQueryDto): Promise<any[]> {
    const search = String(query?.search ?? '').trim();

    const where: any = { practiceId };
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phoneE164: { contains: search } },
      ];
    }

    const patients = await this.patientsRepository.prisma.patient.findMany({
      where,
      include: {
        insuranceRecords: {
          where: { active: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      take: query.limit,
      skip: query.offset,
    });

    const patientIds = patients.map((p) => p.id);
    if (patientIds.length === 0) return [];

    const appointments = await this.patientsRepository.prisma.appointment.findMany({
      where: {
        practiceId,
        patientId: { in: patientIds },
      },
      select: {
        patientId: true,
        providerId: true,
        start: true,
        status: true,
      },
      orderBy: { start: 'desc' },
    });

    // Real clinical/billing flags — previously hardcoded, which is dangerous
    // in a patient list (an allergy flag that is always "no" invites harm).
    const [allergyRows, balanceRows] = await Promise.all([
      this.patientsRepository.prisma.allergy.groupBy({
        by: ['patientId'],
        where: { practiceId, patientId: { in: patientIds }, status: 'active' },
      }),
      this.patientsRepository.prisma.invoice.groupBy({
        by: ['patientId'],
        where: { practiceId, patientId: { in: patientIds }, status: { in: ['sent', 'overdue'] } },
        _sum: { totalAmountCents: true },
      }),
    ]);
    const patientsWithAllergies = new Set(allergyRows.map((r) => r.patientId));
    const outstandingCentsByPatient = new Map(
      balanceRows.map((r) => [r.patientId, r._sum.totalAmountCents ?? 0]),
    );

    const providerIds = Array.from(new Set(appointments.map((a) => a.providerId)));
    const providers = providerIds.length
      ? await this.patientsRepository.prisma.provider.findMany({
          where: { id: { in: providerIds } },
          select: { id: true, name: true },
        })
      : [];
    const providerNameById = new Map(providers.map((p) => [p.id, p.name]));

    const now = new Date();
    const appointmentMap = new Map<
      string,
      {
        nextDate: Date | null;
        lastDate: Date | null;
        providerName: string | null;
      }
    >();

    for (const appt of appointments) {
      const key = String(appt.patientId ?? '');
      if (!key) continue;

      const existing = appointmentMap.get(key) ?? {
        nextDate: null,
        lastDate: null,
        providerName: null,
      };

      const apptDate = new Date(appt.start);
      if (apptDate >= now && (appt.status === 'scheduled' || appt.status === 'confirmed')) {
        if (!existing.nextDate || apptDate < existing.nextDate) {
          existing.nextDate = apptDate;
        }
      }

      if (apptDate < now) {
        if (!existing.lastDate || apptDate > existing.lastDate) {
          existing.lastDate = apptDate;
          existing.providerName = providerNameById.get(appt.providerId) ?? 'Unassigned';
        }
      }

      appointmentMap.set(key, existing);
    }

    return patients.map((patient) => {
      const appointmentMeta = appointmentMap.get(patient.id);
      const primaryPayer = patient.insuranceRecords[0]?.payerName;

      return {
        id: patient.id,
        first_name: patient.firstName,
        last_name: patient.lastName,
        // Patient has no email column yet; empty string beats a fabricated
        // "@careloop.local" address that looks real in the UI.
        email: '',
        phone: patient.phoneE164 ?? 'N/A',
        age: this.toAge(patient.dateOfBirth),
        date_of_birth: patient.dateOfBirth,
        primary_doctor_name: appointmentMeta?.providerName ?? 'Unassigned',
        next_appointment_date: appointmentMeta?.nextDate ?? null,
        last_visit_date: appointmentMeta?.lastDate ?? null,
        has_allergies: patientsWithAllergies.has(patient.id),
        requires_pre_medication: false,
        has_outstanding_balance: outstandingCentsByPatient.get(patient.id) ?? 0,
        patient_type: patient.patientType,
        primary_insurance: primaryPayer ?? null,
      };
    });
  }

  async findById(practiceId: string, id: string, actorUserId?: string): Promise<any> {
    const patient = await this.patientsRepository.prisma.patient.findFirst({
      where: { id, practiceId },
      include: {
        insuranceRecords: {
          where: { active: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    void this.audit.record({
      practiceId,
      eventType: 'patient_viewed',
      outcome: 'success',
      actorUserId,
      metadata: { patientId: id, practiceId: patient?.practiceId },
    });
    if (!patient) return null;

    return {
      ...patient,
      insuranceRecords: patient.insuranceRecords.map((record) => {
        const { memberIdEnc, groupNumberEnc, ...safe } = record;
        const memberId = decryptSensitiveField(memberIdEnc);
        return {
          ...safe,
          memberIdMasked: memberId ? `••••${memberId.slice(-4)}` : null,
          hasGroupNumber: Boolean(groupNumberEnc),
        };
      }),
    };
  }

  async create(practiceId: string, dto: CreatePatientDto, actorUserId?: string): Promise<any> {
    try {
      const patient = await this.patientsRepository.prisma.patient.create({
        data: {
          practiceId,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          dateOfBirth: this.birthDate(dto.dateOfBirth) ?? null,
          phoneE164: dto.phone ?? null,
          patientType: dto.patientType ?? 'existing',
          gender: dto?.gender ?? null,
          ...this.emergencyContactData(dto),
        },
      });

      void this.audit.record({
        practiceId,
        eventType: 'patient_created',
        outcome: 'success',
        actorUserId,
        metadata: { patientId: patient?.id, practiceId },
      });

      return patient;
    } catch (err) {
      // Don't silently swallow write failures — a failed create must not look
      // like success. Audit the failure and rethrow (the exception filter
      // returns a sanitized 500; the real error is logged server-side).
      void this.audit.record({
        practiceId,
        eventType: 'patient_created',
        outcome: 'failure',
        actorUserId,
        metadata: { practiceId, error: err instanceof Error ? err.message : 'unknown' },
      });
      throw err;
    }
  }

  async update(
    practiceId: string,
    id: string,
    dto: UpdatePatientDto,
    actorUserId?: string,
  ): Promise<any> {
    try {
      // Tenant guard: refuse to update a record outside the caller's practice.
      if (!(await this.assertPatientInPractice(practiceId, id))) {
        return null;
      }

      const patient = await this.patientsRepository.prisma.patient.update({
        where: { id },
        data: {
          firstName: dto.firstName?.trim(),
          lastName: dto.lastName?.trim(),
          dateOfBirth: this.birthDate(dto.dateOfBirth),
          phoneE164: dto.phone,
          patientType: dto.patientType,
          gender: dto?.gender ?? undefined,
          ...this.emergencyContactData(dto),
        },
      });

      void this.audit.record({
        practiceId,
        eventType: 'patient_updated',
        outcome: 'success',
        actorUserId,
        metadata: { patientId: id, fields: Object.keys(dto ?? {}) },
      });

      return patient;
    } catch (err) {
      void this.audit.record({
        practiceId,
        eventType: 'patient_updated',
        outcome: 'failure',
        actorUserId,
        metadata: { patientId: id, error: err instanceof Error ? err.message : 'unknown' },
      });
      throw err;
    }
  }

  async remove(practiceId: string, id: string, actorUserId?: string): Promise<void> {
    try {
      // Tenant guard: only delete records within the caller's practice.
      if (!(await this.assertPatientInPractice(practiceId, id))) {
        return;
      }
      await this.patientsRepository.prisma.patient.delete({ where: { id } });
      void this.audit.record({
        practiceId,
        eventType: 'patient_deleted',
        outcome: 'success',
        actorUserId,
        metadata: { patientId: id },
      });
    } catch (err) {
      void this.audit.record({
        practiceId,
        eventType: 'patient_deleted',
        outcome: 'failure',
        actorUserId,
        metadata: { patientId: id, error: err instanceof Error ? err.message : 'unknown' },
      });
      throw err;
    }
  }

  async findMedicalHistory(practiceId: string, patientId: string): Promise<any> {
    if (!(await this.assertPatientInPractice(practiceId, patientId))) return null;
    const record = await this.patientsRepository.prisma.patientMedicalHistory.findUnique({
      where: { patientId },
      select: { history: true },
    });
    return record?.history ?? null;
  }

  async upsertMedicalHistory(
    practiceId: string,
    patientId: string,
    history: unknown,
  ): Promise<any> {
    if (!history || typeof history !== 'object') return null;
    if (!(await this.assertPatientInPractice(practiceId, patientId))) return null;

    const record = await this.patientsRepository.prisma.patientMedicalHistory.upsert({
      where: { patientId },
      create: { patientId, history: history as Prisma.InputJsonValue },
      update: { history: history as Prisma.InputJsonValue },
      select: { history: true },
    });
    return record.history;
  }

  private isValidRecordSection(section: string): boolean {
    return [
      'profile',
      'clinicalChart',
      'periodontalRecords',
      'radiographicRecords',
      'adminDocuments',
    ].includes(section);
  }

  async findRecordSection(practiceId: string, patientId: string, section: string): Promise<any> {
    if (!this.isValidRecordSection(section)) return null;
    if (!(await this.assertPatientInPractice(practiceId, patientId))) return null;

    const record = await this.patientsRepository.prisma.patientRecordSection.findUnique({
      where: { patientId_section: { patientId, section } },
      select: { payload: true },
    });
    return record?.payload ?? null;
  }

  async upsertRecordSection(
    practiceId: string,
    patientId: string,
    section: string,
    payload: unknown,
  ): Promise<any> {
    if (!this.isValidRecordSection(section) || payload === undefined) return null;
    if (!(await this.assertPatientInPractice(practiceId, patientId))) return null;

    const record = await this.patientsRepository.prisma.patientRecordSection.upsert({
      where: { patientId_section: { patientId, section } },
      create: { patientId, section, payload: payload as Prisma.InputJsonValue },
      update: { payload: payload as Prisma.InputJsonValue },
      select: { payload: true },
    });
    return record.payload;
  }
}
