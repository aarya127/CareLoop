/**
 * Appointment Card Component
 * Displays appointment information in calendar views
 */

'use client';

import { motion } from 'framer-motion';
import { Bot, Hand, Clock, User, Phone } from 'lucide-react';
import type { PopulatedAppointment } from '@/lib/types/appointment';
import {
  getAppointmentTimeRange,
  getAppointmentDuration,
  getBookingSourceColor,
  isPast,
} from '@/lib/utils/calendar';

interface AppointmentCardProps {
  appointment: PopulatedAppointment;
  variant?: 'day' | 'week' | 'list';
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  isSelected?: boolean;
  showTooltip?: boolean;
}

export default function AppointmentCard({
  appointment,
  variant = 'day',
  onClick,
  onDragStart,
  onDragEnd,
  isSelected = false,
  showTooltip = false,
}: AppointmentCardProps) {
  const colors = getBookingSourceColor(appointment.bookingSource);
  const isAppointmentPast = isPast(new Date(appointment.endTime));
  const isRescheduled = !!appointment.rescheduledFrom;

  // Calculate card height based on duration (for day view)
  const getDurationHeight = () => {
    if (variant !== 'day') return 'auto';
    const start = new Date(appointment.startTime);
    const end = new Date(appointment.endTime);
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    // 30px per 15 minutes
    return `${(durationMinutes / 15) * 30}px`;
  };

  const baseClasses = `
    relative overflow-hidden rounded-lg border-l-4 bg-white p-3 
    shadow-sm transition-all duration-200
    ${onClick ? 'cursor-pointer' : ''}
    ${isAppointmentPast ? 'opacity-60' : ''}
    ${isSelected ? 'ring-2 ring-[#87CEEB] ring-offset-2' : 'hover:shadow-md'}
  `;

  const CardContent = () => (
    <>
      {/* Border color indicator */}
      <div
        className="absolute left-0 top-0 h-full w-1"
        style={{
          backgroundColor: isRescheduled ? '#FF9500' : colors.border,
        }}
      />

      {/* Background tint */}
      <div
        className="absolute inset-0 opacity-100"
        style={{ backgroundColor: colors.background }}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Patient Name */}
        <div className="mb-1 flex items-start justify-between">
          <div className="font-semibold text-gray-900">
            {appointment.patient.firstName} {appointment.patient.lastName}
          </div>
          {variant === 'day' && (
            <div className="ml-2">
              {appointment.bookingSource === 'ai' ? (
                <Bot size={14} style={{ color: colors.text }} />
              ) : (
                <Hand size={14} style={{ color: colors.text }} />
              )}
            </div>
          )}
        </div>

        {/* Time - Full format for day/list view */}
        {(variant === 'day' || variant === 'list') && (
          <div className="mb-1 flex items-center gap-1 text-xs text-gray-600">
            <Clock size={12} />
            <span>{getAppointmentTimeRange(appointment)}</span>
          </div>
        )}

        {/* Time - Short format for week view */}
        {variant === 'week' && (
          <div className="mb-1 text-xs text-gray-600">
            {new Date(appointment.startTime).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })}
          </div>
        )}

        {/* Procedure and Doctor - Full view */}
        {variant !== 'week' && (
          <div className="mb-2 text-xs text-gray-600">
            <span>{appointment.procedureType}</span>
            <span className="mx-1">•</span>
            <span>{appointment.doctor.name}</span>
          </div>
        )}

        {/* Booking Source Badge - Day and List view */}
        {variant !== 'week' && (
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: colors.background,
                color: colors.text,
                border: `1px solid ${colors.border}20`,
              }}
            >
              {appointment.bookingSource === 'ai' ? (
                <>
                  <Bot size={10} />
                  AI Agent
                </>
              ) : (
                <>
                  <Hand size={10} />
                  Manual
                </>
              )}
            </span>

            {isRescheduled && (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-600">
                Rescheduled
              </span>
            )}
          </div>
        )}

        {/* AI Confidence Score - Only for AI bookings, day/list view */}
        {variant !== 'week' &&
          appointment.bookingSource === 'ai' &&
          appointment.aiConfidenceScore && (
            <div className="mt-2 text-xs text-gray-500">
              Confidence: {appointment.aiConfidenceScore}%
            </div>
          )}

        {/* Status indicator for non-scheduled appointments */}
        {appointment.status !== 'scheduled' && (
          <div
            className={`mt-2 text-xs font-medium ${
              appointment.status === 'completed'
                ? 'text-green-600'
                : appointment.status === 'canceled'
                ? 'text-gray-500'
                : 'text-orange-600'
            }`}
          >
            {appointment.status.charAt(0).toUpperCase() +
              appointment.status.slice(1)}
          </div>
        )}
      </div>
    </>
  );

  // Tooltip overlay (for hover)
  const Tooltip = () =>
    showTooltip ? (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="absolute left-0 top-full z-50 mt-2 w-80 rounded-xl border border-gray-200 bg-white p-4 shadow-xl"
      >
        <div className="mb-3 text-base font-semibold text-gray-900">
          {appointment.patient.firstName} {appointment.patient.lastName}
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Clock size={14} />
            <span>
              {new Date(appointment.startTime).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}{' '}
              • {getAppointmentTimeRange(appointment)}
            </span>
          </div>

          <div className="text-gray-600">
            <strong>Procedure:</strong> {appointment.procedureType}
          </div>

          <div className="text-gray-600">
            <strong>Doctor:</strong> {appointment.doctor.name}
          </div>

          {appointment.insuranceProvider && (
            <div className="text-gray-600">
              <strong>Insurance:</strong> {appointment.insuranceProvider}
            </div>
          )}

          <div className="text-gray-600">
            <strong>Booked by:</strong>{' '}
            {appointment.bookingSource === 'ai' ? 'AI Agent' : 'Manual Entry'}
          </div>

          <div className="flex items-center gap-2 text-gray-600">
            <Phone size={14} />
            <span>{appointment.patient.phone}</span>
          </div>

          {appointment.notes && (
            <div className="mt-2 rounded-lg bg-gray-50 p-2 text-xs text-gray-600">
              {appointment.notes}
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <button className="flex-1 rounded-lg bg-[#87CEEB] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#6BA8D9]">
            View Profile
          </button>
          <button className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
            Reschedule
          </button>
        </div>
      </motion.div>
    ) : null;

  const cardElement = (
    <div
      onClick={onClick}
      className={baseClasses}
      style={{
        height: getDurationHeight(),
        minHeight: variant === 'day' ? '60px' : 'auto',
      }}
      draggable={!!onDragStart}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <CardContent />
    </div>
  );

  return (
    <div className="relative">
      {onDragStart ? (
        cardElement
      ) : (
        <motion.div whileHover={{ y: -2, scale: variant === 'week' ? 1 : 1.02 }}>
          {cardElement}
        </motion.div>
      )}

      <Tooltip />
    </div>
  );
}

/**
 * Compact Appointment Card for Week/Month views
 */
export function CompactAppointmentCard({
  appointment,
  onClick,
}: {
  appointment: PopulatedAppointment;
  onClick?: () => void;
}) {
  const colors = getBookingSourceColor(appointment.bookingSource);

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      className="mb-1 cursor-pointer rounded px-1 py-0.5 text-xs"
      style={{
        backgroundColor: colors.background,
        borderLeft: `3px solid ${colors.border}`,
      }}
    >
      <div className="truncate font-medium text-gray-900">
        {new Date(appointment.startTime).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })}{' '}
        {appointment.patient.firstName}
      </div>
    </motion.div>
  );
}
