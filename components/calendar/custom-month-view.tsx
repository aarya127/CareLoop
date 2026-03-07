'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { MonthViewDay, CalendarAppointment } from '@/lib/types/calendar';
import { getBookingSourceColor } from '@/lib/utils/calendar-helpers';

interface MonthViewProps {
  days: MonthViewDay[];
  onDayClick: (date: Date) => void;
  onAppointmentClick: (appointment: CalendarAppointment) => void;
  selectedDate: Date | null;
}

const dayCellVariants = {
  default: {
    y: 0,
    scale: 1,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] as any }
  },
  hover: {
    y: -2,
    scale: 1.02,
    boxShadow: '0 4px 12px rgba(135,206,235,0.15), 0 0 0 2px rgba(135,206,235,0.2)',
    transition: { duration: 0.15, ease: [0.4, 0, 0.2, 1] as any }
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 }
  }
};

const dotVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: (i: number) => ({
    scale: 1,
    opacity: 1,
    transition: {
      delay: i * 0.05,
      type: 'spring' as const,
      stiffness: 500,
      damping: 15
    }
  }),
  hover: {
    scale: 1.5,
    transition: { duration: 0.2 }
  }
};

export function MonthView({ days, onDayClick, onAppointmentClick, selectedDate }: MonthViewProps) {
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="h-full flex flex-col">
      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 mb-px">
        {weekDays.map((day) => (
          <div
            key={day}
            className="bg-white px-4 py-3 text-center text-sm font-semibold text-gray-700"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 grid grid-cols-7 gap-px bg-gray-200">
        <AnimatePresence mode="wait">
          {days.map((day, index) => (
            <DayCell
              key={day.date.toISOString()}
              day={day}
              index={index}
              onDayClick={onDayClick}
              onAppointmentClick={onAppointmentClick}
              isSelected={!!(selectedDate && format(day.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd'))}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Also export as CustomMonthView for compatibility
export { MonthView as CustomMonthView };

interface DayCellProps {
  day: MonthViewDay;
  index: number;
  onDayClick: (date: Date) => void;
  onAppointmentClick: (appointment: CalendarAppointment) => void;
  isSelected?: boolean;
}

function DayCell({ day, index, onDayClick, onAppointmentClick, isSelected }: DayCellProps) {
  return (
    <motion.div
      variants={dayCellVariants}
      initial="default"
      whileHover="hover"
      whileTap="tap"
      className={cn(
        'bg-white p-2 relative cursor-pointer min-h-[100px] flex flex-col',
        !day.isCurrentMonth && 'bg-gray-50 text-gray-400',
        day.isToday && 'ring-2 ring-sky-400 ring-inset',
        day.isWeekend && 'bg-sky-50/30',
        isSelected && 'ring-2 ring-sky-500 ring-inset bg-sky-50'
      )}
      onClick={() => onDayClick(day.date)}
    >
      {/* Date number */}
      <motion.div
        whileHover={{ scale: 1.2 }}
        className={cn(
          'text-sm font-semibold mb-2 w-8 h-8 rounded-full flex items-center justify-center',
          day.isToday && 'bg-sky-400 text-white',
          !day.isCurrentMonth && 'text-gray-400'
        )}
      >
        {day.dayNumber}
      </motion.div>

      {/* Appointment dots */}
      {day.appointments.length > 0 && (
        <motion.div 
          className="flex flex-wrap gap-1 mt-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {day.appointments.slice(0, 3).map((apt, idx) => (
            <motion.div
              key={apt.id}
              custom={idx}
              variants={dotVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              className="w-2 h-2 rounded-full cursor-pointer"
              style={{ backgroundColor: getBookingSourceColor(apt.source) }}
              onClick={(e) => {
                e.stopPropagation();
                onAppointmentClick(apt);
              }}
              title={`${apt.patientName} - ${format(apt.startTime, 'h:mm a')}`}
            />
          ))}
          {day.appointments.length > 3 && (
            <motion.span
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xs text-gray-500 ml-1"
            >
              +{day.appointments.length - 3}
            </motion.span>
          )}
        </motion.div>
      )}

      {/* Hover preview */}
      <AnimatePresence>
        {day.appointments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            whileHover={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl p-3 z-20 min-w-[200px] pointer-events-none"
          >
            <div className="text-xs font-semibold text-gray-700 mb-2">
              {day.appointments.length} {day.appointments.length === 1 ? 'appointment' : 'appointments'}
            </div>
            <div className="space-y-1">
              {day.appointments.slice(0, 3).map((apt) => (
                <div key={apt.id} className="text-xs text-gray-600">
                  <span className="font-medium">{format(apt.startTime, 'h:mm a')}</span>
                  {' - '}
                  <span>{apt.patientName}</span>
                </div>
              ))}
              {day.appointments.length > 3 && (
                <div className="text-xs text-gray-500 italic">
                  and {day.appointments.length - 3} more...
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
