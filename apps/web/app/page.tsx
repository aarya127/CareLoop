'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, MessageSquare, Phone, ShieldCheck, Users } from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Patient Intelligence',
    description: 'Unified records, insurance details, and treatment context in one timeline.',
  },
  {
    icon: Calendar,
    title: 'Schedule Operations',
    description: 'Smarter appointment management with real-time team visibility.',
  },
  {
    icon: Phone,
    title: 'AI Voice Workflows',
    description: 'Automated call handling with transcripts and actionable summaries.',
  },
  {
    icon: MessageSquare,
    title: 'Messaging Hub',
    description: 'SMS and internal follow-ups orchestrated from one command center.',
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f2f5fb] text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-36 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[#8dbfff]/40 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-[#9ce6c3]/35 blur-3xl" />
      </div>

      <main className="relative mx-auto max-w-6xl px-4 pb-16 pt-20 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="rounded-3xl border border-white/70 bg-white/75 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-12"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5" />
            Secure Admin Platform
          </div>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight md:text-6xl">
            CareLoop
            <span className="ml-2 bg-gradient-to-r from-[#2f4f89] to-[#3e8ba8] bg-clip-text text-transparent">
              Operations Cloud
            </span>
          </h1>

          <p className="mt-5 max-w-2xl text-base text-slate-600 md:text-lg">
            A modern, interactive workspace for dental practices to run front-desk operations,
            patient coordination, and AI-assisted workflows with confidence.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/login"
              className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Sign in to Admin
              <ArrowRight className="h-4 w-4" />
            </Link>
            <span className="text-sm text-slate-500">
              Authentication is validated only by backend database credentials.
            </span>
          </div>

          <div className="mt-5 max-w-xl rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
            <p className="font-semibold">Temporary Demo Login</p>
            <p className="mt-1">Email: demo@careloop.dev</p>
            <p>Password: Demo12345!</p>
          </div>
        </motion.div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, idx) => (
            <motion.article
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + idx * 0.06 }}
              className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-[0_8px_25px_rgba(15,23,42,0.05)] backdrop-blur"
            >
              <feature.icon className="h-5 w-5 text-[#355f9a]" />
              <h2 className="mt-3 text-sm font-semibold text-slate-900">{feature.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.description}</p>
            </motion.article>
          ))}
        </section>
      </main>
    </div>
  );
}
