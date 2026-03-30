'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { WeekViewDay, CalendarAppointment } from '@/lib/types/calendar';
import {
  getBookingSourceColor,
  calculateAppointmentHeight,
  calculateAppointmentTop,
} from '@/lib/utils/calendar-helpers';

interface CustomWeekViewProps {
  days: WeekViewDay[];
  onDayClick: (date: Date) => void;
  onAppointmentClick: (appointment: CalendarAppointment) => void;
}

const dayHeaderVariants = {
  default: {
    backgroundColor: 'transparent',
    transition: { duration: 0.2 }
  },
  hover: {
    backgroundColor: 'rgba(135,206,235,0.1)',
    transition: { duration: 0.15 }
  }
};

const compactCardVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: i * 0.05,
      duration: 0.2
    }
  })
};

export function CustomWeekView({ days, onDayClick, onAppointmentClick }: CustomWeekViewProps) {
  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {days.map((day) => (
          <motion.div
            key={day.date.toISOString()}
            variants={dayHeaderVariants}
            initial="default"
            whileHover="hover"
            whileTap={{ scale: 0.98 }}
            className={cn(
              'bg-white p-4 cursor-pointer',
              day.isToday && 'bg-sky-50',
              day.isWeekend && 'bg-gray-50'
            )}
            onClick={() => onDayClick(day.date)}
          >
            <div className="text-center">
              <div className="text-sm font-medium text-gray-600 mb-1">
                {day.dayName}
              </div>
              <motion.div
                whileHover={{ scale: 1.15 }}
                className={cn(
                  'w-10 h-10 mx-auto rounded-full flex items-center justify-center font-bold',
                  day.isToday
                    ? 'bg-sky-400 text-white'
                    : 'text-gray-900'
                )}
              >
                {day.dayNumber}
              </motion.div>
              <div className="text-xs text-gray-500 mt-2">
                {day.appointments.length} {day.appointments.length === 1 ? 'apt' : 'apts'}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Week grid with appointments */}
      <div className="flex-1 grid grid-cols-7 gap-px bg-gray-200 overflow-hidden">
        {days.map((day, dayIndex) => (
          <div
            key={day.date.toISOString()}
            className={cn(
              'bg-white relative overflow-y-auto',
              day.isToday && 'bg-sky-50/50 ring-2 ring-sky-400 ring-inset',
              day.isWeekend && 'bg-gray-50/50'
            )}
          >
            {/* Time grid lines (subtle) */}
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 14 }, (_, i) => (
                <div
                  key={i}
                  className="border-b border-gray-100"
                  style={{ height: '100px' }}
                />
              ))}
            </div>

            {/* Appointments */}
            <div className="relative px-1 py-2">
              <AnimatePresence>
                {day.appointments.map((apt, aptIndex) => (
                  <CompactAppointmentCard
                    key={apt.id}
                    appointment={apt}
                    index={aptIndex}
                    onClick={() => onAppointmentClick(apt)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Export as default as well
export default CustomWeekView;

interface CompactAppointmentCardProps {
  appointment: CalendarAppointment;
  index: number;
  onClick: () => void;
}

function CompactAppointmentCard({ appointment, index, onClick }: CompactAppointmentCardProps) {
  const dayStart = new Date(appointment.startTime);
  dayStart.setHours(6, 0, 0, 0);
  const top = calculateAppointmentTop(appointment.startTime, dayStart);
  const height = Math.max(
    calculateAppointmentHeight(appointment.startTime, appointment.endTime),
    50 // Minimum height
  );

  return (
    <motion.div
      custom={index}
      variants={compactCardVariants}
      initial="hidden"
      animate="visible"
      layout
      whileHover={{ scale: 1.05, zIndex: 20 }}
      whileTap={{ scale: 0.98 }}
      className="absolute left-1 right-1 cursor-pointer mb-1"
      style={{
        top: `${top}px`,
        height: `${height}px`,
      }}
      onClick={onClick}
    >
      <div
        className="h-full rounded-lg p-2 overflow-hidden relative group"
        style={{
          backgroundColor: 'white',
          borderLeft: `3px solid ${getBookingSourceColor(appointment.source)}`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <div className="text-xs font-semibold text-gray-900 truncate">
          {format(appointment.startTime, 'h:mm a')}
        </div>
        <div className="text-xs text-gray-700 truncate mt-0.5">
          {appointment.patientName}
        </div>
        {height > 60 && (
          <div className="text-xs text-gray-500 truncate mt-0.5">
            {appointment.procedure}
          </div>
        )}

        {/* Hover glow effect */}
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{
            boxShadow: `0 0 0 2px ${getBookingSourceColor(appointment.source)}40`,
          }}
        />
      </div>
    </motion.div>
  );
}
