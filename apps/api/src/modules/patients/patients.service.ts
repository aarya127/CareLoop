import { Injectable } from '@nestjs/common';
import { PatientsRepository } from './patients.repository';

@Injectable()
export class PatientsService {
  private medicalHistoryTableReady = false;
  private recordSectionsTableReady = false;

  constructor(private readonly patientsRepository: PatientsRepository) {}

  private async ensureMedicalHistoryTable(): Promise<void> {
    if (this.medicalHistoryTableReady) {
      return;
    }

    await this.patientsRepository.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "PatientMedicalHistory" (
        "patientId" TEXT PRIMARY KEY,
        "history" JSONB NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PatientMedicalHistory_patientId_fkey"
          FOREIGN KEY ("patientId") REFERENCES "Patient"("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    this.medicalHistoryTableReady = true;
  }

  private async ensureRecordSectionsTable(): Promise<void> {
    if (this.recordSectionsTableReady) {
      return;
    }

    await this.patientsRepository.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "PatientRecordSectionsKv" (
        "patientId" TEXT NOT NULL,
        "section" TEXT NOT NULL,
        "payload" JSONB NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PatientRecordSectionsKv_patientId_fkey"
          FOREIGN KEY ("patientId") REFERENCES "Patient"("id")
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "PatientRecordSectionsKv_pkey" PRIMARY KEY ("patientId", "section")
      );
    `);

    this.recordSectionsTableReady = true;
  }

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

  async findAll(query: any): Promise<any[]> {
    try {
      const practiceId = String(query?.practiceId ?? 'demo-practice');
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
        const emailAlias = `${patient.firstName}.${patient.lastName}`
          .toLowerCase()
          .replace(/[^a-z0-9.]/g, '');

        return {
          id: patient.id,
          first_name: patient.firstName,
          last_name: patient.lastName,
          email: `${emailAlias || 'patient'}@careloop.local`,
          phone: patient.phoneE164 ?? 'N/A',
          age: this.toAge(patient.dateOfBirth),
          date_of_birth: patient.dateOfBirth,
          primary_doctor_name: appointmentMeta?.providerName ?? 'Unassigned',
          next_appointment_date: appointmentMeta?.nextDate ?? null,
          last_visit_date: appointmentMeta?.lastDate ?? null,
          has_allergies: false,
          requires_pre_medication: false,
          has_outstanding_balance: 0,
          patient_type: patient.patientType,
          primary_insurance: primaryPayer ?? null,
        };
      });
    } catch {
      return [];
    }
  }

  async findById(id: string): Promise<any> {
    try {
      return await this.patientsRepository.prisma.patient.findUnique({
        where: { id },
        include: {
          insuranceRecords: {
            where: { active: true },
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    } catch {
      return null;
    }
  }

  async create(dto: any): Promise<any> {
    try {
      const practiceId = String(dto?.practiceId ?? 'demo-practice');

      await this.patientsRepository.prisma.practice.upsert({
        where: { id: practiceId },
        update: {},
        create: {
          id: practiceId,
          name: 'Demo Practice',
          timeZone: 'America/New_York',
        },
      });

      return await this.patientsRepository.prisma.patient.create({
        data: {
          practiceId,
          firstName: String(dto?.firstName ?? dto?.first_name ?? ''),
          lastName: String(dto?.lastName ?? dto?.last_name ?? ''),
          dateOfBirth: this.normalizeDateInput(dto?.dateOfBirth ?? dto?.date_of_birth) ?? null,
          phoneE164: dto?.phoneE164 ?? dto?.phone ?? null,
          patientType: String(dto?.patientType ?? dto?.patient_type ?? 'existing'),
        },
      });
    } catch {
      return null;
    }
  }

  async update(id: string, dto: any): Promise<any> {
    try {
      return await this.patientsRepository.prisma.patient.update({
        where: { id },
        data: {
          firstName: dto?.firstName ?? dto?.first_name,
          lastName: dto?.lastName ?? dto?.last_name,
          dateOfBirth: this.normalizeDateInput(dto?.dateOfBirth ?? dto?.date_of_birth),
          phoneE164: dto?.phoneE164 ?? dto?.phone,
          patientType: dto?.patientType ?? dto?.patient_type,
        },
      });
    } catch {
      return null;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.patientsRepository.prisma.patient.delete({ where: { id } });
    } catch {
      return;
    }
  }

  async findMedicalHistory(patientId: string): Promise<any> {
    try {
      await this.ensureMedicalHistoryTable();

      const patient = await this.patientsRepository.prisma.patient.findUnique({
        where: { id: patientId },
        select: { id: true },
      });

      if (!patient) {
        return null;
      }

      const rows = await this.patientsRepository.prisma.$queryRawUnsafe<Array<{ history: unknown }>>(
        `SELECT "history" FROM "PatientMedicalHistory" WHERE "patientId" = $1 LIMIT 1`,
        patientId
      );

      return rows[0]?.history ?? null;
    } catch {
      return null;
    }
  }

  async upsertMedicalHistory(patientId: string, history: unknown): Promise<any> {
    try {
      if (!history || typeof history !== 'object') {
        return null;
      }

      await this.ensureMedicalHistoryTable();

      const patient = await this.patientsRepository.prisma.patient.findUnique({
        where: { id: patientId },
        select: { id: true },
      });

      if (!patient) {
        return null;
      }

      await this.patientsRepository.prisma.$executeRawUnsafe(
        `
          INSERT INTO "PatientMedicalHistory" ("patientId", "history", "createdAt", "updatedAt")
          VALUES ($1, $2::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT ("patientId")
          DO UPDATE SET
            "history" = EXCLUDED."history",
            "updatedAt" = CURRENT_TIMESTAMP
        `,
        patientId,
        JSON.stringify(history)
      );

      return this.findMedicalHistory(patientId);
    } catch {
      return null;
    }
  }

  private isValidRecordSection(section: string): boolean {
    return ['profile', 'clinicalChart', 'periodontalRecords', 'radiographicRecords', 'adminDocuments'].includes(section);
  }

  async findRecordSection(patientId: string, section: string): Promise<any> {
    try {
      if (!this.isValidRecordSection(section)) {
        return null;
      }

      await this.ensureRecordSectionsTable();

      const patient = await this.patientsRepository.prisma.patient.findUnique({
        where: { id: patientId },
        select: { id: true },
      });
      if (!patient) {
        return null;
      }

      const rows = await this.patientsRepository.prisma.$queryRawUnsafe<Array<{ value: unknown }>>(
        `SELECT "payload" as value FROM "PatientRecordSectionsKv" WHERE "patientId" = $1 AND "section" = $2 LIMIT 1`,
        patientId,
        section
      );

      return rows[0]?.value ?? null;
    } catch {
      return null;
    }
  }

  async upsertRecordSection(patientId: string, section: string, payload: unknown): Promise<any> {
    try {
      if (!this.isValidRecordSection(section) || payload === undefined) {
        return null;
      }

      await this.ensureRecordSectionsTable();

      const patient = await this.patientsRepository.prisma.patient.findUnique({
        where: { id: patientId },
        select: { id: true },
      });
      if (!patient) {
        return null;
      }

      await this.patientsRepository.prisma.$executeRawUnsafe(
        `
          INSERT INTO "PatientRecordSectionsKv" ("patientId", "section", "payload", "createdAt", "updatedAt")
          VALUES ($1, $2, $3::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT ("patientId", "section")
          DO UPDATE SET
            "payload" = EXCLUDED."payload",
            "updatedAt" = CURRENT_TIMESTAMP
        `,
        patientId,
        section,
        JSON.stringify(payload)
      );

      return this.findRecordSection(patientId, section);
    } catch {
      return null;
    }
  }
}
