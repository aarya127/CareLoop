'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  analyticsApi,
  type AppointmentStatsResponse,
  type KpisResponse,
  type NoShowTrendResponse,
  type PatientStatsResponse,
  type PaymentsResponse,
} from '@/lib/api/analytics';

// ─── helpers ──────────────────────────────────────────────────────────────────

const PRACTICE_ID = 'demo-practice';

function fmt$(cents: number) {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(cents / 100);
}

function fmtPct(v: number) {
  return `${v.toFixed(1)}%`;
}

// ─── small components ─────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className ?? ''}`} />;
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border bg-card p-5 shadow-sm ${className ?? ''}`}>{children}</div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: 'green' | 'red' | 'yellow' | 'neutral';
}) {
  const colourMap = {
    green: 'text-emerald-600',
    red: 'text-rose-600',
    yellow: 'text-amber-600',
    neutral: 'text-foreground',
  };
  const colour = colourMap[highlight ?? 'neutral'];
  return (
    <Card>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 text-3xl font-bold tabular-nums ${colour}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </Card>
  );
}

function RangePicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const options = [7, 30, 90] as const;
  return (
    <div className="flex gap-1 rounded-lg border p-1">
      {options.map((d) => (
        <button
          key={d}
          onClick={() => onChange(d)}
          className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
            value === d
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          {d}d
        </button>
      ))}
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [rangeDays, setRangeDays] = useState(30);

  const [kpis, setKpis] = useState<KpisResponse | null>(null);
  const [payments, setPayments] = useState<PaymentsResponse | null>(null);
  const [noShow, setNoShow] = useState<NoShowTrendResponse | null>(null);
  const [appointments, setAppointments] = useState<AppointmentStatsResponse | null>(null);
  const [patients, setPatients] = useState<PatientStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (days: number) => {
      setLoading(true);
      setError(null);
      try {
        const [k, p, ns, a, pat] = await Promise.all([
          analyticsApi.kpis(PRACTICE_ID, days),
          analyticsApi.payments(PRACTICE_ID, days),
          analyticsApi.noShow(PRACTICE_ID, days),
          analyticsApi.appointments(PRACTICE_ID, days),
          analyticsApi.patients(PRACTICE_ID),
        ]);
        setKpis(k);
        setPayments(p);
        setNoShow(ns);
        setAppointments(a);
        setPatients(pat);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void load(rangeDays);
  }, [rangeDays, load]);

  const kpiMap = Object.fromEntries(kpis?.metrics.map((m) => [m.key, m]) ?? []);

  const noShowPct = kpiMap['no_show_rate']?.value ?? 0;
  const recallPct = kpiMap['recall_compliance_rate']?.value ?? 0;
  const treatmentPct = kpiMap['treatment_acceptance_rate']?.value ?? 0;

  return (
    <main className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Practice performance metrics
            {payments?.generatedAt ? ` · updated ${new Date(payments.generatedAt).toLocaleTimeString()}` : ''}
          </p>
        </div>
        <RangePicker value={rangeDays} onChange={setRangeDays} />
      </div>

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : (
          <>
            <KpiCard
              label="No-Show Rate"
              value={fmtPct(noShowPct)}
              sub={`${appointments?.appointmentsInRange ?? 0} appointments in range`}
              highlight={noShowPct > 12 ? 'red' : noShowPct > 8 ? 'yellow' : 'green'}
            />
            <KpiCard
              label="Revenue (paid)"
              value={fmt$(payments?.totalPaidCents ?? 0)}
              sub={`${fmt$(payments?.totalOutstandingCents ?? 0)} outstanding`}
              highlight="neutral"
            />
            <KpiCard
              label="Recall Compliance"
              value={fmtPct(recallPct)}
              sub={`${patients?.total ?? 0} total patients`}
              highlight={recallPct >= 60 ? 'green' : recallPct >= 40 ? 'yellow' : 'red'}
            />
            <KpiCard
              label="Treatment Acceptance"
              value={fmtPct(treatmentPct)}
              sub="based on call transcripts"
              highlight={treatmentPct >= 55 ? 'green' : treatmentPct >= 35 ? 'yellow' : 'red'}
            />
          </>
        )}
      </div>

      {/* Revenue + No-show charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Revenue chart */}
        <Card>
          <h2 className="text-sm font-semibold mb-4">Daily Revenue (paid invoices)</h2>
          {loading ? (
            <Skeleton className="h-48" />
          ) : payments?.dailyTrend.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={payments.dailyTrend} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v: string) => v.slice(5)}
                  tick={{ fontSize: 11 }}
                />
                <YAxis tickFormatter={(v: number) => `$${(v / 100).toFixed(0)}`} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v: number) => [fmt$(v), 'Revenue']}
                  labelFormatter={(l: string) => l}
                />
                <Bar dataKey="amountCents" fill="var(--color-primary, #4f46e5)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">No paid invoices in this period.</p>
          )}
          {payments && (
            <div className="mt-3 flex gap-6 text-xs text-muted-foreground">
              <span>Paid <strong className="text-foreground">{fmt$(payments.totalPaidCents)}</strong></span>
              <span>Outstanding <strong className="text-foreground">{fmt$(payments.totalOutstandingCents)}</strong></span>
              <span>Payments received <strong className="text-foreground">{payments.paymentsReceived}</strong></span>
            </div>
          )}
        </Card>

        {/* No-show trend chart */}
        <Card>
          <h2 className="text-sm font-semibold mb-4">Daily No-Show Count</h2>
          {loading ? (
            <Skeleton className="h-48" />
          ) : noShow?.dailyTrend.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={noShow.dailyTrend}
                margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v: string) => v.slice(5)}
                  tick={{ fontSize: 11 }}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v: number, name: string) => [
                    v,
                    name === 'noShow' ? 'No-shows' : 'Total',
                  ]}
                  labelFormatter={(l: string) => l}
                />
                <Bar dataKey="total" fill="#e2e8f0" radius={[3, 3, 0, 0]} name="Total" />
                <Bar dataKey="noShow" fill="#f43f5e" radius={[3, 3, 0, 0]} name="No-shows" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">No appointment data in this period.</p>
          )}
          {noShow && (
            <div className="mt-3 flex gap-6 text-xs text-muted-foreground">
              <span>Rate <strong className="text-foreground">{fmtPct(noShow.noShowRatePct)}</strong></span>
              <span>No-shows <strong className="text-foreground">{noShow.totalNoShows}</strong></span>
              <span>Total appts <strong className="text-foreground">{noShow.totalAppointments}</strong></span>
            </div>
          )}
        </Card>
      </div>

      {/* Payment status breakdown */}
      {!loading && payments && Object.keys(payments.byStatus).length > 0 && (
        <Card>
          <h2 className="text-sm font-semibold mb-4">Invoice Status Breakdown</h2>
          <div className="flex flex-wrap gap-4">
            {Object.entries(payments.byStatus).map(([status, data]) => (
              <div key={status} className="flex flex-col gap-0.5">
                <span className="text-xs font-medium capitalize text-muted-foreground">{status}</span>
                <span className="text-lg font-bold tabular-nums">{data.count}</span>
                <span className="text-xs text-muted-foreground">{fmt$(data.amountCents)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Appointments + Patients summary row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold mb-3">Appointments</h2>
          {loading ? (
            <Skeleton className="h-16" />
          ) : appointments ? (
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">In range</dt>
                <dd className="font-semibold">{appointments.appointmentsInRange}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">No-show rate</dt>
                <dd className="font-semibold">{fmtPct(appointments.noShowRatePct)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Same-day vacancy</dt>
                <dd className="font-semibold">{fmtPct(appointments.sameDayVacancyRatePct)}</dd>
              </div>
            </dl>
          ) : null}
        </Card>

        <Card>
          <h2 className="text-sm font-semibold mb-3">Patients</h2>
          {loading ? (
            <Skeleton className="h-16" />
          ) : patients ? (
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Total patients</dt>
                <dd className="font-semibold">{patients.total}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">New (30d)</dt>
                <dd className="font-semibold">{patients.newPatients30d}</dd>
              </div>
            </dl>
          ) : null}
        </Card>
      </div>
    </main>
  );
}
