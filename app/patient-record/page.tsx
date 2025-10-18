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
import { getDentalRecordById } from '@/lib/data/mock-dental-records';
import type { PatientProfile } from '@/lib/types/dental-record';

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
              className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm"
            >
              <div className="text-center py-16">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Medical & Dental History
                </h3>
                <p className="text-gray-600">
                  Coming soon: Allergies, medications, conditions, and treatment timeline
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'charting' && (
            <motion.div
              key="charting"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm"
            >
              <div className="text-center py-16">
                <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Clinical Charting</h3>
                <p className="text-gray-600">
                  Coming soon: Interactive 32-tooth chart with color-coded conditions
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'radiographs' && (
            <motion.div
              key="radiographs"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm"
            >
              <div className="text-center py-16">
                <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  X-Rays & Diagnostic Files
                </h3>
                <p className="text-gray-600">
                  Coming soon: X-ray viewer with AI analysis and comparison mode
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'periodontal' && (
            <motion.div
              key="periodontal"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm"
            >
              <div className="text-center py-16">
                <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Periodontal Records
                </h3>
                <p className="text-gray-600">
                  Coming soon: Gum health metrics, pocket depths, and trend charts
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'documents' && (
            <motion.div
              key="documents"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm"
            >
              <div className="text-center py-16">
                <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Administrative Documents
                </h3>
                <p className="text-gray-600">
                  Coming soon: Consents, treatment plans, invoices, and insurance claims
                </p>
              </div>
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
