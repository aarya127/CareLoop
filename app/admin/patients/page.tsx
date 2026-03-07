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
import { getAllDemoPatients } from '@/lib/demo/sample-data';

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

  const openPatientRecord = (patientId: string) => {
    router.push(`/patient-record?id=${patientId}`);
  };

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
                  <tr
                    key={patient.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => openPatientRecord(patient.id)}
                  >
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
                          onClick={(e) => {
                            e.stopPropagation();
                            openPatientRecord(patient.id);
                          }}
                          className="p-2 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"
                          title="View Full Dental Record"
                        >
                          <User className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 text-gray-600 hover:bg-green-50 hover:text-green-600 rounded-lg transition-colors"
                          title="View Calendar"
                        >
                          <Calendar className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                          title="Call Patient"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => e.stopPropagation()}
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
    </div>
  );
}
