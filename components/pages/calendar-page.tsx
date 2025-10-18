'use client';

import * as React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import TopNavigation from '@/components/shared/top-navigation';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Filter,
  Plus,
} from 'lucide-react';
import { Footer } from '@/components/layout/footer';
import { motion } from 'framer-motion';
import './calendar-styles.css';

// Mock appointment data
const mockAppointments = [
  {
    id: '1',
    title: 'Sarah Johnson - New Patient',
    start: new Date(2025, 9, 17, 9, 0).toISOString(),
    end: new Date(2025, 9, 17, 10, 0).toISOString(),
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
    extendedProps: {
      patientId: '1',
      type: 'new_patient',
      providerId: 'dr-smith',
      insurancePending: false,
      balanceDue: false,
    },
  },
  {
    id: '2',
    title: 'Michael Chen - Hygiene',
    start: new Date(2025, 9, 17, 10, 30).toISOString(),
    end: new Date(2025, 9, 17, 11, 30).toISOString(),
    backgroundColor: '#10b981',
    borderColor: '#10b981',
    extendedProps: {
      patientId: '2',
      type: 'hygiene',
      providerId: 'dr-smith',
      insurancePending: false,
      balanceDue: false,
    },
  },
  {
    id: '3',
    title: 'Emily Davis - Crown Procedure',
    start: new Date(2025, 9, 17, 13, 0).toISOString(),
    end: new Date(2025, 9, 17, 14, 30).toISOString(),
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
    extendedProps: {
      patientId: '3',
      type: 'procedure',
      providerId: 'dr-smith',
      insurancePending: true,
      balanceDue: false,
    },
  },
  {
    id: '4',
    title: 'Robert Wilson - Emergency',
    start: new Date(2025, 9, 17, 15, 0).toISOString(),
    end: new Date(2025, 9, 17, 16, 0).toISOString(),
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
    extendedProps: {
      patientId: '4',
      type: 'emergency',
      providerId: 'dr-smith',
      insurancePending: false,
      balanceDue: true,
    },
  },
];

export function CalendarPage() {
  const calendarRef = React.useRef<FullCalendar>(null);
  const [currentView, setCurrentView] = React.useState('timeGridWeek');
  const [selectedEvent, setSelectedEvent] = React.useState<any>(null);

  const handleEventClick = (clickInfo: any) => {
    setSelectedEvent(clickInfo.event);
  };

  const handleDateSelect = (selectInfo: any) => {
    const title = prompt('Enter appointment title:');
    const calendarApi = selectInfo.view.calendar;

    calendarApi.unselect();

    if (title) {
      calendarApi.addEvent({
        title,
        start: selectInfo.startStr,
        end: selectInfo.endStr,
        allDay: selectInfo.allDay,
      });
    }
  };

  const goToToday = () => {
    const calendarApi = calendarRef.current?.getApi();
    calendarApi?.today();
  };

  const goToPrev = () => {
    const calendarApi = calendarRef.current?.getApi();
    calendarApi?.prev();
  };

  const goToNext = () => {
    const calendarApi = calendarRef.current?.getApi();
    calendarApi?.next();
  };

  const changeView = (view: string) => {
    const calendarApi = calendarRef.current?.getApi();
    calendarApi?.changeView(view);
    setCurrentView(view);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNavigation />
      
      <main className="flex-1 container mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Calendar</h1>
              <p className="text-muted-foreground">
                Manage appointments and provider schedules
              </p>
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Appointment
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Rail - Filters */}
            <div className="lg:col-span-1">
              <Card className="p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </h3>
                
                <div className="space-y-4">
                  {/* Date Picker Placeholder */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Date
                    </label>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      Select Date
                    </Button>
                  </div>

                  {/* Provider Filter */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Provider
                    </label>
                    <select className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm">
                      <option>All Providers</option>
                      <option>Dr. Smith</option>
                      <option>Dr. Johnson</option>
                      <option>Dr. Lee</option>
                    </select>
                  </div>

                  {/* Room Filter */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Room/Chair
                    </label>
                    <select className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm">
                      <option>All Rooms</option>
                      <option>Room 1</option>
                      <option>Room 2</option>
                      <option>Room 3</option>
                    </select>
                  </div>

                  {/* Appointment Type */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Type
                    </label>
                    <div className="space-y-2">
                      {['New Patient', 'Hygiene', 'Procedure', 'Emergency', 'Follow-up'].map(
                        (type) => (
                          <label key={type} className="flex items-center gap-2">
                            <input type="checkbox" defaultChecked className="rounded" />
                            <span className="text-sm">{type}</span>
                          </label>
                        )
                      )}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">Legend</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded bg-blue-500" />
                        <span className="text-xs">New Patient</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded bg-green-500" />
                        <span className="text-xs">Hygiene</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded bg-amber-500" />
                        <span className="text-xs">Procedure</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded bg-red-500" />
                        <span className="text-xs">Emergency</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Main Calendar */}
            <div className="lg:col-span-3">
              <Card className="p-6">
                {/* Calendar Controls */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={goToPrev}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" onClick={goToToday}>
                      Today
                    </Button>
                    <Button variant="outline" size="icon" onClick={goToNext}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex gap-1">
                    <Button
                      variant={currentView === 'timeGridDay' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => changeView('timeGridDay')}
                    >
                      Day
                    </Button>
                    <Button
                      variant={currentView === 'timeGridWeek' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => changeView('timeGridWeek')}
                    >
                      Week
                    </Button>
                    <Button
                      variant={currentView === 'dayGridMonth' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => changeView('dayGridMonth')}
                    >
                      Month
                    </Button>
                  </div>
                </div>

                {/* Calendar Component */}
                <div className="calendar-container">
                  <FullCalendar
                    ref={calendarRef}
                    plugins={[
                      dayGridPlugin,
                      timeGridPlugin,
                      interactionPlugin,
                      resourceTimelinePlugin,
                    ]}
                    initialView="timeGridWeek"
                    headerToolbar={false}
                    events={mockAppointments}
                    editable={true}
                    selectable={true}
                    selectMirror={true}
                    dayMaxEvents={true}
                    weekends={true}
                    slotMinTime="08:00:00"
                    slotMaxTime="18:00:00"
                    slotDuration="00:15:00"
                    eventClick={handleEventClick}
                    select={handleDateSelect}
                    height="auto"
                    nowIndicator={true}
                  />
                </div>
              </Card>
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
