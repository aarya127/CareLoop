const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://careloop-tf2l.onrender.com';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'void';
export type PayerType = 'patient' | 'insurance';
export type PaymentMethod = 'card' | 'cash' | 'insurance' | 'check' | 'ach';
export type PaymentStatus = 'pending' | 'completed' | 'refunded' | 'failed';

export interface LineItem {
  description: string;
  procedureCode?: string;
  qty: number;
  unitPriceCents: number;
}

export interface Invoice {
  id: string;
  practiceId: string;
  patientId: string;
  treatmentId?: string | null;
  payerType: PayerType;
  status: InvoiceStatus;
  totalAmountCents: number;
  lineItems?: LineItem[] | null;
  notes?: string | null;
  dueDate?: string | null;
  issuedAt?: string | null;
  paidAt?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  payments?: PaymentRecord[];
}

export interface PaymentRecord {
  id: string;
  practiceId: string;
  invoiceId: string;
  patientId: string;
  payerType: PayerType;
  method: PaymentMethod;
  amountCents: number;
  status: PaymentStatus;
  transactionRef?: string | null;
  createdBy?: string | null;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BillingSummary {
  totalInvoicedCents: number;
  totalPaidCents: number;
  outstandingCents: number;
  overdueCount: number;
  invoiceCount: number;
  byStatus: Record<InvoiceStatus, number>;
}

export interface CreateInvoiceInput {
  practiceId: string;
  patientId: string;
  treatmentId?: string;
  payerType?: PayerType;
  totalAmountCents: number;
  lineItems?: LineItem[];
  notes?: string;
  dueDate?: string;
}

export interface UpdateInvoiceInput {
  status?: InvoiceStatus;
  payerType?: PayerType;
  totalAmountCents?: number;
  lineItems?: LineItem[];
  notes?: string;
  dueDate?: string;
}

export interface CreatePaymentInput {
  practiceId: string;
  invoiceId: string;
  patientId: string;
  payerType?: PayerType;
  method: PaymentMethod;
  amountCents: number;
  transactionRef?: string;
  paidAt?: string;
}

// ---------------------------------------------------------------------------
// Status display helpers
// ---------------------------------------------------------------------------

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
  overdue: 'Overdue',
  void: 'Void',
};

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  void: 'bg-gray-100 text-gray-400 line-through',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  card: 'Card',
  cash: 'Cash',
  insurance: 'Insurance',
  check: 'Check',
  ach: 'ACH',
};

// ---------------------------------------------------------------------------
// Fetch helper
// ---------------------------------------------------------------------------

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    credentials: 'include',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((err as { message?: string }).message ?? res.statusText);
  }

  // 204 no-content
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Invoices API
// ---------------------------------------------------------------------------

export interface InvoiceFilter {
  practiceId?: string;
  patientId?: string;
  status?: InvoiceStatus;
  from?: string;
  to?: string;
}

function buildQs(params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') qs.set(k, v);
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}

export const invoicesApi = {
  list: (filter: InvoiceFilter) =>
    apiFetch<Invoice[]>(`/billing/invoices${buildQs(filter as Record<string, string | undefined>)}`),

  getById: (id: string) => apiFetch<Invoice>(`/billing/invoices/${id}`),

  create: (dto: CreateInvoiceInput, actorUserId?: string) =>
    apiFetch<Invoice>('/billing/invoices', {
      method: 'POST',
      body: JSON.stringify(dto),
      headers: actorUserId ? { 'x-actor-user-id': actorUserId } : {},
    }),

  update: (id: string, dto: UpdateInvoiceInput, actorUserId?: string) =>
    apiFetch<Invoice>(`/billing/invoices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
      headers: actorUserId ? { 'x-actor-user-id': actorUserId } : {},
    }),

  send: (id: string, actorUserId?: string) =>
    apiFetch<Invoice>(`/billing/invoices/${id}/send`, {
      method: 'POST',
      headers: actorUserId ? { 'x-actor-user-id': actorUserId } : {},
    }),

  void: (id: string, actorUserId?: string) =>
    apiFetch<Invoice>(`/billing/invoices/${id}/void`, {
      method: 'POST',
      headers: actorUserId ? { 'x-actor-user-id': actorUserId } : {},
    }),
};

// ---------------------------------------------------------------------------
// Billing summary API
// ---------------------------------------------------------------------------

export interface SummaryFilter {
  practiceId: string;
  patientId?: string;
  from?: string;
  to?: string;
}

export const billingSummaryApi = {
  get: (filter: SummaryFilter) =>
    apiFetch<BillingSummary>(`/billing/summary${buildQs(filter as Record<string, string | undefined>)}`),
};

// ---------------------------------------------------------------------------
// Payments API
// ---------------------------------------------------------------------------

export interface PaymentFilter {
  practiceId?: string;
  patientId?: string;
  invoiceId?: string;
  status?: PaymentStatus;
}

export const paymentsApi = {
  list: (filter: PaymentFilter) =>
    apiFetch<PaymentRecord[]>(`/payments${buildQs(filter as Record<string, string | undefined>)}`),

  getById: (id: string) => apiFetch<PaymentRecord>(`/payments/${id}`),

  create: (dto: CreatePaymentInput, idempotencyKey?: string, actorUserId?: string) =>
    apiFetch<PaymentRecord>('/payments', {
      method: 'POST',
      body: JSON.stringify(dto),
      headers: {
        ...(idempotencyKey ? { 'idempotency-key': idempotencyKey } : {}),
        ...(actorUserId ? { 'x-actor-user-id': actorUserId } : {}),
      },
    }),

  update: (id: string, dto: { status?: PaymentStatus; transactionRef?: string }, actorUserId?: string) =>
    apiFetch<PaymentRecord>(`/payments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
      headers: actorUserId ? { 'x-actor-user-id': actorUserId } : {},
    }),
};
