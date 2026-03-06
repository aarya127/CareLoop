'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Phone, Calendar, MessageSquare, AlertCircle, Clock, Sparkles, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Patient, ViewMode, PatientStatus } from '@/lib/types/patient';
import type { Appointment } from '@/lib/types/appointment';
import { useAuth } from '@/lib/auth/auth-context';
import { auditLog, trackUXClick } from '@/lib/services/audit-service';
import EnhancedPatientProfileDrawer from '@/components/patient/enhanced-patient-profile-drawer';
import CalendarMiniModal from '@/components/patient/calendar-mini-modal';
import PhoneCallPanel from '@/components/patient/phone-call-panel';
import MessagingConversationDrawer from '@/components/patient/messaging-conversation-drawer';

interface PatientCardProps {
  patient: Patient;
  viewMode?: ViewMode;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
  nextAppointment?: Appointment;
  upcomingAppointmentsCount?: number;
  unreadMessagesCount?: number;
  lastCallTimestamp?: Date;
  lastCallAgent?: 'ai' | 'human';
}

export function PatientCard({
  patient,
  viewMode = 'grid',
  isSelected = false,
  onClick,
  className,
  nextAppointment,
  upcomingAppointmentsCount = 0,
  unreadMessagesCount = 0,
  lastCallTimestamp,
  lastCallAgent,
}: PatientCardProps) {
  const { user, hasScope, canAccessPatient } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isPhoneOpen, setIsPhoneOpen] = useState(false);
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);
  const [isPreloading, setIsPreloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const { firstName, lastName, age, phone, insurance, visits, billing, allergies, preMedicationNotes } = patient;
  
  const fullName = `${firstName} ${lastName}`;
  const lastVisit = visits[0]?.date ? new Date(visits[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No visits';
  const totalVisits = visits.length;

  // Preload profile data when card is near viewport (Intersection Observer)
  useEffect(() => {
    if (!cardRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isPreloading) {
            setIsPreloading(true);
          }
        });
      },
      {
        rootMargin: '250px', // Trigger 250px before entering viewport
        threshold: 0,
      }
    );

    observer.observe(cardRef.current);

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, [patient.id, isPreloading]);

  // Action handlers with audit logging
  const handleOpenProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    trackUXClick('open_profile_button', { patient_id: patient.id });
    auditLog({
      action: 'view_patient_profile',
      patient_id: patient.id,
      source: 'patient_card',
      metadata: { view_mode: viewMode },
    });
    setIsProfileOpen(true);
  };

  const handleOpenCalendar = (e: React.MouseEvent) => {
    e.stopPropagation();
    trackUXClick('calendar_button', { patient_id: patient.id });
    setIsCalendarOpen(true);
  };

  const handleOpenPhone = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasScope('VOIP_CALL')) return;
    trackUXClick('phone_button', { patient_id: patient.id });
    setIsPhoneOpen(true);
  };

  const handleOpenMessaging = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasScope('COMMS_READ')) return;
    trackUXClick('message_button', { patient_id: patient.id });
    setIsMessagingOpen(true);
  };

  // Check permissions
  const canViewProfile = hasScope('PATIENT_READ') && canAccessPatient(patient.id);
  const canViewCalendar = hasScope('APPT_READ');
  const canCall = hasScope('VOIP_CALL');
  const canMessage = hasScope('COMMS_READ');
  
  // Format appointment date and time
  const formatAppointmentDateTime = (date: Date) => {
    const dateStr = new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
    const timeStr = new Date(date).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    return { date: dateStr, time: timeStr };
  };

  const getBookingSourceBadge = (source: string) => {
    switch (source) {
      case 'ai':
        return {
          label: 'AI Booking',
          className: 'bg-[#87CEEB]/10 text-[#0A84FF] border-[#87CEEB]/20',
          icon: <Sparkles className="w-3 h-3" />
        };
      case 'manual':
        return {
          label: 'Manual',
          className: 'bg-green-500/10 text-green-700 border-green-500/20',
          icon: null
        };
      case 'rescheduled':
        return {
          label: 'Rescheduled',
          className: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
          icon: null
        };
      default:
        return {
          label: 'Scheduled',
          className: 'bg-gray-500/10 text-gray-700 border-gray-500/20',
          icon: null
        };
    }
  };
  
  const statuses: { type: PatientStatus; label: string }[] = [];
  if (allergies.length > 0) statuses.push({ type: 'allergies', label: 'Allergies' });
  if (billing.outstandingBalance > 0) statuses.push({ type: 'outstanding-balance', label: 'Outstanding Balance' });
  if (preMedicationNotes) statuses.push({ type: 'pre-medication', label: 'Pre-medication' });
  
  const getCoverageBadgeColor = (coverage: number) => {
    if (coverage >= 80) return 'bg-green-500/10 text-green-700 dark:text-green-400';
    if (coverage >= 50) return 'bg-orange-500/10 text-orange-700 dark:text-orange-400';
    if (coverage > 0) return 'bg-red-500/10 text-red-700 dark:text-red-400';
    return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
  };
  
  const getStatusColor = (type: PatientStatus) => {
    switch (type) {
      case 'allergies':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-400';
      case 'outstanding-balance':
        return 'bg-red-500/10 text-red-700 dark:text-red-400';
      case 'pre-medication':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
    }
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        onClick={onClick}
        className={cn(
          'group cursor-pointer rounded-xl bg-[#FBFBFB] border transition-all duration-200',
          'hover:shadow-[0_8px_24px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.08)]',
          'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#0A84FF]/20',
          isSelected ? 'border-[#0A84FF] border-2 bg-[#F5F5F7]' : 'border-[#E5E5E7]',
          className
        )}
        tabIndex={0}
        role="button"
        aria-label={`Patient card: ${fullName}, ${insurance.provider}, Last visit ${lastVisit}`}
      >
        <div className="flex items-center gap-4 p-4">
          {/* Avatar & Name */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-full bg-[#0A84FF] text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
              {getInitials(fullName)}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-[#1D1D1F] truncate">
                {fullName}, {age}
              </h3>
              <a
                href={`tel:${phone}`}
                onClick={(e) => e.stopPropagation()}
                className="text-sm text-[#86868B] hover:text-[#0A84FF] hover:underline"
              >
                {phone}
              </a>
            </div>
          </div>

          {/* Insurance */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm font-medium text-[#1D1D1F]">{insurance.provider}</span>
            <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide', getCoverageBadgeColor(insurance.coveragePercent))}>
              {insurance.coveragePercent}%
            </span>
          </div>

          {/* Stats */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span className="text-sm text-[#1D1D1F]">Last: {lastVisit}</span>
            <span className="text-sm text-[#86868B]">{totalVisits} visits • ${billing.lifetimeSpend.toLocaleString()}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {canViewCalendar && (
              <button
                onClick={handleOpenCalendar}
                className={cn(
                  "relative w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                  "hover:bg-[#F5F5F7]"
                )}
                aria-label="View calendar"
              >
                <Calendar className="w-5 h-5 text-[#86868B] group-hover:text-[#0A84FF]" />
                {upcomingAppointmentsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#0A84FF] text-white text-[10px] font-semibold rounded-full flex items-center justify-center">
                    {upcomingAppointmentsCount}
                  </span>
                )}
              </button>
            )}
            {canCall && (
              <button
                onClick={handleOpenPhone}
                disabled={!canCall}
                className={cn(
                  "relative w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                  canCall ? "hover:bg-[#F5F5F7]" : "opacity-40 cursor-not-allowed"
                )}
                aria-label="Call patient"
              >
                <Phone className="w-5 h-5 text-[#86868B] group-hover:text-[#0A84FF]" />
                {lastCallTimestamp && (
                  <span className={cn(
                    "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white",
                    lastCallAgent === 'ai' ? 'bg-purple-500' : 'bg-[#0A84FF]'
                  )} />
                )}
              </button>
            )}
            {canMessage && (
              <button
                onClick={handleOpenMessaging}
                disabled={!canMessage}
                className={cn(
                  "relative w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                  canMessage ? "hover:bg-[#F5F5F7]" : "opacity-40 cursor-not-allowed"
                )}
                aria-label="Message patient"
              >
                <MessageSquare className="w-5 h-5 text-[#86868B] group-hover:text-[#0A84FF]" />
                {unreadMessagesCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-semibold rounded-full flex items-center justify-center">
                    {unreadMessagesCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={cardRef}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      onClick={onClick}
      className={cn(
        'group cursor-pointer rounded-xl bg-[#FBFBFB] border p-6 transition-all duration-200',
        'shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]',
        'hover:shadow-[0_8px_24px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.08)]',
        'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#0A84FF]/20',
        isSelected ? 'border-[#0A84FF] border-2 bg-[#F5F5F7] shadow-[0_8px_24px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.08)]' : 'border-[#E5E5E7] hover:border-[#D2D2D7]',
        className
      )}
      tabIndex={0}
      role="button"
      aria-label={`Patient card: ${fullName}, ${insurance.provider}, Last visit ${lastVisit}`}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-[#0A84FF] text-white flex items-center justify-center text-base font-semibold flex-shrink-0">
          {getInitials(fullName)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-[#1D1D1F] mb-1 truncate">
            {fullName}
          </h3>
          <span className="text-sm text-[#86868B]">{age} years old</span>
        </div>
      </div>

      {/* Phone */}
      <a
        href={`tel:${phone}`}
        onClick={(e) => e.stopPropagation()}
        className="block text-sm text-[#86868B] mb-4 hover:text-[#0A84FF] hover:underline transition-colors"
      >
        {phone}
      </a>

      {/* Insurance */}
      <div className="mb-4 pb-4 border-b border-[#E5E5E7]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-[#1D1D1F]">{insurance.provider}</span>
          <span className="text-[#86868B]">•</span>
          <span className={cn('px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wide', getCoverageBadgeColor(insurance.coveragePercent))}>
            {insurance.coveragePercent}% Coverage
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-2 mb-4 pb-4 border-b border-[#E5E5E7]">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#86868B]">Last Visit</span>
          <span className="text-[#1D1D1F] font-medium">{lastVisit}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#86868B]">Total Visits</span>
          <span className="text-[#1D1D1F]">{totalVisits}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#86868B]">Lifetime Spend</span>
          <span className="text-[#1D1D1F] font-semibold">${billing.lifetimeSpend.toLocaleString()}</span>
        </div>
      </div>

      {/* Status Chips */}
      {statuses.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {statuses.slice(0, 3).map((status) => (
            <span
              key={status.type}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium',
                getStatusColor(status.type)
              )}
            >
              {status.type === 'allergies' && <AlertCircle className="w-3 h-3" />}
              {status.label}
            </span>
          ))}
          {statuses.length > 3 && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-500/10 text-gray-700">
              +{statuses.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Next Appointment Section */}
      {nextAppointment && (
        <div className="mb-4 p-3 rounded-lg bg-gradient-to-br from-[#87CEEB]/5 to-[#87CEEB]/10 border border-[#87CEEB]/20">
          <div className="flex items-start gap-2 mb-2">
            <Calendar className="w-4 h-4 text-[#0A84FF] mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-[#0A84FF] uppercase tracking-wide">
                  Next Appointment
                </span>
                {(() => {
                  const badge = getBookingSourceBadge(nextAppointment.bookingSource);
                  return (
                    <span className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border',
                      badge.className
                    )}>
                      {badge.icon}
                      {badge.label}
                    </span>
                  );
                })()}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-3.5 h-3.5 text-[#86868B]" />
                  <span className="text-[#1D1D1F] font-medium">
                    {formatAppointmentDateTime(nextAppointment.startTime).date} at {formatAppointmentDateTime(nextAppointment.startTime).time}
                  </span>
                </div>
                <div className="text-sm text-[#1D1D1F]">
                  {nextAppointment.procedureType}
                </div>
              </div>
            </div>
          </div>
          {upcomingAppointmentsCount > 1 && (
            <div className="text-xs text-[#86868B] mt-2 pt-2 border-t border-[#87CEEB]/10">
              +{upcomingAppointmentsCount - 1} more upcoming {upcomingAppointmentsCount - 1 === 1 ? 'appointment' : 'appointments'}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {canViewProfile && (
          <button
            onClick={handleOpenProfile}
            className="flex-1 h-10 bg-[#0A84FF] hover:bg-[#0077ED] active:bg-[#006AD5] text-white rounded-lg font-medium text-sm transition-colors inline-flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Open Profile
          </button>
        )}
        {canViewCalendar && (
          <button
            onClick={handleOpenCalendar}
            className="relative w-10 h-10 rounded-lg flex items-center justify-center hover:bg-[#F5F5F7] transition-colors"
            aria-label="View calendar"
          >
            <Calendar className="w-5 h-5 text-[#86868B] group-hover:text-[#0A84FF]" />
            {upcomingAppointmentsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#0A84FF] text-white text-[10px] font-semibold rounded-full flex items-center justify-center">
                {upcomingAppointmentsCount}
              </span>
            )}
          </button>
        )}
        {canCall && (
          <button
            onClick={handleOpenPhone}
            disabled={!canCall}
            className={cn(
              "relative w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
              canCall ? "hover:bg-[#F5F5F7]" : "opacity-40 cursor-not-allowed"
            )}
            aria-label="Call patient"
          >
            <Phone className="w-5 h-5 text-[#86868B] group-hover:text-[#0A84FF]" />
            {lastCallTimestamp && (
              <span className={cn(
                "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white",
                lastCallAgent === 'ai' ? 'bg-purple-500' : 'bg-[#0A84FF]'
              )} />
            )}
          </button>
        )}
        {canMessage && (
          <button
            onClick={handleOpenMessaging}
            disabled={!canMessage}
            className={cn(
              "relative w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
              canMessage ? "hover:bg-[#F5F5F7]" : "opacity-40 cursor-not-allowed"
            )}
            aria-label="Message patient"
          >
            <MessageSquare className="w-5 h-5 text-[#86868B] group-hover:text-[#0A84FF]" />
            {unreadMessagesCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-semibold rounded-full flex items-center justify-center">
                {unreadMessagesCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Drawers and Modals */}
      {canViewProfile && (
        <EnhancedPatientProfileDrawer
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          patientId={patient.id}
        />
      )}
      
      {canViewCalendar && (
        <CalendarMiniModal
          isOpen={isCalendarOpen}
          onClose={() => setIsCalendarOpen(false)}
          patientId={patient.id}
          patientName={fullName}
        />
      )}
      
      {canCall && (
        <PhoneCallPanel
          isOpen={isPhoneOpen}
          onClose={() => setIsPhoneOpen(false)}
          patientId={patient.id}
          patientName={fullName}
          patientPhone={patient.phone}
        />
      )}
      
      {canMessage && (
        <MessagingConversationDrawer
          isOpen={isMessagingOpen}
          onClose={() => setIsMessagingOpen(false)}
          patientId={patient.id}
          patientName={fullName}
        />
      )}
    </motion.div>
  );
}

export function PatientCardSkeleton({ viewMode = 'grid' }: { viewMode?: ViewMode }) {
  if (viewMode === 'list') {
    return (
      <div className="rounded-xl bg-[#FBFBFB] border border-[#E5E5E7] p-4 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#E5E5E7]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-[#E5E5E7] rounded w-32" />
            <div className="h-3 bg-[#E5E5E7] rounded w-24" />
          </div>
          <div className="h-6 bg-[#E5E5E7] rounded w-24" />
          <div className="space-y-1">
            <div className="h-3 bg-[#E5E5E7] rounded w-28" />
            <div className="h-3 bg-[#E5E5E7] rounded w-32" />
          </div>
          <div className="flex gap-2">
            <div className="w-10 h-10 bg-[#E5E5E7] rounded-lg" />
            <div className="w-10 h-10 bg-[#E5E5E7] rounded-lg" />
            <div className="w-10 h-10 bg-[#E5E5E7] rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-[#FBFBFB] border border-[#E5E5E7] p-6 animate-pulse">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-[#E5E5E7]" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-[#E5E5E7] rounded w-32" />
          <div className="h-4 bg-[#E5E5E7] rounded w-20" />
        </div>
      </div>
      <div className="h-4 bg-[#E5E5E7] rounded w-28 mb-4" />
      <div className="mb-4 pb-4 border-b border-[#E5E5E7]">
        <div className="flex items-center gap-2">
          <div className="h-4 bg-[#E5E5E7] rounded w-24" />
          <div className="h-6 bg-[#E5E5E7] rounded w-16" />
        </div>
      </div>
      <div className="space-y-2 mb-4 pb-4 border-b border-[#E5E5E7]">
        <div className="flex justify-between">
          <div className="h-4 bg-[#E5E5E7] rounded w-20" />
          <div className="h-4 bg-[#E5E5E7] rounded w-24" />
        </div>
        <div className="flex justify-between">
          <div className="h-4 bg-[#E5E5E7] rounded w-20" />
          <div className="h-4 bg-[#E5E5E7] rounded w-16" />
        </div>
        <div className="flex justify-between">
          <div className="h-4 bg-[#E5E5E7] rounded w-24" />
          <div className="h-4 bg-[#E5E5E7] rounded w-20" />
        </div>
      </div>
      <div className="flex gap-2 mb-4">
        <div className="h-6 bg-[#E5E5E7] rounded-lg w-20" />
        <div className="h-6 bg-[#E5E5E7] rounded-lg w-24" />
      </div>
      <div className="flex gap-2">
        <div className="flex-1 h-10 bg-[#E5E5E7] rounded-lg" />
        <div className="w-10 h-10 bg-[#E5E5E7] rounded-lg" />
        <div className="w-10 h-10 bg-[#E5E5E7] rounded-lg" />
        <div className="w-10 h-10 bg-[#E5E5E7] rounded-lg" />
      </div>
    </div>
  );
}
