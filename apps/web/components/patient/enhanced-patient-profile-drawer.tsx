'use client';

/**
 * Enhanced Patient Profile Drawer
 * Full patient profile with tabs, preloading, skeleton states, and audit logging
 * Opened from Patient Card "Open Profile" action or Calendar appointment click
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  User,
  Shield,
  Activity,
  FileText,
  Calendar as CalendarIcon,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  Eye,
  EyeOff,
  Edit,
  Save,
  Download,
  Loader2,
  CreditCard,
  Image as ImageIcon,
  Clock,
  DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/auth-context';
import { auditLog, trackUXClick } from '@/lib/services/audit-service';
import type {
  PatientSummary,
  InsuranceDetails,
  PeriodontalChartingData,
  DentalRecord,
  XRayImage,
  VisitRecord,
  DoctorNote,
} from '@/lib/services/api-types';
import PeriodontalChartDiagram from '@/components/dental/periodontal-chart-diagram';
import { mildGingivitisProfile } from '@/lib/data/mock-periodontal-data';

interface PatientProfileDrawerProps {
  isOpen: boolean;
  patientId: string;
  onClose: () => void;
  source?: 'patient_card' | 'calendar_appointment' | 'search';
}

type TabType = 'overview' | 'insurance' | 'dental' | 'visits' | 'notes';

export default function PatientProfileDrawer({
  isOpen,
  patientId,
  onClose,
  source = 'patient_card',
}: PatientProfileDrawerProps) {
  const { user, hasScope, canAccessPatient } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [patient, setPatient] = useState<PatientSummary | null>(null);
  const [insurance, setInsurance] = useState<InsuranceDetails | null>(null);
  const [periodontal, setPeriodontal] = useState<PeriodontalChartingData | null>(null);
  const [dentalRecords, setDentalRecords] = useState<DentalRecord[]>([]);
  const [xrays, setXrays] = useState<XRayImage[]>([]);
  const [visits, setVisits] = useState<VisitRecord[]>([]);
  const [notes, setNotes] = useState<DoctorNote[]>([]);
  const [piiRevealed, setPiiRevealed] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Check access permission
  useEffect(() => {
    if (isOpen && !canAccessPatient(patientId)) {
      auditLog({
        action: 'view_patient_profile',
        actor_id: user?.id,
        patient_id: patientId,
        source,
        result: 'denied',
        error_message: 'Insufficient permissions',
      });
      onClose();
    }
  }, [isOpen, patientId, canAccessPatient, user, source, onClose]);

  // Load patient data
  useEffect(() => {
    if (!isOpen) return;

    const loadPatientData = async () => {
      setIsLoading(true);
      try {
        // Audit log
        await auditLog({
          action: 'view_patient_profile',
          actor_id: user?.id,
          patient_id: patientId,
          source,
        });

        // In production: Parallel fetch from kb-service
        // GET /patients/{patient_id}?include=summary,insurance,last_visit,flags
        // GET /patients/{patient_id}/records?include=dental,periodontal_summary
        // GET /patients/{patient_id}/visits?limit=25&sort=-date
        // GET /patients/{patient_id}/xrays?limit=10
        // GET /patients/{patient_id}/notes?limit=20

        // Mock data for now
        await new Promise((resolve) => setTimeout(resolve, 800));

        setPatient({
          id: patientId,
          first_name: 'Sarah',
          last_name: 'Johnson',
          date_of_birth: '1983-01-15',
          age: 42,
          phone: '(310) 555-0198',
          email: 'sarah.j@email.com',
          last_visit_date: '2025-03-12',
          next_appointment_date: '2025-10-20',
          flags: {
            has_allergies: true,
            requires_pre_medication: true,
            has_outstanding_balance: false,
          },
        });

        setInsurance({
          provider: 'Blue Shield',
          plan: 'Basic 65',
          coverage_percent: 65,
          member_id: '****1234',
          group_number: 'GRP987654',
          policy_expiry: '2025-12-31',
          annual_max_used: 420,
          annual_max_total: 1500,
          deductible_met: 50,
          deductible_total: 50,
        });

        setPeriodontal({
          last_exam: '2025-09-20',
          pocket_depths_summary: {
            max_mm: 6,
            sites_5mm_plus: 4,
            avg_depth_mm: 3.2,
          },
          bleeding_on_probing_percent: 12,
          recession_present: false,
          mobility_present: false,
          full_chart_available: true,
        });

        setVisits([
          {
            id: 'v1',
            date: '2025-03-12',
            provider: 'Dr. Smith',
            reason: 'Routine cleaning & exam',
            procedures: [
              { code: 'D1110', name: 'Prophylaxis', cost: 150 },
              { code: 'D0150', name: 'Comprehensive exam', cost: 130 },
            ],
            total_cost: 280,
            insurance_paid: 182,
            patient_paid: 98,
            payment_method: 'Visa ••••1234',
            notes: 'No issues found',
          },
        ]);

        setNotes([
          {
            id: 'n1',
            created_at: '2025-09-20T14:30:00Z',
            updated_at: '2025-09-20T14:30:00Z',
            author_id: user?.id || '',
            author_name: 'Dr. Smith',
            text: 'Localized inflammation on upper right quadrant. Recommend periodontal maintenance every 3 months.',
            visibility: 'doctor',
            version: 1,
          },
        ]);
      } catch (error) {
        console.error('Failed to load patient data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPatientData();
  }, [isOpen, patientId, user, source]);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Handle reveal PII
  const handleRevealPII = async () => {
    if (!hasScope('PII_REVEAL')) {
      alert('You do not have permission to reveal sensitive information');
      return;
    }

    await auditLog({
      action: 'reveal_sensitive',
      actor_id: user?.id,
      patient_id: patientId,
      source: 'profile_drawer',
      metadata: { field: 'insurance_member_id' },
    });

    setPiiRevealed(true);

    // In production: Fetch unmasked member ID
    setInsurance((prev) => prev ? { ...prev, member_id: 'BS123456789' } : null);
  };

  // Handle save note
  const handleSaveNote = async () => {
    if (!noteText.trim()) return;

    setIsSavingNote(true);
    try {
      await auditLog({
        action: 'edit_dental_notes',
        actor_id: user?.id,
        patient_id: patientId,
        source: 'profile_drawer',
      });

      // In production: POST /patients/{id}/notes
      await new Promise((resolve) => setTimeout(resolve, 500));

      const newNote: DoctorNote = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        author_id: user?.id || '',
        author_name: `${user?.firstName} ${user?.lastName}`,
        text: noteText,
        visibility: 'doctor',
        version: 1,
      };

      setNotes([newNote, ...notes]);
      setNoteText('');
      setIsEditingNotes(false);
    } catch (error) {
      console.error('Failed to save note:', error);
    } finally {
      setIsSavingNote(false);
    }
  };

  // Handle tab change
  const handleTabChange = async (tab: TabType) => {
    setActiveTab(tab);
    await trackUXClick(`profile_tab_${tab}`, { patient_id: patientId });

    // Audit specific tab views
    if (tab === 'insurance') {
      await auditLog({
        action: 'view_insurance_details',
        actor_id: user?.id,
        patient_id: patientId,
        source: 'profile_drawer',
      });
    } else if (tab === 'dental') {
      await auditLog({
        action: 'view_dental_records',
        actor_id: user?.id,
        patient_id: patientId,
        source: 'profile_drawer',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Drawer */}
        <motion.div
          ref={drawerRef}
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="absolute right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#87CEEB] to-[#6BA8D9] px-6 py-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold">
                {isLoading ? (
                  <div className="h-8 w-48 bg-white/20 rounded animate-pulse" />
                ) : (
                  `${patient?.first_name} ${patient?.last_name}`
                )}
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {!isLoading && patient && (
              <div className="flex items-center gap-4 text-sm text-white/90">
                <span>{patient.age} years old</span>
                <span>•</span>
                <span>DOB: {new Date(patient.date_of_birth).toLocaleDateString()}</span>
                {patient.flags.has_allergies && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1 text-yellow-200">
                      <AlertCircle className="w-4 h-4" />
                      <span>Allergies</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 bg-gray-50 px-6">
            <div className="flex gap-1">
              {([
                { id: 'overview', label: 'Overview', icon: User },
                { id: 'insurance', label: 'Insurance', icon: Shield },
                { id: 'dental', label: 'Dental', icon: Activity },
                { id: 'visits', label: 'Visits', icon: CalendarIcon },
                { id: 'notes', label: 'Notes', icon: FileText },
              ] as const).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2',
                    activeTab === tab.id
                      ? 'border-[#87CEEB] text-[#0A84FF] bg-white'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <TabSkeleton />
            ) : (
              <>
                {activeTab === 'overview' && patient && (
                  <OverviewTab patient={patient} />
                )}
                {activeTab === 'insurance' && insurance && (
                  <InsuranceTab
                    insurance={insurance}
                    piiRevealed={piiRevealed}
                    onRevealPII={handleRevealPII}
                    canReveal={hasScope('PII_REVEAL')}
                  />
                )}
                {activeTab === 'dental' && (
                  <DentalTab
                    periodontal={periodontal}
                    dentalRecords={dentalRecords}
                    xrays={xrays}
                  />
                )}
                {activeTab === 'visits' && (
                  <VisitsTab visits={visits} />
                )}
                {activeTab === 'notes' && (
                  <NotesTab
                    notes={notes}
                    isEditing={isEditingNotes}
                    noteText={noteText}
                    isSaving={isSavingNote}
                    onEdit={() => setIsEditingNotes(true)}
                    onCancel={() => {
                      setIsEditingNotes(false);
                      setNoteText('');
                    }}
                    onChange={setNoteText}
                    onSave={handleSaveNote}
                    canEdit={hasScope('PATIENT_WRITE')}
                  />
                )}
              </>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex items-center justify-between">
            <div className="flex gap-2">
              {hasScope('PATIENT_WRITE') && (
                <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Edit Info
                </button>
              )}
              <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export PDF
              </button>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-[#87CEEB] text-white rounded-lg text-sm font-medium hover:bg-[#6BA8D9] transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// Tab Components
function TabSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-32 bg-gray-200 rounded" />
          <div className="h-8 w-full bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}

function OverviewTab({ patient }: { patient: PatientSummary }) {
  return (
    <div className="space-y-6">
      {/* Contact Information */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Phone className="w-5 h-5 text-gray-400" />
            <div>
              <div className="text-xs text-gray-500">Phone</div>
              <div className="text-sm font-medium text-gray-900">{patient.phone}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Mail className="w-5 h-5 text-gray-400" />
            <div>
              <div className="text-xs text-gray-500">Email</div>
              <div className="text-sm font-medium text-gray-900">{patient.email}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Health Flags */}
      {(patient.flags.has_allergies || patient.flags.requires_pre_medication || patient.flags.has_outstanding_balance) && (
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Alerts</h3>
          <div className="space-y-2">
            {patient.flags.has_allergies && (
              <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">Has medication allergies</span>
              </div>
            )}
            {patient.flags.requires_pre_medication && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Requires pre-medication</span>
              </div>
            )}
            {patient.flags.has_outstanding_balance && (
              <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <DollarSign className="w-5 h-5 text-red-600" />
                <span className="text-sm font-medium text-red-900">Has outstanding balance</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Recent Activity */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-2">
          {patient.last_visit_date && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Last Visit</span>
              <span className="text-sm font-medium text-gray-900">
                {new Date(patient.last_visit_date).toLocaleDateString()}
              </span>
            </div>
          )}
          {patient.next_appointment_date && (
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm text-gray-600">Next Appointment</span>
              <span className="text-sm font-medium text-blue-900">
                {new Date(patient.next_appointment_date).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function InsuranceTab({
  insurance,
  piiRevealed,
  onRevealPII,
  canReveal,
}: {
  insurance: InsuranceDetails;
  piiRevealed: boolean;
  onRevealPII: () => void;
  canReveal: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Provider Info */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Provider Information</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Provider</span>
            <span className="text-sm font-medium text-gray-900">{insurance.provider}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Plan</span>
            <span className="text-sm font-medium text-gray-900">{insurance.plan}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Coverage</span>
            <span className="text-sm font-semibold text-green-600">{insurance.coverage_percent}%</span>
          </div>
        </div>
      </section>

      {/* Member ID (PII) */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Policy Details</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Member ID</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-gray-900">{insurance.member_id}</span>
              {!piiRevealed && canReveal && (
                <button
                  onClick={onRevealPII}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title="Reveal full member ID"
                >
                  <Eye className="w-4 h-4 text-gray-600" />
                </button>
              )}
            </div>
          </div>
          {insurance.group_number && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Group Number</span>
              <span className="text-sm font-mono text-gray-900">{insurance.group_number}</span>
            </div>
          )}
          {insurance.policy_expiry && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Policy Expiry</span>
              <span className="text-sm font-medium text-gray-900">
                {new Date(insurance.policy_expiry).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Annual Maximum */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Annual Maximum</h3>
        <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-700">Used</span>
            <span className="text-lg font-bold text-blue-900">
              ${insurance.annual_max_used.toLocaleString()} / ${insurance.annual_max_total.toLocaleString()}
            </span>
          </div>
          <div className="w-full h-2 bg-white rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${(insurance.annual_max_used / insurance.annual_max_total) * 100}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-gray-600">
            ${(insurance.annual_max_total - insurance.annual_max_used).toLocaleString()} remaining
          </div>
        </div>
      </section>
    </div>
  );
}

function DentalTab({
  periodontal,
  dentalRecords,
  xrays,
}: {
  periodontal: PeriodontalChartingData | null;
  dentalRecords: DentalRecord[];
  xrays: XRayImage[];
}) {
  return (
    <div className="space-y-6">
      {/* Periodontal Charting */}
      {periodontal && (
        <section>
          <PeriodontalChartDiagram
            readings={mildGingivitisProfile}
            showLegend={true}
            interactive={true}
          />
        </section>
      )}

      {/* X-Rays */}
      {xrays.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">X-Ray Images</h3>
          <div className="grid grid-cols-3 gap-4">
            {xrays.map((xray) => (
              <div key={xray.id} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <ImageIcon className="w-full h-full p-8 text-gray-300" />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function VisitsTab({ visits }: { visits: VisitRecord[] }) {
  return (
    <div className="space-y-4">
      {visits.map((visit) => (
        <motion.div
          key={visit.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="font-semibold text-gray-900">{visit.reason}</h4>
              <div className="text-sm text-gray-600 mt-1">
                {new Date(visit.date).toLocaleDateString()} • {visit.provider}
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900">${visit.total_cost}</div>
              <div className="text-xs text-gray-500">
                Patient: ${visit.patient_paid}
              </div>
            </div>
          </div>
          <div className="space-y-1">
            {visit.procedures.map((proc, idx) => (
              <div key={idx} className="text-sm text-gray-600">
                • {proc.name} ({proc.code}) - ${proc.cost}
              </div>
            ))}
          </div>
          {visit.notes && (
            <div className="mt-3 pt-3 border-t border-gray-200 text-sm text-gray-600">
              {visit.notes}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

function NotesTab({
  notes,
  isEditing,
  noteText,
  isSaving,
  onEdit,
  onCancel,
  onChange,
  onSave,
  canEdit,
}: {
  notes: DoctorNote[];
  isEditing: boolean;
  noteText: string;
  isSaving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onChange: (text: string) => void;
  onSave: () => void;
  canEdit: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* New Note Editor */}
      {canEdit && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          {!isEditing ? (
            <button
              onClick={onEdit}
              className="w-full text-left text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              + Add new note...
            </button>
          ) : (
            <div className="space-y-3">
              <textarea
                value={noteText}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Enter clinical notes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#87CEEB]"
                rows={4}
                autoFocus
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={onSave}
                  disabled={!noteText.trim() || isSaving}
                  className="px-4 py-2 bg-[#87CEEB] text-white rounded-lg text-sm font-medium hover:bg-[#6BA8D9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Note
                    </>
                  )}
                </button>
                <button
                  onClick={onCancel}
                  disabled={isSaving}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Existing Notes */}
      <div className="space-y-3">
        {notes.map((note) => (
          <div key={note.id} className="p-4 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-medium text-gray-900">{note.author_name}</div>
                <div className="text-xs text-gray-500">
                  {new Date(note.created_at).toLocaleDateString()} at{' '}
                  {new Date(note.created_at).toLocaleTimeString()}
                </div>
              </div>
              <span className="text-xs text-gray-500 capitalize">{note.visibility}</span>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
