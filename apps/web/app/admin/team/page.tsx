'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { UserPlus, Copy, Check, X, Mail } from 'lucide-react';

interface Invite {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

const ROLES = ['staff', 'manager', 'provider', 'hygienist', 'admin'] as const;

export default function TeamPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>('staff');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [lastLink, setLastLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/invitations', { credentials: 'include', cache: 'no-store' });
      const data = await res.json().catch(() => []);
      setInvites(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLastLink(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? data?.message ?? 'Could not create invite');
      setLastLink(data.acceptUrl ?? null);
      setEmail('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create invite');
    } finally {
      setSubmitting(false);
    }
  };

  const revoke = async (id: string) => {
    await fetch(`/api/invitations/${id}/revoke`, { method: 'POST', credentials: 'include' });
    await load();
  };

  const copyLink = async () => {
    if (!lastLink) return;
    try {
      await navigator.clipboard.writeText(lastLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be unavailable; the link is shown for manual copy */
    }
  };

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-white">
          <UserPlus className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Team</h1>
          <p className="text-sm text-slate-500">Invite colleagues to your practice and manage pending invites.</p>
        </div>
      </div>

      {/* Invite form */}
      <form onSubmit={handleInvite} className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="colleague@practice.com" className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-slate-900 outline-none focus:border-[#3e8ba8] focus:ring-2 focus:ring-[#99d6e4]" />
            </div>
          </div>
          <div>
            <label htmlFor="role" className="mb-1.5 block text-sm font-medium text-slate-700">Role</label>
            <select id="role" value={role} onChange={(e) => setRole(e.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-slate-900 outline-none focus:border-[#3e8ba8] focus:ring-2 focus:ring-[#99d6e4]">
              {ROLES.map((r) => (<option key={r} value={r}>{r}</option>))}
            </select>
          </div>
          <button disabled={submitting} type="submit" className="h-11 rounded-xl bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60">
            {submitting ? 'Inviting…' : 'Send invite'}
          </button>
        </div>

        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

        {lastLink && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-sm font-medium text-emerald-800">Invite created. Share this link:</p>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 truncate rounded-lg bg-white px-3 py-2 text-xs text-slate-700">{lastLink}</code>
              <button type="button" onClick={copyLink} className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
                {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Pending invites */}
      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-slate-700">Pending invitations</div>
        {loading ? (
          <p className="px-5 py-6 text-sm text-slate-400">Loading…</p>
        ) : invites.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-400">No pending invitations.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {invites.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{inv.email}</p>
                  <p className="text-xs text-slate-500">
                    {inv.role} · expires {new Date(inv.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <button onClick={() => revoke(inv.id)} className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200">
                  <X className="h-3.5 w-3.5" /> Revoke
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
