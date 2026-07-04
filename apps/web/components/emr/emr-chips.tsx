'use client';

import React from 'react';

// Shared EMR status / severity chips. Consistent, color-coded, compact — used
// across the chart header, medical-history, encounters, and clinical pages.

type Tone = 'red' | 'orange' | 'amber' | 'green' | 'blue' | 'gray' | 'purple';

const TONES: Record<Tone, string> = {
  red: 'bg-red-100 text-red-700 ring-red-600/20',
  orange: 'bg-orange-100 text-orange-700 ring-orange-600/20',
  amber: 'bg-amber-100 text-amber-800 ring-amber-600/20',
  green: 'bg-emerald-100 text-emerald-700 ring-emerald-600/20',
  blue: 'bg-sky-100 text-sky-700 ring-sky-600/20',
  gray: 'bg-gray-100 text-gray-600 ring-gray-500/20',
  purple: 'bg-violet-100 text-violet-700 ring-violet-600/20',
};

export function Chip({
  children,
  tone = 'gray',
  className = '',
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

const SEVERITY_TONE: Record<string, Tone> = {
  mild: 'amber',
  moderate: 'orange',
  severe: 'red',
  life_threatening: 'red',
};

export function SeverityChip({ severity }: { severity: string }) {
  const label = severity.replace(/_/g, ' ');
  return (
    <Chip tone={SEVERITY_TONE[severity] ?? 'gray'}>
      {severity === 'life_threatening' && <span aria-hidden>▲</span>}
      {label}
    </Chip>
  );
}

const STATUS_TONE: Record<string, Tone> = {
  active: 'green',
  inactive: 'gray',
  resolved: 'gray',
  chronic: 'purple',
  discontinued: 'gray',
  planned: 'blue',
  draft: 'amber',
  signed: 'green',
  amended: 'purple',
  in_progress: 'blue',
  completed: 'green',
  cancelled: 'gray',
};

export function StatusChip({ status }: { status: string }) {
  return <Chip tone={STATUS_TONE[status] ?? 'gray'}>{status.replace(/_/g, ' ')}</Chip>;
}
