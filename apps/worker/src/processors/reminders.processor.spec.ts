import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  reminderFind: vi.fn(),
  reminderUpdateMany: vi.fn(),
  twilioCreate: vi.fn(),
}));

vi.mock('@careloop/db', () => ({
  Prisma: {},
  prisma: {
    reminder: {
      findFirst: mocks.reminderFind,
      updateMany: mocks.reminderUpdateMany,
    },
    auditLog: { create: vi.fn(async () => ({})) },
  },
}));

vi.mock('twilio', () => ({
  default: vi.fn(() => ({ messages: { create: mocks.twilioCreate } })),
}));

vi.mock('nodemailer', () => ({
  default: { createTransport: vi.fn() },
}));

import { remindersProcessor } from './reminders.processor';

function job(overrides: Record<string, unknown> = {}) {
  return {
    data: {
      reminderId: 'reminder-A',
      practiceId: 'practice-A',
      patientId: 'patient-A',
      appointmentId: 'appointment-A',
      channel: 'sms',
      reminderType: 'sms',
      to: '+19999999999',
      content: 'tampered content',
      ...overrides,
    },
    log: vi.fn(),
  } as any;
}

describe('remindersProcessor queue isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TWILIO_ACCOUNT_SID = 'AC-test';
    process.env.TWILIO_AUTH_TOKEN = 'token';
    process.env.TWILIO_PHONE_NUMBER = '+14165550199';
    mocks.reminderFind.mockResolvedValue({
      status: 'pending',
      channel: 'sms',
      metadata: { to: '+14165550100', body: 'Stored reminder' },
    });
    mocks.reminderUpdateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 1 });
    mocks.twilioCreate.mockResolvedValue({ sid: 'SM-test' });
  });

  it('uses the tenant-owned database destination instead of queue content', async () => {
    await remindersProcessor(job());

    expect(mocks.reminderFind).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'reminder-A', practiceId: 'practice-A' } }),
    );
    expect(mocks.twilioCreate).toHaveBeenCalledWith({
      to: '+14165550100',
      from: '+14165550199',
      body: 'Stored reminder',
    });
    expect(mocks.reminderUpdateMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({ practiceId: 'practice-A' }),
        data: expect.objectContaining({ status: 'sending' }),
      }),
    );
  });

  it('does not send cancelled reminders', async () => {
    mocks.reminderFind.mockResolvedValueOnce({
      status: 'cancelled',
      channel: 'sms',
      metadata: { to: '+14165550100', body: 'Stored reminder' },
    });

    await remindersProcessor(job());
    expect(mocks.twilioCreate).not.toHaveBeenCalled();
    expect(mocks.reminderUpdateMany).not.toHaveBeenCalled();
  });
});
