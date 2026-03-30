'use client';

import { FormEvent, useEffect, useState } from 'react';

type RoutingMode = 'ai_only' | 'manual_only' | 'ai_then_manual';

type Thresholds = {
  sentimentMin: number;
  escalateOnTreatmentDecline: boolean;
  notifyChannel: { type: 'in_app' | 'email' | 'sms'; target?: string };
};

const DEFAULT_PROMPT =
  'You are CareLoop Voice Assistant for a dental practice. Verify identity, collect intent, check insurance and scheduling tools, and safely route urgent issues to staff.';

export function SettingsPanel() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [thresholds, setThresholds] = useState<Thresholds>({
    sentimentMin: 4,
    escalateOnTreatmentDecline: true,
    notifyChannel: { type: 'in_app' },
  });
  const [policies, setPolicies] = useState<Array<{ patientType: string; mode: RoutingMode }>>([
    { patientType: 'new', mode: 'ai_then_manual' },
    { patientType: 'existing', mode: 'ai_only' },
    { patientType: 'high_anxiety', mode: 'manual_only' },
    { patientType: 'vip', mode: 'manual_only' },
    { patientType: 'pediatric', mode: 'manual_only' },
  ]);
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    Promise.all([
      fetch('/api/settings/ai-prompt').then((res) => res.json()),
      fetch('/api/settings/thresholds').then((res) => res.json()),
      fetch('/api/settings/routing-policies').then((res) => res.json()),
    ]).then(([promptData, thresholdData, policyData]) => {
      if (promptData?.activePrompt?.systemPrompt) setPrompt(promptData.activePrompt.systemPrompt);
      if (thresholdData?.config) {
        setThresholds({
          sentimentMin: thresholdData.config.sentimentMin,
          escalateOnTreatmentDecline: thresholdData.config.escalateOnTreatmentDecline,
          notifyChannel: thresholdData.config.notifyChannel ?? { type: 'in_app' },
        });
      }
      if (Array.isArray(policyData?.policies) && policyData.policies.length > 0) {
        setPolicies(policyData.policies.map((p: { patientType: string; mode: RoutingMode }) => ({ patientType: p.patientType, mode: p.mode })));
      }
    });
  }, []);

  async function savePrompt(e: FormEvent) {
    e.preventDefault();
    setStatus('Saving prompt...');
    const created = await fetch('/api/settings/ai-prompt', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ systemPrompt: prompt }),
    }).then((r) => r.json());

    if (created?.prompt?.version) {
      await fetch('/api/settings/ai-prompt', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ version: created.prompt.version }),
      });
    }

    setStatus('Prompt updated.');
  }

  async function saveThresholds(e: FormEvent) {
    e.preventDefault();
    setStatus('Saving thresholds...');
    await fetch('/api/settings/thresholds', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(thresholds),
    });
    setStatus('Thresholds updated.');
  }

  async function saveRouting(e: FormEvent) {
    e.preventDefault();
    setStatus('Saving routing policies...');
    await fetch('/api/settings/routing-policies', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(policies),
    });
    setStatus('Routing policies updated.');
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-600 mt-1">Control AI personality, alert thresholds, and manual overtake strategy</p>
      </div>

      {status ? <div className="rounded-md bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-800">{status}</div> : null}

      <form onSubmit={savePrompt} className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
        <h2 className="font-semibold text-gray-900">AI Personality Prompt</h2>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full min-h-44 rounded-md border border-gray-300 p-3 text-sm"
        />
        <button className="rounded-md bg-indigo-600 px-4 py-2 text-white text-sm">Save Prompt Version</button>
      </form>

      <form onSubmit={saveThresholds} className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
        <h2 className="font-semibold text-gray-900">Alert Thresholds</h2>
        <label className="block text-sm text-gray-700">
          Sentiment Alert Minimum (1-10)
          <input
            type="number"
            min={1}
            max={10}
            value={thresholds.sentimentMin}
            onChange={(e) => setThresholds((prev) => ({ ...prev, sentimentMin: Number(e.target.value) }))}
            className="mt-1 w-28 rounded-md border border-gray-300 p-2"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={thresholds.escalateOnTreatmentDecline}
            onChange={(e) => setThresholds((prev) => ({ ...prev, escalateOnTreatmentDecline: e.target.checked }))}
          />
          Escalate to receptionist when treatment is declined
        </label>
        <button className="rounded-md bg-indigo-600 px-4 py-2 text-white text-sm">Save Thresholds</button>
      </form>

      <form onSubmit={saveRouting} className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
        <h2 className="font-semibold text-gray-900">AI vs Manual Overtake Routing</h2>
        {policies.map((policy, index) => (
          <div key={policy.patientType} className="grid grid-cols-2 gap-3">
            <span className="text-sm text-gray-700 self-center">{policy.patientType}</span>
            <select
              className="rounded-md border border-gray-300 p-2 text-sm"
              value={policy.mode}
              onChange={(e) => {
                const next = [...policies];
                next[index] = { ...policy, mode: e.target.value as RoutingMode };
                setPolicies(next);
              }}
            >
              <option value="ai_only">AI Only</option>
              <option value="manual_only">Manual Only</option>
              <option value="ai_then_manual">AI then Manual</option>
            </select>
          </div>
        ))}
        <button className="rounded-md bg-indigo-600 px-4 py-2 text-white text-sm">Save Routing</button>
      </form>
    </div>
  );
}
