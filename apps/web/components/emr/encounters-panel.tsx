'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSignature, Plus, Stethoscope, Lock } from 'lucide-react';
import { emrApi, type Encounter } from '@/lib/api/emr';
import { StatusChip } from './emr-chips';

const ENCOUNTER_TYPES = ['exam', 'cleaning', 'consult', 'procedure', 'followup'];

const emptyForm = {
  type: 'exam',
  chiefComplaint: '',
  subjective: '',
  objective: '',
  assessment: '',
  plan: '',
};

export default function EncountersPanel({ patientId }: { patientId: string }) {
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    setLoading(true);
    emrApi
      .listEncounters(patientId)
      .then((rows) => {
        setEncounters(rows);
        setError('');
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load encounters'))
      .finally(() => setLoading(false));
  }, [patientId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const created = await emrApi.createEncounter(patientId, form);
      setForm(emptyForm);
      setCreating(false);
      setEncounters((cur) => [created, ...cur]);
      setExpanded(created.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create encounter');
    } finally {
      setBusy(false);
    }
  };

  const sign = async (id: string) => {
    setBusy(true);
    try {
      const signed = await emrApi.signEncounter(id);
      setEncounters((cur) => cur.map((e) => (e.id === id ? signed : e)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-[#2f6f95]" />
          <h2 className="text-base font-semibold text-gray-900">Encounters &amp; Visit Notes</h2>
          <span className="text-sm text-gray-400">({encounters.length})</span>
        </div>
        <button
          onClick={() => setCreating((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#87CEEB] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#6BA8D9] transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Encounter
        </button>
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* New encounter form */}
      <AnimatePresence>
        {creating && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={submit}
            className="mb-4 space-y-3 overflow-hidden rounded-xl border border-gray-200 bg-gray-50/60 p-4"
          >
            <div className="flex flex-wrap gap-3">
              <label className="text-sm">
                <span className="mb-1 block font-medium text-gray-600">Type</span>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
                >
                  {ENCOUNTER_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex-1 text-sm">
                <span className="mb-1 block font-medium text-gray-600">Chief complaint</span>
                <input
                  value={form.chiefComplaint}
                  onChange={(e) => setForm({ ...form, chiefComplaint: e.target.value })}
                  placeholder="e.g. tooth pain, upper left"
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
                />
              </label>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(['subjective', 'objective', 'assessment', 'plan'] as const).map((f) => (
                <label key={f} className="text-sm">
                  <span className="mb-1 block font-medium capitalize text-gray-600">{f}</span>
                  <textarea
                    value={form[f]}
                    onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                    rows={2}
                    className="w-full resize-y rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
                  />
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                Save draft
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Timeline list */}
      {loading ? (
        <p className="py-6 text-center text-sm text-gray-400">Loading encounters…</p>
      ) : encounters.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">No encounters recorded yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {encounters.map((enc) => {
            const isOpen = expanded === enc.id;
            return (
              <li key={enc.id} className="py-3">
                <button
                  onClick={() => setExpanded(isOpen ? null : enc.id)}
                  className="flex w-full items-center gap-3 text-left"
                >
                  <span className="w-24 shrink-0 text-sm font-medium text-gray-700">
                    {String(enc.encounterDate).slice(0, 10)}
                  </span>
                  <span className="text-sm capitalize text-gray-600">{enc.type}</span>
                  <span className="truncate text-sm text-gray-400">{enc.chiefComplaint}</span>
                  <span className="ml-auto flex items-center gap-2">
                    <StatusChip status={enc.status} />
                  </span>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 grid grid-cols-1 gap-3 rounded-xl bg-gray-50/70 p-4 text-sm sm:grid-cols-2">
                        <SoapField label="Subjective" value={enc.subjective} />
                        <SoapField label="Objective" value={enc.objective} />
                        <SoapField label="Assessment" value={enc.assessment} />
                        <SoapField label="Plan" value={enc.plan} />
                      </div>
                      <div className="mt-2 flex items-center justify-end gap-3">
                        {enc.status === 'signed' ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                            <Lock className="h-3.5 w-3.5" />
                            Signed {enc.signedAt ? `· ${String(enc.signedAt).slice(0, 10)}` : ''}
                          </span>
                        ) : (
                          <button
                            onClick={() => sign(enc.id)}
                            disabled={busy}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                          >
                            <FileSignature className="h-3.5 w-3.5" />
                            Sign &amp; lock
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SoapField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="whitespace-pre-wrap text-gray-700">
        {value || <span className="text-gray-300">—</span>}
      </p>
    </div>
  );
}
