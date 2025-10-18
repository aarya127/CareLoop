'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  X,
  Plus,
  Filter,
} from 'lucide-react';
import { getAllDemoPatients } from '@/lib/demo/sample-data';

type ViewMode = 'day' | 'week' | 'month';

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  procedure: string;
  startTime: Date;
  endTime: Date;
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  type: 'cleaning' | 'checkup' | 'filling' | 'root-canal' | 'crown' | 'extraction' | 'other';
  notes?: string;
  isAIBooked?: boolean;
}

interface Doctor {
  id: string;
  name: string;
  color: string;
}

const doctors: Doctor[] = [
  { id: 'doc-001', name: 'Dr. Emily Chen', color: 'bg-blue-500' },
  { id: 'doc-002', name: 'Dr. James Wilson', color: 'bg-green-500' },
  { id: 'doc-003', name: 'Dr. Sarah Martinez', color: 'bg-purple-500' },
];

// Generate sample appointments for demo
function generateSampleAppointments(date: Date): Appointment[] {
  const patients = getAllDemoPatients();
  const appointments: Appointment[] = [];
  const procedures = ['Cleaning', 'Checkup', 'Filling', 'Root Canal', 'Crown Prep', 'Extraction'];
  const statuses: Array<'scheduled' | 'confirmed' | 'in-progress' | 'completed'> = [
    'scheduled',
    'confirmed',
    'in-progress',
    'completed',
  ];

  const startOfDay = new Date(date);
  startOfDay.setHours(8, 0, 0, 0);

  // Generate 12-15 appointments per day across doctors
  for (let i = 0; i < 15; i++) {
    const patient = patients[i % patients.length];
    const doctor = doctors[i % doctors.length];
    const procedure = procedures[Math.floor(Math.random() * procedures.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    const hourOffset = Math.floor(i / 2); // 2 appointments per hour
    const minuteOffset = (i % 2) * 30; // Either :00 or :30

    const startTime = new Date(startOfDay);
    startTime.setHours(startOfDay.getHours() + hourOffset, minuteOffset, 0, 0);

    const endTime = new Date(startTime);
    endTime.setMinutes(startTime.getMinutes() + 30); // 30-minute slots

    appointments.push({
      id: `appt-${date.toISOString()}-${i}`,
      patientId: patient.id,
      patientName: `${patient.first_name} ${patient.last_name}`,
      doctorId: doctor.id,
      doctorName: doctor.name,
      procedure,
      startTime,
      endTime,
      status,
      type: 'checkup',
      isAIBooked: Math.random() > 0.6,
    });
  }

  return appointments.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}

export default function AdminCalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [selectedDoctors, setSelectedDoctors] = useState<string[]>(doctors.map((d) => d.id));
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const appointments = useMemo(() => generateSampleAppointments(currentDate), [currentDate]);

  const filteredAppointments = appointments.filter((appt) =>
    selectedDoctors.includes(appt.doctorId)
  );

  const navigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const toggleDoctor = (doctorId: string) => {
    setSelectedDoctors((prev) =>
      prev.includes(doctorId) ? prev.filter((id) => id !== doctorId) : [...prev, doctorId]
    );
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'scheduled':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'confirmed':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'in-progress':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'completed':
        return 'bg-indigo-100 text-indigo-700 border-indigo-300';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  // Group appointments by time slots
  const timeSlots = Array.from({ length: 10 }, (_, i) => {
    const hour = 8 + i;
    return `${hour}:00`;
  });

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
            <p className="text-gray-600 mt-2">{formatDate(currentDate)}</p>
          </div>

          <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('day')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'day'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-2 text-sm font-medium transition-colors border-x border-gray-300 ${
                  viewMode === 'week'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'month'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Month
              </button>
            </div>

            {/* Date Navigation */}
            <div className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg">
              <button
                onClick={() => navigate('prev')}
                className="p-2 hover:bg-gray-50 rounded-l-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => navigate('next')}
                className="p-2 hover:bg-gray-50 rounded-r-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <button className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              <Plus className="w-4 h-4" />
              <span>New Appointment</span>
            </button>
          </div>
        </div>

        {/* Doctor Filter */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter by Doctor:</span>
            </div>
            <div className="flex items-center space-x-2">
              {doctors.map((doctor) => (
                <button
                  key={doctor.id}
                  onClick={() => toggleDoctor(doctor.id)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border transition-colors ${
                    selectedDoctors.includes(doctor.id)
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${doctor.color}`}></div>
                  <span className="text-sm">{doctor.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Day View */}
          {viewMode === 'day' && (
            <div className="grid grid-cols-4 divide-x divide-gray-200">
              {/* Time Column */}
              <div className="col-span-1 bg-gray-50">
                <div className="h-16 border-b border-gray-200 flex items-center justify-center font-medium text-gray-700">
                  Time
                </div>
                {timeSlots.map((time) => (
                  <div
                    key={time}
                    className="h-20 border-b border-gray-200 flex items-start justify-end px-4 pt-2 text-sm text-gray-600"
                  >
                    {time}
                  </div>
                ))}
              </div>

              {/* Doctor Columns */}
              {doctors
                .filter((doctor) => selectedDoctors.includes(doctor.id))
                .map((doctor) => {
                  const doctorAppts = filteredAppointments.filter(
                    (appt) => appt.doctorId === doctor.id
                  );

                  return (
                    <div key={doctor.id} className="col-span-1">
                      <div className="h-16 border-b border-gray-200 flex items-center justify-center">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${doctor.color}`}></div>
                          <span className="font-medium text-gray-900">{doctor.name}</span>
                        </div>
                      </div>

                      {/* Time Slots */}
                      <div className="relative">
                        {timeSlots.map((time, index) => (
                          <div
                            key={time}
                            className="h-20 border-b border-gray-200 hover:bg-gray-50 transition-colors"
                          />
                        ))}

                        {/* Appointments */}
                        {doctorAppts.map((appt) => {
                          const hour = appt.startTime.getHours();
                          const minute = appt.startTime.getMinutes();
                          const top = ((hour - 8) * 80) + (minute / 60) * 80;
                          const duration =
                            (appt.endTime.getTime() - appt.startTime.getTime()) / (1000 * 60);
                          const height = (duration / 60) * 80;

                          return (
                            <button
                              key={appt.id}
                              onClick={() => setSelectedAppointment(appt)}
                              className={`absolute left-1 right-1 rounded-lg border-2 p-2 overflow-hidden transition-all hover:shadow-md ${getStatusColor(
                                appt.status
                              )}`}
                              style={{ top: `${top}px`, height: `${height}px` }}
                            >
                              <div className="text-left">
                                <p className="text-xs font-semibold truncate">
                                  {appt.patientName}
                                </p>
                                <p className="text-xs truncate">{appt.procedure}</p>
                                <p className="text-xs text-gray-600">
                                  {formatTime(appt.startTime)}
                                </p>
                                {appt.isAIBooked && (
                                  <span className="inline-block mt-1 px-1.5 py-0.5 bg-indigo-600 text-white text-xs rounded">
                                    AI
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Week/Month views - Simplified list view for now */}
          {viewMode !== 'day' && (
            <div className="p-6">
              <p className="text-center text-gray-500">
                {viewMode === 'week' ? 'Week' : 'Month'} view coming soon
              </p>
            </div>
          )}
        </div>

        {/* Appointment Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{filteredAppointments.length}</p>
              </div>
              <CalendarIcon className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredAppointments.filter((a) => a.status === 'scheduled').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Confirmed</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredAppointments.filter((a) => a.status === 'confirmed').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">
                  {filteredAppointments.filter((a) => a.status === 'in-progress').length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {filteredAppointments.filter((a) => a.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-indigo-400" />
            </div>
          </div>
        </div>

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Appointment Details</h2>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Patient Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Patient Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Name:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedAppointment.patientName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Doctor:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedAppointment.doctorName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Appointment Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Appointment Details</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Procedure:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedAppointment.procedure}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Date:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(selectedAppointment.startTime)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Time:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatTime(selectedAppointment.startTime)} -{' '}
                      {formatTime(selectedAppointment.endTime)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                        selectedAppointment.status
                      )}`}
                    >
                      {selectedAppointment.status.charAt(0).toUpperCase() +
                        selectedAppointment.status.slice(1)}
                    </span>
                  </div>
                  {selectedAppointment.isAIBooked && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Booked via:</span>
                      <span className="inline-block px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                        AI Assistant
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => router.push(`/patient-record?id=${selectedAppointment.patientId}`)}
                    className="flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">View Full Dental Record</span>
                  </button>
                  <button className="flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm font-medium">Call Patient</span>
                  </button>
                  <button className="flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-sm font-medium">Send Message</span>
                  </button>
                  <button className="flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <CalendarIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">Reschedule</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setSelectedAppointment(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
