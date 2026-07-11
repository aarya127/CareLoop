'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, LoaderCircle, UserMinus } from 'lucide-react';

type UserRow = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: string;
  deletedAt: string | null;
  deletedReason: string | null;
};

function resolveApiBase(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  if (!configured) return 'http://localhost:3001';
  const normalized = configured.replace(/\/$/, '');
  if (
    normalized.includes('localhost:3000') ||
    normalized.includes('127.0.0.1:3000') ||
    normalized === '/'
  ) {
    return 'http://localhost:3001';
  }
  return normalized;
}

export default function LeaveUserPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const userId = params.id;
  const [user, setUser] = useState<UserRow | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const apiBaseUrl = resolveApiBase();

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/users/${userId}`, { credentials: 'include' });
        const json = (await res.json()) as UserRow;
        if (!res.ok) throw new Error('Unable to load user');
        if (mounted) {
          setUser(json);
          setReason(json.deletedReason ?? '');
        }
      } catch {
        if (mounted) setError('Unable to load the selected user.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [apiBaseUrl, userId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${apiBaseUrl}/users/${userId}/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason }),
      });

      if (!res.ok) throw new Error('Removal failed');
      router.push('/admin/analytics');
    } catch {
      setError('Unable to remove the user right now.');
    } finally {
      setSubmitting(false);
    }
  }

  const displayName = user ? `${user.firstName ?? 'User'} ${user.lastName ?? ''}`.trim() : 'User';

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] backdrop-blur"
      >
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to users
        </Link>
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Remove User</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
              {displayName}
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Capture an optional reason before removing this user from the practice and revoking
              their sessions.
            </p>
          </div>
          <div className="rounded-2xl bg-rose-50 p-3 text-rose-700">
            <UserMinus className="h-5 w-5" />
          </div>
        </div>
      </motion.section>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="h-64 animate-pulse rounded-3xl border border-white/70 bg-white/80" />
      ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] backdrop-blur"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">User</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{displayName}</p>
              <p className="text-sm text-slate-600">{user?.email}</p>
              <p className="mt-3 text-sm text-slate-500">Status: {user?.status ?? 'Unknown'}</p>
              {user?.deletedAt && <p className="mt-1 text-sm text-slate-500">Already removed</p>}
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Reason</p>
              <p className="mt-2 text-sm text-slate-600">
                This field is optional, but it feeds retention analytics when staff want to explain
                why a user left.
              </p>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={6}
                className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                placeholder="Optional: financial constraints, moved practices, scheduling conflict, compliance issue..."
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/admin/users"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <UserMinus className="h-4 w-4" />
              )}
              Remove user
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
