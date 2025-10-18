'use client';

/**
 * Patient Dental Record Detail Page
 * Full-screen detailed view with all dental information
 * Apple-like slide-in animation and smooth transitions
 */

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronLeft,
  User,
  FileText,
  Activity,
  Image as ImageIcon,
  Heart,
  Folder,
  Search,
  Bot,
  Clock,
} from 'lucide-react';
import PatientOverview from '@/components/dental-records/patient-overview-section';
import RadiographicFilesSection from '@/components/dental-records/radiographic-files-section';
import MedicalHistorySection from '@/components/dental-records/medical-history-section';
import ClinicalChartingSection from '@/components/dental-records/clinical-charting-section';
import PeriodontalRecordsSection from '@/components/dental-records/periodontal-records-section';
import AdminDocumentsSection from '@/components/dental-records/administrative-documents-section';
import { getDentalRecordById } from '@/lib/data/mock-dental-records';
import type { 
  PatientProfile, 
  MedicalHistory, 
  ClinicalChart,
  PeriodontalRecords,
  AdministrativeDocuments,
  ToothMeasurement
} from '@/lib/types/dental-record';

// Temporary mock medical history generator (will be moved to mock data file)
const getMockMedicalHistory = (patientId: string): MedicalHistory => {
  return {
    patient_id: patientId,
    allergies: [
      {
        id: 'allergy-001',
        allergen: 'Penicillin',
        severity: 'severe',
        reaction: 'Hives and difficulty breathing',
        date_identified: '2018-03-15',
        notes: 'Confirmed by allergist Dr. Smith'
      },
      {
        id: 'allergy-002',
        allergen: 'Latex',
        severity: 'moderate',
        reaction: 'Skin rash and itching',
        date_identified: '2020-06-22',
      }
    ],
    current_medications: [
      {
        id: 'med-001',
        name: 'Lisinopril',
        dosage: '10mg',
        frequency: 'Once daily',
        purpose: 'Blood pressure control',
        start_date: '2022-01-15',
        prescribing_doctor: 'Dr. Johnson'
      },
      {
        id: 'med-002',
        name: 'Metformin',
        dosage: '500mg',
        frequency: 'Twice daily',
        purpose: 'Type 2 diabetes management',
        start_date: '2021-08-10',
        prescribing_doctor: 'Dr. Williams'
      }
    ],
    systemic_conditions: [
      {
        id: 'cond-001',
        condition: 'Type 2 Diabetes',
        diagnosed_date: '2021-07-20',
        status: 'controlled',
        severity: 'moderate',
        treatment: 'Metformin and diet modification'
      },
      {
        id: 'cond-002',
        condition: 'Hypertension',
        diagnosed_date: '2022-01-05',
        status: 'controlled',
        severity: 'mild',
        treatment: 'Lisinopril'
      }
    ],
    past_surgeries: [
      {
        id: 'surg-001',
        procedure: 'Appendectomy',
        date: '2015-06-12',
        hospital: 'San Diego Medical Center',
        surgeon: 'Dr. Anderson'
      }
    ],
    lifestyle_factors: {
      smoking: {
        status: 'former',
        packs_per_day: 0.5,
        years: 10,
        quit_date: '2020-01-01'
      },
      alcohol: {
        frequency: 'occasional',
        drinks_per_week: 2
      },
      diet_notes: 'Low-carb diet for diabetes management',
      exercise_frequency: '3-4 times per week, moderate intensity'
    },
    family_health_history: [
      {
        id: 'fam-001',
        relation: 'Mother',
        conditions: ['diabetes', 'osteoporosis']
      },
      {
        id: 'fam-002',
        relation: 'Father',
        conditions: ['hypertension', 'heart disease']
      }
    ],
    dental_history: {
      last_cleaning_date: '2024-08-15',
      last_exam_date: '2024-09-20',
      previous_orthodontics: true,
      orthodontics_details: 'Braces for 2 years (2005-2007)',
      previous_implants: false,
      dental_anxiety_level: 'mild',
      treatment_history_summary: [
        {
          id: 'treat-001',
          date: '2024-09-20',
          procedure: 'Routine Cleaning & Exam',
          teeth_involved: [],
          dentist_name: 'Dr. Emily Chen',
          cost: 180,
          insurance_covered: 126
        },
        {
          id: 'treat-002',
          date: '2024-06-10',
          procedure: 'Composite Filling',
          teeth_involved: [14, 15],
          dentist_name: 'Dr. Emily Chen',
          cost: 350,
          insurance_covered: 245,
          notes: 'Two posterior fillings completed successfully'
        },
        {
          id: 'treat-003',
          date: '2023-12-15',
          procedure: 'Root Canal Therapy',
          teeth_involved: [19],
          dentist_name: 'Dr. James Wilson',
          cost: 1200,
          insurance_covered: 840,
          notes: 'Root canal with crown placement'
        }
      ]
    }
  };
};

// Mock Clinical Chart generator
const getMockClinicalChart = (patientId: string): ClinicalChart => {
  const toothStatuses: Array<'healthy' | 'decayed' | 'filled' | 'crowned' | 'missing' | 'implant' | 'bridge' | 'root_canal'> = 
    ['healthy', 'decayed', 'filled', 'crowned', 'missing', 'implant', 'bridge', 'root_canal'];
  
  const teeth = Array.from({ length: 32 }, (_, i) => {
    const toothNumber = i + 1;
    const hasIssue = Math.random() > 0.7; // 30% chance of having an issue
    
    return {
      tooth_number: toothNumber,
      status: hasIssue ? toothStatuses[Math.floor(Math.random() * toothStatuses.length)] : 'healthy' as const,
      color_code: hasIssue ? '#ef4444' : '#10b981',
      surfaces_affected: hasIssue ? ['occlusal' as const, 'mesial' as const] : [],
      notes: hasIssue ? 'Requires attention' : undefined,
    };
  });

  return {
    patient_id: patientId,
    last_updated: '2024-10-15',
    teeth,
    gum_health_summary: {
      overall_health: 'good',
      periodontal_diagnosis: 'Mild gingivitis',
      bleeding_on_probing: true,
      pocket_depths_average: 3.2,
      bone_loss_detected: false,
      notes: 'Improved from last visit',
    },
    treatment_plans: [
      {
        id: 'plan-001',
        created_date: '2024-10-01',
        status: 'accepted',
        procedures: [
          {
            id: 'proc-001',
            procedure_name: 'Composite Filling',
            teeth_involved: [14, 15],
            estimated_cost: 350,
            estimated_duration_minutes: 60,
            scheduled_date: '2024-11-05',
            completed: false,
          },
        ],
        total_estimated_cost: 350,
        insurance_coverage_estimated: 245,
        patient_responsibility: 105,
        priority: 'necessary',
        notes: 'Two posterior fillings required',
      },
      {
        id: 'plan-002',
        created_date: '2024-09-15',
        status: 'proposed',
        procedures: [
          {
            id: 'proc-002',
            procedure_name: 'Crown Placement',
            teeth_involved: [30],
            estimated_cost: 1200,
            estimated_duration_minutes: 90,
            completed: false,
          },
        ],
        total_estimated_cost: 1200,
        insurance_coverage_estimated: 600,
        patient_responsibility: 600,
        priority: 'recommended',
        notes: 'Tooth prepared, awaiting lab work',
      },
    ],
    ai_suggestions: [
      {
        id: 'ai-001',
        suggestion_type: 'prevention',
        message: 'Early demineralization detected on tooth #19',
        confidence_score: 78,
        teeth_involved: [19],
        recommended_action: 'Monitor for potential cavity development',
        reasoning: 'AI analysis of radiographs shows early enamel changes',
        created_date: '2024-10-15',
      },
    ],
  };
};

// Mock Periodontal Records generator
const getMockPeriodontalRecords = (patientId: string): PeriodontalRecords => {
  const generateToothMeasurements = (): ToothMeasurement[] => {
    return Array.from({ length: 32 }, (_, i) => {
      const toothNumber = i + 1;
      const healthScore = Math.random();
      
      // Generate 6 pocket depths (MB, B, DB, ML, L, DL)
      const pocketDepths = Array.from({ length: 6 }, () => {
        if (healthScore > 0.7) return Math.floor(Math.random() * 2) + 2; // 2-3mm healthy
        if (healthScore > 0.4) return Math.floor(Math.random() * 2) + 4; // 4-5mm warning
        return Math.floor(Math.random() * 2) + 6; // 6-7mm severe
      });

      // Generate bleeding indicators
      const bleedingOnProbing = Array.from({ length: 6 }, () => Math.random() > 0.7);

      // Generate recession measurements
      const recessionMm = Array.from({ length: 6 }, () => 
        Math.random() > 0.8 ? Math.floor(Math.random() * 2) + 1 : 0
      );

      // Mobility grade (0-3)
      const mobilityGrade = healthScore < 0.3 ? Math.floor(Math.random() * 3) + 1 : 0;

      // Furcation involvement (for molars)
      const isMolar = [6, 7, 14, 15, 18, 19, 30, 31].includes(toothNumber);
      const furcationInvolvement = isMolar && healthScore < 0.4 
        ? (['class_i', 'class_ii', 'class_iii'] as const)[Math.floor(Math.random() * 3)]
        : 'none';

      return {
        tooth_number: toothNumber,
        pocket_depths: pocketDepths,
        bleeding_on_probing: bleedingOnProbing,
        recession_mm: recessionMm,
        mobility_grade: mobilityGrade,
        furcation_involvement: furcationInvolvement,
      };
    });
  };

  return {
    patient_id: patientId,
    exams: [
      {
        exam_id: 'perio-exam-003',
        exam_date: '2024-10-01',
        examiner_name: 'Dr. Sarah Miller',
        tooth_measurements: generateToothMeasurements(),
        overall_diagnosis: 'Mild gingivitis with localized moderate periodontitis',
        treatment_recommendations: [
          'Scaling and root planing in areas of deeper pockets',
          'Improved home care with focus on flossing',
          'Consider electric toothbrush',
          '3-month recall for periodontal maintenance',
        ],
        notes: 'Patient shows improvement from last visit. Continue current treatment plan.',
      },
      {
        exam_id: 'perio-exam-002',
        exam_date: '2024-07-01',
        examiner_name: 'Dr. Sarah Miller',
        tooth_measurements: generateToothMeasurements(),
        overall_diagnosis: 'Moderate periodontitis',
        treatment_recommendations: [
          'Deep cleaning recommended',
          'Antibiotic therapy if needed',
        ],
      },
      {
        exam_id: 'perio-exam-001',
        exam_date: '2024-04-01',
        examiner_name: 'Dr. Sarah Miller',
        tooth_measurements: generateToothMeasurements(),
        overall_diagnosis: 'Generalized gingivitis',
        treatment_recommendations: [
          'Improve oral hygiene routine',
          'Regular cleanings every 6 months',
        ],
      },
    ],
    summary: {
      last_exam_date: '2024-10-01',
      periodontal_status: 'mild_periodontitis',
      average_pocket_depth: 3.2,
      percentage_bleeding_sites: 28,
      percentage_plaque_sites: 35,
      teeth_at_risk: [14, 15, 19, 30],
      recommended_treatment: 'Scaling and root planing with 3-month recall',
      recall_interval_months: 3,
    },
    treatment_history: [
      {
        id: 'perio-treat-001',
        treatment_date: '2024-07-15',
        treatment_type: 'scaling_root_planing',
        teeth_treated: [14, 15, 30, 31],
        provider_name: 'Dr. Sarah Miller',
        outcome_notes: 'Treatment well-tolerated. Patient advised on post-op care.',
        follow_up_date: '2024-10-01',
      },
    ],
  };
};

// Mock Administrative Documents generator
const getMockAdminDocuments = (patientId: string): AdministrativeDocuments => {
  return {
    patient_id: patientId,
    documents: [
      {
        id: 'doc-001',
        document_type: 'consent_form',
        title: 'Informed Consent for Dental Treatment',
        status: 'signed',
        date_issued: '2024-01-15',
        date_signed: '2024-01-15',
        file_url: '/documents/consent-001.pdf',
        file_format: 'pdf',
        signed_by: [
          {
            signer_name: 'John Smith',
            signer_role: 'patient',
            signature_date: '2024-01-15',
          },
        ],
        tags: ['consent', 'required'],
      },
      {
        id: 'doc-002',
        document_type: 'treatment_plan',
        title: 'Comprehensive Treatment Plan - Q4 2024',
        status: 'approved',
        date_issued: '2024-09-20',
        date_signed: '2024-09-22',
        file_url: '/documents/treatment-plan-002.pdf',
        file_format: 'pdf',
        linked_procedure: 'Multiple restorations and crown',
        signed_by: [
          {
            signer_name: 'Dr. Emily Chen',
            signer_role: 'dentist',
            signature_date: '2024-09-20',
          },
          {
            signer_name: 'John Smith',
            signer_role: 'patient',
            signature_date: '2024-09-22',
          },
        ],
        notes: 'Estimated total cost: $2,450. Insurance coverage: 60%',
        tags: ['treatment-plan', '2024'],
      },
      {
        id: 'doc-003',
        document_type: 'invoice',
        title: 'Invoice #2024-0892 - Cleaning & Exam',
        status: 'signed',
        date_issued: '2024-08-15',
        file_url: '/documents/invoice-003.pdf',
        file_format: 'pdf',
        linked_procedure: 'Routine cleaning and examination',
        notes: 'Total: $180. Paid in full.',
        tags: ['invoice', 'paid'],
      },
      {
        id: 'doc-004',
        document_type: 'insurance_claim',
        title: 'Insurance Claim - Root Canal Therapy',
        status: 'approved',
        date_issued: '2023-12-18',
        file_url: '/documents/claim-004.pdf',
        file_format: 'pdf',
        linked_procedure: 'Root canal therapy tooth #19',
        notes: 'Claim approved. Reimbursement: $840',
        tags: ['insurance', 'approved'],
      },
      {
        id: 'doc-005',
        document_type: 'prescription',
        title: 'Prescription - Amoxicillin 500mg',
        status: 'signed',
        date_issued: '2023-12-15',
        file_url: '/documents/rx-005.pdf',
        file_format: 'pdf',
        signed_by: [
          {
            signer_name: 'Dr. James Wilson',
            signer_role: 'dentist',
            signature_date: '2023-12-15',
          },
        ],
        notes: 'Post-operative antibiotic coverage',
        tags: ['prescription', 'antibiotic'],
      },
      {
        id: 'doc-006',
        document_type: 'hipaa_authorization',
        title: 'HIPAA Privacy Authorization',
        status: 'signed',
        date_issued: '2024-01-15',
        date_signed: '2024-01-15',
        file_url: '/documents/hipaa-006.pdf',
        file_format: 'pdf',
        signed_by: [
          {
            signer_name: 'John Smith',
            signer_role: 'patient',
            signature_date: '2024-01-15',
          },
        ],
        tags: ['hipaa', 'required'],
      },
      {
        id: 'doc-007',
        document_type: 'treatment_plan',
        title: 'Periodontal Treatment Plan',
        status: 'pending',
        date_issued: '2024-10-01',
        file_url: '/documents/perio-plan-007.pdf',
        file_format: 'pdf',
        linked_procedure: 'Scaling and root planing',
        notes: 'Awaiting patient signature. Estimated cost: $800',
        tags: ['treatment-plan', 'periodontal', 'pending'],
      },
    ],
  };
};

type TabType = 'overview' | 'history' | 'charting' | 'radiographs' | 'periodontal' | 'documents';

function PatientRecordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get('id');
  
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [patientRecord, setPatientRecord] = useState<PatientProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (patientId) {
      // Simulate API call
      setTimeout(() => {
        const record = getDentalRecordById(patientId);
        setPatientRecord(record || null);
        setIsLoading(false);
      }, 300);
    } else {
      setIsLoading(false);
    }
  }, [patientId]);

  const handleClose = () => {
    router.back();
  };

  const handleUpdateProfile = async (updates: Partial<PatientProfile>) => {
    // Simulate API update
    console.log('Updating profile:', updates);
    if (patientRecord) {
      setPatientRecord({ ...patientRecord, ...updates });
    }
  };

  const tabs = [
    { id: 'overview', label: 'Patient Overview', icon: User },
    { id: 'history', label: 'Medical & Dental History', icon: FileText },
    { id: 'charting', label: 'Clinical Charting', icon: Activity },
    { id: 'radiographs', label: 'X-Rays & Diagnostics', icon: ImageIcon },
    { id: 'periodontal', label: 'Periodontal Records', icon: Heart },
    { id: 'documents', label: 'Administrative Docs', icon: Folder },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#87CEEB] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading patient record...</p>
        </div>
      </div>
    );
  }

  if (!patientRecord) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Patient Not Found</h1>
          <p className="text-gray-600 mb-6">
            The patient record you're looking for doesn't exist.
          </p>
          <button
            onClick={handleClose}
            className="px-6 py-3 bg-[#87CEEB] text-white rounded-xl hover:bg-[#6BA8D9] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gray-50"
    >
      {/* Sticky Header */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Back Button & Patient Info */}
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-gray-600" />
              </motion.button>
              
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#87CEEB] to-[#6BA8D9] flex items-center justify-center text-white font-semibold">
                  {patientRecord.first_name[0]}
                  {patientRecord.last_name[0]}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {patientRecord.first_name} {patientRecord.last_name}
                  </h1>
                  <p className="text-sm text-gray-500">
                    Patient ID: {patientRecord.patient_id}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Search Records</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                <Bot className="w-4 h-4" />
                <span className="hidden sm:inline">AI Assistant</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </motion.button>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                profile={patientRecord}
                onUpdate={handleUpdateProfile}
                onCall={(phone) => {
                  window.location.href = `tel:${phone}`;
                }}
                onEmail={(email) => {
                  window.location.href = `mailto:${email}`;
                }}
                onMessage={(patientId) => {
                  console.log('Message patient:', patientId);
                }}
              />
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
              <MedicalHistorySection
                patientId={patientRecord.patient_id}
                medicalHistory={getMockMedicalHistory(patientRecord.patient_id)}
              />
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
              <ClinicalChartingSection
                patientId={patientRecord.patient_id}
                clinicalChart={getMockClinicalChart(patientRecord.patient_id)}
              />
            </motion.div>
          )}

          {activeTab === 'radiographs' && (
            <motion.div
              key="radiographs"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <RadiographicFilesSection
                patientId={patientRecord.patient_id}
                radiographicRecords={patientRecord.radiographic_records || []}
              />
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
              <PeriodontalRecordsSection
                patientId={patientRecord.patient_id}
                periodontalRecords={getMockPeriodontalRecords(patientRecord.patient_id)}
              />
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
              <AdminDocumentsSection
                patientId={patientRecord.patient_id}
                adminDocuments={getMockAdminDocuments(patientRecord.patient_id)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Activity Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-[#87CEEB]" />
            <span>Recent Activity</span>
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Payment Received</p>
                <p className="text-sm text-gray-600">
                  ${patientRecord.financial.last_payment_amount?.toFixed(2)} paid on{' '}
                  {patientRecord.financial.last_payment_date}
                </p>
              </div>
              <span className="text-xs text-gray-500">2 days ago</span>
            </div>

            {patientRecord.next_appointment && (
              <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Appointment Scheduled</p>
                  <p className="text-sm text-gray-600">
                    {patientRecord.next_appointment.procedure_type} with{' '}
                    {patientRecord.next_appointment.dentist_name}
                  </p>
                </div>
                <span className="text-xs text-gray-500">5 days ago</span>
              </div>
            )}

            <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Profile Updated</p>
                <p className="text-sm text-gray-600">Contact information changed</p>
              </div>
              <span className="text-xs text-gray-500">1 week ago</span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function PatientRecordPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mb-4"></div>
          <p className="text-gray-600">Loading patient record...</p>
        </div>
      </div>
    }>
      <PatientRecordContent />
    </Suspense>
  );
}
