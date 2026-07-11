'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { Lock, Mail, Eye, EyeOff, Sparkles, ShieldCheck, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await login(email, password);
      router.push('/admin');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      const lower = message.toLowerCase();
      const sanitized = message
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      const shortMessage = sanitized.length > 220 ? `${sanitized.slice(0, 220)}...` : sanitized;

      if (
        lower.includes('failed to fetch') ||
        lower.includes('networkerror') ||
        lower.includes('cors')
      ) {
        setError(
          'Unable to reach authentication API. Ensure API is running on port 3001 and web/api origins are allowed.',
        );
      } else if (lower.includes('401') || lower.includes('invalid credentials')) {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(shortMessage || 'Login failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f4f6fb]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-[#96c8ff]/50 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#9be7c4]/40 blur-3xl" />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-6xl grid-cols-1 gap-6 px-4 py-10 md:px-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <motion.section
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="rounded-3xl border border-white/70 bg-white/70 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-10"
        >
          <div className="mb-8 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#1c2e53] to-[#4768a9] text-white">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Secure Access</p>
              <h1 className="text-2xl font-semibold text-slate-900">CareLoop Admin</h1>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
              Sign in to your
              <span className="ml-2 bg-gradient-to-r from-[#2f4f89] to-[#3e8ba8] bg-clip-text text-transparent">
                operations dashboard
              </span>
            </h2>
            <p className="mt-3 max-w-xl text-slate-600">
              Authentication is validated against backend database credentials. No passwords or
              secrets are stored in frontend code.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                Work Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@demo.careloop"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-slate-900 outline-none transition focus:border-[#3e8ba8] focus:ring-2 focus:ring-[#99d6e4]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-12 text-slate-900 outline-none transition focus:border-[#3e8ba8] focus:ring-2 focus:ring-[#99d6e4]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              disabled={isSubmitting}
              type="submit"
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
              {!isSubmitting && (
                <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              )}
            </motion.button>
          </form>

          <p className="mt-6 text-sm text-slate-600">
            New practice?{' '}
            <a href="/signup" className="font-medium text-[#2f4f89] hover:underline">
              Create an account
            </a>
          </p>
        </motion.section>

        <motion.aside
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="rounded-3xl border border-white/70 bg-gradient-to-b from-[#1f3b66] to-[#0f253f] p-8 text-white shadow-[0_20px_70px_rgba(15,23,42,0.16)] md:p-10"
        >
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-sky-100">
            <Sparkles className="h-3.5 w-3.5" />
            Apple-style Experience
          </div>

          <h3 className="text-2xl font-semibold leading-tight">
            Fast, polished operations for your practice
          </h3>
          <p className="mt-4 text-sm leading-relaxed text-sky-100/90">
            Monitor growth, staff trends, patient flow, and monthly health indicators in one
            interactive command center.
          </p>

          <div className="mt-8 space-y-3">
            {[
              'Database-backed admin authentication',
              'HTTP-only session cookies from backend',
              'Live monthly growth and churn indicators',
              'Smooth transitions tuned for desktop and mobile',
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-xs leading-relaxed text-sky-100/90">
            Temporary dev login:
            <br />
            Email: <strong>demo@careloop.dev</strong>
            <br />
            Password: <strong>Demo12345!</strong>
          </div>
        </motion.aside>
      </div>
    </div>
  );
}
