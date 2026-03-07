'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Users, Calendar, Phone, MessageSquare, Shield, Zap, CheckCircle2 } from 'lucide-react';
import { DEMO_USERS } from '@/lib/demo/sample-data';

export default function DemoLanding() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleDemoLogin = async (email: string, password: string, roleName: string) => {
    setIsLoading(true);
    
    // Redirect to login page
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Interactive Demo
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Care<span className="text-blue-600">Loop</span>
            </h1>
            <p className="text-2xl md:text-3xl text-gray-600 mb-4">
              AI-Powered Dental Practice Management
            </p>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Experience the future of patient care with intelligent automation, real-time communication, and enterprise-grade security.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              title="Patient Management"
              description="Comprehensive profiles with insurance, dental records, and visit history"
              color="blue"
            />
            <FeatureCard
              icon={<Calendar className="w-6 h-6" />}
              title="Smart Scheduling"
              description="AI-powered appointment booking with coverage estimates"
              color="purple"
            />
            <FeatureCard
              icon={<Phone className="w-6 h-6" />}
              title="VoIP Integration"
              description="Click-to-call with AI assistants, transcripts, and recordings"
              color="green"
            />
            <FeatureCard
              icon={<MessageSquare className="w-6 h-6" />}
              title="Omni-Channel Messaging"
              description="SMS, web chat, and email in one unified inbox"
              color="orange"
            />
          </div>

          {/* Demo Accounts */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8 text-gray-900">
              Try CareLoop Now - Choose Your Role
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {DEMO_USERS.map((user) => (
                <DemoAccountCard
                  key={user.email}
                  {...user}
                  onLogin={handleDemoLogin}
                  isLoading={isLoading}
                />
              ))}
            </div>
            <p className="text-center text-sm text-gray-500 mt-6">
              All demo accounts use password: <code className="bg-gray-100 px-2 py-1 rounded font-mono">demo123</code>
            </p>
          </div>

          {/* What's Included */}
          <div className="mt-20 max-w-4xl mx-auto">
            <h3 className="text-xl font-bold text-center mb-8 text-gray-900">
              What's Included in This Demo
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <IncludedFeature text="15 sample patients with realistic data" />
              <IncludedFeature text="Role-based access control (RBAC)" />
              <IncludedFeature text="Interactive patient profiles with 5 tabs" />
              <IncludedFeature text="Appointment calendar with AI badges" />
              <IncludedFeature text="VoIP call panel with transcripts" />
              <IncludedFeature text="Messaging with conversation threads" />
              <IncludedFeature text="Periodontal charting visualization" />
              <IncludedFeature text="Insurance coverage estimates" />
              <IncludedFeature text="HIPAA-compliant audit logging" />
              <IncludedFeature text="Production-ready TypeScript codebase" />
            </div>
          </div>

          {/* Technical Stack */}
          <div className="mt-16 text-center">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Built With</h3>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
              <TechBadge text="Next.js 15" />
              <TechBadge text="React 18" />
              <TechBadge text="TypeScript" />
              <TechBadge text="Tailwind CSS" />
              <TechBadge text="Shadcn UI" />
              <TechBadge text="Lucide Icons" />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-sm text-gray-600">
          <p>
            © 2025 CareLoop Demo. Built with{' '}
            <span className="text-red-500">♥</span> for dental practices.
          </p>
          <p className="mt-2 text-xs text-gray-500">
            This is a demonstration environment with sample data. Not for production use.
          </p>
        </div>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'blue' | 'purple' | 'green' | 'orange';
}

function FeatureCard({ icon, title, description, color }: FeatureCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}

interface DemoAccountCardProps {
  email: string;
  password: string;
  role: string;
  name: string;
  onLogin: (email: string, password: string, role: string) => void;
  isLoading: boolean;
}

function DemoAccountCard({ email, password, role, name, onLogin, isLoading }: DemoAccountCardProps) {
  const roleColors = {
    admin: 'bg-red-50 border-red-200 hover:border-red-300',
    doctor: 'bg-blue-50 border-blue-200 hover:border-blue-300',
    nurse: 'bg-green-50 border-green-200 hover:border-green-300',
    receptionist: 'bg-purple-50 border-purple-200 hover:border-purple-300',
  };

  const roleIcons = {
    admin: <Shield className="w-5 h-5" />,
    doctor: <Users className="w-5 h-5" />,
    nurse: <Zap className="w-5 h-5" />,
    receptionist: <Calendar className="w-5 h-5" />,
  };

  return (
    <button
      onClick={() => onLogin(email, password, role)}
      disabled={isLoading}
      className={`${roleColors[role as keyof typeof roleColors]} border-2 rounded-lg p-4 text-left transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1">
          {roleIcons[role as keyof typeof roleIcons]}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-gray-900 capitalize mb-1">
            {role}
          </div>
          <div className="text-xs text-gray-600 mb-2">{name}</div>
          <div className="text-xs text-gray-500 font-mono bg-white/50 px-2 py-1 rounded">
            {email.split('@')[0]}
          </div>
        </div>
      </div>
      <div className="mt-3 text-xs font-medium text-gray-700 text-center bg-white/70 py-1.5 rounded">
        {isLoading ? 'Loading...' : 'Try This Role →'}
      </div>
    </button>
  );
}

function IncludedFeature({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2">
      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
      <span className="text-gray-700">{text}</span>
    </div>
  );
}

function TechBadge({ text }: { text: string }) {
  return (
    <span className="px-3 py-1 bg-gray-100 rounded-full font-medium">
      {text}
    </span>
  );
}

