'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { Building2, User, Mail, Lock, Eye, EyeOff, ShieldCheck, ChevronRight } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();

  const [practiceName, setPracticeName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setIsSubmitting(true);
    try {
      await signup({ practiceName, firstName, lastName, email, password });
      router.push('/admin');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      setError(message.length > 220 ? `${message.slice(0, 220)}…` : message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const field =
    'h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-slate-900 outline-none transition focus:border-[#3e8ba8] focus:ring-2 focus:ring-[#99d6e4]';
  const iconCls = 'absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400';

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f4f6fb]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-[#96c8ff]/50 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#9be7c4]/40 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-lg items-center px-4 py-10">
        <section className="w-full rounded-3xl border border-white/70 bg-white/70 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-10">
          <div className="mb-8 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#1c2e53] to-[#4768a9] text-white">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Get started</p>
              <h1 className="text-2xl font-semibold text-slate-900">Create your practice</h1>
            </div>
          </div>

          <p className="mb-6 text-sm text-slate-600">
            Sets up a new CareLoop practice and makes you its first administrator.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="practiceName"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Practice name
              </label>
              <div className="relative">
                <Building2 className={iconCls} />
                <input
                  id="practiceName"
                  value={practiceName}
                  onChange={(e) => setPracticeName(e.target.value)}
                  required
                  placeholder="Bright Smile Dental"
                  className={field}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="firstName"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  First name
                </label>
                <div className="relative">
                  <User className={iconCls} />
                  <input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    placeholder="Jane"
                    className={field}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="lastName" className="mb-2 block text-sm font-medium text-slate-700">
                  Last name
                </label>
                <input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  placeholder="Doe"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition focus:border-[#3e8ba8] focus:ring-2 focus:ring-[#99d6e4]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                Work email
              </label>
              <div className="relative">
                <Mail className={iconCls} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="jane@brightsmile.com"
                  className={field}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <Lock className={iconCls} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
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

            <button
              disabled={isSubmitting}
              type="submit"
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Creating your practice…' : 'Create practice & admin account'}
              {!isSubmitting && (
                <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-[#2f4f89] hover:underline">
              Sign in
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
