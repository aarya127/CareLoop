'use client';

import React, { useEffect, useState, use } from 'react';
import { Lock, User, ShieldCheck, ChevronRight } from 'lucide-react';

interface Props {
  params: Promise<{ token: string }>;
}

interface Preview {
  email: string;
  role: string;
  practiceName: string;
}

export default function JoinPage({ params }: Props) {
  const { token } = use(params);

  const [preview, setPreview] = useState<Preview | null>(null);
  const [invalid, setInvalid] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/invitations/accept/${token}`, { cache: 'no-store' })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setInvalid(data?.error ?? data?.message ?? 'This invitation is no longer valid.');
        } else {
          setPreview(data);
        }
      })
      .catch(() => setInvalid('Could not load this invitation.'));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/invitations/accept/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ firstName, lastName, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Could not accept invitation');
      // Full navigation so the auth provider re-initialises from the new cookie.
      window.location.href = '/admin';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not accept invitation');
      setSubmitting(false);
    }
  };

  const field =
    'h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition focus:border-[#3e8ba8] focus:ring-2 focus:ring-[#99d6e4]';

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f4f6fb]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-[#96c8ff]/50 blur-3xl" />
      </div>
      <div className="relative mx-auto flex min-h-screen max-w-md items-center px-4 py-10">
        <section className="w-full rounded-3xl border border-white/70 bg-white/70 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[#1c2e53] to-[#4768a9] text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-semibold text-slate-900">Join your team</h1>
          </div>

          {invalid ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {invalid}
            </div>
          ) : !preview ? (
            <p className="text-sm text-slate-500 animate-pulse">Loading invitation…</p>
          ) : (
            <>
              <p className="mb-6 text-sm text-slate-600">
                You&apos;ve been invited to join <strong>{preview.practiceName}</strong> as{' '}
                <strong>{preview.role}</strong>. Set your name and password to finish.
              </p>
              <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                {preview.email}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="firstName" className="mb-1.5 block text-sm font-medium text-slate-700">First name</label>
                    <input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required placeholder="Jane" className={field} />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="mb-1.5 block text-sm font-medium text-slate-700">Last name</label>
                    <input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required placeholder="Doe" className={field} />
                  </div>
                </div>
                <div>
                  <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} placeholder="At least 8 characters" className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-slate-900 outline-none transition focus:border-[#3e8ba8] focus:ring-2 focus:ring-[#99d6e4]" />
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
                )}

                <button disabled={submitting} type="submit" className="group flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
                  {submitting ? 'Joining…' : 'Join team'}
                  {!submitting && <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />}
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
