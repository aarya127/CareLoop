'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Grid3x3, List, ChevronDown, User, X } from 'lucide-react';
import { PatientCard, PatientCardSkeleton } from '@/components/patients/patient-card';
import { PatientDetailsPanel } from '@/components/patients/patient-details-panel';
import TopNavigation from '@/components/shared/top-navigation';
import { mockPatients } from '@/lib/data/mock-patients';
import { mockAppointments } from '@/lib/data/mock-appointments';
import { Patient, ViewMode, SortOption } from '@/lib/types/patient';
import type { Appointment } from '@/lib/types/appointment';
import { cn } from '@/lib/utils';

export function PatientsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('last-visit');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get patient's next appointment
  const getPatientNextAppointment = (patientId: string): Appointment | undefined => {
    const now = new Date();
    const upcomingAppointments = mockAppointments
      .filter(apt => apt.patientId === patientId && new Date(apt.startTime) > now && apt.status === 'scheduled')
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    return upcomingAppointments[0];
  };

  // Get count of upcoming appointments for a patient
  const getUpcomingAppointmentsCount = (patientId: string): number => {
    const now = new Date();
    return mockAppointments.filter(
      apt => apt.patientId === patientId && new Date(apt.startTime) > now && apt.status === 'scheduled'
    ).length;
  };

  // Filter and sort patients
  const filteredPatients = mockPatients.filter((patient) => {
    const query = searchQuery.toLowerCase();
    return (
      patient.firstName.toLowerCase().includes(query) ||
      patient.lastName.toLowerCase().includes(query) ||
      patient.phone.includes(query) ||
      patient.insurance.provider.toLowerCase().includes(query)
    );
  });

  const sortedPatients = [...filteredPatients].sort((a, b) => {
    switch (sortBy) {
      case 'name-asc':
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      case 'spend-desc':
        return b.billing.lifetimeSpend - a.billing.lifetimeSpend;
      case 'balance-desc':
        return b.billing.outstandingBalance - a.billing.outstandingBalance;
      case 'last-visit':
      default:
        const aDate = a.visits[0]?.date || '1900-01-01';
        const bDate = b.visits[0]?.date || '1900-01-01';
        return bDate.localeCompare(aDate);
    }
  });

  const sortOptions = [
    { value: 'last-visit' as SortOption, label: 'Last Visit ↓' },
    { value: 'name-asc' as SortOption, label: 'Name A–Z' },
    { value: 'spend-desc' as SortOption, label: 'Lifetime Spend ↓' },
    { value: 'balance-desc' as SortOption, label: 'Outstanding Balance ↓' },
  ];

  const handleLogoClick = () => {
    setSearchQuery('');
    setSelectedPatient(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation */}
      <TopNavigation />

      {/* Main Content Container */}
      <div className="max-w-[1920px] mx-auto px-6 pt-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Clientele List</h1>
          <p className="text-lg text-gray-600">
            {sortedPatients.length} {sortedPatients.length === 1 ? 'patient' : 'patients'}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-12"
        >
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868B]" />
              <input
                type="text"
                placeholder="🔍 Search by Name, Phone, or Insurance Provider…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-12 py-5 bg-[#F5F5F7] border-2 border-transparent rounded-2xl text-base text-[#1D1D1F] placeholder:text-[#86868B] focus:bg-white focus:border-[#0A84FF] focus:shadow-[0_8px_24px_rgba(10,132,255,0.12)] transition-all outline-none"
                aria-label="Search patients by name, phone, or insurance"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#E5E5E7] transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Controls Bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-6">
            <p className="text-sm text-[#86868B]">
              {sortedPatients.length} patient{sortedPatients.length !== 1 ? 's' : ''}
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="h-11 pl-4 pr-10 rounded-xl bg-white hover:bg-[#F5F5F7] text-sm font-medium text-[#1D1D1F] border border-[#E5E5E7] cursor-pointer appearance-none transition-colors focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/20"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B] pointer-events-none" />
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2 p-1 bg-[#F5F5F7] rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center transition-all',
                  viewMode === 'grid'
                    ? 'bg-[#0A84FF] text-white shadow-sm'
                    : 'text-[#86868B] hover:text-[#1D1D1F]'
                )}
                aria-label="Grid view"
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center transition-all',
                  viewMode === 'list'
                    ? 'bg-[#0A84FF] text-white shadow-sm'
                    : 'text-[#86868B] hover:text-[#1D1D1F]'
                )}
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Patient Cards Grid/List */}
        {isLoading ? (
          <div className={cn(
            'grid gap-6',
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          )}>
            {[...Array(6)].map((_, i) => (
              <PatientCardSkeleton key={i} viewMode={viewMode} />
            ))}
          </div>
        ) : sortedPatients.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24"
          >
            <div className="w-48 h-48 rounded-full bg-[#0A84FF]/5 flex items-center justify-center mb-6">
              <Search className="w-24 h-24 text-[#0A84FF]/20" />
            </div>
            <h2 className="text-2xl font-semibold text-[#1D1D1F] mb-2">No patients found</h2>
            <p className="text-[#86868B] mb-6">Try adjusting your search or filters.</p>
            <button
              onClick={() => setSearchQuery('')}
              className="px-6 py-3 bg-[#0A84FF] hover:bg-[#0077ED] text-white rounded-xl font-medium transition-colors"
            >
              Clear Search
            </button>
          </motion.div>
        ) : (
          <motion.div
            layout
            className={cn(
              'grid gap-6',
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
            )}
          >
            {sortedPatients.map((patient) => (
              <PatientCard
                key={patient.id}
                patient={patient}
                viewMode={viewMode}
                isSelected={selectedPatient?.id === patient.id}
                onClick={() => setSelectedPatient(patient)}
                nextAppointment={getPatientNextAppointment(patient.id)}
                upcomingAppointmentsCount={getUpcomingAppointmentsCount(patient.id)}
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* Details Panel */}
      <AnimatePresence>
        {selectedPatient && (
          <PatientDetailsPanel
            patient={selectedPatient}
            onClose={() => setSelectedPatient(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
