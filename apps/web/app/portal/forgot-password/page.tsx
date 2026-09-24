'use client';

import React, { useState } from 'react';
import { Mail, ShieldCheck, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PatientPortalForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetch('/api/patient-portal/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    } catch {
      // Best-effort — the response is generic either way.
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f4f6fb]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-[#96c8ff]/50 blur-3xl" />
      </div>
      <div className="relative mx-auto flex min-h-screen max-w-md items-center px-4 py-10">
        <motion.section
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full rounded-3xl border border-white/70 bg-white/70 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl"
        >
          <div className="mb-8 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#1c2e53] to-[#4768a9] text-white">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Patient Portal</p>
              <h1 className="text-xl font-semibold text-slate-900">Reset your password</h1>
            </div>
          </div>

          {submitted ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              If an account exists for that email, we&apos;ve sent a link to reset your password.
              The link expires in 1 hour.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-slate-900 outline-none transition focus:border-[#3e8ba8] focus:ring-2 focus:ring-[#99d6e4]"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                disabled={isSubmitting}
                type="submit"
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Sending...' : 'Send reset link'}
                {!isSubmitting && (
                  <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                )}
              </motion.button>
            </form>
          )}

          <p className="mt-6 text-sm text-slate-600">
            <a href="/portal/login" className="font-medium text-[#2f4f89] hover:underline">
              Back to sign in
            </a>
          </p>
        </motion.section>
      </div>
    </div>
  );
}
