import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  lock: vi.fn(),
  invoiceFind: vi.fn(),
  aggregate: vi.fn(),
  paymentCreate: vi.fn(),
  invoiceUpdate: vi.fn(),
}));

vi.mock('@careloop/db', () => ({
  Prisma: {},
  prisma: {
    $transaction: mocks.transaction,
    paymentRecord: { create: vi.fn(), update: vi.fn() },
  },
}));

import { PaymentsRepository } from './payments.repository';

describe('PaymentsRepository invoice serialization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.lock.mockResolvedValue(1);
    mocks.invoiceFind.mockResolvedValue({
      id: 'invoice-A',
      patientId: 'patient-A',
      status: 'sent',
      totalAmountCents: 1000,
    });
    mocks.aggregate.mockResolvedValue({ _sum: { amountCents: 400 } });
    mocks.paymentCreate.mockResolvedValue({ id: 'payment-new' });
    mocks.invoiceUpdate.mockResolvedValue({});
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        $executeRaw: mocks.lock,
        invoice: { findFirst: mocks.invoiceFind, update: mocks.invoiceUpdate },
        paymentRecord: { aggregate: mocks.aggregate, create: mocks.paymentCreate },
      }),
    );
  });

  it('locks the invoice before calculating its balance and writing payment', async () => {
    const repository = new PaymentsRepository();
    const result = await repository.createAndRecalculateInvoice({
      practiceId: 'practice-A',
      invoiceId: 'invoice-A',
      patientId: 'patient-A',
      payerType: 'patient',
      method: 'card',
      amountCents: 600,
      status: 'completed',
    });

    expect(result).toMatchObject({ ok: true, payment: { id: 'payment-new' } });
    expect(mocks.lock.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.invoiceFind.mock.invocationCallOrder[0],
    );
    expect(mocks.invoiceUpdate).toHaveBeenCalledWith({
      where: { id: 'invoice-A' },
      data: expect.objectContaining({ status: 'paid' }),
    });
  });

  it('does not write when the supplied patient differs from the invoice', async () => {
    const repository = new PaymentsRepository();
    const result = await repository.createAndRecalculateInvoice({
      practiceId: 'practice-A',
      invoiceId: 'invoice-A',
      patientId: 'patient-B',
      payerType: 'patient',
      method: 'card',
      amountCents: 100,
      status: 'completed',
    });

    expect(result).toEqual({ ok: false, reason: 'patient_mismatch' });
    expect(mocks.paymentCreate).not.toHaveBeenCalled();
  });
});
