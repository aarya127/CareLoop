/**
 * Calendar Analytics Dashboard
 * Displays 6 key metrics for the calendar/schedule page
 */

'use client';

import { motion } from 'framer-motion';
import {
  Calendar,
  Bot,
  Hand,
  RefreshCw,
  Clock,
  Activity,
} from 'lucide-react';
import type { CalendarAnalytics } from '@/lib/types/appointment';
import { animateNumber } from '@/lib/utils/analytics';
import { useEffect, useState } from 'react';

interface CalendarAnalyticsDashboardProps {
  analytics: CalendarAnalytics;
  onFilterClick?: (filter: string) => void;
  activeFilters?: string[];
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  subValue?: string;
  color: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  onClick?: () => void;
  isActive?: boolean;
}

function StatCard({
  icon,
  label,
  value,
  subValue,
  color,
  trend,
  onClick,
  isActive,
}: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = typeof value === 'number' ? value : 0;

  useEffect(() => {
    if (typeof value === 'number') {
      animateNumber(0, numericValue, 800, setDisplayValue);
    }
  }, [value, numericValue]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)' }}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl border bg-white p-6 
        transition-all duration-200
        ${onClick ? 'cursor-pointer' : ''}
        ${
          isActive
            ? 'border-[#87CEEB] border-2 ring-2 ring-[#87CEEB]/20'
            : 'border-gray-200 hover:border-gray-300'
        }
      `}
      style={{
        boxShadow: isActive
          ? '0 8px 24px rgba(135, 206, 235, 0.15)'
          : '0 2px 8px rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* Icon */}
      <div
        className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${color}15` }}
      >
        <div style={{ color }}>{icon}</div>
      </div>

      {/* Label */}
      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </div>

      {/* Value */}
      <div className="mb-1 text-3xl font-semibold text-gray-900">
        {typeof value === 'number' ? Math.round(displayValue) : value}
      </div>

      {/* Sub value or trend */}
      {subValue && (
        <div className="text-sm text-gray-600">{subValue}</div>
      )}

      {trend && (
        <div
          className={`text-sm font-medium ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {trend.isPositive ? '↑' : '↓'} {trend.value}
        </div>
      )}

      {/* Active indicator */}
      {isActive && (
        <div className="absolute right-3 top-3 h-2 w-2 rounded-full bg-[#87CEEB]" />
      )}
    </motion.div>
  );
}

export default function CalendarAnalyticsDashboard({
  analytics,
  onFilterClick,
  activeFilters = [],
}: CalendarAnalyticsDashboardProps) {
  return (
    <div className="mb-8">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Schedule Overview
          </h2>
          <p className="text-sm text-gray-600">
            Real-time booking analytics and trends
          </p>
        </div>

        {/* Clear filters button */}
        {activeFilters.length > 0 && (
          <button
            onClick={() => onFilterClick?.('clear')}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Clear Filters ({activeFilters.length})
          </button>
        )}
      </div>

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Card 1: Total Bookings */}
        <StatCard
          icon={<Calendar size={20} />}
          label="Total Bookings"
          value={analytics.totalBookings}
          subValue={`${analytics.averageDailyBookings.toFixed(1)} avg/day`}
          color="#87CEEB"
          onClick={() => onFilterClick?.('total')}
          isActive={activeFilters.includes('total')}
        />

        {/* Card 2: AI Bookings */}
        <StatCard
          icon={<Bot size={20} />}
          label="AI Bookings"
          value={analytics.aiBookings}
          subValue={`${analytics.aiBookingPercentage.toFixed(1)}% of total`}
          color="#87CEEB"
          onClick={() => onFilterClick?.('ai')}
          isActive={activeFilters.includes('ai')}
        />

        {/* Card 3: Manual Bookings */}
        <StatCard
          icon={<Hand size={20} />}
          label="Manual Bookings"
          value={analytics.manualBookings}
          subValue={`${analytics.manualBookingPercentage.toFixed(1)}% of total`}
          color="#34C759"
          onClick={() => onFilterClick?.('manual')}
          isActive={activeFilters.includes('manual')}
        />

        {/* Card 4: Rescheduled */}
        <StatCard
          icon={<RefreshCw size={20} />}
          label="Rescheduled"
          value={analytics.rescheduled}
          subValue="Last 30 days"
          color="#FF9500"
          onClick={() => onFilterClick?.('rescheduled')}
          isActive={activeFilters.includes('rescheduled')}
        />

        {/* Card 5: Upcoming 7 Days */}
        <StatCard
          icon={<Clock size={20} />}
          label="Upcoming"
          value={analytics.upcomingSevenDays}
          subValue="Next 7 days"
          color="#5856D6"
          onClick={() => onFilterClick?.('upcoming')}
          isActive={activeFilters.includes('upcoming')}
        />

        {/* Card 6: Most Frequent Procedure */}
        <StatCard
          icon={<Activity size={20} />}
          label="Top Procedure"
          value={analytics.mostFrequentProcedure.type}
          subValue={`${analytics.mostFrequentProcedure.count} this month`}
          color="#FF2D55"
          onClick={() =>
            onFilterClick?.(`procedure-${analytics.mostFrequentProcedure.type}`)
          }
          isActive={activeFilters.includes(
            `procedure-${analytics.mostFrequentProcedure.type}`
          )}
        />
      </div>

      {/* Active Filters Chips */}
      {activeFilters.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <div
              key={filter}
              className="inline-flex items-center gap-2 rounded-full border border-[#87CEEB]/20 bg-[#87CEEB]/10 px-3 py-1 text-sm font-medium text-[#87CEEB]"
            >
              <span className="capitalize">
                {filter.replace('procedure-', '')}
              </span>
              <button
                onClick={() => onFilterClick?.(filter)}
                className="hover:text-[#6BA8D9]"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
