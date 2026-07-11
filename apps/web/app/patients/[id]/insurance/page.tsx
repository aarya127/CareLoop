'use client';

import { useEffect, useState, use } from 'react';

interface Coverage {
  annualMaximumCents?: number;
  deductibleCents?: number;
  usedToDateCents?: number;
  preventivePct?: number;
  basicPct?: number;
  majorPct?: number;
  orthoPct?: number;
}

interface CoverageResponse {
  hasCoverage: boolean;
  payerName?: string;
  planName?: string;
  verifiedAt?: string | null;
  coverage?: Coverage;
  remainingBenefitCents?: number | null;
}

interface Props {
  params: Promise<{ id: string }>;
}

const money = (cents?: number | null) =>
  typeof cents === 'number' ? `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—';
const pct = (v?: number) => (typeof v === 'number' ? `${v}%` : '—');

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export default function PatientInsurancePage({ params }: Props) {
  const { id } = use(params);
  const [data, setData] = useState<CoverageResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/insurance/${id}/coverage`, { credentials: 'include', cache: 'no-store' })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ hasCoverage: false }))
      .finally(() => setLoading(false));
  }, [id]);

  const c = data?.coverage ?? {};

  return (
    <main className="p-6 max-w-3xl">
      <h1 className="text-2xl font-semibold text-slate-900">Insurance</h1>

      {loading ? (
        <p className="mt-4 text-sm text-slate-400">Loading coverage…</p>
      ) : !data?.hasCoverage ? (
        <p className="mt-2 text-muted-foreground">No active insurance on file for this patient.</p>
      ) : (
        <>
          <div className="mt-2 flex items-center gap-3 text-sm text-slate-600">
            <span className="font-medium text-slate-900">{data.payerName}</span>
            {data.planName && <span>· {data.planName}</span>}
            {data.verifiedAt && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                Verified {new Date(data.verifiedAt).toLocaleDateString()}
              </span>
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Annual max" value={money(c.annualMaximumCents)} />
            <Stat label="Used to date" value={money(c.usedToDateCents)} />
            <Stat label="Remaining" value={money(data.remainingBenefitCents)} />
            <Stat label="Deductible" value={money(c.deductibleCents)} />
          </div>

          <h2 className="mt-8 text-sm font-semibold text-slate-700">Coverage by category</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Preventive" value={pct(c.preventivePct)} />
            <Stat label="Basic" value={pct(c.basicPct)} />
            <Stat label="Major" value={pct(c.majorPct)} />
            <Stat label="Orthodontics" value={pct(c.orthoPct)} />
          </div>
        </>
      )}
    </main>
  );
}
