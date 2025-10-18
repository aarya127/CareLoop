'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, UserPlus, AlertCircle, Pill, DollarSign } from 'lucide-react';
import { getAllDemoPatients, type DemoPatient } from '@/lib/demo/sample-data';

export default function PatientsPage() {
  const [patients, setPatients] = useState<DemoPatient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDoctor, setFilterDoctor] = useState<string>('all');

  useEffect(() => {
    // Load demo patients
    setPatients(getAllDemoPatients());
  }, []);

  // Filter patients based on search and doctor filter
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = 
      patient.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.phone.includes(searchQuery);

    const matchesDoctor = 
      filterDoctor === 'all' || 
      patient.primary_doctor_id === filterDoctor;

    return matchesSearch && matchesDoctor;
  });

  // Get unique doctors for filter
  const doctors = Array.from(new Set(patients.map(p => p.primary_doctor_name)))
    .map(name => {
      const patient = patients.find(p => p.primary_doctor_name === name);
      return {
        id: patient?.primary_doctor_id || '',
        name,
      };
    });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
              <p className="text-gray-600 mt-1">
                Manage your patient records and appointments
              </p>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Add Patient
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search patients by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterDoctor}
              onChange={(e) => setFilterDoctor(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Doctors</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Patient List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700">
            <div className="col-span-3">Patient</div>
            <div className="col-span-2">Contact</div>
            <div className="col-span-2">Primary Doctor</div>
            <div className="col-span-2">Next Appointment</div>
            <div className="col-span-2">Last Visit</div>
            <div className="col-span-1">Flags</div>
          </div>

          {filteredPatients.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No patients found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredPatients.map((patient) => (
                <PatientRow key={patient.id} patient={patient} />
              ))}
            </div>
          )}
        </div>

        {/* Stats Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          Showing {filteredPatients.length} of {patients.length} patients
        </div>
      </div>
    </div>
  );
}

function PatientRow({ patient }: { patient: DemoPatient }) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer">
      {/* Patient Info */}
      <div className="col-span-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
          {patient.first_name[0]}{patient.last_name[0]}
        </div>
        <div>
          <div className="font-medium text-gray-900">
            {patient.first_name} {patient.last_name}
          </div>
          <div className="text-sm text-gray-500">
            Age {patient.age}
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="col-span-2">
        <div className="text-sm text-gray-900">{patient.phone}</div>
        <div className="text-sm text-gray-500 truncate">{patient.email}</div>
      </div>

      {/* Primary Doctor */}
      <div className="col-span-2">
        <div className="text-sm text-gray-900">{patient.primary_doctor_name}</div>
      </div>

      {/* Next Appointment */}
      <div className="col-span-2">
        <div className="text-sm text-gray-900">
          {formatDate(patient.next_appointment_date)}
        </div>
      </div>

      {/* Last Visit */}
      <div className="col-span-2">
        <div className="text-sm text-gray-500">
          {formatDate(patient.last_visit_date)}
        </div>
      </div>

      {/* Flags */}
      <div className="col-span-1 flex gap-1">
        {patient.has_allergies && (
          <div className="w-6 h-6 rounded bg-yellow-100 text-yellow-700 flex items-center justify-center" title="Has allergies">
            <AlertCircle className="w-4 h-4" />
          </div>
        )}
        {patient.requires_pre_medication && (
          <div className="w-6 h-6 rounded bg-purple-100 text-purple-700 flex items-center justify-center" title="Requires pre-medication">
            <Pill className="w-4 h-4" />
          </div>
        )}
        {patient.has_outstanding_balance && (
          <div className="w-6 h-6 rounded bg-red-100 text-red-700 flex items-center justify-center" title="Outstanding balance">
            <DollarSign className="w-4 h-4" />
          </div>
        )}
      </div>
    </div>
  );
}
