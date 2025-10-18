/**
 * Week View Component
 * 7-column grid showing Mon-Sun with appointments
 */

'use client';

import { useState } from 'react';
import type { PopulatedAppointment } from '@/lib/types/appointment';
import { CompactAppointmentCard } from './appointment-card';
import {
  formatTime,
  sortAppointmentsByTime,
  isToday,
} from '@/lib/utils/calendar';
import { startOfWeek, endOfWeek, addDays, format } from 'date-fns';

interface WeekViewProps {
  date: Date;
  appointments: PopulatedAppointment[];
  onAppointmentClick?: (appointment: PopulatedAppointment) => void;
  onDayClick?: (date: Date) => void;
  workStartHour?: number;
  workEndHour?: number;
}

export default function WeekView({
  date,
  appointments,
  onAppointmentClick,
  onDayClick,
  workStartHour = 8,
  workEndHour = 18,
}: WeekViewProps) {
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);

  // Get week boundaries (Monday to Sunday)
  const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // 1 = Monday
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });

  // Generate days of the week
  const weekDays: Array<{
    date: Date;
    dayName: string;
    dayNumber: string;
    fullDate: string;
    isToday: boolean;
    isWeekend: boolean;
  }> = [];
  for (let i = 0; i < 7; i++) {
    const day = addDays(weekStart, i);
    weekDays.push({
      date: day,
      dayName: format(day, 'EEE'), // Mon, Tue, Wed, etc.
      dayNumber: format(day, 'd'), // 1, 2, 3, etc.
      fullDate: format(day, 'MMM d'), // Oct 21
      isToday: isToday(day),
      isWeekend: day.getDay() === 0 || day.getDay() === 6,
    });
  }

  // Generate time slots
  const timeSlots: Array<{ hour: number; time: string }> = [];
  for (let hour = workStartHour; hour <= workEndHour; hour++) {
    const slotDate = new Date();
    slotDate.setHours(hour, 0, 0, 0);
    timeSlots.push({
      hour,
      time: formatTime(slotDate),
    });
  }

  // Group appointments by day
  const appointmentsByDay = weekDays.map((day) => {
    const dayStart = new Date(day.date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day.date);
    dayEnd.setHours(23, 59, 59, 999);

    const dayAppointments = sortAppointmentsByTime(
      appointments.filter((apt) => {
        const aptDate = new Date(apt.startTime);
        return aptDate >= dayStart && aptDate <= dayEnd;
      })
    ) as PopulatedAppointment[];

    return {
      ...day,
      appointments: dayAppointments,
    };
  });

  const handleDayClick = (day: typeof weekDays[0], index: number) => {
    setSelectedDayIndex(index);
    onDayClick?.(day.date);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
      {/* Week Header */}
      <div className="grid grid-cols-8 border-b border-gray-200">
        {/* Time column header */}
        <div className="border-r border-gray-200 bg-gray-50 p-2" />

        {/* Day headers */}
        {appointmentsByDay.map((day, index) => (
          <div
            key={day.date.toISOString()}
            onClick={() => handleDayClick(day, index)}
            className={`
              cursor-pointer border-r border-gray-200 p-3 text-center 
              transition-colors duration-150
              ${day.isToday ? 'bg-[#87CEEB] text-white' : 'bg-gray-50 hover:bg-gray-100'}
              ${day.isWeekend ? 'bg-gray-100' : ''}
              ${selectedDayIndex === index ? 'ring-2 ring-[#87CEEB] ring-inset' : ''}
            `}
          >
            <div className="text-xs font-medium uppercase tracking-wide">
              {day.dayName}
            </div>
            <div className={`text-lg font-semibold ${day.isToday ? 'text-white' : 'text-gray-900'}`}>
              {day.dayNumber}
            </div>
            <div className={`text-xs ${day.isToday ? 'text-white/80' : 'text-gray-500'}`}>
              {day.appointments.length} apt{day.appointments.length !== 1 ? 's' : ''}
            </div>
          </div>
        ))}
      </div>

      {/* Week Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-8">
          {/* Time labels column */}
          <div className="sticky left-0 z-10 border-r border-gray-200 bg-white">
            {timeSlots.map((slot) => (
              <div
                key={slot.hour}
                className="h-16 border-b border-gray-100 px-2 py-1 text-right"
              >
                <span className="text-xs font-medium text-gray-600">
                  {slot.time}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {appointmentsByDay.map((day) => (
            <div
              key={day.date.toISOString()}
              className="relative border-r border-gray-200 last:border-r-0"
            >
              {/* Time slot grid */}
              {timeSlots.map((slot, slotIndex) => (
                <div
                  key={slot.hour}
                  className={`
                    h-16 border-b border-gray-100 
                    ${day.isWeekend ? 'bg-gray-50/50' : slotIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}
                  `}
                />
              ))}

              {/* Appointments (positioned absolutely) */}
              <div className="absolute inset-0 overflow-hidden px-1 py-1">
                <div className="space-y-1">
                  {day.appointments.map((appointment) => (
                    <CompactAppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      onClick={() => onAppointmentClick?.(appointment)}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact Week View (for mobile/tablet)
 * Shows only 5 days (Mon-Fri)
 */
export function CompactWeekView({
  date,
  appointments,
  onAppointmentClick,
  onDayClick,
}: Omit<WeekViewProps, 'workStartHour' | 'workEndHour'>) {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });

  // Only Mon-Fri
  const weekDays = [];
  for (let i = 0; i < 5; i++) {
    const day = addDays(weekStart, i);
    weekDays.push({
      date: day,
      dayName: format(day, 'EEE'),
      dayNumber: format(day, 'd'),
      isToday: isToday(day),
    });
  }

  // Group appointments by day
  const appointmentsByDay = weekDays.map((day) => {
    const dayStart = new Date(day.date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day.date);
    dayEnd.setHours(23, 59, 59, 999);

    const dayAppointments = sortAppointmentsByTime(
      appointments.filter((apt) => {
        const aptDate = new Date(apt.startTime);
        return aptDate >= dayStart && aptDate <= dayEnd;
      })
    ) as PopulatedAppointment[];

    return {
      ...day,
      appointments: dayAppointments,
    };
  });

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
      {/* Header */}
      <div className="grid grid-cols-5 border-b border-gray-200">
        {appointmentsByDay.map((day, index) => (
          <div
            key={day.date.toISOString()}
            onClick={() => onDayClick?.(day.date)}
            className={`
              cursor-pointer border-r border-gray-200 p-2 text-center
              last:border-r-0
              ${day.isToday ? 'bg-[#87CEEB] text-white' : 'bg-gray-50 hover:bg-gray-100'}
            `}
          >
            <div className="text-xs font-medium uppercase">
              {day.dayName}
            </div>
            <div className={`text-base font-semibold ${day.isToday ? 'text-white' : 'text-gray-900'}`}>
              {day.dayNumber}
            </div>
          </div>
        ))}
      </div>

      {/* Appointments */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-5">
          {appointmentsByDay.map((day) => (
            <div
              key={day.date.toISOString()}
              className="min-h-[200px] border-r border-gray-100 p-2 last:border-r-0"
            >
              <div className="space-y-1">
                {day.appointments.length > 0 ? (
                  day.appointments.map((appointment) => (
                    <CompactAppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      onClick={() => onAppointmentClick?.(appointment)}
                    />
                  ))
                ) : (
                  <div className="py-4 text-center text-xs text-gray-400">
                    No appointments
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Empty State for Week View
 */
export function WeekViewEmpty({ onAddClick }: { onAddClick?: () => void }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="mb-4 text-6xl">📆</div>
        <h3 className="mb-2 text-xl font-semibold text-gray-900">
          Nothing scheduled this week
        </h3>
        <p className="mb-6 text-gray-600">
          Start adding appointments to fill up your calendar.
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
