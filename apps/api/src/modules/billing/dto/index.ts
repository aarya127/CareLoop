export interface LineItemDto {
  description: string;
  procedureCode?: string;
  qty: number;
  unitPriceCents: number;
}

export interface CreateInvoiceDto {
  practiceId: string;
  patientId: string;
  treatmentId?: string;
  payerType?: string;       // 'patient' | 'insurance'
  totalAmountCents: number;
  lineItems?: LineItemDto[];
  notes?: string;
  dueDate?: string;
}

export interface UpdateInvoiceDto {
  status?: string;          // draft | sent | paid | overdue | void
  payerType?: string;
  totalAmountCents?: number;
  lineItems?: LineItemDto[];
  notes?: string;
  dueDate?: string;
  paidAt?: string;
}

export interface BillingSummaryQuery {
  practiceId: string;
  patientId?: string;
  from?: string;
  to?: string;
}

export interface InvoiceFilter {
  practiceId?: string;
  patientId?: string;
  status?: string;
  from?: string;
  to?: string;
}
