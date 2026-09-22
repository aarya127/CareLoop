'use client';

import { useState } from 'react';
import { Mail, Send, X } from 'lucide-react';

interface Props {
  patientId: string;
}

/** Staff action: invite an existing patient to create a patient portal login. */
export default function InviteToPortalButton({ patientId }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [acceptUrl, setAcceptUrl] = useState<string | null>(null);

  const reset = () => {
    setOpen(false);
    setEmail('');
    setError('');
    setAcceptUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/patient-portal-invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ patientId, email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? data?.message ?? 'Could not send invitation');
      setAcceptUrl(data.acceptUrl ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send invitation');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
      >
        <Mail className="h-3.5 w-3.5" />
        Invite to Portal
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-medium text-slate-700">Invite patient to portal</span>
        <button type="button" onClick={reset} className="text-slate-400 hover:text-slate-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      {acceptUrl ? (
        <div className="space-y-2">
          <p className="text-xs text-slate-600">Invitation sent. Share this link if needed:</p>
          <div className="break-all rounded-lg bg-slate-50 px-2 py-1.5 text-xs text-slate-700">
            {acceptUrl}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="patient@example.com"
            className="h-9 flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#3e8ba8] focus:ring-2 focus:ring-[#99d6e4]"
          />
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send className="h-3.5 w-3.5" />
            {submitting ? 'Sending…' : 'Send'}
          </button>
        </form>
      )}

      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
