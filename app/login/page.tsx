'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';

interface DemoAccount {
  email: string;
  password: string;
  role: string;
  name: string;
  description: string;
  color: string;
}

const demoAccounts: DemoAccount[] = [
  {
    email: 'admin@careloop.demo',
    password: 'demo123',
    role: 'admin',
    name: 'Admin',
    description: 'Full system access',
    color: 'from-red-500 to-pink-500',
  },
  {
    email: 'doctor@careloop.demo',
    password: 'demo123',
    role: 'doctor',
    name: 'Doctor',
    description: 'Clinical & patient management',
    color: 'from-blue-500 to-indigo-500',
  },
  {
    email: 'hygienist@careloop.demo',
    password: 'demo123',
    role: 'hygienist',
    name: 'Hygienist',
    description: 'Limited patient access',
    color: 'from-green-500 to-indigo-500',
  },
  {
    email: 'receptionist@careloop.demo',
    password: 'demo123',
    role: 'receptionist',
    name: 'Receptionist',
    description: 'Scheduling & messaging',
    color: 'from-purple-500 to-pink-500',
  },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const account = demoAccounts.find(
        (acc) => acc.email === email && acc.password === password
      );

      if (!account) {
        setError('Invalid email or password');
        return;
      }

      await login(email, password);
      window.location.href = '/admin';
    } catch (err) {
      setError('Login failed. Please try again.');
    }
  };

  const handleDemoLogin = async (account: DemoAccount) => {
    setEmail(account.email);
    setPassword(account.password);
    setError('');

    try {
      await login(account.email, account.password);
      window.location.href = '/admin';
    } catch (err) {
      setError('Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">CL</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">CareLoop</h1>
                <p className="text-sm text-gray-500">Admin Portal</p>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
            <p className="text-gray-600">Sign in to access your dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all"
            >
              Sign In
            </button>

            <div className="text-center">
              <button type="button" className="text-sm text-indigo-600 hover:text-indigo-700">
                Forgot your password?
              </button>
            </div>
          </form>
        </div>

        {/* Demo Accounts */}
        <div>
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Try a Demo Account</h3>
            <p className="text-gray-600 mb-6">
              Click any card below to instantly login and explore CareLoop
            </p>

            <div className="space-y-4">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  onClick={() => handleDemoLogin(account)}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all text-left group"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-12 h-12 bg-gradient-to-br ${account.color} rounded-lg flex items-center justify-center text-white font-bold text-lg`}
                    >
                      {account.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {account.name}
                      </p>
                      <p className="text-sm text-gray-500">{account.description}</p>
                    </div>
                    <div className="text-sm text-gray-400 group-hover:text-indigo-600 transition-colors">
                      Click to login →
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
              <p className="text-sm text-indigo-900 font-medium mb-2">Demo Credentials:</p>
              <ul className="text-sm text-indigo-700 space-y-1">
                <li>• Email: Any demo account above</li>
                <li>• Password: demo123</li>
              </ul>
            </div>
          </div>

          {/* Features */}
          <div className="mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
            <h3 className="text-xl font-bold mb-4">What's Inside</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  ✓
                </div>
                <div>
                  <p className="font-medium">Patient Management</p>
                  <p className="text-sm text-white/80">
                    Search, filter, and manage patient records
                  </p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  ✓
                </div>
                <div>
                  <p className="font-medium">Smart Calendar</p>
                  <p className="text-sm text-white/80">Multi-doctor scheduling with real-time updates</p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  ✓
                </div>
                <div>
                  <p className="font-medium">AI Phone Assistant</p>
                  <p className="text-sm text-white/80">
                    View call history and live transcripts
                  </p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  ✓
                </div>
                <div>
                  <p className="font-medium">Omni-Channel Messaging</p>
                  <p className="text-sm text-white/80">SMS, email, and portal messages in one place</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
