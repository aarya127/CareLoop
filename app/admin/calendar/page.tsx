
"use client";
import React, { useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { useRouter } from "next/navigation";

// Helper to fetch events from backend
async function fetchEvents(info: any, successCallback: any, failureCallback: any) {
  try {
    const params = new URLSearchParams({
      start: info.startStr,
      end: info.endStr,
    });
    const res = await fetch(`/api/calendar/events?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch events");
    const data = await res.json();
    // Map backend events to FullCalendar format
    const events = data.events.map((evt: any) => ({
      id: evt.id,
      title: evt.summary || evt.title || "(No Title)",
      start: evt.start,
      end: evt.end,
      extendedProps: evt,
      allDay: evt.allDay || false,
    }));
    successCallback(events);
  } catch (err) {
    failureCallback(err);
  }
}

export default function AdminCalendarPage() {
  const calendarRef = useRef<FullCalendar>(null);
  const router = useRouter();
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isBooking, setIsBooking] = useState(false);
  // Helper to fetch a random patient and xray from the vector DB
  async function fetchRandomPatientAndXray() {
    // Query vector search for a random patient
    const patientRes = await fetch('/api/vector/search?q=patient&k=1');
    const patientData = await patientRes.json();
    const patient = patientData?.results?.[0]?.item;
    // Query vector search for a random xray
    const xrayRes = await fetch('/api/vector/search?q=xray&k=1');
    const xrayData = await xrayRes.json();
    const xray = xrayData?.results?.[0]?.item;
    return { patient, xray };
  }

  // Handler for fake booking
  async function handleFakeBooking() {
    setIsBooking(true);
    try {
      const { patient, xray } = await fetchRandomPatientAndXray();
      if (!patient) {
        alert('No demo patient found in vector DB.');
        setIsBooking(false);
        return;
      }
      // Create a new event for the next available slot (now + 1h)
      const now = new Date();
      const start = new Date(now.getTime() + 60 * 60 * 1000);
      const end = new Date(start.getTime() + 30 * 60 * 1000);
      const event = {
        summary: `Exam: ${patient.first_name} ${patient.last_name}`,
        description: xray ? `XRAY: ${xray.text || xray.note || ''}` : '',
        start: start.toISOString(),
        end: end.toISOString(),
        patientId: patient.id,
        xrayId: xray?.id,
      };
      // Call backend to create event
      const res = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
      if (!res.ok) throw new Error('Failed to create event');
      // Refetch events
      calendarRef.current?.getApi().refetchEvents();
      alert('Fake booking created!');
    } catch (err) {
      alert('Error creating fake booking: ' + (err as any).message);
    }
    setIsBooking(false);
  }

  // Handler for event click
  function handleEventClick(clickInfo: any) {
    setSelectedEvent(clickInfo.event.extendedProps);
  }

  // Handler for date selection (create new event)
  function handleDateSelect(selectInfo: any) {
    // Could open a modal for new event creation
    alert(
      `Create new appointment from ${selectInfo.startStr} to ${selectInfo.endStr}`
    );
  }

  // Handler for event drop/resize
  async function handleEventChange(changeInfo: any) {
    const event = changeInfo.event;
    // Call backend to update event
    await fetch(`/api/calendar/events/${event.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        start: event.start?.toISOString(),
        end: event.end?.toISOString(),
      }),
    });
  }

  // Handler for Google Connect
  async function handleGoogleConnect() {
    const res = await fetch('/api/oauth/google/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      alert('Failed to start Google OAuth flow.');
      return;
    }
    const { url } = await res.json();
    window.location.href = url;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Calendar</h1>
        <div className="flex gap-2">
          <button
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-60"
            onClick={handleFakeBooking}
            disabled={isBooking}
          >
            {isBooking ? 'Booking...' : 'Fake Booking'}
          </button>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={handleGoogleConnect}
          >
            Connect Google Calendar
          </button>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow border p-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[
            dayGridPlugin,
            timeGridPlugin,
            interactionPlugin,
            listPlugin,
          ]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
          }}
          selectable={true}
          editable={true}
          eventResizableFromStart={true}
          selectMirror={true}
          events={fetchEvents}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventChange}
          eventResize={handleEventChange}
          height="auto"
        />
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold mb-4">Appointment Details</h2>
            <div className="mb-2">
              <strong>Title:</strong> {selectedEvent.summary || selectedEvent.title}
            </div>
            <div className="mb-2">
              <strong>Start:</strong> {selectedEvent.start}
            </div>
            <div className="mb-2">
              <strong>End:</strong> {selectedEvent.end}
            </div>
            <div className="mb-2">
              <strong>Status:</strong> {selectedEvent.status}
            </div>
            <div className="flex justify-end mt-4">
              <button
                className="px-4 py-2 border rounded mr-2"
                onClick={() => setSelectedEvent(null)}
              >
                Close
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={() => router.push(`/patient-record?id=${selectedEvent.patientId || ''}`)}
              >
                View Patient Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
