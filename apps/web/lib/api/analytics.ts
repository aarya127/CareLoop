const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { credentials: 'include' });
  if (!res.ok) throw new Error(`Analytics API error: ${res.status}`);
  return res.json() as Promise<T>;
}

export interface CoreMetrics {
  noShowRatePct: number;
  sameDayVacancyRatePct: number;
  communicationConversionPct: number;
  recallCompliancePct: number;
  treatmentAcceptancePct: number;
  appointmentsInRange: number;
  conversationsInRange: number;
  patientsTotal: number;
}

export interface KpiItem {
  key: string;
  value: number;
  unit: string;
  decision: string;
  automation: string;
}

export interface DecisionAction {
  actionKey: string;
  trigger: string;
  decision: string;
  automation: string;
  priority: 'high' | 'medium' | 'low';
}

export interface KpisResponse {
  phase: string;
  rangeDays: number;
  metrics: KpiItem[];
  actions: DecisionAction[];
}

export interface OverviewResponse {
  phase: string;
  rangeDays: number;
  metrics: CoreMetrics;
  decisions: DecisionAction[];
}

export interface AppointmentStatsResponse {
  rangeDays: number;
  appointmentsInRange: number;
  noShowRatePct: number;
  sameDayVacancyRatePct: number;
}

export interface PaymentsByStatusEntry {
  count: number;
  amountCents: number;
}

export interface PaymentsDailyEntry {
  date: string;
  amountCents: number;
  amountDollars: number;
}

export interface PaymentsResponse {
  rangeDays: number;
  currency: string;
  totalPaidCents: number;
  totalPaidDollars: number;
  totalOutstandingCents: number;
  totalOutstandingDollars: number;
  paymentsReceived: number;
  paymentsReceivedCents: number;
  byStatus: Record<string, PaymentsByStatusEntry>;
  dailyTrend: PaymentsDailyEntry[];
  generatedAt: string;
}

export interface NoShowDailyEntry {
  date: string;
  noShow: number;
  total: number;
  ratePct: number;
}

export interface NoShowTrendResponse {
  rangeDays: number;
  noShowRatePct: number;
  totalNoShows: number;
  totalAppointments: number;
  statusBreakdown: Record<string, number>;
  dailyTrend: NoShowDailyEntry[];
  generatedAt: string;
}

export interface PatientStatsResponse {
  total: number;
  newPatients30d: number;
}

function qs(practiceId: string, rangeDays: number) {
  return `?practiceId=${encodeURIComponent(practiceId)}&rangeDays=${rangeDays}`;
}

export const analyticsApi = {
  overview: (practiceId: string, rangeDays = 30) =>
    get<OverviewResponse>(`/analytics/overview${qs(practiceId, rangeDays)}`),

  kpis: (practiceId: string, rangeDays = 30) =>
    get<KpisResponse>(`/analytics/kpis${qs(practiceId, rangeDays)}`),

  appointments: (practiceId: string, rangeDays = 30) =>
    get<AppointmentStatsResponse>(`/analytics/appointments${qs(practiceId, rangeDays)}`),

  payments: (practiceId: string, rangeDays = 30) =>
    get<PaymentsResponse>(`/analytics/payments${qs(practiceId, rangeDays)}`),

  noShow: (practiceId: string, rangeDays = 30) =>
    get<NoShowTrendResponse>(`/analytics/no-show${qs(practiceId, rangeDays)}`),

  patients: (practiceId: string) =>
    get<PatientStatsResponse>(`/analytics/patients?practiceId=${encodeURIComponent(practiceId)}`),
};
