export interface Invoice {
  id: string;
  patientId: string;
  appointmentId?: string;
  lineItems: LineItem[];
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  paidCents: number;
  balanceCents: number;
  status: InvoiceStatus;
  dueDate: string;
  sentAt?: string;
  paidAt?: string;
  createdAt: string;
}

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface LineItem {
  id: string;
  description: string;
  procedureCode?: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amountCents: number;
  method: 'CASH' | 'CARD' | 'CHECK' | 'INSURANCE';
  reference?: string;
  processedAt: string;
}
