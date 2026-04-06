'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, Mail, UserMinus, Users } from 'lucide-react';

type UserRow = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  practiceId: string;
  status: string;
  createdAt: string;
  deletedAt: string | null;
  deletedReason: string | null;
};

function resolveApiBase(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  if (!configured) return 'http://localhost:3001';
  const normalized = configured.replace(/\/$/, '');
  if (normalized.includes('localhost:3000') || normalized.includes('127.0.0.1:3000') || normalized === '/') {
    return 'http://localhost:3001';
  }
  return normalized;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const apiBaseUrl = resolveApiBase();

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/users`, { credentials: 'include' });
        const json = (await res.json()) as UserRow[];
        if (!res.ok) throw new Error('Unable to load users');
        if (mounted) setUsers(json);
      } catch {
        if (mounted) setError('Unable to load users right now.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [apiBaseUrl]);

  const activeUsers = users.filter((user) => !user.deletedAt);
  const removedUsers = users.filter((user) => Boolean(user.deletedAt));

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] backdrop-blur"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Admin Users</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Team access and removals</h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Remove users from the practice and capture an optional exit reason for churn analytics.
            </p>
          </div>
          <Link
            href="/admin/analytics"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm text-white transition hover:bg-slate-800"
          >
            View Analytics
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.section>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Users className="h-4 w-4" /> Active Users
          </div>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{activeUsers.length}</p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <UserMinus className="h-4 w-4" /> Removed Users
          </div>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{removedUsers.length}</p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Clock className="h-4 w-4" /> Removal Reason Capture
          </div>
          <p className="mt-2 text-sm text-slate-600">Optional reason page is required before confirming a removal.</p>
        </div>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-20 animate-pulse rounded-2xl border border-white/70 bg-white/80" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <section className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
            <h2 className="text-lg font-semibold text-slate-900">Active Users</h2>
            <div className="mt-4 space-y-3">
              {activeUsers.map((user) => (
                <div key={user.id} className="flex flex-col gap-3 rounded-2xl border border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{user.firstName ?? 'User'} {user.lastName ?? ''}</p>
                    <p className="text-sm text-slate-600 flex items-center gap-2"><Mail className="h-4 w-4" />{user.email}</p>
                    <p className="text-xs text-slate-500 mt-1">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Link
                    href={`/admin/users/${user.id}/leave`}
                    className="inline-flex items-center gap-2 self-start rounded-xl bg-rose-600 px-4 py-2 text-sm text-white transition hover:bg-rose-700"
                  >
                    Remove user
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
              {activeUsers.length === 0 && <p className="text-sm text-slate-600">No active users found.</p>}
            </div>
          </section>

          <section className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
            <h2 className="text-lg font-semibold text-slate-900">Removed Users</h2>
            <div className="mt-4 space-y-3">
              {removedUsers.map((user) => (
                <div key={user.id} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{user.firstName ?? 'User'} {user.lastName ?? ''}</p>
                      <p className="text-sm text-slate-600">{user.email}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">Removed</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">Reason: {user.deletedReason ?? 'Not provided'}</p>
                  <p className="text-xs text-slate-500">Removed {user.deletedAt ? new Date(user.deletedAt).toLocaleString() : 'Unknown'}</p>
                </div>
              ))}
              {removedUsers.length === 0 && <p className="text-sm text-slate-600">No users have been removed yet.</p>}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
