'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { differenceInYears, format, isValid, parseISO } from 'date-fns';
import { X, User, Phone, Shield, Calendar, ExternalLink } from 'lucide-react';
import type { PatientDrawerData, DrawerPatient } from '@/lib/types/calendar';
import { getBookingSourceColor } from '@/lib/utils/calendar-helpers';

interface PatientDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  data: PatientDrawerData | null;
}

const drawerVariants = {
  closed: {
    x: '100%',
    opacity: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 30 },
  },
  open: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 30,
      staggerChildren: 0.07,
      delayChildren: 0.1,
    },
  },
};

const drawerContentVariants = {
  closed: { opacity: 0, y: 20 },
  open: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const backgroundBlurVariants = {
  closed: { opacity: 0 },
  open: { opacity: 1 },
};

const FAILURE_TEXT: Record<string, string> = {
  unauthorized: 'Your session has expired — sign in again.',
  forbidden: "You don't have access to this patient.",
  not_found: 'The linked patient record was not found.',
  network: "Couldn't reach the server.",
  server: 'The server returned an error.',
};

export function PatientDetailDrawer({ isOpen, onClose, data }: PatientDetailDrawerProps) {
  if (!data) return null;

  const { appointment, patient } = data;
  const loaded = patient.status === 'ready' ? patient.data : null;
  const title = loaded ? `${loaded.firstName} ${loaded.lastName}` : appointment.patientName;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            variants={backgroundBlurVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          <motion.div
            variants={drawerVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed right-0 top-0 bottom-0 w-full md:w-[600px] bg-white shadow-2xl z-50 overflow-y-auto"
          >
            <motion.header
              variants={drawerContentVariants}
              className="sticky top-0 z-10 px-6 py-6 bg-gradient-to-br from-sky-400 to-sky-500 text-white"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{title}</h1>
                  <div className="mt-2 text-white/90">
                    <div className="text-sm">
                      {format(appointment.startTime, 'EEEE, MMMM d, yyyy')}
                    </div>
                    <div className="text-sm">
                      {format(appointment.startTime, 'h:mm a')} -{' '}
                      {format(appointment.endTime, 'h:mm a')}
                    </div>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mt-4 flex items-center gap-3">
                {appointment.procedure && (
                  <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg font-medium">
                    {appointment.procedure}
                  </div>
                )}
                <div
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: `${getBookingSourceColor(appointment.source)}20`,
                    color: getBookingSourceColor(appointment.source),
                    border: `1px solid ${getBookingSourceColor(appointment.source)}`,
                  }}
                >
                  {appointment.source}
                </div>
                <div className="px-3 py-1 rounded-full text-xs font-medium bg-white/20 capitalize">
                  {appointment.status.replace('-', ' ')}
                </div>
              </div>
            </motion.header>

            <div className="px-6 py-6 space-y-6">
              {appointment.notes && (
                <Section icon={Calendar} title="Appointment Notes">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{appointment.notes}</p>
                </Section>
              )}

              {patient.status === 'loading' && (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-sky-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {patient.status === 'error' && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  Couldn&apos;t load patient details. {FAILURE_TEXT[patient.reason]}
                </div>
              )}

              {patient.status === 'ready' && !patient.data && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                  This appointment isn&apos;t linked to a patient record.
                </div>
              )}

              {loaded && <PatientDetails patient={loaded} />}
            </div>

            {loaded && (
              <motion.footer
                variants={drawerContentVariants}
                className="sticky bottom-0 bg-white border-t border-gray-200 p-4"
              >
                <Link
                  href={`/patient-record?id=${encodeURIComponent(loaded.id)}`}
                  className="w-full px-4 py-3 bg-sky-400 text-white rounded-xl font-medium hover:bg-sky-500 transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open full chart
                </Link>
              </motion.footer>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function PatientDetails({ patient }: { patient: DrawerPatient }) {
  const dob = patient.dateOfBirth ? parseISO(patient.dateOfBirth) : null;
  const validDob = dob && isValid(dob) ? dob : null;

  return (
    <>
      <Section icon={User} title="Patient">
        <div className="grid grid-cols-2 gap-4">
          <InfoField label="Full Name" value={`${patient.firstName} ${patient.lastName}`} />
          <InfoField
            label="Age"
            value={validDob ? `${differenceInYears(new Date(), validDob)} years old` : '—'}
          />
          <InfoField
            label="Date of Birth"
            value={validDob ? format(validDob, 'MMM d, yyyy') : 'Not recorded'}
          />
          <InfoField label="Phone" value={patient.phone || 'Not recorded'} icon={Phone} />
        </div>
      </Section>

      <Section icon={Shield} title="Insurance">
        {patient.insurance ? (
          <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-2xl p-5 grid grid-cols-2 gap-4">
            <InfoField label="Payer" value={patient.insurance.payerName} />
            <InfoField label="Plan" value={patient.insurance.planName || 'Not recorded'} />
            <InfoField label="Member ID" value={patient.insurance.memberIdMasked || '—'} />
          </div>
        ) : (
          <p className="text-sm text-gray-600">No insurance on file.</p>
        )}
      </Section>
    </>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section variants={drawerContentVariants} className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-sky-400" />
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </motion.section>
  );
}

function InfoField({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: React.ElementType;
}) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-gray-400" />}
        <div className="text-sm font-medium text-gray-900">{value}</div>
      </div>
    </div>
  );
}
