'use client';

/**
 * Calendar Mini-Modal
 * Compact appointment view for patient cards
 * Shows past/future appointments with booking actions
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  Plus,
  ExternalLink,
  Sparkles,
  Check,
  XCircle,
  AlertCircle,
  ChevronRight,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { format, isFuture, isPast, isToday, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/auth-context';
import { auditLog, trackUXClick } from '@/lib/services/audit-service';
import type { Appointment } from '@/lib/services/api-types';

interface CalendarMiniModalProps {
  isOpen: boolean;
  patientId: string;
  patientName: string;
  onClose: () => void;
  onOpenMasterCalendar?: () => void;
  onNewBooking?: (patientId: string) => void;
  source?: 'patient_card' | 'quick_action';
}

type AppointmentFilter = 'all' | 'upcoming' | 'past';

export default function CalendarMiniModal({
  isOpen,
  patientId,
  patientName,
  onClose,
  onOpenMasterCalendar,
  onNewBooking,
  source = 'patient_card',
}: CalendarMiniModalProps) {
  const { user, hasScope } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<AppointmentFilter>('all');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Load appointments
  useEffect(() => {
    if (!isOpen) return;

    const loadAppointments = async () => {
      setIsLoading(true);
      try {
        // Audit log
        await auditLog({
          action: 'view_patient_calendar',
          actor_id: user?.id,
          patient_id: patientId,
          source,
        });

        // Production: GET /appointments?patient_id={patientId}&from={30_days_ago}&to={90_days_future}
        await new Promise((resolve) => setTimeout(resolve, 600));

        // Mock data
        const mockAppointments: Appointment[] = [
          {
            id: 'appt-1',
            patient_id: patientId,
            patient_name: patientName,
            doctor_id: 'doc-1',
            doctor_name: 'Dr. Smith',
            start: '2025-10-20T10:00:00-07:00',
            end: '2025-10-20T11:00:00-07:00',
            procedure_code: 'D1110',
            procedure_name: 'Prophylaxis - Adult',
            status: 'scheduled',
            source: 'ai',
            booking_channel: 'web_chat',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ai_confidence_score: 0.92,
            estimated_cost: 150,
            insurance_coverage_estimate: 97.5,
            confirmation_timestamp: '2025-10-15T14:30:00Z',
          },
          {
            id: 'appt-2',
            patient_id: patientId,
            patient_name: patientName,
            doctor_id: 'doc-2',
            doctor_name: 'Dr. Johnson',
            start: '2025-11-15T14:00:00-08:00',
            end: '2025-11-15T15:30:00-08:00',
            procedure_code: 'D0150',
            procedure_name: 'Comprehensive oral evaluation',
            status: 'confirmed',
            source: 'manual',
            booking_channel: 'phone',
            estimated_cost: 130,
            insurance_coverage_estimate: 84.5,
            confirmation_timestamp: '2025-11-10T09:15:00Z',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'appt-3',
            patient_id: patientId,
            patient_name: patientName,
            doctor_id: 'doc-1',
            doctor_name: 'Dr. Smith',
            start: '2025-09-20T09:00:00-07:00',
            end: '2025-09-20T10:00:00-07:00',
            procedure_code: 'D4910',
            procedure_name: 'Periodontal maintenance',
            status: 'completed',
            source: 'rescheduled',
            booking_channel: 'in_person',
            estimated_cost: 180,
            insurance_coverage_estimate: 117,
            confirmation_timestamp: '2025-09-15T11:00:00Z',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'appt-4',
            patient_id: patientId,
            patient_name: patientName,
            doctor_id: 'doc-1',
            doctor_name: 'Dr. Smith',
            start: '2025-08-12T13:00:00-07:00',
            end: '2025-08-12T14:00:00-07:00',
            procedure_code: 'D0210',
            procedure_name: 'Intraoral - complete series',
            status: 'completed',
            source: 'manual',
            booking_channel: 'phone',
            estimated_cost: 220,
            insurance_coverage_estimate: 143,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];

        setAppointments(mockAppointments);
      } catch (error) {
        console.error('Failed to load appointments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAppointments();
  }, [isOpen, patientId, patientName, user, source]);

  // Filter appointments
  const filteredAppointments = appointments.filter((appt) => {
    const apptDate = parseISO(appt.start);
    if (filter === 'upcoming') return isFuture(apptDate);
    if (filter === 'past') return isPast(apptDate) && !isToday(apptDate);
    return true;
  });

  // Group by upcoming/past
  const upcomingAppointments = filteredAppointments.filter((appt) => isFuture(parseISO(appt.start)));
  const pastAppointments = filteredAppointments.filter((appt) => isPast(parseISO(appt.start)) && !isToday(parseISO(appt.start)));

  // Handle new booking
  const handleNewBooking = async () => {
    await trackUXClick('new_booking_button', {
      patient_id: patientId,
      source: 'calendar_mini_modal',
    });

    if (onNewBooking) {
      onNewBooking(patientId);
    }
    onClose();
  };

  // Handle open master calendar
  const handleOpenMasterCalendar = async () => {
    await trackUXClick('open_master_calendar', {
      patient_id: patientId,
      source: 'calendar_mini_modal',
    });

    if (onOpenMasterCalendar) {
      onOpenMasterCalendar();
    }
    onClose();
  };

  // Handle appointment click
  const handleAppointmentClick = async (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    await trackUXClick('appointment_card_click', {
      patient_id: patientId,
      appointment_id: appointment.id,
      source: 'calendar_mini_modal',
    });
  };

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (selectedAppointment) {
          setSelectedAppointment(null);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, selectedAppointment, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => selectedAppointment ? setSelectedAppointment(null) : onClose()}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="relative w-full max-w-2xl max-h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#87CEEB] to-[#6BA8D9] px-6 py-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{patientName}'s Calendar</h2>
                  <p className="text-sm text-white/80">
                    {appointments.length} appointment{appointments.length !== 1 ? 's' : ''} on record
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Action Bar */}
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Filter Buttons */}
              {(['all', 'upcoming', 'past'] as const).map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={cn(
                    'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                    filter === filterType
                      ? 'bg-[#87CEEB] text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                  )}
                >
                  {filterType === 'all' && 'All'}
                  {filterType === 'upcoming' && `Upcoming (${upcomingAppointments.length})`}
                  {filterType === 'past' && `Past (${pastAppointments.length})`}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {hasScope('APPT_WRITE') && (
                <button
                  onClick={handleNewBooking}
                  className="px-4 py-1.5 bg-[#87CEEB] text-white rounded-lg text-sm font-medium hover:bg-[#6BA8D9] transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Booking
                </button>
              )}
              {onOpenMasterCalendar && (
                <button
                  onClick={handleOpenMasterCalendar}
                  className="px-4 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Full Calendar
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <LoadingSkeleton />
            ) : filteredAppointments.length === 0 ? (
              <EmptyState filter={filter} onNewBooking={hasScope('APPT_WRITE') ? handleNewBooking : undefined} />
            ) : (
              <div className="space-y-6">
                {/* Upcoming Appointments */}
                {(filter === 'all' || filter === 'upcoming') && upcomingAppointments.length > 0 && (
                  <section>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      Upcoming Appointments
                    </h3>
                    <div className="space-y-2">
                      {upcomingAppointments.map((appointment, index) => (
                        <AppointmentCard
                          key={appointment.id}
                          appointment={appointment}
                          onClick={() => handleAppointmentClick(appointment)}
                          delay={index * 0.05}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Past Appointments */}
                {(filter === 'all' || filter === 'past') && pastAppointments.length > 0 && (
                  <section>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      Past Appointments
                    </h3>
                    <div className="space-y-2">
                      {pastAppointments.map((appointment, index) => (
                        <AppointmentCard
                          key={appointment.id}
                          appointment={appointment}
                          onClick={() => handleAppointmentClick(appointment)}
                          delay={index * 0.05}
                          isPast
                        />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>

          {/* Footer Stats */}
          {!isLoading && appointments.length > 0 && (
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-gray-600">
                    <span className="font-semibold text-gray-900">{upcomingAppointments.length}</span> upcoming
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">
                    <span className="font-semibold text-gray-900">{pastAppointments.length}</span> completed
                  </span>
                </div>
                {hasScope('APPT_READ') && (
                  <button
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </button>
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* Appointment Detail Modal */}
        {selectedAppointment && (
          <AppointmentDetailModal
            appointment={selectedAppointment}
            onClose={() => setSelectedAppointment(null)}
          />
        )}
      </div>
    </AnimatePresence>
  );
}

// Appointment Card Component
function AppointmentCard({
  appointment,
  onClick,
  delay = 0,
  isPast = false,
}: {
  appointment: Appointment;
  onClick: () => void;
  delay?: number;
  isPast?: boolean;
}) {
  const startDate = parseISO(appointment.start);
  const endDate = parseISO(appointment.end);

  // Booking source badge
  const getSourceBadge = () => {
    switch (appointment.source) {
      case 'ai':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-sky-100 text-sky-700 rounded-full text-xs font-medium">
            <Sparkles className="w-3 h-3" />
            AI Booked
          </div>
        );
      case 'manual':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            <Check className="w-3 h-3" />
            Manual
          </div>
        );
      case 'rescheduled':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
            <RefreshCw className="w-3 h-3" />
            Rescheduled
          </div>
        );
    }
  };

  // Status badge
  const getStatusBadge = () => {
    switch (appointment.status) {
      case 'scheduled':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">Scheduled</span>;
      case 'confirmed':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">Confirmed</span>;
      case 'checked_in':
        return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">Checked In</span>;
      case 'in_progress':
        return <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">In Progress</span>;
      case 'completed':
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">Completed</span>;
      case 'cancelled':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">Cancelled</span>;
      case 'no_show':
        return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">No Show</span>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onClick={onClick}
      className={cn(
        'p-4 border rounded-xl cursor-pointer transition-all hover:shadow-md',
        isPast ? 'bg-gray-50 border-gray-200 hover:bg-gray-100' : 'bg-white border-gray-200 hover:border-[#87CEEB]'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={cn('font-semibold', isPast ? 'text-gray-700' : 'text-gray-900')}>
              {appointment.procedure_name}
            </h4>
            {getSourceBadge()}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span className="font-medium">
              {format(startDate, 'MMM d, yyyy')} • {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {getStatusBadge()}
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          <span className="font-medium">Dr. {appointment.doctor_name.split(' ').pop()}</span>
        </div>
        <div className="text-sm">
          <span className="text-gray-600">Est. Cost: </span>
          <span className="font-semibold text-gray-900">${appointment.estimated_cost}</span>
        </div>
      </div>
    </motion.div>
  );
}

// Appointment Detail Modal
function AppointmentDetailModal({
  appointment,
  onClose,
}: {
  appointment: Appointment;
  onClose: () => void;
}) {
  const startDate = parseISO(appointment.start);
  const endDate = parseISO(appointment.end);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="absolute inset-4 m-auto w-full max-w-lg h-fit bg-white rounded-2xl shadow-2xl p-6 z-10"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{appointment.procedure_name}</h3>
          <p className="text-sm text-gray-600 mt-1">Procedure Code: {appointment.procedure_code}</p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Date & Time */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Date & Time</div>
          <div className="text-sm font-medium text-gray-900">
            {format(startDate, 'EEEE, MMMM d, yyyy')}
          </div>
          <div className="text-sm text-gray-600">
            {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
          </div>
        </div>

        {/* Provider */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Provider</div>
          <div className="text-sm font-medium text-gray-900">{appointment.doctor_name}</div>
        </div>

        {/* Cost Breakdown */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-500 mb-2">Cost Estimate</div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600">Total Cost</span>
            <span className="text-sm font-medium text-gray-900">${appointment.estimated_cost}</span>
          </div>
          {appointment.insurance_coverage_estimate && (
            <>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Insurance Coverage</span>
                <span className="text-sm font-medium text-green-600">${appointment.insurance_coverage_estimate}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <span className="text-sm font-semibold text-gray-900">Patient Responsibility</span>
                <span className="text-sm font-bold text-gray-900">
                  ${((appointment.estimated_cost || 0) - (appointment.insurance_coverage_estimate || 0)).toFixed(2)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Booking Details */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-500 mb-2">Booking Details</div>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Source</span>
              <span className="font-medium text-gray-900 capitalize">{appointment.source}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Channel</span>
              <span className="font-medium text-gray-900 capitalize">{appointment.booking_channel?.replace('_', ' ')}</span>
            </div>
            {appointment.ai_confidence_score && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">AI Confidence</span>
                <span className="font-medium text-gray-900">{(appointment.ai_confidence_score * 100).toFixed(0)}%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Close
        </button>
        <button className="flex-1 px-4 py-2 bg-[#87CEEB] text-white rounded-lg font-medium hover:bg-[#6BA8D9] transition-colors">
          Reschedule
        </button>
      </div>
    </motion.div>
  );
}

// Loading Skeleton
function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="p-4 bg-gray-100 rounded-xl">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 space-y-2">
              <div className="h-5 w-48 bg-gray-200 rounded" />
              <div className="h-4 w-64 bg-gray-200 rounded" />
            </div>
            <div className="h-6 w-20 bg-gray-200 rounded-full" />
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-4 w-20 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Empty State
function EmptyState({ filter, onNewBooking }: { filter: AppointmentFilter; onNewBooking?: () => void }) {
  const getMessage = () => {
    switch (filter) {
      case 'upcoming':
        return 'No upcoming appointments scheduled';
      case 'past':
        return 'No past appointments found';
      default:
        return 'No appointments on record';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <CalendarIcon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{getMessage()}</h3>
      <p className="text-sm text-gray-600 mb-6">
        {filter === 'upcoming' ? 'Schedule a new appointment to get started' : 'This patient has no appointment history'}
      </p>
      {onNewBooking && filter !== 'past' && (
        <button
          onClick={onNewBooking}
          className="px-6 py-2 bg-[#87CEEB] text-white rounded-lg font-medium hover:bg-[#6BA8D9] transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Schedule Appointment
        </button>
      )}
    </div>
  );
}
