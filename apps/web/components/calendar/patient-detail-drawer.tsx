'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  X,
  User,
  Mail,
  Phone,
  Shield,
  FileText,
  Calendar,
  FileEdit,
  Edit,
  Clock,
  UserPlus,
  Download,
  Trash2,
  Expand,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PatientDrawerData, CalendarAppointment } from '@/lib/types/calendar';
import { getBookingSourceColor } from '@/lib/utils/calendar-helpers';
import PeriodontalChartDiagram from '@/components/dental/periodontal-chart-diagram';
import { mildGingivitisProfile } from '@/lib/data/mock-periodontal-data';
import Image from 'next/image';

interface PatientDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  data: PatientDrawerData | null;
}

const drawerVariants = {
  closed: {
    x: '100%',
    opacity: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 30,
    }
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
    }
  }
};

const drawerContentVariants = {
  closed: { opacity: 0, y: 20 },
  open: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 }
  }
};

const backgroundBlurVariants = {
  closed: { opacity: 0 },
  open: { opacity: 1 }
};

export function PatientDetailDrawer({ isOpen, onClose, data }: PatientDetailDrawerProps) {
  if (!data) return null;

  const { appointment, patient, insurance } = data;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={backgroundBlurVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            variants={drawerVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed right-0 top-0 bottom-0 w-full md:w-[600px] bg-white shadow-2xl z-50 overflow-y-auto"
          >
            {/* Header */}
            <motion.header
              variants={drawerContentVariants}
              className="sticky top-0 z-10 px-6 py-6 bg-gradient-to-br from-sky-400 to-sky-500 text-white"
            >
              <div className="flex items-start justify-between">
                <div>
                  <motion.h1
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-2xl font-bold"
                  >
                    {patient.firstName} {patient.lastName}
                  </motion.h1>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-2 text-white/90"
                  >
                    <div className="text-sm">
                      {format(appointment.startTime, 'EEEE, MMMM d, yyyy')}
                    </div>
                    <div className="text-sm">
                      {format(appointment.startTime, 'h:mm a')} -{' '}
                      {format(appointment.endTime, 'h:mm a')}
                    </div>
                  </motion.div>
                </div>

                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Procedure & Source */}
              <div className="mt-4 flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                  className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg font-medium"
                >
                  {appointment.procedure}
                </motion.div>

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: 'spring' }}
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: `${getBookingSourceColor(appointment.source)}20`,
                    color: getBookingSourceColor(appointment.source),
                    border: `1px solid ${getBookingSourceColor(appointment.source)}`,
                  }}
                >
                  {appointment.source}
                </motion.div>
              </div>
            </motion.header>

            {/* Content */}
            <div className="px-6 py-6 space-y-6">
              {/* Contact Information */}
              <Section
                icon={User}
                title="Contact Information"
              >
                <div className="grid grid-cols-2 gap-4">
                  <InfoField label="Full Name" value={`${patient.firstName} ${patient.lastName}`} />
                  <InfoField label="Age" value={`${patient.age} years old`} />
                  <InfoField label="Email" value={patient.email} icon={Mail} />
                  <InfoField label="Phone" value={patient.phone} icon={Phone} />
                  <InfoField label="Date of Birth" value={format(patient.dateOfBirth, 'MMM d, yyyy')} />
                  <InfoField
                    label="Address"
                    value={`${patient.address.city}, ${patient.address.state}`}
                  />
                </div>
              </Section>

              {/* Insurance Coverage */}
              <Section
                icon={Shield}
                title="Insurance Coverage"
              >
                <InsuranceCoverage insurance={insurance} appointment={appointment} />
              </Section>

              {/* Dental & Clinical Data */}
              <Section
                icon={FileText}
                title="Dental Records & Clinical Data"
              >
                <DentalRecords data={data} />
              </Section>

              {/* Visit History */}
              <Section
                icon={Calendar}
                title="Visit History"
              >
                <VisitHistory visits={data.visitHistory} />
              </Section>

              {/* Doctor Notes */}
              <Section
                icon={FileEdit}
                title="Doctor Notes & Findings"
              >
                <DoctorNotes appointmentId={appointment.id} notes={data.notes} />
              </Section>
            </div>

            {/* Action Footer */}
            <motion.footer
              variants={drawerContentVariants}
              className="sticky bottom-0 bg-white border-t border-gray-200 p-4"
            >
              <ActionButtons appointment={appointment} onClose={onClose} />
            </motion.footer>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Section component
interface SectionProps {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}

function Section({ icon: Icon, title, children }: SectionProps) {
  return (
    <motion.section
      variants={drawerContentVariants}
      className="space-y-3"
    >
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-sky-400" />
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </motion.section>
  );
}

// InfoField component
interface InfoFieldProps {
  label: string;
  value: string;
  icon?: React.ElementType;
}

function InfoField({ label, value, icon: Icon }: InfoFieldProps) {
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

// Insurance Coverage component
interface InsuranceCoverageProps {
  insurance: PatientDrawerData['insurance'];
  appointment: CalendarAppointment;
}

function InsuranceCoverage({ insurance, appointment }: InsuranceCoverageProps) {
  const procedureCost = 150; // Mock cost

  return (
    <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-lg font-semibold text-gray-900">
            {insurance.provider}
          </div>
          <div className="text-sm text-gray-600">{insurance.planName}</div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-sky-600">
            {insurance.coveragePercent}%
          </div>
          <div className="text-xs text-gray-500">Coverage</div>
        </div>
      </div>

      {/* Coverage Breakdown */}
      <div className="mt-4 p-4 bg-white rounded-xl border border-sky-100">
        <div className="text-sm font-medium text-gray-700 mb-3">
          Coverage for {appointment.procedure}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total Cost</span>
            <span className="font-semibold">${procedureCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Insurance Pays</span>
            <span className="text-green-600 font-semibold">
              ${((procedureCost * insurance.coveragePercent) / 100).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm border-t pt-2">
            <span className="font-medium text-gray-900">Patient Owes</span>
            <span className="text-lg font-bold text-gray-900">
              ${(procedureCost * (1 - insurance.coveragePercent / 100)).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Policy Details */}
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <div className="text-gray-500">Member ID</div>
          <div className="font-mono font-medium">{insurance.memberId}</div>
        </div>
        <div>
          <div className="text-gray-500">Policy Expiry</div>
          <div className="font-medium">
            {format(insurance.policyExpiry, 'MMM d, yyyy')}
          </div>
        </div>
      </div>
    </div>
  );
}

// Dental Records component
function DentalRecords({ data }: { data: PatientDrawerData }) {
  return (
    <div className="space-y-4">
      {/* X-rays */}
      {data.xrays && data.xrays.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            Radiographs & X-rays
          </h4>
          <div className="grid grid-cols-3 gap-3">
            {data.xrays.map((xray, idx) => (
              <motion.div
                key={xray.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="relative group cursor-pointer"
              >
                <div className="aspect-square bg-gray-900 rounded-xl overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
                  <div className="absolute inset-0 flex items-center justify-center text-white text-xs">
                    {xray.type}
                  </div>
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 rounded-xl transition-colors flex items-center justify-center">
                  <Expand className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="mt-1 text-xs text-gray-600 text-center">
                  {format(xray.date, 'MMM d, yyyy')}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Periodontal Data */}
        {/* Periodontal Charting Diagram */}
        <div className="mt-6">
          <PeriodontalChartDiagram 
            readings={mildGingivitisProfile}
            showLegend={true}
            interactive={true}
          />
        </div>
    </div>
  );
}

// Visit History component
function VisitHistory({ visits }: { visits: PatientDrawerData['visitHistory'] }) {
  return (
    <div className="space-y-3 max-h-64 overflow-y-auto">
      {visits.slice(0, 5).map((visit, idx) => (
        <motion.div
          key={visit.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.05 }}
          whileHover={{ x: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
          className="p-4 bg-white border border-gray-200 rounded-xl cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="font-semibold text-gray-900">{visit.reason}</div>
              <div className="text-sm text-gray-600 mt-1">
                {format(visit.date, 'MMMM d, yyyy')} • {visit.provider}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {visit.procedures.map((p) => p.name).join(', ')}
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900">
                ${visit.totalCost}
              </div>
              <div className="text-xs text-gray-500">Paid: ${visit.patientPaid}</div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Doctor Notes component
function DoctorNotes({
  appointmentId,
  notes,
}: {
  appointmentId: string;
  notes: PatientDrawerData['notes'];
}) {
  return (
    <div className="space-y-4">
      {/* Current Notes */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Notes for this appointment
        </label>
        <textarea
          placeholder="Enter observations, findings, treatment notes..."
          className="w-full h-32 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm resize-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all outline-none"
        />
      </div>

      {/* Previous Notes */}
      {notes.length > 0 && (
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Previous Notes
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {notes.slice(0, 3).map((note, idx) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-900">
                    {note.author} • {note.role}
                  </span>
                  <span className="text-xs text-gray-500">
                    {format(note.timestamp, 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
                <div className="text-sm text-gray-700">{note.content}</div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Action Buttons component
function ActionButtons({
  appointment,
  onClose,
}: {
  appointment: CalendarAppointment;
  onClose: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 px-4 py-3 bg-sky-400 text-white rounded-xl font-medium hover:bg-sky-500 transition-colors flex items-center justify-center gap-2"
        >
          <Edit className="w-4 h-4" />
          Edit Appointment
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 px-4 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
          <Clock className="w-4 h-4" />
          Reschedule
        </motion.button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
          <UserPlus className="w-4 h-4 mx-auto mb-1" />
          Full Profile
        </button>
        <button className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
          <Download className="w-4 h-4 mx-auto mb-1" />
          Export PDF
        </button>
        <button className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
          <Trash2 className="w-4 h-4 mx-auto mb-1" />
          Cancel
        </button>
      </div>
    </div>
  );
}
