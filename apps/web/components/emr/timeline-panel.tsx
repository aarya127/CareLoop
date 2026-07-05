'use client';

import React, { useEffect, useState } from 'react';
import { Stethoscope, FileText, Image as ImageIcon, Calendar, Activity } from 'lucide-react';
import { emrApi, type TimelineEvent } from '@/lib/api/emr';
import { StatusChip } from './emr-chips';

const ICON: Record<TimelineEvent['type'], React.ComponentType<{ className?: string }>> = {
  encounter: Stethoscope,
  treatment: Activity,
  document: FileText,
  appointment: Calendar,
};
const DOT: Record<TimelineEvent['type'], string> = {
  encounter: 'bg-sky-500',
  treatment: 'bg-violet-500',
  document: 'bg-amber-500',
  appointment: 'bg-emerald-500',
};

export default function TimelinePanel({ patientId }: { patientId: string }) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    emrApi
      .getTimeline(patientId)
      .then((rows) => {
        setEvents(rows);
        setError('');
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load timeline'))
      .finally(() => setLoading(false));
  }, [patientId]);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Activity className="h-5 w-5 text-[#2f6f95]" />
        <h2 className="text-base font-semibold text-gray-900">Patient Timeline</h2>
        <span className="text-sm text-gray-400">({events.length})</span>
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="py-6 text-center text-sm text-gray-400">Loading timeline…</p>
      ) : events.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">No clinical activity yet.</p>
      ) : (
        <ol className="relative ml-3 border-l border-gray-200">
          {events.map((ev) => {
            const Icon = ICON[ev.type];
            return (
              <li key={`${ev.type}-${ev.id}`} className="mb-5 ml-6">
                <span
                  className={`absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white ${DOT[ev.type]}`}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Icon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">{ev.title}</span>
                  {ev.status && <StatusChip status={ev.status} />}
                  <span className="ml-auto text-xs text-gray-400">
                    {String(ev.date).slice(0, 10)}
                  </span>
                </div>
                {ev.detail && <p className="mt-0.5 text-sm text-gray-500">{ev.detail}</p>}
                <p className="text-[11px] uppercase tracking-wide text-gray-300">{ev.type}</p>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
