'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
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

// Mock appointments data
const mockAppointments: CalendarAppointment[] = [
  {
    id: 'apt-1',
    patientId: '1',
    patientName: 'Sarah Johnson',
    startTime: new Date(2025, 9, 17, 9, 0),
    endTime: new Date(2025, 9, 17, 9, 30),
    duration: 30,
    procedure: 'Routine Cleaning',
    doctorId: 'dr-1',
    doctorName: 'Dr. Smith',
    source: 'AI',
    status: 'scheduled',
    insuranceCovered: true,
  },
  {
    id: 'apt-2',
    patientId: '2',
    patientName: 'Michael Chen',
    startTime: new Date(2025, 9, 17, 10, 0),
    endTime: new Date(2025, 9, 17, 10, 45),
    duration: 45,
    procedure: 'Filling - Tooth #18',
    doctorId: 'dr-2',
    doctorName: 'Dr. Lee',
    source: 'Manual',
    status: 'scheduled',
    insuranceCovered: true,
  },
  {
    id: 'apt-3',
    patientId: '3',
    patientName: 'Emily Davis',
    startTime: new Date(2025, 9, 17, 13, 0),
    endTime: new Date(2025, 9, 17, 14, 30),
    duration: 90,
    procedure: 'Crown Placement',
    doctorId: 'dr-3',
    doctorName: 'Dr. Martinez',
    source: 'Rescheduled',
    status: 'scheduled',
    insuranceCovered: true,
  },
  {
    id: 'apt-4',
    patientId: '4',
    patientName: 'James Wilson',
    startTime: new Date(2025, 9, 18, 9, 30),
    endTime: new Date(2025, 9, 18, 10, 0),
    duration: 30,
    procedure: 'Check-up',
    doctorId: 'dr-1',
    doctorName: 'Dr. Smith',
    source: 'AI',
    status: 'scheduled',
    insuranceCovered: true,
  },
  {
    id: 'apt-5',
    patientId: '5',
    patientName: 'Lisa Anderson',
    startTime: new Date(2025, 9, 18, 14, 0),
    endTime: new Date(2025, 9, 18, 15, 30),
    duration: 90,
    procedure: 'Root Canal',
    doctorId: 'dr-2',
    doctorName: 'Dr. Lee',
    source: 'Manual',
    status: 'scheduled',
    insuranceCovered: true,
  },
  {
    id: 'apt-6',
    patientId: '6',
    patientName: 'David Brown',
    startTime: new Date(2025, 9, 19, 11, 0),
    endTime: new Date(2025, 9, 19, 11, 30),
    duration: 30,
    procedure: 'Cleaning',
    doctorId: 'dr-1',
    doctorName: 'Dr. Smith',
    source: 'AI',
    status: 'scheduled',
    insuranceCovered: false,
  },
  {
    id: 'apt-7',
    patientId: '7',
    patientName: 'Jennifer Martinez',
    startTime: new Date(2025, 9, 20, 10, 0),
    endTime: new Date(2025, 9, 20, 11, 0),
    duration: 60,
    procedure: 'Extraction',
    doctorId: 'dr-3',
    doctorName: 'Dr. Martinez',
    source: 'Rescheduled',
    status: 'scheduled',
    insuranceCovered: true,
  },
];

// Mock patient drawer data generator
function generatePatientDrawerData(appointment: CalendarAppointment): PatientDrawerData {
  return {
    appointment,
    patient: {
      id: appointment.patientId,
      firstName: appointment.patientName.split(' ')[0],
      lastName: appointment.patientName.split(' ')[1],
      email: `${appointment.patientName.toLowerCase().replace(' ', '.')}@example.com`,
      phone: '(555) 123-4567',
      dateOfBirth: new Date(1985, 5, 15),
      age: 39,
      address: {
        street: '123 Main St',
        city: 'Toronto',
        state: 'ON',
        zip: 'M5H 2N2',
      },
    },
    insurance: {
      provider: 'Blue Cross Blue Shield',
      planName: 'Dental Plus PPO',
      memberId: 'BC123456789',
      coveragePercent: 80,
      policyExpiry: new Date(2026, 11, 31),
    },
    xrays: [
      {
        id: 'xray-1',
        type: 'Bitewing',
        date: new Date(2025, 8, 15),
        thumbnailUrl: '/xrays/bitewing-thumb.jpg',
        fullUrl: '/xrays/bitewing-full.jpg',
      },
      {
        id: 'xray-2',
        type: 'Panoramic',
        date: new Date(2025, 8, 15),
        thumbnailUrl: '/xrays/panoramic-thumb.jpg',
        fullUrl: '/xrays/panoramic-full.jpg',
      },
    ],
    periodontalData: {
      lastExam: new Date(2025, 8, 15),
      averagePocketDepth: 2.5,
      gingivalIndex: 1,
      bleedingPoints: 3,
      pocketDepths: [],
      recessionsPresent: false,
      mobilityPresent: false,
    },
    dentalChart: [],
    visitHistory: [
      {
        id: 'visit-1',
        date: new Date(2025, 8, 15),
        reason: 'Routine Cleaning',
        provider: 'Dr. Smith',
        procedures: [
          { code: 'D1110', name: 'Prophylaxis - Adult', cost: 120 },
        ],
        totalCost: 120,
        insurancePaid: 96,
        patientPaid: 24,
        status: 'completed',
      },
      {
        id: 'visit-2',
        date: new Date(2025, 2, 20),
        reason: 'Filling',
        provider: 'Dr. Lee',
        procedures: [
          { code: 'D2391', name: 'Resin-based composite - one surface', cost: 180 },
        ],
        totalCost: 180,
        insurancePaid: 144,
        patientPaid: 36,
        status: 'completed',
      },
    ],
    notes: [
      {
        id: 'note-1',
        appointmentId: 'apt-old',
        author: 'Dr. Smith',
        role: 'Dentist',
        timestamp: new Date(2025, 8, 15, 10, 30),
        content: 'Patient presents with good oral hygiene. No signs of decay. Advised to continue regular brushing and flossing.',
        isEdited: false,
      },
    ],
  };
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
    }
  },
  exit: (direction: number) => ({
    opacity: 0,
    scale: 0.95,
    x: direction > 0 ? -50 : 50,
    transition: {
      duration: 0.3,
    }
  })
};

export default function CustomCalendarPage() {
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

  // Handle appointment click
  const handleAppointmentClick = (appointment: CalendarAppointment) => {
    const data = generatePatientDrawerData(appointment);
    setDrawerData(data);
    setCalendarState((prev) => ({
      ...prev,
      selectedAppointment: appointment,
      isDrawerOpen: true,
    }));
  };

  // Handle slot click (booking)
  const handleSlotClick = (time: Date) => {
    console.log('Slot clicked:', time);
    // Open booking modal (to be implemented)
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
  const monthDays = generateMonthViewDays(calendarState.currentDate, mockAppointments);
  const daySlots = generateDayViewSlots(calendarState.selectedDate || calendarState.currentDate, mockAppointments);
  const weekDays = generateWeekViewDays(calendarState.currentDate, mockAppointments);

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
                <div className="p-8 text-center text-gray-500">
                  Agenda view coming soon...
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Floating Action Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-br from-sky-400 to-sky-500 text-white rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center z-30"
          onClick={() => console.log('Open booking modal')}
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

      {/* Keyboard shortcuts legend (hidden, just for reference) */}
      <div className="sr-only">
        Keyboard shortcuts: ← → (navigate), D (day view), W (week view), M (month view), T (today), ESC (close)
      </div>
    </div>
  );
}
