'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePatientAuth } from '@/lib/patient-auth/patient-auth-context';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PatientPortalLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { login } = usePatientAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await login(email, password);
      router.push('/portal/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      const lower = message.toLowerCase();
      if (lower.includes('401') || lower.includes('invalid credentials')) {
        setError('Invalid email or password. Please try again.');
      } else if (lower.includes('locked')) {
        setError('This account is temporarily locked. Please try again later.');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
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
              <h1 className="text-xl font-semibold text-slate-900">Sign in</h1>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
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

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <a
                  href="/portal/forgot-password"
                  className="text-xs font-medium text-[#2f4f89] hover:underline"
                >
                  Forgot password?
                </a>
              </div>
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
            Don&apos;t have a portal account? Ask your dental office to send you an invitation.
          </p>
        </motion.section>
      </div>
    </div>
  );
}
