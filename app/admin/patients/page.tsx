'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Filter,
  Download,
  Plus,
  Phone,
  MessageSquare,
  Calendar,
  User,
  AlertCircle,
  Pill,
  DollarSign,
  ChevronDown,
  X,
} from 'lucide-react';
import { getAllDemoPatients, DemoPatient } from '@/lib/demo/sample-data';

type SortField = 'name' | 'age' | 'nextAppointment' | 'lastVisit';
type SortDirection = 'asc' | 'desc';

interface FilterState {
  hasAllergies: boolean;
  requiresPreMed: boolean;
  hasBalance: boolean;
  doctors: string[];
}

export default function AdminPatientsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filters, setFilters] = useState<FilterState>({
    hasAllergies: false,
    requiresPreMed: false,
    hasBalance: false,
    doctors: [],
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<DemoPatient | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'dental' | 'gum'>('overview');

  const allPatients = getAllDemoPatients();

  // Get unique doctors for filter
  const uniqueDoctors = Array.from(new Set(allPatients.map((p) => p.primary_doctor_name)));

  // Filter and sort patients
  const filteredAndSortedPatients = useMemo(() => {
    let result = allPatients.filter((patient) => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        patient.first_name.toLowerCase().includes(searchLower) ||
        patient.last_name.toLowerCase().includes(searchLower) ||
        patient.email.toLowerCase().includes(searchLower) ||
        patient.phone.includes(searchTerm);

      if (!matchesSearch) return false;

      // Flag filters
      if (filters.hasAllergies && !patient.has_allergies) return false;
      if (filters.requiresPreMed && !patient.requires_pre_medication) return false;
      if (filters.hasBalance && !patient.has_outstanding_balance) return false;

      // Doctor filter
      if (filters.doctors.length > 0 && !filters.doctors.includes(patient.primary_doctor_name)) {
        return false;
      }

      return true;
    });

    // Sort
    result.sort((a, b) => {
      let compareValue = 0;

      switch (sortField) {
        case 'name':
          compareValue = `${a.first_name} ${a.last_name}`.localeCompare(
            `${b.first_name} ${b.last_name}`
          );
          break;
        case 'age':
          compareValue = a.age - b.age;
          break;
        case 'nextAppointment':
          const aNext = a.next_appointment_date || '9999-12-31';
          const bNext = b.next_appointment_date || '9999-12-31';
          compareValue = aNext.localeCompare(bNext);
          break;
        case 'lastVisit':
          const aLast = a.last_visit_date || '0000-00-00';
          const bLast = b.last_visit_date || '0000-00-00';
          compareValue = aLast.localeCompare(bLast);
          break;
      }

      return sortDirection === 'asc' ? compareValue : -compareValue;
    });

    return result;
  }, [allPatients, searchTerm, sortField, sortDirection, filters]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleDoctorFilter = (doctor: string) => {
    setFilters((prev) => ({
      ...prev,
      doctors: prev.doctors.includes(doctor)
        ? prev.doctors.filter((d) => d !== doctor)
        : [...prev.doctors, doctor],
    }));
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const hasActiveFilters =
    filters.hasAllergies ||
    filters.requiresPreMed ||
    filters.hasBalance ||
    filters.doctors.length > 0;

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Patient List</h1>
            <p className="text-gray-600 mt-2">
              Showing {filteredAndSortedPatients.length} of {allPatients.length} patients
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              <Plus className="w-4 h-4" />
              <span>Add Patient</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors ${
                showFilters || hasActiveFilters
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="ml-1 px-2 py-0.5 bg-indigo-600 text-white text-xs rounded-full">
                  {Object.values(filters).flat().filter(Boolean).length}
                </span>
              )}
            </button>
          </div>
          {/* Sort */}
          <select
            value={`${sortField}-${sortDirection}`}
            onChange={(e) => {
              const [field, direction] = e.target.value.split('-') as [
                SortField,
                SortDirection
              ];
              setSortField(field);
              setSortDirection(direction);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="age-asc">Age (Low-High)</option>
            <option value="age-desc">Age (High-Low)</option>
            <option value="nextAppointment-asc">Next Appointment (Soon)</option>
            <option value="nextAppointment-desc">Next Appointment (Later)</option>
            <option value="lastVisit-asc">Last Visit (Oldest)</option>
            <option value="lastVisit-desc">Last Visit (Recent)</option>
          </select>
        </div>

        {/* Patient Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Primary Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Flags
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Next Appointment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Visit
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                    {/* Patient Info */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium">
                          {patient.first_name.charAt(0)}
                          {patient.last_name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {patient.first_name} {patient.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {patient.age} years • DOB: {formatDate(patient.date_of_birth)}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{patient.phone}</div>
                      <div className="text-sm text-gray-500">{patient.email}</div>
                    </td>

                    {/* Primary Doctor */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{patient.primary_doctor_name}</div>
                    </td>

                    {/* Flags */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {patient.has_allergies && (
                          <div
                            className="p-1.5 bg-yellow-100 rounded-lg"
                            title="Has Allergies"
                          >
                            <AlertCircle className="w-4 h-4 text-yellow-600" />
                          </div>
                        )}
                        {patient.requires_pre_medication && (
                          <div
                            className="p-1.5 bg-purple-100 rounded-lg"
                            title="Requires Pre-Medication"
                          >
                            <Pill className="w-4 h-4 text-purple-600" />
                          </div>
                        )}
                        {patient.has_outstanding_balance && (
                          <div
                            className="p-1.5 bg-red-100 rounded-lg"
                            title="Outstanding Balance"
                          >
                            <DollarSign className="w-4 h-4 text-red-600" />
                          </div>
                        )}
                        {!patient.has_allergies &&
                          !patient.requires_pre_medication &&
                          !patient.has_outstanding_balance && (
                            <span className="text-sm text-gray-400">None</span>
                          )}
                      </div>
                    </td>

                    {/* Next Appointment */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(patient.next_appointment_date)}
                      </div>
                    </td>

                    {/* Last Visit */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(patient.last_visit_date)}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => router.push(`/patient-record?id=${patient.id}`)}
                          className="p-2 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"
                          title="View Full Dental Record"
                        >
                          <User className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-gray-600 hover:bg-green-50 hover:text-green-600 rounded-lg transition-colors"
                          title="View Calendar"
                        >
                          <Calendar className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                          title="Call Patient"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-gray-600 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors"
                          title="Send Message"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredAndSortedPatients.length === 0 && (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No patients found</p>
              <p className="text-gray-500 text-sm mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-indigo-600 font-bold text-2xl">
                  {selectedPatient.first_name.charAt(0)}
                  {selectedPatient.last_name.charAt(0)}
                </div>
                <div className="text-white">
                  <h2 className="text-2xl font-bold">
                    {selectedPatient.first_name} {selectedPatient.last_name}
                  </h2>
                  <p className="text-indigo-100">
                    {selectedPatient.age} years • DOB: {formatDate(selectedPatient.date_of_birth)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="px-6 border-b border-gray-200 bg-gray-50">
              <div className="flex space-x-1">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-3 font-medium transition-colors ${
                    activeTab === 'overview'
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-4 py-3 font-medium transition-colors ${
                    activeTab === 'history'
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Visit History
                </button>
                <button
                  onClick={() => setActiveTab('dental')}
                  className={`px-4 py-3 font-medium transition-colors ${
                    activeTab === 'dental'
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Dental Records
                </button>
                <button
                  onClick={() => setActiveTab('gum')}
                  className={`px-4 py-3 font-medium transition-colors ${
                    activeTab === 'gum'
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Gum Records
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Contact Information */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="text-gray-900 font-medium">{selectedPatient.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="text-gray-900 font-medium">{selectedPatient.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="text-gray-900 font-medium">{selectedPatient.address}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Emergency Contact</p>
                        <p className="text-gray-900 font-medium">Available on file</p>
                      </div>
                    </div>
                  </div>

                  {/* Medical Information */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Medical Information</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Primary Doctor</p>
                        <p className="text-gray-900 font-medium">{selectedPatient.primary_doctor_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Insurance Provider</p>
                        <p className="text-gray-900 font-medium">On file</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Allergies</p>
                        {selectedPatient.has_allergies ? (
                          <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                              See medical records
                            </span>
                          </div>
                        ) : (
                          <p className="text-gray-600">No known allergies</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Medical Conditions</p>
                        <p className="text-gray-600">See medical records for details</p>
                      </div>
                      {selectedPatient.requires_pre_medication && (
                        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <Pill className="w-5 h-5 text-purple-600 mt-0.5" />
                            <div>
                              <p className="font-medium text-purple-900">Pre-medication Required</p>
                              <p className="text-sm text-purple-700">Patient requires pre-medication before procedures</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Appointment Information */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointment Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Next Appointment</p>
                        <p className="text-gray-900 font-medium">
                          {formatDate(selectedPatient.next_appointment_date)}
                        </p>
                        <p className="text-sm text-gray-600">Checkup</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Last Visit</p>
                        <p className="text-gray-900 font-medium">
                          {formatDate(selectedPatient.last_visit_date)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Billing Information */}
                  {selectedPatient.has_outstanding_balance && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                      <div className="flex items-start space-x-3">
                        <DollarSign className="w-6 h-6 text-red-600 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-red-900 mb-2">Outstanding Balance</h3>
                          <p className="text-red-700">
                            This patient has an outstanding balance that requires attention.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Visit History</h3>
                  {/* Sample visit history */}
                  {[
                    {
                      date: '2025-09-15',
                      type: 'Regular Checkup',
                      doctor: selectedPatient.primary_doctor_name,
                      notes: 'Routine cleaning and examination. No issues found.',
                    },
                    {
                      date: '2025-06-20',
                      type: 'Cavity Filling',
                      doctor: selectedPatient.primary_doctor_name,
                      notes: 'Filled cavity in tooth #14. Patient tolerated procedure well.',
                    },
                    {
                      date: '2025-03-10',
                      type: 'Regular Checkup',
                      doctor: selectedPatient.primary_doctor_name,
                      notes: 'Routine cleaning. Recommended fluoride treatment.',
                    },
                  ].map((visit, idx) => (
                    <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Calendar className="w-4 h-4 text-indigo-600" />
                            <p className="font-semibold text-gray-900">{formatDate(visit.date)}</p>
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                              {visit.type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">Doctor: {visit.doctor}</p>
                          <p className="text-sm text-gray-700">{visit.notes}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'dental' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Dental Records</h3>
                  
                  {/* Dental Chart */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Tooth Chart</h4>
                    <div className="grid grid-cols-8 gap-2">
                      {Array.from({ length: 32 }, (_, i) => i + 1).map((tooth) => (
                        <div
                          key={tooth}
                          className="aspect-square border-2 border-gray-300 rounded-lg flex items-center justify-center text-sm font-medium hover:border-indigo-500 cursor-pointer transition-colors"
                        >
                          {tooth}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-4">
                      Click on a tooth to view or add notes
                    </p>
                  </div>

                  {/* Dental History */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Treatment History</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <div>
                          <p className="font-medium text-gray-900">Tooth #14 - Cavity Filling</p>
                          <p className="text-sm text-gray-600">June 20, 2025</p>
                        </div>
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Completed</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <div>
                          <p className="font-medium text-gray-900">Tooth #3 - Crown Placement</p>
                          <p className="text-sm text-gray-600">March 15, 2024</p>
                        </div>
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Completed</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'gum' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Periodontal Records</h3>
                  
                  {/* Gum Health Status */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Gum Health Status</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">Good</p>
                        <p className="text-sm text-gray-600 mt-1">Overall Health</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">2-3mm</p>
                        <p className="text-sm text-gray-600 mt-1">Avg Pocket Depth</p>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <p className="text-2xl font-bold text-yellow-600">Mild</p>
                        <p className="text-sm text-gray-600 mt-1">Bleeding Score</p>
                      </div>
                    </div>
                  </div>

                  {/* Pocket Depth Chart */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Pocket Depth Measurements</h4>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Upper Jaw</p>
                        <div className="h-20 bg-gray-50 rounded flex items-end justify-around p-2">
                          {[2, 3, 2, 3, 2, 2, 3, 2].map((depth, idx) => (
                            <div key={idx} className="flex flex-col items-center">
                              <div
                                className={`w-6 rounded-t ${
                                  depth <= 3 ? 'bg-green-400' : depth <= 5 ? 'bg-yellow-400' : 'bg-red-400'
                                }`}
                                style={{ height: `${depth * 8}px` }}
                              />
                              <span className="text-xs text-gray-600 mt-1">{depth}mm</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Lower Jaw</p>
                        <div className="h-20 bg-gray-50 rounded flex items-end justify-around p-2">
                          {[2, 2, 3, 2, 3, 2, 2, 3].map((depth, idx) => (
                            <div key={idx} className="flex flex-col items-center">
                              <div
                                className={`w-6 rounded-t ${
                                  depth <= 3 ? 'bg-green-400' : depth <= 5 ? 'bg-yellow-400' : 'bg-red-400'
                                }`}
                                style={{ height: `${depth * 8}px` }}
                              />
                              <span className="text-xs text-gray-600 mt-1">{depth}mm</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-gray-600 mt-4">
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 bg-green-400 rounded" />
                          <span>Healthy (1-3mm)</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 bg-yellow-400 rounded" />
                          <span>Mild (4-5mm)</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 bg-red-400 rounded" />
                          <span>Severe (6mm+)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Treatment Recommendations */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Recommendations</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Continue regular brushing and flossing routine</li>
                      <li>• Schedule cleaning every 6 months</li>
                      <li>• Monitor areas with 3mm pockets</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                  Schedule Appointment
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
                  Send Message
                </button>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
