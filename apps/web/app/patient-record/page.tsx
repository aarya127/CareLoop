'use client';

/**
 * Patient Dental Record Detail Page
 * Full-screen detailed view with all dental information
 * Apple-like slide-in animation and smooth transitions
 */

import { useEffect, useMemo, useState, Suspense, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  User,
  FileText,
  Activity,
  Image as ImageIcon,
  Heart,
  Folder,
  Clock,
  Plus,
  Stethoscope,
  ClipboardList,
} from 'lucide-react';
import ChartHeader from '@/components/emr/chart-header';
import InviteToPortalButton from '@/components/emr/invite-to-portal-button';
import EncountersPanel from '@/components/emr/encounters-panel';
import TimelinePanel from '@/components/emr/timeline-panel';
import TreatmentPlansPanel from '@/components/emr/treatment-plans-panel';
import PatientOverview from '@/components/dental-records/patient-overview-section';
import MedicalHistorySection from '@/components/dental-records/medical-history-section';
import ClinicalChartingSection from '@/components/dental-records/clinical-charting-section';
import PeriodontalRecordsSection from '@/components/dental-records/periodontal-records-section';
import AdminDocumentsSection from '@/components/dental-records/administrative-documents-section';
import RadiographicFilesSection from '@/components/dental-records/radiographic-files-section';
import {
  treatmentsApi,
  STATUS_LABELS,
  STATUS_COLORS,
  type TreatmentRecord,
} from '@/lib/api/treatments';
import { documentsApi, computeSha256Hex } from '@/lib/api/documents';
import { PUBLIC_API_URL } from '@/lib/config/api-client';
import { syncEmrMedicalSlices, syncToothChart, syncEmrPerioExams } from '@/lib/api/emr-mappers';
import { createRecordLoaders } from '@/lib/patient-record/loaders';
import { readyState, type LoadFailure, type SectionState } from '@/lib/patient-record/load-state';
import { persistableProfile } from '@/lib/patient-record/profile';
import type {
  PatientProfile,
  MedicalHistory,
  ClinicalChart,
  PeriodontalRecords,
  AdministrativeDocuments,
  RadiographicRecord,
} from '@/lib/types/dental-record';

type TabType =
  | 'overview'
  | 'timeline'
  | 'history'
  | 'treatments'
  | 'plans'
  | 'charting'
  | 'periodontal'
  | 'imaging'
  | 'encounters'
  | 'documents';

type PatientState =
  | { status: 'loading' }
  | { status: 'ready'; profile: PatientProfile; profileEditable: boolean }
  | { status: 'error'; reason: LoadFailure };

const LOADING = { status: 'loading' } as const;

const FAILURE_MESSAGES: Record<LoadFailure, string> = {
  unauthorized: 'Your session has expired — sign in again.',
  forbidden: "Your account doesn't have access to this record.",
  not_found: 'This record was not found.',
  network: "Couldn't reach the server.",
  server: 'The server returned an error.',
};

/**
 * Renders a section only once its data has loaded. On failure it shows an error
 * instead of an empty, editable form — saving a blank form over data we merely
 * failed to read would destroy it.
 */
function SectionGate<T>({
  state,
  label,
  onRetry,
  children,
}: {
  state: SectionState<T>;
  label: string;
  onRetry: () => void;
  children: (data: T) => ReactNode;
}) {
  if (state.status === 'loading') {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-sky-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (state.status === 'error') {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="font-medium text-red-800">Couldn&apos;t load {label}</p>
        <p className="mt-1 text-sm text-red-700">{FAILURE_MESSAGES[state.reason]}</p>
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 text-sm bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-100"
        >
          Retry
        </button>
      </div>
    );
  }
  return <>{children(state.data)}</>;
}

function PatientRecordContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const patientId = searchParams.get('id');
  const isAdminContext = pathname?.startsWith('/admin');
  const apiBaseUrl = PUBLIC_API_URL;

  const loaders = useMemo(
    () => (patientId ? createRecordLoaders(apiBaseUrl, patientId) : null),
    [apiBaseUrl, patientId],
  );

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [reloadKey, setReloadKey] = useState(0);
  const [patientState, setPatientState] = useState<PatientState>(LOADING);
  const [historyState, setHistoryState] = useState<SectionState<MedicalHistory>>(LOADING);
  const [chartState, setChartState] = useState<SectionState<ClinicalChart>>(LOADING);
  const [perioState, setPerioState] = useState<SectionState<PeriodontalRecords>>(LOADING);
  const [docsState, setDocsState] = useState<SectionState<AdministrativeDocuments>>(LOADING);
  const [imagingState, setImagingState] = useState<SectionState<RadiographicRecord[]>>(LOADING);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [treatmentRecords, setTreatmentRecords] = useState<TreatmentRecord[]>([]);
  const [treatmentsLoading, setTreatmentsLoading] = useState(false);
  const [treatmentsError, setTreatmentsError] = useState<string | null>(null);
  const [showTreatmentForm, setShowTreatmentForm] = useState(false);
  const [treatmentForm, setTreatmentForm] = useState({
    procedureCode: '',
    toothNumber: '',
    surface: '',
    notes: '',
    status: 'planned',
  });
  const [treatmentSubmitting, setTreatmentSubmitting] = useState(false);

  const patientRecord = patientState.status === 'ready' ? patientState.profile : null;
  const reload = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    if (!loaders) {
      setPatientState({ status: 'error', reason: 'not_found' });
      return;
    }
    let cancelled = false;
    setPatientState(LOADING);
    setHistoryState(LOADING);
    setChartState(LOADING);
    setPerioState(LOADING);
    setDocsState(LOADING);
    setImagingState(LOADING);

    (async () => {
      const patient = await loaders.loadPatient();
      if (cancelled) return;
      setPatientState(patient);
      if (patient.status !== 'ready') return;

      const [history, chart, perio, docs, imaging] = await Promise.all([
        loaders.loadHistory(),
        loaders.loadChart(),
        loaders.loadPerio(),
        loaders.loadAdminDocuments(),
        loaders.loadImaging(),
      ]);
      if (cancelled) return;
      setHistoryState(history);
      setChartState(chart);
      setPerioState(perio);
      setDocsState(docs);
      setImagingState(imaging);
    })();

    return () => {
      cancelled = true;
    };
  }, [loaders, reloadKey]);

  // Load treatment records when the treatments tab is opened
  const loadedPatientId = patientRecord?.patient_id;
  useEffect(() => {
    if (activeTab !== 'treatments' || !loadedPatientId) return;
    setTreatmentsLoading(true);
    setTreatmentsError(null);
    treatmentsApi
      .list({ patientId: loadedPatientId })
      .then(setTreatmentRecords)
      .catch(() => setTreatmentsError("Couldn't load treatment records."))
      .finally(() => setTreatmentsLoading(false));
  }, [activeTab, loadedPatientId]);

  const handleClose = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }

    router.push('/admin');
  };

  const handleGoHome = () => {
    router.push('/admin');
  };

  const reportSaveFailure = (what: string) =>
    setSaveError(`Couldn't save ${what}. The latest saved version has been reloaded.`);

  const handleUpdateProfile = async (updates: Partial<PatientProfile>) => {
    if (!loaders || patientState.status !== 'ready') return;
    if (!patientState.profileEditable) {
      setSaveError("Contact details couldn't be loaded, so they can't be edited right now.");
      return;
    }
    const prev = patientState.profile;
    const next: PatientProfile = {
      ...prev,
      ...updates,
      contact: { ...prev.contact, ...updates.contact },
    };
    setPatientState({ ...patientState, profile: next });
    setSaveError(null);

    try {
      // Phone lives on the Patient record itself; email/address/preferences in the profile section.
      if (next.contact.phone !== prev.contact.phone) await loaders.savePhone(next.contact.phone);
      await loaders.saveSection('profile', persistableProfile(next));
    } catch {
      setSaveError(
        "Couldn't save contact details. Phone numbers must be in international format, e.g. +15551234567.",
      );
      setPatientState(await loaders.loadPatient());
    }
  };

  const handleUpdateMedicalHistory = async (updates: Partial<MedicalHistory>) => {
    if (!loaders || historyState.status !== 'ready') return;
    const prev = historyState.data;
    const next = { ...prev, ...updates };
    setHistoryState(readyState(next, false));
    setSaveError(null);

    try {
      // Allergies/medications/conditions live in first-class EMR tables; the
      // legacy blob keeps surgeries, lifestyle, family and dental history.
      const fresh = await syncEmrMedicalSlices(prev.patient_id, prev, updates);
      const saved = { ...next, ...fresh };
      await loaders.saveMedicalHistory(saved);
      setHistoryState(readyState(saved, false));
    } catch {
      reportSaveFailure('the medical history');
      setHistoryState(await loaders.loadHistory());
    }
  };

  const handleUpdateClinicalChart = async (updates: Partial<ClinicalChart>) => {
    if (!loaders || chartState.status !== 'ready') return;
    const prev = chartState.data;
    const next = { ...prev, ...updates };
    setChartState(readyState(next, false));
    setSaveError(null);

    try {
      if (updates.teeth) await syncToothChart(prev.patient_id, prev.teeth, next.teeth);
      await loaders.saveSection('clinicalChart', next);
    } catch {
      reportSaveFailure('the clinical chart');
      setChartState(await loaders.loadChart());
    }
  };

  const handleUpdatePeriodontalRecords = async (updates: Partial<PeriodontalRecords>) => {
    if (!loaders || perioState.status !== 'ready') return;
    const prev = perioState.data;
    const next = { ...prev, ...updates };
    setPerioState(readyState(next, false));
    setSaveError(null);

    try {
      let saved = next;
      if (updates.exams) {
        const exams = await syncEmrPerioExams(prev.patient_id, prev.exams, next.exams);
        saved = { ...next, exams };
      }
      await loaders.saveSection('periodontalRecords', saved);
      setPerioState(readyState(saved, false));
    } catch {
      reportSaveFailure('the periodontal records');
      setPerioState(await loaders.loadPerio());
    }
  };

  const handleUpdateAdminDocuments = async (updates: Partial<AdministrativeDocuments>) => {
    if (!loaders || docsState.status !== 'ready') return;
    const next = { ...docsState.data, ...updates };
    setDocsState(readyState(next, false));
    setSaveError(null);

    try {
      await loaders.saveSection('adminDocuments', next);
    } catch {
      reportSaveFailure('the documents');
      setDocsState(await loaders.loadAdminDocuments());
    }
  };

  const handleUploadRadiograph = async (file: File) => {
    if (!loaders || !patientRecord || imagingState.status !== 'ready') {
      throw new Error('Imaging is not loaded yet');
    }

    // Route imaging through the presigned-S3 flow (upload-url → PUT → confirm)
    // instead of embedding a base64 data URL in the record JSON.
    const checksum = await computeSha256Hex(file);
    const { uploadUrl, documentId } = await documentsApi.getUploadUrl({
      patientId: patientRecord.patient_id,
      category: 'radiograph',
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
      checksumSha256: checksum,
    });

    const putRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        'x-amz-server-side-encryption': 'AES256',
      },
      body: file,
    });
    if (!putRes.ok) throw new Error(`Upload to storage failed (${putRes.status})`);

    await documentsApi.confirmUpload(documentId, checksum);
    // Resolve a short-lived URL so the image renders immediately.
    const { url } = await documentsApi.getDownloadUrl(documentId);

    const nextRecord: RadiographicRecord = {
      // Store the S3 documentId so the URL can be re-resolved on future loads.
      id: documentId,
      type: 'intraoral_photo',
      date_taken: new Date().toISOString().slice(0, 10),
      file_url: url,
      thumbnail_url: url,
      dentist_notes: `Uploaded file: ${file.name}`,
    };

    const next = [...imagingState.data, nextRecord];
    setImagingState(readyState(next, false));
    await loaders.saveSection('radiographicRecords', next);
  };

  const handleCreateTreatment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientRecord) return;
    setTreatmentSubmitting(true);
    setTreatmentsError(null);
    try {
      const record = await treatmentsApi.create({
        patientId: patientRecord.patient_id,
        procedureCode: treatmentForm.procedureCode || undefined,
        toothNumber: treatmentForm.toothNumber ? Number(treatmentForm.toothNumber) : undefined,
        surface: treatmentForm.surface || undefined,
        notes: treatmentForm.notes || undefined,
        status: treatmentForm.status,
      });
      setTreatmentRecords((prev) => [record, ...prev]);
      setTreatmentForm({
        procedureCode: '',
        toothNumber: '',
        surface: '',
        notes: '',
        status: 'planned',
      });
      setShowTreatmentForm(false);
    } catch {
      setTreatmentsError("Couldn't save the treatment record.");
    } finally {
      setTreatmentSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    setTreatmentsError(null);
    try {
      const updated = await treatmentsApi.update(id, { status });
      setTreatmentRecords((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch {
      setTreatmentsError("Couldn't update the treatment status.");
    }
  };

  const tabs = [
    { id: 'overview', label: 'Patient Overview', icon: User },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'history', label: 'Medical & Dental History', icon: FileText },
    { id: 'treatments', label: 'Treatment History', icon: Stethoscope },
    { id: 'plans', label: 'Treatment Plans', icon: ClipboardList },
    { id: 'charting', label: 'Clinical Charting', icon: Activity },
    { id: 'periodontal', label: 'Periodontal Records', icon: Heart },
    { id: 'imaging', label: 'Imaging', icon: ImageIcon },
    { id: 'encounters', label: 'Encounters', icon: ClipboardList },
    { id: 'documents', label: 'Administrative Docs', icon: Folder },
  ];

  if (patientState.status === 'loading') {
    return (
      <div
        className={`${isAdminContext ? 'py-16' : 'min-h-screen'} bg-gray-50 flex items-center justify-center`}
      >
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#87CEEB] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading patient record...</p>
        </div>
      </div>
    );
  }

  if (patientState.status === 'error') {
    const reason = patientState.reason;
    const copy =
      reason === 'not_found'
        ? {
            title: 'Patient Not Found',
            body: "The patient record you're looking for doesn't exist.",
          }
        : reason === 'unauthorized'
          ? { title: 'Session Expired', body: 'Sign in again to view this patient record.' }
          : reason === 'forbidden'
            ? { title: 'No Access', body: "Your account doesn't have access to this patient." }
            : {
                title: "Couldn't Load Patient",
                body: 'Something went wrong loading this record. Nothing is shown rather than risk showing incomplete data.',
              };
    return (
      <div
        className={`${isAdminContext ? 'py-16' : 'min-h-screen'} bg-gray-50 flex items-center justify-center`}
      >
        <div className="text-center">
          <FileText className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{copy.title}</h1>
          <p className="text-gray-600 mb-6">{copy.body}</p>
          {reason === 'unauthorized' ? (
            <button
              onClick={() =>
                router.push(
                  `/login?next=${encodeURIComponent(`${pathname}?${searchParams.toString()}`)}`,
                )
              }
              className="px-6 py-3 bg-[#87CEEB] text-white rounded-xl hover:bg-[#6BA8D9] transition-colors"
            >
              Sign In
            </button>
          ) : reason === 'network' || reason === 'server' ? (
            <button
              onClick={reload}
              className="px-6 py-3 bg-[#87CEEB] text-white rounded-xl hover:bg-[#6BA8D9] transition-colors"
            >
              Retry
            </button>
          ) : (
            <button
              onClick={handleGoHome}
              className="px-6 py-3 bg-[#87CEEB] text-white rounded-xl hover:bg-[#6BA8D9] transition-colors"
            >
              Go Home
            </button>
          )}
        </div>
      </div>
    );
  }

  const profile = patientState.profile;
  const history = historyState.status === 'ready' ? historyState.data : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`${isAdminContext ? '' : 'min-h-screen'} bg-gray-50`}
    >
      {/* Header */}
      <motion.div
        initial={isAdminContext ? { opacity: 0, y: 8 } : { y: -100 }}
        animate={isAdminContext ? { opacity: 1, y: 0 } : { y: 0 }}
        className={
          isAdminContext
            ? 'relative z-10 bg-white border border-gray-200 shadow-sm rounded-2xl'
            : 'sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm'
        }
      >
        <div
          className={
            isAdminContext
              ? 'w-full px-4 sm:px-6 lg:px-6'
              : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'
          }
        >
          {/* Clinical chart header: demographics + allergy banner + summary */}
          <div className="py-4">
            <ChartHeader
              name={`${profile.first_name} ${profile.last_name}`}
              patientId={profile.patient_id}
              dateOfBirth={profile.date_of_birth}
              gender={profile.gender}
              phone={profile.contact?.phone}
              allergyStatus={historyState.status}
              allergies={(history?.allergies ?? []).map((a) => ({
                allergen: a.allergen,
                severity: a.severity,
              }))}
              activeProblems={(history?.systemic_conditions ?? [])
                .filter((c) => c.status !== 'resolved')
                .map((c) => c.condition)}
              activeMedications={(history?.current_medications ?? []).map((m) => m.name)}
              nextAppointment={
                profile.next_appointment
                  ? {
                      date: profile.next_appointment.date?.slice(0, 10),
                      label: profile.next_appointment.procedure_type,
                    }
                  : null
              }
              onBack={handleClose}
              onQuickAdd={(kind) => setActiveTab(kind === 'note' ? 'encounters' : 'history')}
            />
            <div className="mt-3 flex justify-end">
              <InviteToPortalButton patientId={profile.patient_id} />
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 overflow-x-auto pb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-t-lg transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-[#87CEEB] text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div
        className={isAdminContext ? 'w-full py-6' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}
      >
        {saveError && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="flex-1">{saveError}</span>
            <button onClick={() => setSaveError(null)} className="text-amber-700 hover:underline">
              Dismiss
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <PatientOverview
                profile={profile}
                onUpdate={handleUpdateProfile}
                onCall={(phone) => {
                  window.location.href = `tel:${phone}`;
                }}
                onEmail={(email) => {
                  window.location.href = `mailto:${email}`;
                }}
              />
            </motion.div>
          )}

          {activeTab === 'timeline' && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <TimelinePanel patientId={profile.patient_id} />
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <SectionGate state={historyState} label="the medical history" onRetry={reload}>
                {(data) => (
                  <MedicalHistorySection
                    patientId={profile.patient_id}
                    medicalHistory={data}
                    onUpdate={handleUpdateMedicalHistory}
                  />
                )}
              </SectionGate>
            </motion.div>
          )}

          {activeTab === 'treatments' && (
            <motion.div
              key="treatments"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="p-6"
            >
              {/* Header row */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Treatment History</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Clinical care records linked to this patient
                  </p>
                </div>
                <button
                  onClick={() => setShowTreatmentForm((v) => !v)}
                  className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Record
                </button>
              </div>

              {treatmentsError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {treatmentsError}
                </div>
              )}

              {/* Create form */}
              {showTreatmentForm && (
                <motion.form
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  onSubmit={handleCreateTreatment}
                  className="mb-6 p-5 bg-white border border-gray-200 rounded-xl shadow-sm space-y-4"
                >
                  <h3 className="font-semibold text-gray-800">New Treatment Record</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Procedure Code
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. D2140"
                        value={treatmentForm.procedureCode}
                        onChange={(e) =>
                          setTreatmentForm((f) => ({ ...f, procedureCode: e.target.value }))
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Tooth Number
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={32}
                        placeholder="1–32"
                        value={treatmentForm.toothNumber}
                        onChange={(e) =>
                          setTreatmentForm((f) => ({ ...f, toothNumber: e.target.value }))
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Surface
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. MOD"
                        value={treatmentForm.surface}
                        onChange={(e) =>
                          setTreatmentForm((f) => ({ ...f, surface: e.target.value }))
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                      <select
                        value={treatmentForm.status}
                        onChange={(e) =>
                          setTreatmentForm((f) => ({ ...f, status: e.target.value }))
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400"
                      >
                        <option value="planned">Planned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Clinical Notes
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Clinical notes..."
                        value={treatmentForm.notes}
                        onChange={(e) => setTreatmentForm((f) => ({ ...f, notes: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowTreatmentForm(false)}
                      className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={treatmentSubmitting}
                      className="px-4 py-2 text-sm bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:opacity-50"
                    >
                      {treatmentSubmitting ? 'Saving...' : 'Save Record'}
                    </button>
                  </div>
                </motion.form>
              )}

              {/* Records list */}
              {treatmentsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-4 border-sky-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : treatmentsError &&
                treatmentRecords.length === 0 ? null : treatmentRecords.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Stethoscope className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No treatment records yet. Add the first one.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {treatmentRecords.map((rec) => (
                    <div
                      key={rec.id}
                      className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-4 shadow-sm"
                    >
                      {/* Status badge */}
                      <div className="pt-0.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[rec.status] ?? 'bg-gray-100 text-gray-600'}`}
                        >
                          {STATUS_LABELS[rec.status] ?? rec.status}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {rec.procedureCode && (
                            <span className="font-mono text-sm font-semibold text-gray-800">
                              {rec.procedureCode}
                            </span>
                          )}
                          {rec.toothNumber && (
                            <span className="text-xs text-gray-500">Tooth #{rec.toothNumber}</span>
                          )}
                          {rec.surface && (
                            <span className="text-xs text-gray-500">Surface: {rec.surface}</span>
                          )}
                          {rec.provider && (
                            <span className="text-xs text-gray-500">· {rec.provider.name}</span>
                          )}
                        </div>
                        {rec.notes && (
                          <p className="mt-1 text-sm text-gray-600 line-clamp-2">{rec.notes}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-400">
                          Created {new Date(rec.createdAt).toLocaleDateString()}
                          {rec.completedAt &&
                            ` · Completed ${new Date(rec.completedAt).toLocaleDateString()}`}
                          {rec.createdBy && ` · by ${rec.createdBy}`}
                        </p>
                      </div>

                      {/* Inline status changer */}
                      <select
                        value={rec.status}
                        onChange={(e) => handleStatusChange(rec.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-sky-400"
                      >
                        <option value="planned">Planned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'plans' && (
            <motion.div
              key="plans"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <TreatmentPlansPanel patientId={profile.patient_id} />
            </motion.div>
          )}

          {activeTab === 'charting' && (
            <motion.div
              key="charting"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <SectionGate state={chartState} label="the clinical chart" onRetry={reload}>
                {(data) => (
                  <ClinicalChartingSection
                    patientId={profile.patient_id}
                    clinicalChart={data}
                    onUpdate={handleUpdateClinicalChart}
                  />
                )}
              </SectionGate>
            </motion.div>
          )}

          {activeTab === 'periodontal' && (
            <motion.div
              key="periodontal"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <SectionGate state={perioState} label="the periodontal records" onRetry={reload}>
                {(data) => (
                  <PeriodontalRecordsSection
                    patientId={profile.patient_id}
                    periodontalRecords={data}
                    onUpdate={handleUpdatePeriodontalRecords}
                  />
                )}
              </SectionGate>
            </motion.div>
          )}

          {activeTab === 'imaging' && (
            <motion.div
              key="imaging"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <SectionGate state={imagingState} label="imaging" onRetry={reload}>
                {(data) => (
                  <RadiographicFilesSection
                    patientId={profile.patient_id}
                    radiographicRecords={data}
                    onUpload={handleUploadRadiograph}
                  />
                )}
              </SectionGate>
            </motion.div>
          )}

          {activeTab === 'encounters' && (
            <motion.div
              key="encounters"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <EncountersPanel patientId={profile.patient_id} />
            </motion.div>
          )}

          {activeTab === 'documents' && (
            <motion.div
              key="documents"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <SectionGate state={docsState} label="the documents" onRetry={reload}>
                {(data) => (
                  <AdminDocumentsSection
                    patientId={profile.patient_id}
                    adminDocuments={data}
                    onUpdate={handleUpdateAdminDocuments}
                  />
                )}
              </SectionGate>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function PatientRecordPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mb-4"></div>
            <p className="text-gray-600">Loading patient record...</p>
          </div>
        </div>
      }
    >
      <PatientRecordContent />
    </Suspense>
  );
}
