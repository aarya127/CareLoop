'use client';

/**
 * Medical & Dental History Section
 * Comprehensive patient medical history with allergies, medications,
 * systemic conditions, surgeries, lifestyle factors, and dental history
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Pill,
  Heart,
  Scissors,
  Activity,
  Users,
  Calendar,
  Edit2,
  Trash2,
  Plus,
  X,
  CheckCircle2,
  Clock,
  Cigarette,
  Wine,
  Utensils,
} from 'lucide-react';
import type {
  AllergyRecord,
  FamilyHistoryEntry,
  MedicationRecord,
  SurgeryRecord,
  SystemicCondition,
  MedicalHistory,
} from '@/lib/types/dental-record';

interface MedicalHistorySectionProps {
  patientId: string;
  medicalHistory: MedicalHistory;
  onUpdate?: (updates: Partial<MedicalHistory>) => void;
}

type EditorType =
  | 'allergy'
  | 'medication'
  | 'condition'
  | 'surgery'
  | 'lifestyle'
  | 'family'
  | 'dental'
  | null;

type UndoEntryType = 'allergy' | 'medication' | 'condition' | 'surgery' | 'family';

type PendingUndoDelete = {
  type: UndoEntryType;
  item: AllergyRecord | MedicationRecord | SystemicCondition | SurgeryRecord | FamilyHistoryEntry;
  index: number;
};

export default function MedicalHistorySection({
  patientId,
  medicalHistory: initialMedicalHistory,
  onUpdate,
}: MedicalHistorySectionProps) {
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory>(initialMedicalHistory);

  useEffect(() => {
    setMedicalHistory(initialMedicalHistory);
  }, [initialMedicalHistory]);

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

  const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}`;
  const [editorType, setEditorType] = useState<EditorType>(null);
  const [editorMode, setEditorMode] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [pendingUndoDelete, setPendingUndoDelete] = useState<PendingUndoDelete | null>(null);
  const [undoTimeoutId, setUndoTimeoutId] = useState<number | null>(null);

  const commitMedicalHistory = (next: MedicalHistory) => {
    setMedicalHistory(next);
    onUpdate?.(next);
  };

  const closeEditor = () => {
    setEditorType(null);
    setEditingId(null);
    setForm({});
    setEditorMode('add');
  };

  useEffect(() => {
    return () => {
      if (undoTimeoutId) {
        window.clearTimeout(undoTimeoutId);
      }
    };
  }, [undoTimeoutId]);

  const openEditor = (
    type: Exclude<EditorType, null>,
    mode: 'add' | 'edit',
    item?: Record<string, unknown>
  ) => {
    setEditorType(type);
    setEditorMode(mode);
    setEditingId(typeof item?.id === 'string' ? item.id : null);

    if (type === 'allergy') {
      setForm({
        allergen: String(item?.allergen ?? ''),
        reaction: String(item?.reaction ?? ''),
        severity: String(item?.severity ?? 'moderate'),
        date_identified: String(item?.date_identified ?? new Date().toISOString().slice(0, 10)),
        notes: String(item?.notes ?? ''),
      });
      return;
    }

    if (type === 'medication') {
      setForm({
        name: String(item?.name ?? ''),
        dosage: String(item?.dosage ?? ''),
        frequency: String(item?.frequency ?? ''),
        purpose: String(item?.purpose ?? ''),
        start_date: String(item?.start_date ?? new Date().toISOString().slice(0, 10)),
        prescribing_doctor: String(item?.prescribing_doctor ?? ''),
      });
      return;
    }

    if (type === 'condition') {
      setForm({
        condition: String(item?.condition ?? ''),
        diagnosed_date: String(item?.diagnosed_date ?? new Date().toISOString().slice(0, 10)),
        status: String(item?.status ?? 'active'),
        severity: String(item?.severity ?? 'mild'),
        treatment: String(item?.treatment ?? ''),
        notes: String(item?.notes ?? ''),
      });
      return;
    }

    if (type === 'surgery') {
      setForm({
        procedure: String(item?.procedure ?? ''),
        date: String(item?.date ?? new Date().toISOString().slice(0, 10)),
        hospital: String(item?.hospital ?? ''),
        surgeon: String(item?.surgeon ?? ''),
      });
      return;
    }

    if (type === 'family') {
      const conditions = Array.isArray(item?.conditions)
        ? (item.conditions as string[]).join(', ')
        : '';
      setForm({
        relation: String(item?.relation ?? ''),
        conditions,
      });
      return;
    }

    if (type === 'lifestyle') {
      setForm({
        smoking_status: medicalHistory.lifestyle_factors.smoking?.status ?? 'never',
        packs_per_day: String(medicalHistory.lifestyle_factors.smoking?.packs_per_day ?? ''),
        years: String(medicalHistory.lifestyle_factors.smoking?.years ?? ''),
        quit_date: medicalHistory.lifestyle_factors.smoking?.quit_date ?? '',
        alcohol_frequency: medicalHistory.lifestyle_factors.alcohol?.frequency ?? 'none',
        drinks_per_week: String(medicalHistory.lifestyle_factors.alcohol?.drinks_per_week ?? ''),
        diet_notes: medicalHistory.lifestyle_factors.diet_notes ?? '',
        exercise_frequency: medicalHistory.lifestyle_factors.exercise_frequency ?? '',
      });
      return;
    }

    if (type === 'dental') {
      setForm({
        last_cleaning_date: medicalHistory.dental_history.last_cleaning_date ?? '',
        last_exam_date: medicalHistory.dental_history.last_exam_date ?? '',
        dental_anxiety_level: medicalHistory.dental_history.dental_anxiety_level ?? 'none',
        previous_orthodontics: medicalHistory.dental_history.previous_orthodontics ? 'yes' : 'no',
        orthodontics_details: medicalHistory.dental_history.orthodontics_details ?? '',
        previous_implants: medicalHistory.dental_history.previous_implants ? 'yes' : 'no',
      });
    }
  };

  const updateField = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const queueUndoToast = (entry: PendingUndoDelete) => {
    if (undoTimeoutId) {
      window.clearTimeout(undoTimeoutId);
    }

    setPendingUndoDelete(entry);
    const timeoutId = window.setTimeout(() => {
      setPendingUndoDelete(null);
      setUndoTimeoutId(null);
    }, 5000);
    setUndoTimeoutId(timeoutId);
  };

  const deleteEntry = (type: UndoEntryType, id: string) => {
    if (!window.confirm('Are you sure you want to remove this entry?')) return;

    if (type === 'allergy') {
      const index = medicalHistory.allergies.findIndex(item => item.id === id);
      const deleted = medicalHistory.allergies[index];
      if (!deleted) return;
      commitMedicalHistory({
        ...medicalHistory,
        allergies: medicalHistory.allergies.filter(item => item.id !== id),
      });
      queueUndoToast({ type, item: deleted, index });
      return;
    }

    if (type === 'medication') {
      const index = medicalHistory.current_medications.findIndex(item => item.id === id);
      const deleted = medicalHistory.current_medications[index];
      if (!deleted) return;
      commitMedicalHistory({
        ...medicalHistory,
        current_medications: medicalHistory.current_medications.filter(item => item.id !== id),
      });
      queueUndoToast({ type, item: deleted, index });
      return;
    }

    if (type === 'condition') {
      const index = medicalHistory.systemic_conditions.findIndex(item => item.id === id);
      const deleted = medicalHistory.systemic_conditions[index];
      if (!deleted) return;
      commitMedicalHistory({
        ...medicalHistory,
        systemic_conditions: medicalHistory.systemic_conditions.filter(item => item.id !== id),
      });
      queueUndoToast({ type, item: deleted, index });
      return;
    }

    if (type === 'surgery') {
      const index = medicalHistory.past_surgeries.findIndex(item => item.id === id);
      const deleted = medicalHistory.past_surgeries[index];
      if (!deleted) return;
      commitMedicalHistory({
        ...medicalHistory,
        past_surgeries: medicalHistory.past_surgeries.filter(item => item.id !== id),
      });
      queueUndoToast({ type, item: deleted, index });
      return;
    }

    const index = medicalHistory.family_health_history.findIndex(item => item.id === id);
    const deleted = medicalHistory.family_health_history[index];
    if (!deleted) return;

    commitMedicalHistory({
      ...medicalHistory,
      family_health_history: medicalHistory.family_health_history.filter(item => item.id !== id),
    });
    queueUndoToast({ type, item: deleted, index });
  };

  const undoDelete = () => {
    if (!pendingUndoDelete) return;

    if (undoTimeoutId) {
      window.clearTimeout(undoTimeoutId);
      setUndoTimeoutId(null);
    }

    if (pendingUndoDelete.type === 'allergy') {
      const next = [...medicalHistory.allergies];
      next.splice(pendingUndoDelete.index, 0, pendingUndoDelete.item as AllergyRecord);
      commitMedicalHistory({ ...medicalHistory, allergies: next });
      setPendingUndoDelete(null);
      return;
    }

    if (pendingUndoDelete.type === 'medication') {
      const next = [...medicalHistory.current_medications];
      next.splice(pendingUndoDelete.index, 0, pendingUndoDelete.item as MedicationRecord);
      commitMedicalHistory({ ...medicalHistory, current_medications: next });
      setPendingUndoDelete(null);
      return;
    }

    if (pendingUndoDelete.type === 'condition') {
      const next = [...medicalHistory.systemic_conditions];
      next.splice(pendingUndoDelete.index, 0, pendingUndoDelete.item as SystemicCondition);
      commitMedicalHistory({ ...medicalHistory, systemic_conditions: next });
      setPendingUndoDelete(null);
      return;
    }

    if (pendingUndoDelete.type === 'surgery') {
      const next = [...medicalHistory.past_surgeries];
      next.splice(pendingUndoDelete.index, 0, pendingUndoDelete.item as SurgeryRecord);
      commitMedicalHistory({ ...medicalHistory, past_surgeries: next });
      setPendingUndoDelete(null);
      return;
    }

    const next = [...medicalHistory.family_health_history];
    next.splice(pendingUndoDelete.index, 0, pendingUndoDelete.item as FamilyHistoryEntry);
    commitMedicalHistory({ ...medicalHistory, family_health_history: next });
    setPendingUndoDelete(null);
  };

  const getUndoToastMessage = () => {
    if (!pendingUndoDelete) return '';

    if (pendingUndoDelete.type === 'allergy') {
      const item = pendingUndoDelete.item as AllergyRecord;
      return item.allergen ? `Allergy removed: ${item.allergen}` : 'Allergy removed';
    }

    if (pendingUndoDelete.type === 'medication') {
      const item = pendingUndoDelete.item as MedicationRecord;
      return item.name ? `Medication removed: ${item.name}` : 'Medication removed';
    }

    if (pendingUndoDelete.type === 'condition') {
      const item = pendingUndoDelete.item as SystemicCondition;
      return item.condition ? `Condition removed: ${item.condition}` : 'Condition removed';
    }

    if (pendingUndoDelete.type === 'surgery') {
      const item = pendingUndoDelete.item as SurgeryRecord;
      return item.procedure ? `Surgery removed: ${item.procedure}` : 'Surgery removed';
    }

    const item = pendingUndoDelete.item as FamilyHistoryEntry;
    return item.relation
      ? `Family history removed: ${item.relation}`
      : 'Family history entry removed';
  };

  const saveEditor = () => {
    if (!editorType) return;

    if (editorType === 'allergy') {
      if (!form.allergen?.trim() || !form.reaction?.trim()) return;
      const nextItem = {
        id: editingId ?? newId('allergy'),
        allergen: form.allergen.trim(),
        reaction: form.reaction.trim(),
        severity: (form.severity || 'moderate') as 'mild' | 'moderate' | 'severe' | 'life_threatening',
        date_identified: form.date_identified || new Date().toISOString().slice(0, 10),
        notes: form.notes?.trim() || undefined,
      };

      commitMedicalHistory({
        ...medicalHistory,
        allergies:
          editorMode === 'add'
            ? [...medicalHistory.allergies, nextItem]
            : medicalHistory.allergies.map(item => (item.id === editingId ? nextItem : item)),
      });
      closeEditor();
      return;
    }

    if (editorType === 'medication') {
      if (!form.name?.trim()) return;
      const nextItem = {
        id: editingId ?? newId('med'),
        name: form.name.trim(),
        dosage: form.dosage || 'Not specified',
        frequency: form.frequency || 'Not specified',
        purpose: form.purpose || 'Not specified',
        start_date: form.start_date || new Date().toISOString().slice(0, 10),
        prescribing_doctor: form.prescribing_doctor?.trim() || undefined,
      };

      commitMedicalHistory({
        ...medicalHistory,
        current_medications:
          editorMode === 'add'
            ? [...medicalHistory.current_medications, nextItem]
            : medicalHistory.current_medications.map(item =>
                item.id === editingId ? nextItem : item
              ),
      });
      closeEditor();
      return;
    }

    if (editorType === 'condition') {
      if (!form.condition?.trim()) return;
      const nextItem = {
        id: editingId ?? newId('condition'),
        condition: form.condition.trim(),
        diagnosed_date: form.diagnosed_date || new Date().toISOString().slice(0, 10),
        status: (form.status || 'active') as 'active' | 'controlled' | 'resolved',
        severity: (form.severity || 'mild') as 'mild' | 'moderate' | 'severe',
        treatment: form.treatment?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
      };

      commitMedicalHistory({
        ...medicalHistory,
        systemic_conditions:
          editorMode === 'add'
            ? [...medicalHistory.systemic_conditions, nextItem]
            : medicalHistory.systemic_conditions.map(item =>
                item.id === editingId ? nextItem : item
              ),
      });
      closeEditor();
      return;
    }

    if (editorType === 'surgery') {
      if (!form.procedure?.trim()) return;
      const nextItem = {
        id: editingId ?? newId('surgery'),
        procedure: form.procedure.trim(),
        date: form.date || new Date().toISOString().slice(0, 10),
        hospital: form.hospital?.trim() || undefined,
        surgeon: form.surgeon?.trim() || undefined,
      };

      commitMedicalHistory({
        ...medicalHistory,
        past_surgeries:
          editorMode === 'add'
            ? [...medicalHistory.past_surgeries, nextItem]
            : medicalHistory.past_surgeries.map(item => (item.id === editingId ? nextItem : item)),
      });
      closeEditor();
      return;
    }

    if (editorType === 'family') {
      if (!form.relation?.trim()) return;
      const nextItem = {
        id: editingId ?? newId('family'),
        relation: form.relation.trim(),
        conditions: (form.conditions || '')
          .split(',')
          .map(item => item.trim())
          .filter(Boolean),
      };

      commitMedicalHistory({
        ...medicalHistory,
        family_health_history:
          editorMode === 'add'
            ? [...medicalHistory.family_health_history, nextItem]
            : medicalHistory.family_health_history.map(item =>
                item.id === editingId ? nextItem : item
              ),
      });
      closeEditor();
      return;
    }

    if (editorType === 'lifestyle') {
      commitMedicalHistory({
        ...medicalHistory,
        lifestyle_factors: {
          smoking: {
            status: (form.smoking_status || 'never') as 'never' | 'former' | 'current',
            packs_per_day: form.packs_per_day ? Number(form.packs_per_day) : undefined,
            years: form.years ? Number(form.years) : undefined,
            quit_date: form.quit_date || undefined,
          },
          alcohol: {
            frequency: form.alcohol_frequency || 'none',
            drinks_per_week: form.drinks_per_week ? Number(form.drinks_per_week) : undefined,
          },
          diet_notes: form.diet_notes?.trim() || undefined,
          exercise_frequency: form.exercise_frequency?.trim() || undefined,
        },
      });
      closeEditor();
      return;
    }

    if (editorType === 'dental') {
      commitMedicalHistory({
        ...medicalHistory,
        dental_history: {
          ...medicalHistory.dental_history,
          last_cleaning_date: form.last_cleaning_date || undefined,
          last_exam_date: form.last_exam_date || undefined,
          dental_anxiety_level: (form.dental_anxiety_level || 'none') as
            | 'none'
            | 'mild'
            | 'moderate'
            | 'severe',
          previous_orthodontics: form.previous_orthodontics === 'yes',
          orthodontics_details: form.orthodontics_details?.trim() || undefined,
          previous_implants: form.previous_implants === 'yes',
        },
      });
      closeEditor();
    }
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
          <button
            onClick={() => openEditor('allergy', 'add')}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
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
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditor('allergy', 'edit', allergy as unknown as Record<string, unknown>)}
                      className="p-2 hover:bg-white/30 rounded-lg transition-colors"
                      aria-label="Edit allergy"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteEntry('allergy', allergy.id)}
                      className="p-2 hover:bg-white/30 rounded-lg transition-colors"
                      aria-label="Delete allergy"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
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
          <button
            onClick={() => openEditor('medication', 'add')}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
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
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditor('medication', 'edit', medication as unknown as Record<string, unknown>)}
                      className="p-1.5 hover:bg-blue-100 rounded transition-colors"
                      aria-label="Edit medication"
                    >
                      <Edit2 className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => deleteEntry('medication', medication.id)}
                      className="p-1.5 hover:bg-red-100 rounded transition-colors"
                      aria-label="Delete medication"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
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
          <button
            onClick={() => openEditor('condition', 'add')}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
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
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditor('condition', 'edit', condition as unknown as Record<string, unknown>)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      aria-label="Edit condition"
                    >
                      <Edit2 className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => deleteEntry('condition', condition.id)}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                      aria-label="Delete condition"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
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
          <button
            onClick={() => openEditor('surgery', 'add')}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
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
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditor('surgery', 'edit', surgery as unknown as Record<string, unknown>)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      aria-label="Edit surgery"
                    >
                      <Edit2 className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => deleteEntry('surgery', surgery.id)}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                      aria-label="Delete surgery"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
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
          <button
            onClick={() => openEditor('lifestyle', 'edit')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
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
            <button
              onClick={() => openEditor('family', 'add')}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>

          {medicalHistory.family_health_history.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {medicalHistory.family_health_history.map(family => (
              <motion.div
                key={family.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-lg border border-gray-200 bg-gradient-to-br from-teal-50 to-white"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 capitalize">
                    {family.relation}
                  </h4>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditor('family', 'edit', family as unknown as Record<string, unknown>)}
                      className="p-1 hover:bg-white/70 rounded transition-colors"
                      aria-label="Edit family history"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-gray-600" />
                    </button>
                    <button
                      onClick={() => deleteEntry('family', family.id)}
                      className="p-1 hover:bg-red-100 rounded transition-colors"
                      aria-label="Delete family history"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    </button>
                  </div>
                </div>
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
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No family health history recorded</p>
            </div>
          )}
        </div>

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
          <button
            onClick={() => openEditor('dental', 'edit')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
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

      {pendingUndoDelete && (
        <div className="fixed bottom-4 right-4 z-[60] bg-gray-900 text-white rounded-xl px-4 py-3 shadow-2xl flex items-center gap-3">
          <p className="text-sm">{getUndoToastMessage()}.</p>
          <button
            onClick={undoDelete}
            className="text-sm font-semibold text-sky-300 hover:text-sky-200 transition-colors"
          >
            Undo
          </button>
        </div>
      )}

      {editorType && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h4 className="text-lg font-bold text-gray-900 capitalize">
                {editorMode === 'add' ? 'Add' : 'Edit'} {editorType}
              </h4>
              <button
                onClick={closeEditor}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {(editorType === 'allergy' || editorType === 'medication' || editorType === 'condition' || editorType === 'surgery' || editorType === 'family') && (
                <p className="text-sm text-gray-500">Use this editor to update details without leaving the patient chart.</p>
              )}

              {editorType === 'allergy' && (
                <>
                  <input value={form.allergen || ''} onChange={e => updateField('allergen', e.target.value)} placeholder="Allergen" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  <input value={form.reaction || ''} onChange={e => updateField('reaction', e.target.value)} placeholder="Reaction" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  <select value={form.severity || 'moderate'} onChange={e => updateField('severity', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="mild">Mild</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe</option>
                    <option value="life_threatening">Life Threatening</option>
                  </select>
                  <input type="date" value={form.date_identified || ''} onChange={e => updateField('date_identified', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  <textarea value={form.notes || ''} onChange={e => updateField('notes', e.target.value)} placeholder="Notes" className="w-full px-3 py-2 border border-gray-300 rounded-lg min-h-[90px]" />
                </>
              )}

              {editorType === 'medication' && (
                <>
                  <input value={form.name || ''} onChange={e => updateField('name', e.target.value)} placeholder="Medication" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  <input value={form.dosage || ''} onChange={e => updateField('dosage', e.target.value)} placeholder="Dosage" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  <input value={form.frequency || ''} onChange={e => updateField('frequency', e.target.value)} placeholder="Frequency" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  <input value={form.purpose || ''} onChange={e => updateField('purpose', e.target.value)} placeholder="Purpose" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  <input type="date" value={form.start_date || ''} onChange={e => updateField('start_date', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  <input value={form.prescribing_doctor || ''} onChange={e => updateField('prescribing_doctor', e.target.value)} placeholder="Prescribing Doctor" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </>
              )}

              {editorType === 'condition' && (
                <>
                  <input value={form.condition || ''} onChange={e => updateField('condition', e.target.value)} placeholder="Condition" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  <input type="date" value={form.diagnosed_date || ''} onChange={e => updateField('diagnosed_date', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  <select value={form.status || 'active'} onChange={e => updateField('status', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="active">Active</option>
                    <option value="controlled">Controlled</option>
                    <option value="resolved">Resolved</option>
                  </select>
                  <select value={form.severity || 'mild'} onChange={e => updateField('severity', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="mild">Mild</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe</option>
                  </select>
                  <input value={form.treatment || ''} onChange={e => updateField('treatment', e.target.value)} placeholder="Treatment" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  <textarea value={form.notes || ''} onChange={e => updateField('notes', e.target.value)} placeholder="Notes" className="w-full px-3 py-2 border border-gray-300 rounded-lg min-h-[90px]" />
                </>
              )}

              {editorType === 'surgery' && (
                <>
                  <input value={form.procedure || ''} onChange={e => updateField('procedure', e.target.value)} placeholder="Procedure" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  <input type="date" value={form.date || ''} onChange={e => updateField('date', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  <input value={form.hospital || ''} onChange={e => updateField('hospital', e.target.value)} placeholder="Hospital" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  <input value={form.surgeon || ''} onChange={e => updateField('surgeon', e.target.value)} placeholder="Surgeon" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </>
              )}

              {editorType === 'family' && (
                <>
                  <input value={form.relation || ''} onChange={e => updateField('relation', e.target.value)} placeholder="Relation" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  <textarea value={form.conditions || ''} onChange={e => updateField('conditions', e.target.value)} placeholder="Conditions (comma separated)" className="w-full px-3 py-2 border border-gray-300 rounded-lg min-h-[90px]" />
                </>
              )}

              {editorType === 'lifestyle' && (
                <>
                  <select value={form.smoking_status || 'never'} onChange={e => updateField('smoking_status', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="never">Never Smoked</option>
                    <option value="former">Former Smoker</option>
                    <option value="current">Current Smoker</option>
                  </select>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input value={form.packs_per_day || ''} onChange={e => updateField('packs_per_day', e.target.value)} placeholder="Packs/day" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                    <input value={form.years || ''} onChange={e => updateField('years', e.target.value)} placeholder="Years" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <input type="date" value={form.quit_date || ''} onChange={e => updateField('quit_date', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  <select value={form.alcohol_frequency || 'none'} onChange={e => updateField('alcohol_frequency', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="none">No Alcohol</option>
                    <option value="occasional">Occasional</option>
                    <option value="moderate">Moderate</option>
                    <option value="heavy">Heavy</option>
                  </select>
                  <input value={form.drinks_per_week || ''} onChange={e => updateField('drinks_per_week', e.target.value)} placeholder="Drinks per week" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  <textarea value={form.diet_notes || ''} onChange={e => updateField('diet_notes', e.target.value)} placeholder="Diet notes" className="w-full px-3 py-2 border border-gray-300 rounded-lg min-h-[80px]" />
                  <input value={form.exercise_frequency || ''} onChange={e => updateField('exercise_frequency', e.target.value)} placeholder="Exercise frequency" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </>
              )}

              {editorType === 'dental' && (
                <>
                  <input type="date" value={form.last_cleaning_date || ''} onChange={e => updateField('last_cleaning_date', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  <input type="date" value={form.last_exam_date || ''} onChange={e => updateField('last_exam_date', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  <select value={form.dental_anxiety_level || 'none'} onChange={e => updateField('dental_anxiety_level', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="none">No Anxiety</option>
                    <option value="mild">Mild Anxiety</option>
                    <option value="moderate">Moderate Anxiety</option>
                    <option value="severe">Severe Anxiety</option>
                  </select>
                  <select value={form.previous_orthodontics || 'no'} onChange={e => updateField('previous_orthodontics', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="no">No Previous Orthodontics</option>
                    <option value="yes">Previous Orthodontics</option>
                  </select>
                  <input value={form.orthodontics_details || ''} onChange={e => updateField('orthodontics_details', e.target.value)} placeholder="Orthodontics details" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  <select value={form.previous_implants || 'no'} onChange={e => updateField('previous_implants', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="no">No Previous Implants</option>
                    <option value="yes">Previous Implants</option>
                  </select>
                </>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end space-x-3 bg-gray-50">
              <button
                onClick={closeEditor}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEditor}
                className="px-4 py-2 text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
