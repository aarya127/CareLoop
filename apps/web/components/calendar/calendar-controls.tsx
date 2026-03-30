'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CalendarView } from '@/lib/types/calendar';

interface CalendarControlsProps {
  viewMode: CalendarView;
  onViewModeChange: (mode: CalendarView) => void;
  displayText: string;
  onNavigate: (direction: 'prev' | 'next') => void;
  onToday: () => void;
}

const viewModes: { value: CalendarView; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'agenda', label: 'Agenda' },
];

export function CalendarControls({
  viewMode,
  onViewModeChange,
  displayText,
  onNavigate,
  onToday,
}: CalendarControlsProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
      {/* Left: Navigation */}
      <div className="flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToday}
          className="px-4 py-2 bg-sky-400 text-white rounded-lg font-medium hover:bg-sky-500 transition-colors shadow-sm"
        >
          Today
        </motion.button>

        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onNavigate('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onNavigate('next')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </motion.button>
        </div>

        <div className="flex items-center gap-2 px-3">
          <CalendarIcon className="w-4 h-4 text-gray-500" />
          <span className="text-lg font-semibold text-gray-900">
            {displayText}
          </span>
        </div>
      </div>

      {/* Right: View mode toggles */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        {viewModes.map((mode) => (
          <motion.button
            key={mode.value}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onViewModeChange(mode.value)}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-all',
              viewMode === mode.value
                ? 'bg-white text-sky-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            {mode.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
