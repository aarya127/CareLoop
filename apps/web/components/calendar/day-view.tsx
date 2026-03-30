/**
 * Day View Component
 * Hourly timeline view with appointment cards
 */

'use client';

import { useState } from 'react';
import type { PopulatedAppointment } from '@/lib/types/appointment';
import AppointmentCard from './appointment-card';
import { formatTime, sortAppointmentsByTime } from '@/lib/utils/calendar';

interface DayViewProps {
  date: Date;
  appointments: PopulatedAppointment[];
  onAppointmentClick?: (appointment: PopulatedAppointment) => void;
  onTimeSlotClick?: (time: Date) => void;
  workStartHour?: number;
  workEndHour?: number;
}

export default function DayView({
  date,
  appointments,
  onAppointmentClick,
  onTimeSlotClick,
  workStartHour = 8, // 8 AM
  workEndHour = 18, // 6 PM
}: DayViewProps) {
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<
    string | null
  >(null);

  // Generate time slots
  const timeSlots = [];
  for (let hour = workStartHour; hour <= workEndHour; hour++) {
    const slotDate = new Date(date);
    slotDate.setHours(hour, 0, 0, 0);
    timeSlots.push({
      hour,
      time: formatTime(slotDate),
      fullTime: slotDate,
    });
  }

  // Get appointments for this day, sorted by time
  const dayAppointments = sortAppointmentsByTime(
    appointments.filter((apt) => {
      const aptDate = new Date(apt.startTime);
      return (
        aptDate.getFullYear() === date.getFullYear() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getDate() === date.getDate()
      );
    })
  ) as PopulatedAppointment[];

  // Calculate position and height for each appointment
  const getAppointmentStyle = (appointment: PopulatedAppointment) => {
    const start = new Date(appointment.startTime);
    const end = new Date(appointment.endTime);

    // Calculate minutes from work start
    const startMinutes =
      (start.getHours() - workStartHour) * 60 + start.getMinutes();
    const durationMinutes =
      (end.getTime() - start.getTime()) / (1000 * 60);

    // Each hour is 80px tall, so each minute is 80/60 px
    const pixelsPerMinute = 80 / 60;
    const top = startMinutes * pixelsPerMinute;
    const height = durationMinutes * pixelsPerMinute;

    return {
      top: `${top}px`,
      height: `${Math.max(height, 60)}px`, // Minimum 60px
    };
  };

  const handleAppointmentClick = (appointment: PopulatedAppointment) => {
    setSelectedAppointmentId(appointment.id);
    onAppointmentClick?.(appointment);
  };

  const handleTimeSlotClick = (slotTime: Date) => {
    // Create a 30-minute slot starting at this time
    const endTime = new Date(slotTime);
    endTime.setMinutes(endTime.getMinutes() + 30);

    onTimeSlotClick?.(slotTime);
  };

  return (
    <div className="relative flex h-full">
      {/* Time Labels Column */}
      <div className="sticky left-0 z-10 w-20 flex-shrink-0 border-r border-gray-200 bg-white">
        {timeSlots.map((slot) => (
          <div
            key={slot.hour}
            className="h-20 border-b border-gray-100 px-2 py-1 text-right"
          >
            <span className="text-sm font-medium text-gray-600">
              {slot.time}
            </span>
          </div>
        ))}
      </div>

      {/* Appointments Column */}
      <div className="relative flex-1">
        {/* Time slot grid (background) */}
        <div className="absolute inset-0">
          {timeSlots.map((slot, index) => (
            <div
              key={slot.hour}
              onClick={() => handleTimeSlotClick(slot.fullTime)}
              className="
                h-20 cursor-pointer border-b border-gray-100 
                transition-colors duration-150
                hover:bg-gray-50
              "
              style={{
                backgroundColor: index % 2 === 0 ? '#FBFBFB' : '#FFFFFF',
              }}
            >
              {/* 30-minute divider */}
              <div className="h-10 border-b border-gray-50" />
            </div>
          ))}
        </div>

        {/* Appointments (absolute positioned) */}
        <div className="relative">
          {dayAppointments.map((appointment) => {
            const style = getAppointmentStyle(appointment);
            return (
              <div
                key={appointment.id}
                className="absolute left-0 right-0 px-2"
                style={{
                  top: style.top,
                  height: style.height,
                  zIndex: selectedAppointmentId === appointment.id ? 30 : 20,
                }}
              >
                <AppointmentCard
                  appointment={appointment}
                  variant="day"
                  onClick={() => handleAppointmentClick(appointment)}
                  isSelected={selectedAppointmentId === appointment.id}
                />
              </div>
            );
          })}
        </div>

        {/* Current time indicator */}
        <CurrentTimeIndicator
          workStartHour={workStartHour}
          workEndHour={workEndHour}
          date={date}
        />
      </div>
    </div>
  );
}

/**
 * Current Time Indicator
 * Shows a red line at the current time (only for today)
 */
function CurrentTimeIndicator({
  workStartHour,
  workEndHour,
  date,
}: {
  workStartHour: number;
  workEndHour: number;
  date: Date;
}) {
  const now = new Date();

  // Only show if viewing today
  const isToday =
    now.getDate() === date.getDate() &&
    now.getMonth() === date.getMonth() &&
    now.getFullYear() === date.getFullYear();

  if (!isToday) return null;

  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();

  // Only show during work hours
  if (currentHour < workStartHour || currentHour >= workEndHour) {
    return null;
  }

  // Calculate position
  const minutesFromStart =
    (currentHour - workStartHour) * 60 + currentMinutes;
  const pixelsPerMinute = 80 / 60;
  const top = minutesFromStart * pixelsPerMinute;

  return (
    <div
      className="absolute left-0 right-0 z-40 flex items-center"
      style={{ top: `${top}px` }}
    >
      {/* Red circle */}
      <div className="h-3 w-3 rounded-full bg-red-500 shadow-sm" />
      {/* Red line */}
      <div className="h-0.5 flex-1 bg-red-500 opacity-75" />
      {/* Current time label */}
      <div className="ml-2 rounded bg-red-500 px-2 py-0.5 text-xs font-medium text-white shadow-sm">
        {formatTime(now)}
      </div>
    </div>
  );
}

/**
 * Empty State for Day View
 */
export function DayViewEmpty({ onAddClick }: { onAddClick?: () => void }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="mb-4 text-6xl">📅</div>
        <h3 className="mb-2 text-xl font-semibold text-gray-900">
          No appointments scheduled
        </h3>
        <p className="mb-6 text-gray-600">
          This day is wide open. Add an appointment to get started.
        </p>
        {onAddClick && (
          <button
            onClick={onAddClick}
            className="rounded-lg bg-[#87CEEB] px-6 py-2 font-medium text-white transition-colors hover:bg-[#6BA8D9]"
          >
            + Add Appointment
          </button>
        )}
      </div>
    </div>
  );
}
