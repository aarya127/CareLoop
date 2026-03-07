'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DayViewSlot, CalendarAppointment } from '@/lib/types/calendar';
import {
  calculateCurrentTimePosition,
  getBookingSourceColor,
  getBookingSourceGradient,
  calculateAppointmentHeight,
  calculateAppointmentTop,
} from '@/lib/utils/calendar-helpers';

interface CustomDayViewProps {
  slots: DayViewSlot[];
  onSlotClick: (time: Date) => void;
  onAppointmentClick: (appointment: CalendarAppointment) => void;
  selectedDate: Date;
}

const slotVariants = {
  default: {
    backgroundColor: 'transparent',
    transition: { duration: 0.2 }
  },
  hover: {
    backgroundColor: 'rgba(135,206,235,0.05)',
    boxShadow: 'inset 0 0 0 2px rgba(135,206,235,0.2)',
    transition: { duration: 0.15 }
  }
};

const appointmentVariants = {
  collapsed: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: { duration: 0.2 }
  },
  expanded: {
    scale: 1.02,
    opacity: 1,
    y: -4,
    zIndex: 100,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 25
    }
  },
  selected: {
    scale: 1.05,
    opacity: 0.8,
    transition: { duration: 0.3 }
  }
};

export function CustomDayView({
  slots,
  onSlotClick,
  onAppointmentClick,
  selectedDate,
}: CustomDayViewProps) {
  const currentTimePosition = calculateCurrentTimePosition();
  const showCurrentTimeLine = currentTimePosition !== -1;

  return (
    <div className="relative h-full flex flex-col bg-gray-50">
      {/* Time labels column */}
      <div className="flex">
        <div className="w-20 flex-shrink-0" />
        <div className="flex-1 px-4 py-2 border-b border-gray-200 bg-white">
          <div className="text-sm font-semibold text-gray-700">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </div>
        </div>
      </div>

      {/* Scrollable time slots */}
      <div className="flex-1 overflow-y-auto relative">
        <div className="flex relative">
          {/* Time labels */}
          <div className="w-20 flex-shrink-0 relative">
            {slots.map((slot) => (
              <div
                key={slot.time.toISOString()}
                className="h-[100px] border-b border-gray-200 px-2 py-1 text-sm text-gray-600"
              >
                {format(slot.time, 'h a')}
              </div>
            ))}
          </div>

          {/* Appointment grid */}
          <div className="flex-1 relative border-l border-gray-200">
            {/* Time slots */}
            {slots.map((slot) => (
              <motion.div
                key={slot.time.toISOString()}
                variants={slotVariants}
                initial="default"
                whileHover="hover"
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'h-[100px] border-b border-gray-200 cursor-pointer relative',
                  slot.isPast && 'bg-gray-50/50'
                )}
                onClick={() => onSlotClick(slot.time)}
              />
            ))}

            {/* Current time indicator */}
            <AnimatePresence>
              {showCurrentTimeLine && (
                <motion.div
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="absolute left-0 right-0 z-30 pointer-events-none"
                  style={{ top: `${currentTimePosition}px` }}
                >
                  <div
                    className="h-0.5 bg-gradient-to-r from-red-500 to-red-600 shadow-lg shadow-red-500/40"
                    style={{ transformOrigin: 'left' }}
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-lg"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Appointments overlay */}
            <div className="absolute inset-0 px-2">
              {slots.flatMap((slot) =>
                slot.appointments.map((apt) => (
                  <AppointmentCard
                    key={apt.id}
                    appointment={apt}
                    onClick={() => onAppointmentClick(apt)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export as default as well
export default CustomDayView;

interface AppointmentCardProps {
  appointment: CalendarAppointment;
  onClick: () => void;
}

function AppointmentCard({ appointment, onClick }: AppointmentCardProps) {
  const height = calculateAppointmentHeight(appointment.startTime, appointment.endTime);
  const dayStart = new Date(appointment.startTime);
  dayStart.setHours(6, 0, 0, 0);
  const top = calculateAppointmentTop(appointment.startTime, dayStart);

  return (
    <motion.div
      variants={appointmentVariants}
      initial="collapsed"
      whileHover="expanded"
      whileTap={{ scale: 0.98 }}
      className="absolute left-0 right-0 cursor-pointer group"
      style={{
        top: `${top}px`,
        height: `${height}px`,
        minHeight: '60px',
      }}
      onClick={onClick}
    >
      <div
        className="h-full rounded-xl p-3 overflow-hidden relative"
        style={{
          background: getBookingSourceGradient(appointment.source),
          borderLeft: `4px solid ${getBookingSourceColor(appointment.source)}`,
        }}
      >
        {/* Card content */}
        <div className="relative z-10">
          <div className="text-white font-semibold text-sm mb-1">
            {appointment.patientName}
          </div>
          <div className="text-white/90 text-xs mb-1">
            {format(appointment.startTime, 'h:mm a')} - {format(appointment.endTime, 'h:mm a')}
          </div>
          <div className="text-white/80 text-xs">
            {appointment.procedure}
          </div>
          
          {/* Doctor badge */}
          <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 rounded-full backdrop-blur-sm">
            <Clock className="w-3 h-3 text-white" />
            <span className="text-white text-xs">{appointment.doctorName}</span>
          </div>
        </div>

        {/* Booking source badge */}
        <div className="absolute top-2 right-2">
          <span className="px-2 py-0.5 bg-white/30 backdrop-blur-sm rounded-full text-white text-xs font-medium">
            {appointment.source}
          </span>
        </div>

        {/* Quick actions on hover */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          whileHover={{ opacity: 1, y: 0 }}
          className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <div className="flex gap-1">
            <button
              className="px-2 py-1 bg-white/90 hover:bg-white text-gray-700 rounded text-xs font-medium shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                // Edit action
              }}
            >
              Edit
            </button>
            <button
              className="px-2 py-1 bg-white/90 hover:bg-white text-gray-700 rounded text-xs font-medium shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                // Reschedule action
              }}
            >
              Reschedule
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
