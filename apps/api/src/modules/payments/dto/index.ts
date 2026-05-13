export interface CreatePaymentDto {
  practiceId: string;
  invoiceId: string;
  patientId: string;
  payerType?: string;       // 'patient' | 'insurance'
  method: string;           // card | cash | insurance | check | ach
  amountCents: number;
  transactionRef?: string;
  paidAt?: string;
}

export interface UpdatePaymentDto {
  status?: string;          // pending | completed | refunded | failed
  transactionRef?: string;
  paidAt?: string;
}

export interface PaymentFilter {
  practiceId?: string;
  patientId?: string;
  invoiceId?: string;
  status?: string;
  from?: string;
  to?: string;
}
