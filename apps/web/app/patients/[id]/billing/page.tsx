'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  invoicesApi,
  paymentsApi,
  billingSummaryApi,
  type Invoice,
  type PaymentRecord,
  type BillingSummary,
  type CreateInvoiceInput,
  type CreatePaymentInput,
  type InvoiceStatus,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
  PAYMENT_METHOD_LABELS,
} from '@/lib/api/billing';

const DEMO_PRACTICE_ID = process.env.NEXT_PUBLIC_DEMO_PRACTICE_ID ?? 'demo-practice';
const DEMO_USER_ID = process.env.NEXT_PUBLIC_DEMO_USER_ID ?? 'user-admin';

function formatCents(cents: number) {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Summary Card ────────────────────────────────────────────────────────────

function SummaryCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Status Badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${INVOICE_STATUS_COLORS[status]}`}>
      {INVOICE_STATUS_LABELS[status]}
    </span>
  );
}

// ─── Create Invoice Form ──────────────────────────────────────────────────────

interface InvoiceFormState {
  totalAmountCents: string;
  payerType: 'patient' | 'insurance';
  notes: string;
  dueDate: string;
}

const DEFAULT_FORM: InvoiceFormState = {
  totalAmountCents: '',
  payerType: 'patient',
  notes: '',
  dueDate: '',
};

// ─── Create Payment Modal ─────────────────────────────────────────────────────

interface PaymentFormState {
  amountCents: string;
  method: 'card' | 'cash' | 'insurance' | 'check' | 'ach';
  transactionRef: string;
  payerType: 'patient' | 'insurance';
}

const DEFAULT_PAYMENT_FORM: PaymentFormState = {
  amountCents: '',
  method: 'card',
  transactionRef: '',
  payerType: 'patient',
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PatientBillingPage() {
  const params = useParams<{ id: string }>();
  const patientId = params.id;

  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invoice form
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState<InvoiceFormState>(DEFAULT_FORM);
  const [invoiceSubmitting, setInvoiceSubmitting] = useState(false);

  // Payment modal
  const [paymentTarget, setPaymentTarget] = useState<Invoice | null>(null);
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>(DEFAULT_PAYMENT_FORM);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  // Selected invoice for payment detail
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sum, invs, pays] = await Promise.all([
        billingSummaryApi.get({ practiceId: DEMO_PRACTICE_ID, patientId }),
        invoicesApi.list({ practiceId: DEMO_PRACTICE_ID, patientId }),
        paymentsApi.list({ practiceId: DEMO_PRACTICE_ID, patientId }),
      ]);
      setSummary(sum);
      setInvoices(invs);
      setPayments(pays);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load billing data');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ── Invoice actions ──────────────────────────────────────────────────────

  async function handleCreateInvoice(e: React.FormEvent) {
    e.preventDefault();
    setInvoiceSubmitting(true);
    try {
      const dto: CreateInvoiceInput = {
        practiceId: DEMO_PRACTICE_ID,
        patientId,
        payerType: invoiceForm.payerType,
        totalAmountCents: Math.round(parseFloat(invoiceForm.totalAmountCents) * 100),
        notes: invoiceForm.notes || undefined,
        dueDate: invoiceForm.dueDate || undefined,
      };
      await invoicesApi.create(dto, DEMO_USER_ID);
      setInvoiceForm(DEFAULT_FORM);
      setShowInvoiceForm(false);
      await loadAll();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to create invoice');
    } finally {
      setInvoiceSubmitting(false);
    }
  }

  async function handleSendInvoice(id: string) {
    try {
      await invoicesApi.send(id, DEMO_USER_ID);
      await loadAll();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to send invoice');
    }
  }

  async function handleVoidInvoice(id: string) {
    if (!confirm('Void this invoice? This cannot be undone.')) return;
    try {
      await invoicesApi.void(id, DEMO_USER_ID);
      await loadAll();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to void invoice');
    }
  }

  // ── Payment actions ──────────────────────────────────────────────────────

  async function handleCreatePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!paymentTarget) return;
    setPaymentSubmitting(true);
    try {
      const dto: CreatePaymentInput = {
        practiceId: DEMO_PRACTICE_ID,
        invoiceId: paymentTarget.id,
        patientId,
        payerType: paymentForm.payerType,
        method: paymentForm.method,
        amountCents: Math.round(parseFloat(paymentForm.amountCents) * 100),
        transactionRef: paymentForm.transactionRef || undefined,
      };
      // Generate simple idempotency key from form data + timestamp
      const idemKey = `pay-${patientId}-${paymentTarget.id}-${Date.now()}`;
      await paymentsApi.create(dto, idemKey, DEMO_USER_ID);
      setPaymentTarget(null);
      setPaymentForm(DEFAULT_PAYMENT_FORM);
      await loadAll();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to record payment');
    } finally {
      setPaymentSubmitting(false);
    }
  }

  // ── Derived ──────────────────────────────────────────────────────────────

  const selectedPayments = selectedInvoiceId
    ? payments.filter((p) => p.invoiceId === selectedInvoiceId)
    : [];

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <main className="p-6">
        <p className="text-gray-400 animate-pulse">Loading billing data…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-6">
        <p className="text-red-600">{error}</p>
        <button onClick={loadAll} className="mt-2 text-sm text-blue-600 hover:underline">
          Retry
        </button>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Billing</h1>
          <p className="text-sm text-gray-500 mt-0.5">Patient · {patientId}</p>
        </div>
        <button
          onClick={() => setShowInvoiceForm((v) => !v)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          {showInvoiceForm ? 'Cancel' : '+ New Invoice'}
        </button>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard label="Total Invoiced" value={formatCents(summary.totalInvoicedCents)} sub={`${summary.invoiceCount} invoice${summary.invoiceCount !== 1 ? 's' : ''}`} />
          <SummaryCard label="Total Paid" value={formatCents(summary.totalPaidCents)} />
          <SummaryCard label="Outstanding" value={formatCents(summary.outstandingCents)} />
          <SummaryCard label="Overdue" value={String(summary.overdueCount)} sub="invoices" />
        </div>
      )}

      {/* New invoice form */}
      {showInvoiceForm && (
        <form
          onSubmit={handleCreateInvoice}
          className="rounded-xl border bg-white p-4 shadow-sm space-y-3"
        >
          <h2 className="text-sm font-semibold text-gray-700">New Invoice</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={invoiceForm.totalAmountCents}
                onChange={(e) => setInvoiceForm((f) => ({ ...f, totalAmountCents: e.target.value }))}
                className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Payer Type</label>
              <select
                value={invoiceForm.payerType}
                onChange={(e) => setInvoiceForm((f) => ({ ...f, payerType: e.target.value as 'patient' | 'insurance' }))}
                className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="patient">Patient</option>
                <option value="insurance">Insurance</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Due Date</label>
              <input
                type="date"
                value={invoiceForm.dueDate}
                onChange={(e) => setInvoiceForm((f) => ({ ...f, dueDate: e.target.value }))}
                className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Notes</label>
              <input
                type="text"
                value={invoiceForm.notes}
                onChange={(e) => setInvoiceForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => { setShowInvoiceForm(false); setInvoiceForm(DEFAULT_FORM); }}
              className="rounded-md border px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={invoiceSubmitting}
              className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {invoiceSubmitting ? 'Creating…' : 'Create Invoice'}
            </button>
          </div>
        </form>
      )}

      {/* Invoices table */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Invoices</h2>
        {invoices.length === 0 ? (
          <p className="text-sm text-gray-400">No invoices yet.</p>
        ) : (
          <div className="rounded-xl border overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Amount', 'Status', 'Payer', 'Due', 'Issued', 'Payments', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {invoices.map((inv) => {
                  const invPayments = payments.filter((p) => p.invoiceId === inv.id);
                  const paidSoFar = invPayments
                    .filter((p) => p.status === 'completed')
                    .reduce((s, p) => s + p.amountCents, 0);

                  return (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium text-gray-900">{formatCents(inv.totalAmountCents)}</td>
                      <td className="px-4 py-2"><StatusBadge status={inv.status} /></td>
                      <td className="px-4 py-2 text-gray-600 capitalize">{inv.payerType}</td>
                      <td className="px-4 py-2 text-gray-500">{formatDate(inv.dueDate)}</td>
                      <td className="px-4 py-2 text-gray-500">{formatDate(inv.issuedAt)}</td>
                      <td className="px-4 py-2 text-gray-600">
                        <button
                          onClick={() => setSelectedInvoiceId(selectedInvoiceId === inv.id ? null : inv.id)}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          {formatCents(paidSoFar)} / {invPayments.length} payment{invPayments.length !== 1 ? 's' : ''}
                        </button>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2 flex-wrap">
                          {inv.status === 'draft' && (
                            <button
                              onClick={() => handleSendInvoice(inv.id)}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Send
                            </button>
                          )}
                          {['sent', 'overdue'].includes(inv.status) && (
                            <button
                              onClick={() => { setPaymentTarget(inv); setPaymentForm(DEFAULT_PAYMENT_FORM); }}
                              className="text-xs text-green-600 hover:underline"
                            >
                              + Payment
                            </button>
                          )}
                          {inv.status !== 'void' && inv.status !== 'paid' && (
                            <button
                              onClick={() => handleVoidInvoice(inv.id)}
                              className="text-xs text-red-500 hover:underline"
                            >
                              Void
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Payment detail panel */}
      {selectedInvoiceId && selectedPayments.length > 0 && (
        <section className="rounded-xl border bg-white shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Payments for invoice
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr>
                {['Amount', 'Method', 'Payer', 'Status', 'Paid At', 'Ref'].map((h) => (
                  <th key={h} className="pb-1 text-left text-xs font-medium text-gray-400 uppercase tracking-wide pr-4">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {selectedPayments.map((pay) => (
                <tr key={pay.id}>
                  <td className="py-1.5 pr-4 font-medium text-gray-900">{formatCents(pay.amountCents)}</td>
                  <td className="py-1.5 pr-4 text-gray-600">{PAYMENT_METHOD_LABELS[pay.method]}</td>
                  <td className="py-1.5 pr-4 text-gray-500 capitalize">{pay.payerType}</td>
                  <td className="py-1.5 pr-4">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      pay.status === 'completed' ? 'bg-green-100 text-green-700' :
                      pay.status === 'refunded' ? 'bg-yellow-100 text-yellow-700' :
                      pay.status === 'failed' ? 'bg-red-100 text-red-600' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {pay.status}
                    </span>
                  </td>
                  <td className="py-1.5 pr-4 text-gray-500">{formatDate(pay.paidAt)}</td>
                  <td className="py-1.5 text-gray-400 font-mono text-xs">{pay.transactionRef ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Add payment modal */}
      {paymentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <form
            onSubmit={handleCreatePayment}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4"
          >
            <h2 className="text-base font-semibold text-gray-900">Record Payment</h2>
            <p className="text-xs text-gray-500">
              Invoice: {formatCents(paymentTarget.totalAmountCents)}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={paymentForm.amountCents}
                  onChange={(e) => setPaymentForm((f) => ({ ...f, amountCents: e.target.value }))}
                  className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Method</label>
                <select
                  value={paymentForm.method}
                  onChange={(e) => setPaymentForm((f) => ({ ...f, method: e.target.value as PaymentFormState['method'] }))}
                  className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="card">Card</option>
                  <option value="cash">Cash</option>
                  <option value="insurance">Insurance</option>
                  <option value="check">Check</option>
                  <option value="ach">ACH</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Payer Type</label>
                <select
                  value={paymentForm.payerType}
                  onChange={(e) => setPaymentForm((f) => ({ ...f, payerType: e.target.value as 'patient' | 'insurance' }))}
                  className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="patient">Patient</option>
                  <option value="insurance">Insurance</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Transaction Ref</label>
                <input
                  type="text"
                  value={paymentForm.transactionRef}
                  onChange={(e) => setPaymentForm((f) => ({ ...f, transactionRef: e.target.value }))}
                  className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={() => setPaymentTarget(null)}
                className="rounded-md border px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={paymentSubmitting}
                className="rounded-md bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {paymentSubmitting ? 'Recording…' : 'Record Payment'}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

