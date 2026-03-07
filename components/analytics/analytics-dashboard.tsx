'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Users, Calendar, DollarSign, TrendingUp, Shield, Activity } from 'lucide-react';
import { AnalyticsData, animateNumber } from '@/lib/utils/analytics';
import { cn } from '@/lib/utils';

interface AnalyticsDashboardProps {
  data: AnalyticsData;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
  delay?: number;
  animateValue?: boolean;
}

function StatCard({ 
  icon, 
  label, 
  value, 
  prefix = '', 
  suffix = '', 
  trend, 
  color = 'bg-[#0A84FF]',
  delay = 0,
  animateValue = true 
}: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(animateValue ? 0 : value);

  useEffect(() => {
    if (animateValue && typeof value === 'number') {
      const timer = setTimeout(() => {
        animateNumber(0, value, 1500, setDisplayValue);
      }, delay);
      return () => clearTimeout(timer);
    } else {
      setDisplayValue(value);
    }
  }, [value, delay, animateValue]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay: delay / 1000,
        ease: [0.4, 0, 0.2, 1] 
      }}
      className="relative group"
    >
      <div className="rounded-2xl bg-white border border-[#E5E5E7] p-6 transition-all duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.08)] hover:-translate-y-1">
        {/* Icon */}
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4', color)}>
          <div className="text-white">
            {icon}
          </div>
        </div>

        {/* Label */}
        <p className="text-xs uppercase font-medium text-[#86868B] tracking-wide mb-2">
          {label}
        </p>

        {/* Value */}
        <div className="flex items-baseline gap-1">
          {prefix && <span className="text-xl font-semibold text-[#1D1D1F]">{prefix}</span>}
          <span className="text-3xl font-semibold text-[#1D1D1F]">
            {typeof displayValue === 'number' 
              ? displayValue.toLocaleString() 
              : displayValue
            }
          </span>
          {suffix && <span className="text-lg font-medium text-[#86868B]">{suffix}</span>}
        </div>

        {/* Trend Indicator (optional) */}
        {trend && (
          <div className={cn(
            'mt-3 flex items-center gap-1 text-xs font-medium',
            trend === 'up' && 'text-green-600',
            trend === 'down' && 'text-red-600',
            trend === 'neutral' && 'text-[#86868B]'
          )}>
            {trend === 'up' && <TrendingUp className="w-3 h-3" />}
            {trend === 'down' && <TrendingUp className="w-3 h-3 rotate-180" />}
            <span>{trend === 'up' ? 'Growing' : trend === 'down' ? 'Declining' : 'Stable'}</span>
          </div>
        )}

        {/* Hover Glow Effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#0A84FF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
      </div>
    </motion.div>
  );
}

export function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
  const {
    totalClients,
    upcomingAppointments,
    outstandingBalances,
    averageVisitCost,
    insuranceCoverage,
    mostFrequentProcedure,
  } = data;

  return (
    <div className="w-full">
      {/* Section Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-semibold text-[#1D1D1F] mb-2">Practice Overview</h2>
        <p className="text-sm text-[#86868B]">Real-time insights and key metrics</p>
      </motion.div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Clients */}
        <StatCard
          icon={<Users className="w-6 h-6" />}
          label="Total Clients"
          value={totalClients}
          color="bg-[#0A84FF]"
          delay={0}
          trend="up"
        />

        {/* Upcoming Appointments */}
        <StatCard
          icon={<Calendar className="w-6 h-6" />}
          label="Upcoming Appointments"
          value={upcomingAppointments}
          suffix=" this week"
          color="bg-[#34C759]"
          delay={100}
        />

        {/* Outstanding Balances */}
        <StatCard
          icon={<DollarSign className="w-6 h-6" />}
          label="Outstanding Balances"
          value={outstandingBalances}
          prefix="$"
          color={outstandingBalances > 0 ? 'bg-[#FF9500]' : 'bg-[#34C759]'}
          delay={200}
        />

        {/* Average Visit Cost */}
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          label="Average Visit Cost"
          value={Math.round(averageVisitCost)}
          prefix="$"
          color="bg-[#5856D6]"
          delay={300}
        />

        {/* Insurance Coverage */}
        <StatCard
          icon={<Shield className="w-6 h-6" />}
          label="Insurance Coverage"
          value={Math.round(insuranceCoverage.percentage)}
          suffix="%"
          color="bg-[#00C7BE]"
          delay={400}
        />

        {/* Most Frequent Procedure */}
        <StatCard
          icon={<Activity className="w-6 h-6" />}
          label="Most Frequent Procedure"
          value={mostFrequentProcedure.name}
          animateValue={false}
          color="bg-[#FF2D55]"
          delay={500}
        />
      </div>

      {/* Additional Details (Optional Sub-stats) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="rounded-xl bg-[#F5F5F7] p-4">
          <p className="text-xs uppercase font-medium text-[#86868B] tracking-wide mb-1">
            Active Coverage
          </p>
          <p className="text-lg font-semibold text-[#1D1D1F]">
            {insuranceCoverage.covered} of {insuranceCoverage.total} patients
          </p>
        </div>

        <div className="rounded-xl bg-[#F5F5F7] p-4">
          <p className="text-xs uppercase font-medium text-[#86868B] tracking-wide mb-1">
            Procedure Volume
          </p>
          <p className="text-lg font-semibold text-[#1D1D1F]">
            {mostFrequentProcedure.count}× {mostFrequentProcedure.name}
          </p>
        </div>

        <div className="rounded-xl bg-[#F5F5F7] p-4">
          <p className="text-xs uppercase font-medium text-[#86868B] tracking-wide mb-1">
            Payment Collection
          </p>
          <p className="text-lg font-semibold text-[#1D1D1F]">
            {outstandingBalances > 0 
              ? `$${outstandingBalances.toLocaleString()} pending`
              : 'All paid up! 🎉'
            }
          </p>
        </div>
      </motion.div>
    </div>
  );
}
