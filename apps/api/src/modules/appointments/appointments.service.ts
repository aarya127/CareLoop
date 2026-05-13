import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { AppointmentsRepository } from './appointments.repository';
import { AvailabilityService } from './availability.service';
import { AuditService } from '../audit/audit.service';
import { IdempotencyService } from '../../common/services/idempotency.service';
import { getRedisClient } from '../../config/redis';
import type { CreateAppointmentDto, RescheduleDto, CancelDto, GetSlotsDto } from './dto';

export const APPT_EVENTS_CHANNEL = (practiceId: string) => `appt-events:${practiceId}`;

export interface AppointmentEventPayload {
  type: 'created' | 'cancelled' | 'rescheduled';
  id: string;
  practiceId: string;
  providerId: string;
  patientId: string | null;
  title: string;
  start: string;
  end: string;
  status: string;
  source: string;
  ts: number;
}

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly repo: AppointmentsRepository,
    private readonly availability: AvailabilityService,
    private readonly audit: AuditService,
    private readonly idempotency: IdempotencyService,
  ) {}

  // ── Queries ───────────────────────────────────────────────────────────────

  async findAll(query: {
    practiceId?: string;
    providerId?: string;
    patientId?: string;
    from?: string;
    to?: string;
    status?: string;
    limit?: string;
    offset?: string;
  }) {
    if (!query.practiceId) throw new BadRequestException('practiceId is required');
    return this.repo.findAll({
      practiceId: query.practiceId,
      providerId: query.providerId,
      patientId: query.patientId,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      status: query.status,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
      offset: query.offset ? parseInt(query.offset, 10) : undefined,
    });
  }

  async findById(id: string) {
    const appt = await this.repo.findById(id);
    if (!appt) throw new NotFoundException('Appointment not found');
    return appt;
  }

  async getAvailability(query: GetSlotsDto) {
    if (!query.providerId || !query.date || !query.duration) {
      throw new BadRequestException('providerId, date, and duration are required');
    }
    return this.availability.getSlots({
      practiceId: query.practiceId,
      providerId: query.providerId,
      date: query.date,
      duration: Number(query.duration),
    });
  }

  // ── Mutations ─────────────────────────────────────────────────────────────

  async create(
    dto: CreateAppointmentDto,
    idempotencyKey?: string,
    actorUserId?: string,
  ) {
    if (!dto.practiceId || !dto.providerId || !dto.start || !dto.end) {
      throw new BadRequestException('practiceId, providerId, start, and end are required');
    }
    if (!dto.userId) {
      throw new BadRequestException('userId (the booking staff member) is required');
    }

    const start = new Date(dto.start);
    const end = new Date(dto.end);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid start or end datetime');
    }
    if (end <= start) throw new BadRequestException('end must be after start');

    // Idempotency — return cached result on replay
    if (idempotencyKey) {
      const cached = await this.idempotency.claim(idempotencyKey);
      if (cached) return cached.body;
    }

    // Conflict check
    const conflicts = await this.repo.findConflicting(dto.providerId, start, end);
    if (conflicts.length > 0) {
      if (idempotencyKey) {
        await this.idempotency.complete(idempotencyKey, 409, {
          message: 'Scheduling conflict',
        });
      }
      throw new ConflictException(
        'Provider has a conflicting appointment at this time',
      );
    }

    const appointment = await this.repo.create({
      practiceId: dto.practiceId,
      userId: dto.userId,
      providerId: dto.providerId,
      patientId: dto.patientId,
      roomId: dto.roomId ?? undefined,
      title: dto.title ?? 'Appointment',
      start,
      end,
      timeZone: dto.timeZone ?? 'America/New_York',
      notes: dto.notes,
      procedureCode: dto.procedureCode,
      source: dto.source ?? 'manual',
      status: 'confirmed',
    });

    await this.audit.record({
      eventType: 'appointment_created',
      outcome: 'success',
      actorUserId: actorUserId ?? dto.userId,
      metadata: {
        appointmentId: appointment.id,
        providerId: dto.providerId,
        patientId: dto.patientId,
        start: dto.start,
        end: dto.end,
      },
    });

    // Bust availability cache
    const dateStr = start.toISOString().split('T')[0];
    await this.availability.invalidateCache(dto.providerId, dateStr);

    if (idempotencyKey) {
      await this.idempotency.complete(idempotencyKey, 201, appointment);
    }

    this.publishEvent({
      type: 'created',
      id: appointment.id,
      practiceId: appointment.practiceId,
      providerId: appointment.providerId,
      patientId: appointment.patientId ?? null,
      title: appointment.title,
      start: appointment.start.toISOString(),
      end: appointment.end.toISOString(),
      status: appointment.status,
      source: appointment.source,
      ts: Date.now(),
    });

    return appointment;
  }

  async reschedule(
    id: string,
    dto: RescheduleDto,
    actorUserId?: string,
  ) {
    const appt = await this.repo.findById(id);
    if (!appt) throw new NotFoundException('Appointment not found');
    if (appt.status === 'cancelled') {
      throw new BadRequestException('Cannot reschedule a cancelled appointment');
    }

    const newStart = new Date(dto.start);
    const newEnd = new Date(dto.end);
    if (isNaN(newStart.getTime()) || isNaN(newEnd.getTime())) {
      throw new BadRequestException('Invalid dates');
    }
    if (newEnd <= newStart) throw new BadRequestException('end must be after start');

    const conflicts = await this.repo.findConflicting(
      appt.providerId,
      newStart,
      newEnd,
      id,
    );
    if (conflicts.length > 0) {
      throw new ConflictException(
        'Provider has a conflicting appointment at this time',
      );
    }

    const updated = await this.repo.update(id, {
      start: newStart,
      end: newEnd,
      extended: {
        ...(typeof appt.extended === 'object' && appt.extended !== null
          ? (appt.extended as object)
          : {}),
        previousStart: appt.start.toISOString(),
        previousEnd: appt.end.toISOString(),
        rescheduleReason: dto.reason,
        rescheduledAt: new Date().toISOString(),
      },
    });

    await this.audit.record({
      eventType: 'appointment_rescheduled',
      outcome: 'success',
      actorUserId,
      metadata: {
        appointmentId: id,
        previousStart: appt.start.toISOString(),
        previousEnd: appt.end.toISOString(),
        newStart: dto.start,
        newEnd: dto.end,
        reason: dto.reason,
      },
    });

    // Bust cache for old date and new date
    const oldDate = appt.start.toISOString().split('T')[0];
    const newDate = newStart.toISOString().split('T')[0];
    await Promise.all([
      this.availability.invalidateCache(appt.providerId, oldDate),
      oldDate !== newDate
        ? this.availability.invalidateCache(appt.providerId, newDate)
        : Promise.resolve(),
    ]);

    this.publishEvent({
      type: 'rescheduled',
      id: updated.id,
      practiceId: updated.practiceId,
      providerId: updated.providerId,
      patientId: updated.patientId ?? null,
      title: updated.title,
      start: updated.start.toISOString(),
      end: updated.end.toISOString(),
      status: updated.status,
      source: updated.source,
      ts: Date.now(),
    });

    return updated;
  }

  async cancel(id: string, dto: CancelDto, actorUserId?: string) {
    const appt = await this.repo.findById(id);
    if (!appt) throw new NotFoundException('Appointment not found');
    if (appt.status === 'cancelled') {
      throw new BadRequestException('Appointment is already cancelled');
    }

    const notes = dto.reason
      ? `${appt.notes ?? ''}\nCancellation reason: ${dto.reason}`.trim()
      : appt.notes ?? undefined;

    const updated = await this.repo.update(id, {
      status: 'cancelled',
      notes,
      extended: {
        ...(typeof appt.extended === 'object' && appt.extended !== null
          ? (appt.extended as object)
          : {}),
        cancelledAt: new Date().toISOString(),
        cancelReason: dto.reason,
      },
    });

    await this.audit.record({
      eventType: 'appointment_cancelled',
      outcome: 'success',
      actorUserId,
      metadata: { appointmentId: id, reason: dto.reason },
    });

    // Bust availability cache
    const dateStr = appt.start.toISOString().split('T')[0];
    await this.availability.invalidateCache(appt.providerId, dateStr);

    this.publishEvent({
      type: 'cancelled',
      id: updated.id,
      practiceId: updated.practiceId,
      providerId: updated.providerId,
      patientId: updated.patientId ?? null,
      title: updated.title,
      start: updated.start.toISOString(),
      end: updated.end.toISOString(),
      status: updated.status,
      source: updated.source,
      ts: Date.now(),
    });

    return updated;
  }

  // ── Redis pub/sub event publishing ───────────────────────────────────────

  private publishEvent(payload: AppointmentEventPayload): void {
    // Fire-and-forget — SSE is a UX enhancement; don't fail the mutation if Redis is down
    getRedisClient()
      .publish(APPT_EVENTS_CHANNEL(payload.practiceId), JSON.stringify(payload))
      .catch(() => {});
  }

  // ── Legacy stubs (used by older calendar components) ─────────────────────

  async update(id: string, dto: any) {
    return this.repo.update(id, dto);
  }

  async remove(id: string) {
    return this.cancel(id, {});
  }
}
