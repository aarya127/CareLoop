'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ClipboardList, Plus, Check, Trash2, CheckCircle2 } from 'lucide-react';
import {
  treatmentPlansApi,
  dollars,
  type TreatmentPlan,
  type NewPlanItem,
} from '@/lib/api/treatment-plans';
import { StatusChip } from './emr-chips';

const emptyItem: NewPlanItem = { description: '', procedureCode: '', feeCents: 0 };

export default function TreatmentPlansPanel({ patientId }: { patientId: string }) {
  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [itemForm, setItemForm] = useState<{ [planId: string]: NewPlanItem }>({});

  const refresh = useCallback(() => {
    setLoading(true);
    treatmentPlansApi
      .list(patientId)
      .then((rows) => {
        setPlans(rows);
        setError('');
        if (!selectedId && rows[0]) setSelectedId(rows[0].id);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load plans'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      const rows = await treatmentPlansApi.list(patientId);
      setPlans(rows);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const createPlan = () =>
    run(async () => {
      const plan = await treatmentPlansApi.create(patientId, { title: newTitle || 'Treatment Plan' });
      setNewTitle('');
      setCreating(false);
      setSelectedId(plan.id);
    });

  const addItem = (planId: string) => {
    const form = itemForm[planId] ?? emptyItem;
    if (!form.description.trim()) return;
    return run(async () => {
      await treatmentPlansApi.addItem(planId, {
        description: form.description.trim(),
        procedureCode: form.procedureCode || undefined,
        toothNumber: form.toothNumber ? Number(form.toothNumber) : undefined,
        feeCents: form.feeCents ? Number(form.feeCents) : 0,
      });
      setItemForm((f) => ({ ...f, [planId]: emptyItem }));
    });
  };

  const selected = plans.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
      {/* Plan list */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-[#2f6f95]" />
            <h2 className="text-sm font-semibold text-gray-900">Treatment Plans</h2>
          </div>
          <button
            onClick={() => setCreating((v) => !v)}
            className="inline-flex items-center gap-1 rounded-lg bg-[#87CEEB] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#6BA8D9]"
          >
            <Plus className="h-3.5 w-3.5" /> New
          </button>
        </div>

        {creating && (
          <div className="mb-3 space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Plan title"
              className="w-full rounded-md border border-gray-200 px-2 py-1 text-sm"
            />
            <button
              onClick={createPlan}
              disabled={busy}
              className="w-full rounded-md bg-gray-900 py-1 text-xs font-medium text-white disabled:opacity-50"
            >
              Create plan
            </button>
          </div>
        )}

        {loading ? (
          <p className="py-4 text-center text-sm text-gray-400">Loading…</p>
        ) : plans.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">No plans yet.</p>
        ) : (
          <ul className="space-y-1">
            {plans.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => setSelectedId(p.id)}
                  className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${
                    p.id === selectedId ? 'bg-[#87CEEB]/15' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-gray-800">{p.title}</span>
                    <StatusChip status={p.status} />
                  </div>
                  <span className="text-xs text-gray-400">{dollars(p.estimatedCostCents)} est.</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Selected plan detail */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        {error && (
          <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}
        {!selected ? (
          <p className="py-10 text-center text-sm text-gray-400">Select or create a plan.</p>
        ) : (
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <h3 className="text-base font-semibold text-gray-900">{selected.title}</h3>
              <StatusChip status={selected.status} />
              <div className="ml-auto text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {dollars(selected.estimatedCostCents)}
                </p>
                <p className="text-xs text-gray-400">
                  est. · insurance {dollars(selected.insuranceEstimateCents)}
                </p>
              </div>
              {selected.status !== 'accepted' && selected.status !== 'completed' && (
                <button
                  onClick={() => run(() => treatmentPlansApi.accept(selected.id))}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" /> Accept plan
                </button>
              )}
            </div>

            {/* Items table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
                    <th className="py-2 pr-2">Procedure</th>
                    <th className="py-2 pr-2">Tooth</th>
                    <th className="py-2 pr-2">Fee</th>
                    <th className="py-2 pr-2">Status</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {selected.items.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-gray-400">
                        No items yet — add procedures below.
                      </td>
                    </tr>
                  )}
                  {selected.items.map((it) => (
                    <tr key={it.id} className="border-b border-gray-50">
                      <td className="py-2 pr-2">
                        <span className="font-medium text-gray-800">
                          {it.procedureCode ? `${it.procedureCode} · ` : ''}
                          {it.description}
                        </span>
                      </td>
                      <td className="py-2 pr-2 text-gray-600">{it.toothNumber ?? '—'}</td>
                      <td className="py-2 pr-2 text-gray-600">{dollars(it.feeCents)}</td>
                      <td className="py-2 pr-2">
                        <StatusChip status={it.status} />
                      </td>
                      <td className="py-2">
                        <div className="flex items-center justify-end gap-1">
                          {it.status !== 'completed' && (
                            <button
                              title="Mark completed"
                              onClick={() =>
                                run(() => treatmentPlansApi.updateItem(it.id, { status: 'completed' }))
                              }
                              disabled={busy}
                              className="rounded p-1 text-emerald-600 hover:bg-emerald-50"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            title="Remove"
                            onClick={() => run(() => treatmentPlansApi.deleteItem(it.id))}
                            disabled={busy}
                            className="rounded p-1 text-rose-500 hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add item row */}
            <div className="mt-4 flex flex-wrap items-end gap-2 rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <Field label="Procedure / description">
                <input
                  value={(itemForm[selected.id] ?? emptyItem).description}
                  onChange={(e) =>
                    setItemForm((f) => ({
                      ...f,
                      [selected.id]: { ...(f[selected.id] ?? emptyItem), description: e.target.value },
                    }))
                  }
                  placeholder="e.g. Composite filling"
                  className="w-56 rounded-md border border-gray-200 px-2 py-1 text-sm"
                />
              </Field>
              <Field label="Code">
                <input
                  value={(itemForm[selected.id] ?? emptyItem).procedureCode ?? ''}
                  onChange={(e) =>
                    setItemForm((f) => ({
                      ...f,
                      [selected.id]: { ...(f[selected.id] ?? emptyItem), procedureCode: e.target.value },
                    }))
                  }
                  placeholder="D2391"
                  className="w-24 rounded-md border border-gray-200 px-2 py-1 text-sm"
                />
              </Field>
              <Field label="Tooth">
                <input
                  type="number"
                  value={(itemForm[selected.id] ?? emptyItem).toothNumber ?? ''}
                  onChange={(e) =>
                    setItemForm((f) => ({
                      ...f,
                      [selected.id]: {
                        ...(f[selected.id] ?? emptyItem),
                        toothNumber: e.target.value ? Number(e.target.value) : undefined,
                      },
                    }))
                  }
                  className="w-16 rounded-md border border-gray-200 px-2 py-1 text-sm"
                />
              </Field>
              <Field label="Fee ($)">
                <input
                  type="number"
                  value={((itemForm[selected.id] ?? emptyItem).feeCents ?? 0) / 100 || ''}
                  onChange={(e) =>
                    setItemForm((f) => ({
                      ...f,
                      [selected.id]: {
                        ...(f[selected.id] ?? emptyItem),
                        feeCents: Math.round(Number(e.target.value || 0) * 100),
                      },
                    }))
                  }
                  className="w-24 rounded-md border border-gray-200 px-2 py-1 text-sm"
                />
              </Field>
              <button
                onClick={() => addItem(selected.id)}
                disabled={busy}
                className="inline-flex items-center gap-1 rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" /> Add
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="text-xs">
      <span className="mb-1 block font-medium text-gray-500">{label}</span>
      {children}
    </label>
  );
}
