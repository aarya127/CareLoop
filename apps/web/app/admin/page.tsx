'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  MessageSquare,
  Phone,
  TrendingUp,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react';

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

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function StatTile({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  trend?: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const positive = (trend ?? 0) >= 0;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)] backdrop-blur"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="rounded-xl bg-slate-100 p-2.5">
          <Icon className="h-5 w-5 text-slate-700" />
        </div>
        {typeof trend === 'number' && (
          <div
            className={`flex items-center gap-1 text-xs font-medium ${
              positive ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {positive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await fetch(`${API_URL}/auth/admin-overview?practiceId=demo-practice`, {
          credentials: 'include',
        });
        if (!res.ok) return;
        const data = (await res.json()) as AdminOverview;
        if (mounted) setOverview(data);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const cards = useMemo(() => {
    if (!overview) return [];

    return [
      {
        title: 'New Users This Month',
        value: overview.users.newThisMonth,
        subtitle: `${overview.users.leftThisMonth} users left this month`,
        icon: UserPlus,
        trend: overview.users.monthlyGrowthPct,
      },
      {
        title: 'Total Active Team Members',
        value: overview.users.active,
        subtitle: `${overview.users.total} total users in auth DB`,
        icon: Users,
      },
      {
        title: 'New Patients This Month',
        value: overview.patients.newThisMonth,
        subtitle: `${overview.patients.total} total patients`,
        icon: Activity,
      },
      {
        title: 'Appointments Completed',
        value: `${overview.appointments.completionRatePct}%`,
        subtitle: `${overview.appointments.completedThisMonth} of ${overview.appointments.thisMonth} this month`,
        icon: Calendar,
      },
    ];
  }, [overview]);

  return (
    <div className="relative space-y-6 overflow-hidden rounded-3xl bg-[#f3f6fb] p-4 md:p-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 right-0 h-72 w-72 rounded-full bg-[#97c5ff]/30 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-[#9ee8c7]/30 blur-3xl" />
      </div>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl border border-white/70 bg-white/75 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.07)] backdrop-blur-xl md:p-8"
      >
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Admin Overview</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
              Practice pulse at a glance
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Monthly user growth, churn, and operational indicators are sourced from backend database records only.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-1 md:text-right">
            <Link
              href="/admin/patients"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-slate-300"
            >
              Manage Patients
            </Link>
            <Link
              href="/admin/analytics"
              className="rounded-xl bg-slate-900 px-3 py-2 text-sm text-white transition hover:bg-slate-800"
            >
              Detailed Analytics
            </Link>
          </div>
        </div>
      </motion.section>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-40 animate-pulse rounded-2xl border border-white/70 bg-white/75" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card, idx) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
            >
              <StatTile {...card} />
            </motion.div>
          ))}
        </div>
      )}

      {overview && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative rounded-3xl border border-white/70 bg-white/80 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
        >
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Application Health Overview</h2>
              <p className="mt-2 text-sm text-slate-600">
                Core operational indicators for staffing, patient flow, and AI-assisted communication.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                    <TrendingUp className="h-4 w-4" />
                    Team Growth Momentum
                  </div>
                  <p className="text-3xl font-semibold text-slate-900">{overview.users.monthlyGrowthPct}%</p>
                  <p className="mt-1 text-sm text-slate-600">compared with previous month</p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                    <UserMinus className="h-4 w-4" />
                    User Churn Signal
                  </div>
                  <p className="text-3xl font-semibold text-slate-900">{overview.users.leftThisMonth}</p>
                  <p className="mt-1 text-sm text-slate-600">users left during current month</p>
                </div>
              </div>

              {overview.users.leftReasons.length > 0 && (
                <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                    <UserMinus className="h-4 w-4" />
                    Why users left
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {overview.users.leftReasons.map((item) => (
                      <span key={item.reason} className="rounded-full bg-white px-3 py-1 text-xs text-slate-700 border border-slate-200">
                        {item.reason}: {item.count}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Phone className="h-4 w-4" />
                  AI Voice Activity
                </div>
                <p className="text-3xl font-semibold text-slate-900">{overview.activity.transcriptsThisMonth}</p>
                <p className="mt-1 text-sm text-slate-600">call transcripts this month</p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <MessageSquare className="h-4 w-4" />
                  Messaging Throughput
                </div>
                <p className="text-3xl font-semibold text-slate-900">{overview.activity.conversationsThisMonth}</p>
                <p className="mt-1 text-sm text-slate-600">new conversations this month</p>
              </div>
            </div>
          </div>
        </motion.section>
      )}
    </div>
  );
}
