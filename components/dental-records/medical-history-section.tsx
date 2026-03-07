'use client';

/**
 * Medical & Dental History Section
 * Comprehensive patient medical history with allergies, medications,
 * systemic conditions, surgeries, lifestyle factors, and dental history
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Pill,
  Heart,
  Scissors,
  Activity,
  Users,
  Calendar,
  FileText,
  Edit2,
  Plus,
  X,
  CheckCircle2,
  Clock,
  Cigarette,
  Wine,
  Utensils,
} from 'lucide-react';
import type { MedicalHistory } from '@/lib/types/dental-record';

interface MedicalHistorySectionProps {
  patientId: string;
  medicalHistory: MedicalHistory;
  onUpdate?: (updates: Partial<MedicalHistory>) => void;
}

export default function MedicalHistorySection({
  patientId,
  medicalHistory,
  onUpdate,
}: MedicalHistorySectionProps) {
  const [editMode, setEditMode] = useState<string | null>(null);

  // Severity colors
  const severityColors = {
    mild: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    moderate: 'bg-orange-100 text-orange-800 border-orange-300',
    severe: 'bg-red-100 text-red-800 border-red-300',
    life_threatening: 'bg-red-200 text-red-900 border-red-500',
  };

  // Status colors
  const statusColors = {
    active: 'bg-red-100 text-red-800',
    controlled: 'bg-blue-100 text-blue-800',
    resolved: 'bg-green-100 text-green-800',
  };

  return (
    <div className="space-y-6">
      {/* Emergency Medical Alert */}
      {(medicalHistory.allergies.some(a => a.severity === 'life_threatening') ||
        medicalHistory.systemic_conditions.some(c => c.severity === 'severe')) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border-2 border-red-300 rounded-xl p-4"
        >
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-bold text-red-900 mb-2">
                ⚠️ Medical Alert
              </h3>
              <ul className="space-y-1 text-sm text-red-800">
                {medicalHistory.allergies
                  .filter(a => a.severity === 'life_threatening')
                  .map(allergy => (
                    <li key={allergy.id} className="font-semibold">
                      • Severe allergy to {allergy.allergen} - {allergy.reaction}
                    </li>
                  ))}
                {medicalHistory.systemic_conditions
                  .filter(c => c.severity === 'severe')
                  .map(condition => (
                    <li key={condition.id} className="font-semibold">
                      • Severe {condition.condition}
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* Allergies Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Allergies</h3>
              <p className="text-sm text-gray-500">
                {medicalHistory.allergies.length} documented
              </p>
            </div>
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>

        {medicalHistory.allergies.length > 0 ? (
          <div className="space-y-3">
            {medicalHistory.allergies.map(allergy => (
              <motion.div
                key={allergy.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-4 rounded-lg border-2 ${severityColors[allergy.severity]}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-bold text-base">{allergy.allergen}</h4>
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-white/50">
                        {allergy.severity.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm mb-2">
                      <span className="font-medium">Reaction:</span> {allergy.reaction}
                    </p>
                    {allergy.notes && (
                      <p className="text-sm mb-2">
                        <span className="font-medium">Notes:</span> {allergy.notes}
                      </p>
                    )}
                    <p className="text-xs opacity-75">
                      Identified: {new Date(allergy.date_identified).toLocaleDateString()}
                    </p>
                  </div>
                  <button className="p-2 hover:bg-white/30 rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
            <p>No known allergies</p>
          </div>
        )}
      </div>

      {/* Current Medications */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Pill className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Current Medications</h3>
              <p className="text-sm text-gray-500">
                {medicalHistory.current_medications.length} active prescriptions
              </p>
            </div>
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>

        {medicalHistory.current_medications.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {medicalHistory.current_medications.map(medication => (
              <motion.div
                key={medication.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors bg-gradient-to-br from-white to-blue-50"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-gray-900">{medication.name}</h4>
                    <p className="text-sm text-gray-600">{medication.dosage}</p>
                  </div>
                  <button className="p-1.5 hover:bg-blue-100 rounded transition-colors">
                    <Edit2 className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
                
                <div className="space-y-1 text-sm text-gray-700">
                  <p>
                    <span className="font-medium">Frequency:</span> {medication.frequency}
                  </p>
                  <p>
                    <span className="font-medium">Purpose:</span> {medication.purpose}
                  </p>
                  {medication.prescribing_doctor && (
                    <p>
                      <span className="font-medium">Doctor:</span> {medication.prescribing_doctor}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Started: {new Date(medication.start_date).toLocaleDateString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Pill className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No current medications</p>
          </div>
        )}
      </div>

      {/* Systemic Conditions */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Heart className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Systemic Conditions</h3>
              <p className="text-sm text-gray-500">
                {medicalHistory.systemic_conditions.length} conditions
              </p>
            </div>
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>

        {medicalHistory.systemic_conditions.length > 0 ? (
          <div className="space-y-3">
            {medicalHistory.systemic_conditions.map(condition => (
              <motion.div
                key={condition.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-bold text-gray-900 capitalize">
                        {condition.condition}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[condition.status]}`}>
                        {condition.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        condition.severity === 'severe' ? 'bg-red-100 text-red-800' :
                        condition.severity === 'moderate' ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {condition.severity}
                      </span>
                    </div>
                    
                    {condition.treatment && (
                      <p className="text-sm text-gray-700 mb-1">
                        <span className="font-medium">Treatment:</span> {condition.treatment}
                      </p>
                    )}
                    {condition.notes && (
                      <p className="text-sm text-gray-600 mb-2">{condition.notes}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Diagnosed: {new Date(condition.diagnosed_date).toLocaleDateString()}
                    </p>
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
            <p>No systemic conditions</p>
          </div>
        )}
      </div>

      {/* Past Surgeries */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Scissors className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Past Surgeries</h3>
              <p className="text-sm text-gray-500">
                {medicalHistory.past_surgeries.length} procedures
              </p>
            </div>
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>

        {medicalHistory.past_surgeries.length > 0 ? (
          <div className="space-y-3">
            {medicalHistory.past_surgeries.map(surgery => (
              <motion.div
                key={surgery.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-2">{surgery.procedure}</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 mb-2">
                      <p>
                        <span className="font-medium">Date:</span>{' '}
                        {new Date(surgery.date).toLocaleDateString()}
                      </p>
                      {surgery.hospital && (
                        <p>
                          <span className="font-medium">Hospital:</span> {surgery.hospital}
                        </p>
                      )}
                      {surgery.surgeon && (
                        <p>
                          <span className="font-medium">Surgeon:</span> {surgery.surgeon}
                        </p>
                      )}
                      {surgery.dental_implants && (
                        <p className="text-blue-700 font-medium">
                          ✓ Dental implants involved
                        </p>
                      )}
                    </div>
                    {surgery.complications && (
                      <p className="text-sm text-orange-700 bg-orange-50 p-2 rounded">
                        <span className="font-medium">Complications:</span> {surgery.complications}
                      </p>
                    )}
                    {surgery.notes && (
                      <p className="text-sm text-gray-600 mt-2">{surgery.notes}</p>
                    )}
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Scissors className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No past surgeries</p>
          </div>
        )}
      </div>

      {/* Lifestyle Factors */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Activity className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Lifestyle Factors</h3>
              <p className="text-sm text-gray-500">Habits & wellness</p>
            </div>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Edit2 className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Smoking */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-gray-50 to-white border border-gray-200">
            <div className="flex items-center space-x-3 mb-3">
              <Cigarette className="w-5 h-5 text-gray-600" />
              <h4 className="font-semibold text-gray-900">Smoking</h4>
            </div>
            <p className="text-sm text-gray-700 capitalize mb-2">
              <span className="font-medium">Status:</span>{' '}
              <span className={`px-2 py-0.5 rounded ${
                medicalHistory.lifestyle_factors.smoking.status === 'current' ? 'bg-red-100 text-red-800' :
                medicalHistory.lifestyle_factors.smoking.status === 'former' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {medicalHistory.lifestyle_factors.smoking.status}
              </span>
            </p>
            {medicalHistory.lifestyle_factors.smoking.status !== 'never' && (
              <>
                {medicalHistory.lifestyle_factors.smoking.packs_per_day && (
                  <p className="text-sm text-gray-600">
                    {medicalHistory.lifestyle_factors.smoking.packs_per_day} packs/day
                  </p>
                )}
                {medicalHistory.lifestyle_factors.smoking.years && (
                  <p className="text-sm text-gray-600">
                    {medicalHistory.lifestyle_factors.smoking.years} years
                  </p>
                )}
                {medicalHistory.lifestyle_factors.smoking.quit_date && (
                  <p className="text-sm text-green-700">
                    Quit: {new Date(medicalHistory.lifestyle_factors.smoking.quit_date).toLocaleDateString()}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Alcohol */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-gray-50 to-white border border-gray-200">
            <div className="flex items-center space-x-3 mb-3">
              <Wine className="w-5 h-5 text-gray-600" />
              <h4 className="font-semibold text-gray-900">Alcohol</h4>
            </div>
            <p className="text-sm text-gray-700 capitalize mb-2">
              <span className="font-medium">Frequency:</span>{' '}
              <span className={`px-2 py-0.5 rounded ${
                medicalHistory.lifestyle_factors.alcohol.frequency === 'heavy' ? 'bg-red-100 text-red-800' :
                medicalHistory.lifestyle_factors.alcohol.frequency === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                medicalHistory.lifestyle_factors.alcohol.frequency === 'occasional' ? 'bg-blue-100 text-blue-800' :
                'bg-green-100 text-green-800'
              }`}>
                {medicalHistory.lifestyle_factors.alcohol.frequency}
              </span>
            </p>
            {medicalHistory.lifestyle_factors.alcohol.drinks_per_week && (
              <p className="text-sm text-gray-600">
                {medicalHistory.lifestyle_factors.alcohol.drinks_per_week} drinks/week
              </p>
            )}
          </div>

          {/* Diet */}
          {medicalHistory.lifestyle_factors.diet_notes && (
            <div className="p-4 rounded-lg bg-gradient-to-br from-gray-50 to-white border border-gray-200">
              <div className="flex items-center space-x-3 mb-3">
                <Utensils className="w-5 h-5 text-gray-600" />
                <h4 className="font-semibold text-gray-900">Diet</h4>
              </div>
              <p className="text-sm text-gray-700">
                {medicalHistory.lifestyle_factors.diet_notes}
              </p>
            </div>
          )}

          {/* Exercise */}
          {medicalHistory.lifestyle_factors.exercise_frequency && (
            <div className="p-4 rounded-lg bg-gradient-to-br from-gray-50 to-white border border-gray-200">
              <div className="flex items-center space-x-3 mb-3">
                <Activity className="w-5 h-5 text-gray-600" />
                <h4 className="font-semibold text-gray-900">Exercise</h4>
              </div>
              <p className="text-sm text-gray-700">
                {medicalHistory.lifestyle_factors.exercise_frequency}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Family Health History */}
      {medicalHistory.family_health_history.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Family Health History</h3>
                <p className="text-sm text-gray-500">Hereditary conditions</p>
              </div>
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {medicalHistory.family_health_history.map(family => (
              <motion.div
                key={family.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-lg border border-gray-200 bg-gradient-to-br from-teal-50 to-white"
              >
                <h4 className="font-semibold text-gray-900 capitalize mb-2">
                  {family.relation}
                </h4>
                <ul className="space-y-1 text-sm text-gray-700">
                  {family.conditions.map((condition, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-teal-600 mr-2">•</span>
                      <span className="capitalize">{condition}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Dental History */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Dental History</h3>
              <p className="text-sm text-gray-500">Past dental care & treatments</p>
            </div>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Edit2 className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="p-4 rounded-lg bg-sky-50 border border-sky-200">
            <p className="text-sm font-medium text-gray-700 mb-1">Last Cleaning</p>
            <p className="text-lg font-bold text-gray-900">
              {medicalHistory.dental_history.last_cleaning_date
                ? new Date(medicalHistory.dental_history.last_cleaning_date).toLocaleDateString()
                : 'Not recorded'}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-sky-50 border border-sky-200">
            <p className="text-sm font-medium text-gray-700 mb-1">Last Exam</p>
            <p className="text-lg font-bold text-gray-900">
              {medicalHistory.dental_history.last_exam_date
                ? new Date(medicalHistory.dental_history.last_exam_date).toLocaleDateString()
                : 'Not recorded'}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-sky-50 border border-sky-200">
            <p className="text-sm font-medium text-gray-700 mb-1">Dental Anxiety</p>
            <p className={`text-lg font-bold ${
              medicalHistory.dental_history.dental_anxiety_level === 'severe' ? 'text-red-600' :
              medicalHistory.dental_history.dental_anxiety_level === 'moderate' ? 'text-orange-600' :
              medicalHistory.dental_history.dental_anxiety_level === 'mild' ? 'text-yellow-600' :
              'text-green-600'
            }`}>
              {medicalHistory.dental_history.dental_anxiety_level.charAt(0).toUpperCase() +
                medicalHistory.dental_history.dental_anxiety_level.slice(1)}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-sky-50 border border-sky-200">
            <p className="text-sm font-medium text-gray-700 mb-1">Previous Treatments</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {medicalHistory.dental_history.previous_orthodontics && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                  Orthodontics
                </span>
              )}
              {medicalHistory.dental_history.previous_implants && (
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                  Implants
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Treatment History Timeline */}
        {medicalHistory.dental_history.treatment_history_summary.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="w-4 h-4 mr-2 text-sky-600" />
              Treatment Timeline
            </h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {medicalHistory.dental_history.treatment_history_summary
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map(treatment => (
                  <motion.div
                    key={treatment.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start space-x-4 p-3 rounded-lg border border-gray-200 hover:border-sky-300 transition-colors"
                  >
                    <div className="w-2 h-2 bg-sky-500 rounded-full mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h5 className="font-semibold text-gray-900">{treatment.procedure}</h5>
                        <span className="text-sm text-gray-500 flex-shrink-0 ml-2">
                          {new Date(treatment.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        Dr. {treatment.dentist_name}
                      </p>
                      {treatment.teeth_involved.length > 0 && (
                        <p className="text-sm text-gray-600 mb-1">
                          Teeth: {treatment.teeth_involved.join(', ')}
                        </p>
                      )}
                      {treatment.cost && (
                        <p className="text-sm text-gray-600">
                          Cost: ${treatment.cost.toFixed(2)}
                          {treatment.insurance_covered && (
                            <span className="text-green-600 ml-2">
                              (${treatment.insurance_covered.toFixed(2)} covered)
                            </span>
                          )}
                        </p>
                      )}
                      {treatment.notes && (
                        <p className="text-sm text-gray-500 mt-2 italic">{treatment.notes}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
