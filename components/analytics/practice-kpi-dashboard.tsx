'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts';

type KpiRow = {
  id: number;
  kpiDate: string;
  metricName: string;
  metricValue: number;
};

type RecentCall = {
  id: string;
  callSid: string;
  sentimentScore: number | null;
  treatmentAcceptance: boolean | null;
  createdAt: string;
};

type ApiPayload = {
  ok: boolean;
  summary: {
    avgSentiment: number;
    acceptanceRate: number;
    totalCalls: number;
  };
  timeline: KpiRow[];
  recentCalls: RecentCall[];
};

function toDateLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function PracticeKpiDashboard() {
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [data, setData] = useState<ApiPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch(`/api/analytics/overview?range=${range}`)
      .then((res) => res.json())
      .then((json: ApiPayload) => {
        if (mounted) setData(json);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [range]);

  const sentimentSeries = useMemo(() => {
    const rows = data?.timeline?.filter((r) => r.metricName === 'avg_sentiment') ?? [];
    return rows.map((row) => ({ date: toDateLabel(row.kpiDate), sentiment: row.metricValue }));
  }, [data]);

  const satisfactionSeries = useMemo(() => {
    const dentist = data?.timeline?.filter((r) => r.metricName === 'provider_satisfaction_dentist') ?? [];
    const hygienist = data?.timeline?.filter((r) => r.metricName === 'provider_satisfaction_hygienist') ?? [];

    const max = Math.max(dentist.length, hygienist.length);
    const output: Array<{ date: string; Dentist: number; Hygienist: number }> = [];

    for (let i = 0; i < max; i += 1) {
      const d = dentist[i];
      const h = hygienist[i];
      output.push({
        date: toDateLabel(d?.kpiDate ?? h?.kpiDate ?? new Date().toISOString()),
        Dentist: d?.metricValue ?? 0,
        Hygienist: h?.metricValue ?? 0,
      });
    }

    return output;
  }, [data]);

  if (loading) {
    return <div className="text-sm text-gray-500">Loading analytics...</div>;
  }

  if (!data?.ok) {
    return <div className="text-sm text-red-600">Unable to load analytics data.</div>;
  }

  const sentimentBadgeColor = (value: number | null): string => {
    if (value === null) return 'bg-gray-100 text-gray-700';
    if (value < 4) return 'bg-red-100 text-red-700';
    return 'bg-green-100 text-green-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-600 mt-1">Voice call outcomes, sentiment, and treatment acceptance</p>
        </div>
        <div className="flex items-center gap-2">
          {(['7d', '30d', '90d'] as const).map((value) => (
            <button
              key={value}
              onClick={() => setRange(value)}
              className={`px-3 py-1.5 rounded-md text-sm border ${
                range === value ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-700'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-600">Average Sentiment</p>
          <p className="text-3xl font-bold text-gray-900">{data.summary.avgSentiment.toFixed(2)} / 10</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-600">Treatment Acceptance</p>
          <p className="text-3xl font-bold text-gray-900">{data.summary.acceptanceRate.toFixed(1)}%</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-600">Total Calls (Range)</p>
          <p className="text-3xl font-bold text-gray-900">{data.summary.totalCalls}</p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-medium text-gray-700">Sentiment Trend</h2>
        <div className="h-72 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sentimentSeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[1, 10]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sentiment" stroke="#4f46e5" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-medium text-gray-700">Provider Satisfaction</h2>
        <div className="h-72 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={satisfactionSeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[1, 10]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Dentist" fill="#2563eb" />
              <Bar dataKey="Hygienist" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-medium text-gray-700">Recent Calls</h2>
        <div className="mt-3 space-y-2">
          {data.recentCalls.map((call) => (
            <div key={call.id} className="flex items-center justify-between rounded border border-gray-200 p-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{call.callSid}</p>
                <p className="text-xs text-gray-500">{new Date(call.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs rounded-full px-2 py-1 ${sentimentBadgeColor(call.sentimentScore)}`}>
                  Sentiment: {call.sentimentScore ?? 'N/A'}
                </span>
                <span
                  className={`text-xs rounded-full px-2 py-1 ${
                    call.treatmentAcceptance ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {call.treatmentAcceptance ? 'Accepted' : 'Not accepted'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
