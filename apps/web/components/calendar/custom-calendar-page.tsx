'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Plus } from 'lucide-react';
import { addMonths, endOfMonth, format, startOfMonth, subMonths } from 'date-fns';
import { appointmentsApi, type AppointmentRecord } from '@/lib/api/appointments';
import { AppointmentFormModal } from '@/components/appointments/appointment-form-modal';
import { useAppointmentEvents, type AppointmentEvent } from '@/hooks/useAppointmentEvents';
import { useAuth } from '@/lib/auth/auth-context';
import { PUBLIC_API_URL } from '@/lib/config/api-client';
import { classifyHttpStatus } from '@/lib/patient-record/load-state';
import type { ApiPatient } from '@/lib/patient-record/profile';
import TopNavigation from '@/components/shared/top-navigation';
import { CalendarControls } from '@/components/calendar/calendar-controls';
import { CustomMonthView } from '@/components/calendar/custom-month-view';
import { CustomDayView } from '@/components/calendar/custom-day-view';
import { CustomWeekView } from '@/components/calendar/custom-week-view';
import { PatientDetailDrawer } from '@/components/calendar/patient-detail-drawer';
import type {
  CalendarView,
  CalendarAppointment,
  CalendarState,
  PatientDrawerData,
} from '@/lib/types/calendar';
import {
  generateMonthViewDays,
  generateDayViewSlots,
  generateWeekViewDays,
  navigateCalendar,
  getNavigationDisplayText,
} from '@/lib/utils/calendar-helpers';

/** API sources: manual | ai_booked | rescheduled (older rows may say `ai`). */
function toCalendarSource(source?: string | null): CalendarAppointment['source'] {
  if (source === 'ai_booked' || source === 'ai') return 'AI';
  if (source === 'rescheduled') return 'Rescheduled';
  return 'Manual';
}

/** API statuses: scheduled | confirmed | pending | completed | cancelled | no_show. */
function toCalendarStatus(status?: string | null): CalendarAppointment['status'] {
  if (status === 'no_show') return 'no-show';
  if (status === 'completed' || status === 'cancelled') return status;
  return 'scheduled';
}

/** Map an API AppointmentRecord to CalendarAppointment */
function toCalendarAppt(a: AppointmentRecord): CalendarAppointment {
  return {
    id: a.id,
    patientId: a.patientId ?? '',
    patientName: a.title,
    startTime: new Date(a.start),
    endTime: new Date(a.end),
    duration: Math.round((new Date(a.end).getTime() - new Date(a.start).getTime()) / 60_000),
    procedure: a.procedureCode ?? '',
    doctorId: a.providerId,
    doctorName: '',
    source: toCalendarSource(a.source),
    status: toCalendarStatus(a.status),
  };
}

async function fetchDrawerPatient(patientId: string): Promise<PatientDrawerData['patient']> {
  try {
    const res = await fetch(`${PUBLIC_API_URL}/patients/${encodeURIComponent(patientId)}`, {
      credentials: 'include',
    });
    const outcome = classifyHttpStatus(res.status);
    if (outcome !== 'ok') return { status: 'error', reason: outcome };
    const p = (await res.json()) as ApiPatient;
    const insurance = p.insuranceRecords?.[0];
    return {
      status: 'ready',
      isEmpty: false,
      data: {
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        dateOfBirth: p.dateOfBirth ? String(p.dateOfBirth).slice(0, 10) : '',
        phone: p.phoneE164 ?? '',
        gender: p.gender ?? '',
        insurance: insurance
          ? {
              payerName: insurance.payerName,
              planName: insurance.planName ?? '',
              memberIdMasked: insurance.memberIdMasked ?? '',
            }
          : undefined,
      },
    };
  } catch {
    return { status: 'error', reason: 'network' };
  }
}

const viewTransitionVariants = {
  initial: (direction: number) => ({
    opacity: 0,
    scale: 0.95,
    x: direction > 0 ? 50 : -50,
  }),
  animate: {
    opacity: 1,
    scale: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1] as any,
    },
  },
  exit: (direction: number) => ({
    opacity: 0,
    scale: 0.95,
    x: direction > 0 ? -50 : 50,
    transition: {
      duration: 0.3,
    },
  }),
};

export default function CustomCalendarPage() {
  const { user } = useAuth();
  const practiceId = user?.practiceId ?? '';

  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [apptStatus, setApptStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [reloadKey, setReloadKey] = useState(0);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [defaultStart, setDefaultStart] = useState<string | undefined>();

  const [calendarState, setCalendarState] = useState<CalendarState>({
    currentDate: new Date(),
    selectedDate: new Date(),
    viewMode: 'week',
    selectedAppointment: null,
    isDrawerOpen: false,
    isBookingModalOpen: false,
    focusedAppointmentId: null,
  });

  const [direction, setDirection] = useState(0);
  const [drawerData, setDrawerData] = useState<PatientDrawerData | null>(null);

  // Load the visible month plus one either side; refetch when navigating to another month.
  const monthKey = format(calendarState.currentDate, 'yyyy-MM');
  useEffect(() => {
    if (!practiceId) return;
    let cancelled = false;
    const anchor = calendarState.currentDate;
    setApptStatus('loading');
    appointmentsApi
      .list({
        practiceId,
        from: startOfMonth(subMonths(anchor, 1)).toISOString(),
        to: endOfMonth(addMonths(anchor, 1)).toISOString(),
      })
      .then((records) => {
        if (cancelled) return;
        setAppointments(records.map(toCalendarAppt));
        setApptStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setApptStatus('error');
      });
    return () => {
      cancelled = true;
    };
    // Keyed on monthKey (not currentDate) so day/week navigation within a month doesn't refetch.
  }, [practiceId, monthKey, reloadKey]);

  // Live appointment board: apply SSE events from colleagues' mutations
  const handleAppointmentEvent = useCallback((event: AppointmentEvent) => {
    setAppointments((prev) => {
      switch (event.type) {
        case 'created': {
          if (prev.some((a) => a.id === event.id)) return prev; // already present
          const mapped: CalendarAppointment = {
            id: event.id,
            patientId: event.patientId ?? '',
            patientName: event.title,
            startTime: new Date(event.start),
            endTime: new Date(event.end),
            duration: Math.round(
              (new Date(event.end).getTime() - new Date(event.start).getTime()) / 60_000,
            ),
            procedure: '',
            doctorId: event.providerId,
            doctorName: '',
            source: toCalendarSource(event.source),
            status: 'scheduled',
          };
          return [...prev, mapped];
        }
        case 'cancelled':
          return prev.map((a) =>
            a.id === event.id ? { ...a, status: 'cancelled' as CalendarAppointment['status'] } : a,
          );
        case 'rescheduled':
          return prev.map((a) =>
            a.id === event.id
              ? {
                  ...a,
                  startTime: new Date(event.start),
                  endTime: new Date(event.end),
                  duration: Math.round(
                    (new Date(event.end).getTime() - new Date(event.start).getTime()) / 60_000,
                  ),
                  status: toCalendarStatus(event.status),
                }
              : a,
          );
        default:
          return prev;
      }
    });
  }, []);

  useAppointmentEvents(practiceId || undefined, handleAppointmentEvent);

  // Handle view mode change
  const handleViewModeChange = (mode: CalendarView) => {
    setCalendarState((prev) => ({ ...prev, viewMode: mode }));
  };

  // Handle navigation (prev/next)
  const handleNavigate = (dir: 'prev' | 'next') => {
    setDirection(dir === 'next' ? 1 : -1);
    if (calendarState.viewMode !== 'agenda') {
      const newDate = navigateCalendar(calendarState.currentDate, dir, calendarState.viewMode);
      setCalendarState((prev) => ({ ...prev, currentDate: newDate }));
    }
  };

  // Handle today button
  const handleToday = () => {
    setCalendarState((prev) => ({
      ...prev,
      currentDate: new Date(),
      selectedDate: new Date(),
    }));
  };

  // Handle day click (from month view)
  const handleDayClick = (date: Date) => {
    setCalendarState((prev) => ({
      ...prev,
      selectedDate: date,
      viewMode: 'day',
      currentDate: date,
    }));
  };

  // Open the drawer immediately, then fill in the real patient record.
  const handleAppointmentClick = (appointment: CalendarAppointment) => {
    const patientId = appointment.patientId;
    setDrawerData({
      appointment,
      patient: patientId ? { status: 'loading' } : { status: 'ready', data: null, isEmpty: true },
    });
    setCalendarState((prev) => ({
      ...prev,
      selectedAppointment: appointment,
      isDrawerOpen: true,
    }));
    if (!patientId) return;
    fetchDrawerPatient(patientId).then((patient) =>
      setDrawerData((cur) =>
        cur?.appointment.id === appointment.id ? { appointment, patient } : cur,
      ),
    );
  };

  // Handle slot click (booking)
  const handleSlotClick = (time: Date) => {
    setDefaultStart(time.toISOString());
    setBookingModalOpen(true);
  };

  // Close drawer
  const closeDrawer = () => {
    setCalendarState((prev) => ({
      ...prev,
      isDrawerOpen: false,
      selectedAppointment: null,
    }));
  };

  // Generate view data based on current view mode
  const monthDays = generateMonthViewDays(calendarState.currentDate, appointments);
  const daySlots = generateDayViewSlots(
    calendarState.selectedDate || calendarState.currentDate,
    appointments,
  );
  const weekDays = generateWeekViewDays(calendarState.currentDate, appointments);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          handleNavigate('prev');
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNavigate('next');
          break;
        case 'd':
          setCalendarState((prev) => ({ ...prev, viewMode: 'day' }));
          break;
        case 'w':
          setCalendarState((prev) => ({ ...prev, viewMode: 'week' }));
          break;
        case 'm':
          setCalendarState((prev) => ({ ...prev, viewMode: 'month' }));
          break;
        case 't':
          handleToday();
          break;
        case 'Escape':
          closeDrawer();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [calendarState.currentDate, calendarState.viewMode]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopNavigation />

      <main className="flex-1 flex flex-col">
        {/* Calendar Controls */}
        <CalendarControls
          viewMode={calendarState.viewMode}
          onViewModeChange={handleViewModeChange}
          displayText={
            calendarState.viewMode === 'agenda'
              ? 'Agenda View'
              : getNavigationDisplayText(calendarState.currentDate, calendarState.viewMode)
          }
          onNavigate={handleNavigate}
          onToday={handleToday}
        />

        {apptStatus === 'error' && (
          <div className="mx-6 mt-3 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="flex-1">
              Couldn&apos;t load appointments. The calendar may be incomplete.
            </span>
            <button
              onClick={() => setReloadKey((k) => k + 1)}
              className="font-medium text-red-700 hover:underline"
            >
              Retry
            </button>
          </div>
        )}
        {apptStatus === 'loading' && (
          <div className="mx-6 mt-3 text-xs text-gray-500">Loading appointments…</div>
        )}

        {/* Calendar Views */}
        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={`${calendarState.viewMode}-${calendarState.currentDate.toISOString()}`}
              custom={direction}
              variants={viewTransitionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute inset-0"
            >
              {calendarState.viewMode === 'month' && (
                <CustomMonthView
                  days={monthDays}
                  onDayClick={handleDayClick}
                  onAppointmentClick={handleAppointmentClick}
                  selectedDate={calendarState.selectedDate}
                />
              )}

              {calendarState.viewMode === 'day' && (
                <CustomDayView
                  slots={daySlots}
                  onSlotClick={handleSlotClick}
                  onAppointmentClick={handleAppointmentClick}
                  selectedDate={calendarState.selectedDate || calendarState.currentDate}
                />
              )}

              {calendarState.viewMode === 'week' && (
                <CustomWeekView
                  days={weekDays}
                  onDayClick={handleDayClick}
                  onAppointmentClick={handleAppointmentClick}
                />
              )}

              {calendarState.viewMode === 'agenda' && (
                <div className="p-8 text-center text-gray-500">Agenda view coming soon...</div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Floating Action Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-br from-sky-400 to-sky-500 text-white rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center z-30"
          onClick={() => {
            setDefaultStart(undefined);
            setBookingModalOpen(true);
          }}
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      </main>

      {/* Patient Detail Drawer */}
      <PatientDetailDrawer
        isOpen={calendarState.isDrawerOpen}
        onClose={closeDrawer}
        data={drawerData}
      />

      {/* Appointment booking modal */}
      <AppointmentFormModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        practiceId={practiceId}
        userId={user?.id ?? ''}
        defaultStart={defaultStart}
        onCreated={(appt) => {
          setAppointments((prev) => [...prev, toCalendarAppt(appt)]);
          setBookingModalOpen(false);
        }}
      />

      <div className="sr-only">
        Keyboard shortcuts: ← → (navigate), D (day view), W (week view), M (month view), T (today),
        ESC (close)
      </div>
    </div>
  );
}
