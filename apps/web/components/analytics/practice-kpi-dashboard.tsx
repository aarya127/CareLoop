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

type AdminOverview = {
  users: {
    total: number;
    active: number;
    newThisMonth: number;
    leftThisMonth: number;
    monthlyGrowthPct: number;
    leftReasons: Array<{ reason: string; count: number }>;
  };
  patients: {
    total: number;
    newThisMonth: number;
  };
  appointments: {
    thisMonth: number;
    completedThisMonth: number;
    completionRatePct: number;
  };
  activity: {
    transcriptsThisMonth: number;
    conversationsThisMonth: number;
  };
};

type DecisionAction = {
  actionKey: string;
  trigger: string;
  decision: string;
  automation: string;
  priority: 'high' | 'medium' | 'low';
};

type PhaseOverviewPayload = {
  phase: string;
  rangeDays: number;
  metrics: {
    noShowRatePct: number;
    sameDayVacancyRatePct: number;
    communicationConversionPct: number;
    recallCompliancePct: number;
    treatmentAcceptancePct: number;
    appointmentsInRange: number;
    conversationsInRange: number;
    patientsTotal: number;
  };
  decisions: DecisionAction[];
};

type PhaseRoadmapPayload = {
  mvp: {
    status: string;
    top5Metrics: string[];
    automations: string[];
  };
  phase2: {
    status: string;
    deliverables: string[];
  };
  phase3: {
    status: string;
    deliverables: string[];
  };
};

type DashboardPayload = {
  ok: boolean;
  summary: ApiPayload['summary'];
  timeline: ApiPayload['timeline'];
  recentCalls: ApiPayload['recentCalls'];
  overview: AdminOverview | null;
  phaseOverview: PhaseOverviewPayload | null;
  phaseRoadmap: PhaseRoadmapPayload | null;
};

function toDateLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function PracticeKpiDashboard() {
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [data, setData] = useState<ApiPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [phaseOverview, setPhaseOverview] = useState<PhaseOverviewPayload | null>(null);
  const [phaseRoadmap, setPhaseRoadmap] = useState<PhaseRoadmapPayload | null>(null);
  const [runningActionKey, setRunningActionKey] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<Record<string, string>>({});
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedFeedback, setSeedFeedback] = useState('');

  const loadAnalytics = async (activeRange: '7d' | '30d' | '90d') => {
    const res = await fetch(`/api/analytics/dashboard?range=${activeRange}&practiceId=demo-practice`, {
      credentials: 'include',
    });
    const payload = (await res.json()) as DashboardPayload;

    setData({
      ok: payload.ok,
      summary: payload.summary,
      timeline: payload.timeline,
      recentCalls: payload.recentCalls,
    });
    setOverview(payload.overview);
    setPhaseOverview(payload.phaseOverview);
    setPhaseRoadmap(payload.phaseRoadmap);
  };

  const triggerAutomation = async (actionKey: string) => {
    setRunningActionKey(actionKey);
    setActionFeedback((prev) => ({ ...prev, [actionKey]: '' }));
    try {
      const res = await fetch('http://localhost:3001/analytics/automation/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionKey, practiceId: 'demo-practice' }),
      });
      const json = (await res.json()) as { ok?: boolean; message?: string };
      setActionFeedback((prev) => ({
        ...prev,
        [actionKey]: json?.message ?? (json?.ok ? 'Automation triggered.' : 'Automation failed.'),
      }));
    } catch {
      setActionFeedback((prev) => ({
        ...prev,
        [actionKey]: 'Unable to trigger automation right now.',
      }));
    } finally {
      setRunningActionKey(null);
    }
  };

  const seedPhase1Data = async () => {
    setSeedLoading(true);
    setSeedFeedback('');
    try {
      const res = await fetch('http://localhost:3001/analytics/seed-phase1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ practiceId: 'demo-practice' }),
      });
      const json = (await res.json()) as { ok?: boolean; fallback?: string; message?: string };

      if (json?.ok) {
        await loadAnalytics(range);
        setSeedFeedback(
          json.fallback === 'synthetic'
            ? 'Seeded synthetic Phase 1 data (DB unavailable).'
            : 'Seeded Phase 1 data successfully.'
        );
      } else {
        setSeedFeedback(json?.message ?? 'Unable to seed Phase 1 data.');
      }
    } catch {
      setSeedFeedback('Unable to seed Phase 1 data right now.');
    } finally {
      setSeedLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    loadAnalytics(range)
      .then(() => {
        if (!mounted) return;
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
          {seedFeedback && <p className="text-xs text-indigo-700 mt-1">{seedFeedback}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={seedPhase1Data}
            disabled={seedLoading}
            className="px-3 py-1.5 rounded-md text-sm border border-indigo-300 text-indigo-700 hover:bg-indigo-50 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {seedLoading ? 'Seeding...' : 'Seed Phase 1 Test Data'}
          </button>
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

      {overview && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-medium text-gray-700">Operational Overview (This Month)</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-md border border-gray-200 p-3">
              <p className="text-xs text-gray-500">New Users</p>
              <p className="text-2xl font-bold text-gray-900">{overview.users.newThisMonth}</p>
              <p className="text-xs text-gray-500">{overview.users.leftThisMonth} left</p>
            </div>
            <div className="rounded-md border border-gray-200 p-3">
              <p className="text-xs text-gray-500">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{overview.users.active}</p>
              <p className="text-xs text-gray-500">{overview.users.total} total</p>
            </div>
            <div className="rounded-md border border-gray-200 p-3">
              <p className="text-xs text-gray-500">Patients</p>
              <p className="text-2xl font-bold text-gray-900">{overview.patients.total}</p>
              <p className="text-xs text-gray-500">+{overview.patients.newThisMonth} this month</p>
            </div>
            <div className="rounded-md border border-gray-200 p-3">
              <p className="text-xs text-gray-500">Appointments Completion</p>
              <p className="text-2xl font-bold text-gray-900">{overview.appointments.completionRatePct}%</p>
              <p className="text-xs text-gray-500">
                {overview.appointments.completedThisMonth}/{overview.appointments.thisMonth} completed
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-md border border-gray-200 p-3">
              <p className="text-xs text-gray-500">User Growth Trend</p>
              <p className="text-xl font-semibold text-gray-900">{overview.users.monthlyGrowthPct}%</p>
            </div>
            <div className="rounded-md border border-gray-200 p-3">
              <p className="text-xs text-gray-500">Voice Transcripts</p>
              <p className="text-xl font-semibold text-gray-900">{overview.activity.transcriptsThisMonth}</p>
            </div>
            <div className="rounded-md border border-gray-200 p-3">
              <p className="text-xs text-gray-500">New Conversations</p>
              <p className="text-xl font-semibold text-gray-900">{overview.activity.conversationsThisMonth}</p>
            </div>
          </div>

          <div className="mt-4 rounded-md border border-gray-200 p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Client / user exit reasons</p>
            {overview.users.leftReasons.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {overview.users.leftReasons.map((item) => (
                  <span key={item.reason} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                    {item.reason}: {item.count}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-600">No removal reasons recorded yet.</p>
            )}
          </div>
        </div>
      )}

      {phaseOverview && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-700">Phase 1 (MVP) Live Decision Actions</h2>
            <span className="text-xs uppercase tracking-wide rounded-full px-2 py-1 bg-indigo-100 text-indigo-700">
              {phaseOverview.phase}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="rounded-md border border-gray-200 p-3">
              <p className="text-xs text-gray-500">No-show Rate</p>
              <p className="text-xl font-semibold text-gray-900">{phaseOverview.metrics.noShowRatePct}%</p>
            </div>
            <div className="rounded-md border border-gray-200 p-3">
              <p className="text-xs text-gray-500">Same-day Vacancy</p>
              <p className="text-xl font-semibold text-gray-900">{phaseOverview.metrics.sameDayVacancyRatePct}%</p>
            </div>
            <div className="rounded-md border border-gray-200 p-3">
              <p className="text-xs text-gray-500">Comms Conversion</p>
              <p className="text-xl font-semibold text-gray-900">{phaseOverview.metrics.communicationConversionPct}%</p>
            </div>
            <div className="rounded-md border border-gray-200 p-3">
              <p className="text-xs text-gray-500">Recall Compliance</p>
              <p className="text-xl font-semibold text-gray-900">{phaseOverview.metrics.recallCompliancePct}%</p>
            </div>
            <div className="rounded-md border border-gray-200 p-3">
              <p className="text-xs text-gray-500">Treatment Acceptance</p>
              <p className="text-xl font-semibold text-gray-900">{phaseOverview.metrics.treatmentAcceptancePct}%</p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {phaseOverview.decisions.length === 0 && (
              <p className="text-sm text-gray-500">No immediate automations triggered. Metrics are within threshold.</p>
            )}
            {phaseOverview.decisions.map((item, idx) => (
              <div key={`${item.trigger}-${idx}`} className="rounded-md border border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">{item.trigger}</p>
                  <span
                    className={`text-xs rounded-full px-2 py-1 ${
                      item.priority === 'high'
                        ? 'bg-red-100 text-red-700'
                        : item.priority === 'medium'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {item.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mt-1">
                  <span className="font-medium">Decision:</span> {item.decision}
                </p>
                <p className="text-sm text-indigo-700 mt-0.5">
                  <span className="font-medium">Automation:</span> {item.automation}
                </p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <button
                    onClick={() => triggerAutomation(item.actionKey)}
                    disabled={runningActionKey === item.actionKey}
                    className="text-xs rounded-md px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {runningActionKey === item.actionKey ? 'Running...' : 'Run Automation'}
                  </button>
                  {actionFeedback[item.actionKey] && (
                    <p className="text-xs text-gray-600 text-right">{actionFeedback[item.actionKey]}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {phaseRoadmap && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-medium text-gray-700">Phase 2/3 Rollout Panel</h2>
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="rounded-md border border-gray-200 p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Phase 1</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">{phaseRoadmap.mvp.status}</p>
              <ul className="mt-2 text-sm text-gray-700 list-disc pl-4 space-y-1">
                {phaseRoadmap.mvp.top5Metrics.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-md border border-gray-200 p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Phase 2</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">{phaseRoadmap.phase2.status}</p>
              <ul className="mt-2 text-sm text-gray-700 list-disc pl-4 space-y-1">
                {phaseRoadmap.phase2.deliverables.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-md border border-gray-200 p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Phase 3</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">{phaseRoadmap.phase3.status}</p>
              <ul className="mt-2 text-sm text-gray-700 list-disc pl-4 space-y-1">
                {phaseRoadmap.phase3.deliverables.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

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
