import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  patientFind: vi.fn(),
  appointmentFind: vi.fn(),
  reminderFind: vi.fn(),
  reminderCreate: vi.fn(),
  reminderUpdateMany: vi.fn(),
  enqueue: vi.fn(),
  sendSms: vi.fn(),
  sendEmail: vi.fn(),
}));

vi.mock('../../config/database', () => ({
  prisma: {
    patient: { findFirst: mocks.patientFind },
    appointment: { findFirst: mocks.appointmentFind },
    reminder: {
      findFirst: mocks.reminderFind,
      create: mocks.reminderCreate,
      updateMany: mocks.reminderUpdateMany,
    },
  },
}));

vi.mock('../../jobs/producers', () => ({
  enqueueAppointmentReminder: mocks.enqueue,
}));

import { MessagingService } from './messaging.service';

function service() {
  return new MessagingService({ sendSms: mocks.sendSms } as any, { send: mocks.sendEmail } as any);
}

describe('MessagingService delivery isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.patientFind.mockResolvedValue({ id: 'patient-A' });
    mocks.appointmentFind.mockResolvedValue({ id: 'appointment-A' });
    mocks.reminderFind.mockResolvedValue({ id: 'reminder-A' });
    mocks.reminderCreate.mockResolvedValue({ id: 'reminder-A' });
    mocks.reminderUpdateMany.mockResolvedValue({ count: 1 });
    mocks.enqueue.mockResolvedValue({ id: 'job-A' });
  });

  it('rejects sending for a patient outside the practice', async () => {
    mocks.patientFind.mockResolvedValueOnce(null);
    await expect(
      service().send('practice-A', {
        patientId: 'patient-B',
        channel: 'sms',
        to: '+14165550100',
        body: 'Reminder',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(mocks.sendSms).not.toHaveBeenCalled();
  });

  it('rejects an appointment that does not belong to the patient', async () => {
    mocks.appointmentFind.mockResolvedValueOnce(null);
    await expect(
      service().scheduleReminder('practice-A', {
        patientId: 'patient-A',
        appointmentId: 'appointment-B',
        channel: 'email',
        type: 'appointment_reminder',
        to: 'patient@example.com',
        body: 'Reminder',
        scheduledAt: '2030-01-01T10:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(mocks.reminderCreate).not.toHaveBeenCalled();
  });

  it('persists recovery data and uses a deterministic queue job ID', async () => {
    await service().scheduleReminder('practice-A', {
      patientId: 'patient-A',
      appointmentId: 'appointment-A',
      channel: 'email',
      type: 'appointment_reminder',
      to: 'patient@example.com',
      subject: 'Upcoming visit',
      body: '<p>Reminder</p>',
      scheduledAt: '2030-01-01T10:00:00.000Z',
    });

    expect(mocks.reminderCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            to: 'patient@example.com',
            subject: 'Upcoming visit',
            body: '<p>Reminder</p>',
          }),
        }),
      }),
    );
    expect(mocks.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({ reminderId: 'reminder-A' }),
      expect.objectContaining({ jobId: 'reminder:reminder-A' }),
    );
  });
});
