'use client';

/**
 * Periodontal Records Section
 * Comprehensive periodontal charting with pocket depths, bleeding,
 * recession, mobility, furcation, and trend analysis
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Droplet,
  Activity,
  Calendar,
  Plus,
  Edit3,
  Trash2,
} from 'lucide-react';
import type { PeriodontalRecords, PeriodontalExam, ToothMeasurement } from '@/lib/types/dental-record';

interface PeriodontalRecordsSectionProps {
  patientId: string;
  periodontalRecords: PeriodontalRecords;
  onUpdate?: (updates: Partial<PeriodontalRecords>) => void;
}

export default function PeriodontalRecordsSection({
  patientId,
  periodontalRecords,
  onUpdate,
}: PeriodontalRecordsSectionProps) {
  const [selectedExam, setSelectedExam] = useState<PeriodontalExam | null>(
    periodontalRecords.exams[0] || null
  );
  const [viewMode, setViewMode] = useState<'chart' | 'trends'>('chart');
  const [expandedQuadrant, setExpandedQuadrant] = useState<string | null>(null);
  const [showNewExamModal, setShowNewExamModal] = useState(false);
  const [showMeasurementEditor, setShowMeasurementEditor] = useState(false);
  const [editingTooth, setEditingTooth] = useState<ToothMeasurement | null>(null);
  const [lastUpdateMessage, setLastUpdateMessage] = useState<string>('');
  const [measurementForm, setMeasurementForm] = useState({
    pocketDepths: [3, 3, 3, 3, 3, 3],
    bleeding: [false, false, false, false, false, false],
    recession: [0, 0, 0, 0, 0, 0],
    mobilityGrade: 0,
    furcationInvolvement: 'none',
  });
  const [newExamForm, setNewExamForm] = useState({
    examiner_name: '',
    exam_date: new Date().toISOString().slice(0, 10),
    diagnosis: '',
    recommendations: '',
  });

  useEffect(() => {
    if (!lastUpdateMessage) return;
    const timeout = setTimeout(() => setLastUpdateMessage(''), 2600);
    return () => clearTimeout(timeout);
  }, [lastUpdateMessage]);

  const commitPeriodontalRecords = (next: PeriodontalRecords, message: string) => {
    onUpdate?.(next);
    setLastUpdateMessage(`${message} at ${new Date().toLocaleTimeString()}`);
  };

  const handleCreateExam = () => {
    const examinerName = newExamForm.examiner_name.trim();
    if (!examinerName) return;

    const baseline = periodontalRecords.exams[0]?.tooth_measurements ?? [];

    const nextExam: PeriodontalExam = {
      exam_id: `perio-exam-${Date.now().toString(36)}`,
      exam_date: newExamForm.exam_date || new Date().toISOString().slice(0, 10),
      examiner_name: examinerName,
      tooth_measurements: baseline,
      overall_diagnosis: newExamForm.diagnosis.trim() || undefined,
      treatment_recommendations: newExamForm.recommendations
        .split('\n')
        .map(item => item.trim())
        .filter(Boolean),
    };

    commitPeriodontalRecords({
      ...periodontalRecords,
      exams: [nextExam, ...periodontalRecords.exams],
    }, 'Exam created');

    setSelectedExam(nextExam);
    setShowNewExamModal(false);
    setNewExamForm({
      examiner_name: '',
      exam_date: new Date().toISOString().slice(0, 10),
      diagnosis: '',
      recommendations: '',
    });
  };

  const activeExam =
    periodontalRecords.exams.find((exam) => exam.exam_id === selectedExam?.exam_id) ||
    periodontalRecords.exams[0] ||
    null;

  const removeExam = (examId: string) => {
    const nextExams = periodontalRecords.exams.filter((exam) => exam.exam_id !== examId);
    if (nextExams.length === 0) return;

    commitPeriodontalRecords({
      ...periodontalRecords,
      exams: nextExams,
    }, 'Exam removed');
    setSelectedExam(nextExams[0]);
  };

  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

  const openMeasurementEditor = (tooth: ToothMeasurement) => {
    setEditingTooth(tooth);
    setMeasurementForm({
      pocketDepths: [...tooth.pocket_depths],
      bleeding: [...tooth.bleeding_on_probing],
      recession: [...tooth.recession_mm],
      mobilityGrade: tooth.mobility_grade,
      furcationInvolvement: tooth.furcation_involvement || 'none',
    });
    setShowMeasurementEditor(true);
  };

  const updatePocketDepth = (idx: number, nextValue: number) => {
    setMeasurementForm((prev) => {
      const next = [...prev.pocketDepths];
      next[idx] = clamp(nextValue, 1, 12);
      return { ...prev, pocketDepths: next };
    });
  };

  const updateRecession = (idx: number, nextValue: number) => {
    setMeasurementForm((prev) => {
      const next = [...prev.recession];
      next[idx] = clamp(nextValue, 0, 8);
      return { ...prev, recession: next };
    });
  };

  const toggleBleeding = (idx: number) => {
    setMeasurementForm((prev) => {
      const next = [...prev.bleeding];
      next[idx] = !next[idx];
      return { ...prev, bleeding: next };
    });
  };

  const saveMeasurementEditor = () => {
    if (!activeExam || !editingTooth) return;

    const nextMeasurement: ToothMeasurement = {
      ...editingTooth,
      pocket_depths: measurementForm.pocketDepths.map((depth) => clamp(depth, 1, 12)),
      bleeding_on_probing: [...measurementForm.bleeding],
      recession_mm: measurementForm.recession.map((value) => clamp(value, 0, 8)),
      mobility_grade: clamp(Number(measurementForm.mobilityGrade) || 0, 0, 3),
      furcation_involvement: measurementForm.furcationInvolvement as ToothMeasurement['furcation_involvement'],
    };

    const nextExams = periodontalRecords.exams.map((exam) => {
      if (exam.exam_id !== activeExam.exam_id) return exam;
      return {
        ...exam,
        tooth_measurements: exam.tooth_measurements.map((measurement) =>
          measurement.tooth_number === nextMeasurement.tooth_number ? nextMeasurement : measurement
        ),
      };
    });

    commitPeriodontalRecords({
      ...periodontalRecords,
      exams: nextExams,
    }, `Tooth #${nextMeasurement.tooth_number} updated`);

    setShowMeasurementEditor(false);
    setEditingTooth(null);
  };

  // Get latest exam
  const latestExam = activeExam;

  // Calculate statistics from latest exam
  const calculateStats = () => {
    if (!latestExam) return { healthy: 0, warning: 0, severe: 0, avgDepth: 0, bleedingPoints: 0 };

    let totalDepth = 0;
    let totalPoints = 0;
    let bleedingPoints = 0;
    let healthy = 0;
    let warning = 0;
    let severe = 0;

    latestExam.tooth_measurements.forEach((tooth: ToothMeasurement) => {
      tooth.pocket_depths.forEach((depth: number) => {
        totalDepth += depth;
        totalPoints++;
        
        if (depth <= 3) healthy++;
        else if (depth <= 5) warning++;
        else severe++;
      });

      tooth.bleeding_on_probing.forEach((bleeding: boolean) => {
        if (bleeding) bleedingPoints++;
      });
    });

    return {
      healthy,
      warning,
      severe,
      avgDepth: totalPoints > 0 ? (totalDepth / totalPoints).toFixed(1) : '0',
      bleedingPoints,
      totalPoints,
    };
  };

  const stats = calculateStats();

  // Get color based on pocket depth
  const getDepthColor = (depth: number) => {
    if (depth <= 3) return 'text-green-600 bg-green-50';
    if (depth <= 5) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  // Get mobility color
  const getMobilityColor = (grade: number) => {
    if (grade === 0) return 'text-green-600';
    if (grade <= 1) return 'text-yellow-600';
    return 'text-red-600';
  };

  const siteLabel = (idx: number) => {
    const labels = ['M', 'B', 'D', 'M', 'L', 'D'];
    return labels[idx];
  };

  const sectionTitle = (idx: number) => (idx < 3 ? 'Buccal' : 'Lingual');

  // Get quadrant teeth
  const getQuadrantTeeth = (quadrant: 'UR' | 'UL' | 'LL' | 'LR') => {
    const ranges = {
      UR: [1, 2, 3, 4, 5, 6, 7, 8],
      UL: [9, 10, 11, 12, 13, 14, 15, 16],
      LL: [17, 18, 19, 20, 21, 22, 23, 24],
      LR: [25, 26, 27, 28, 29, 30, 31, 32],
    };
    
    return ranges[quadrant].map(num => 
      latestExam?.tooth_measurements.find((t: ToothMeasurement) => t.tooth_number === num)
    ).filter(Boolean);
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Depth</p>
              <p className="text-2xl font-bold text-blue-600">{stats.avgDepth}mm</p>
            </div>
            <Activity className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Healthy</p>
              <p className="text-2xl font-bold text-green-600">{stats.healthy}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Warning</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.warning}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Severe</p>
              <p className="text-2xl font-bold text-red-600">{stats.severe}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Bleeding</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.bleedingPoints}/{stats.totalPoints}
              </p>
            </div>
            <Droplet className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Exam History Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Exam Date:</span>
            </div>
            <select
              value={selectedExam?.exam_id || ''}
              onChange={(e) => {
                const exam = periodontalRecords.exams.find((ex: PeriodontalExam) => ex.exam_id === e.target.value);
                setSelectedExam(exam || null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {periodontalRecords.exams.map((exam: PeriodontalExam) => (
                <option key={exam.exam_id} value={exam.exam_id}>
                  {new Date(exam.exam_date).toLocaleDateString()} - Dr. {exam.examiner_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('chart')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'chart'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Chart View
            </button>
            <button
              onClick={() => setViewMode('trends')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'trends'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Trends
            </button>
            <button
              onClick={() => setShowNewExamModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Exam</span>
            </button>
            <button
              onClick={() => activeExam && removeExam(activeExam.exam_id)}
              disabled={!activeExam || periodontalRecords.exams.length <= 1}
              className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              <span>Remove Exam</span>
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
          <p className="font-medium">How to edit</p>
          <p className="mt-1">Pick an exam, then press Edit on any tooth card. Saving changes updates only the selected exam.</p>
        </div>

        {activeExam && (
          <div className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-900">
            Currently editing exam: {new Date(activeExam.exam_date).toLocaleDateString()} by Dr. {activeExam.examiner_name}
          </div>
        )}

        {lastUpdateMessage && (
          <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
            {lastUpdateMessage}
          </div>
        )}
      </div>

      {viewMode === 'chart' ? (
        /* Periodontal Chart */
        <div className="space-y-4">
          {/* Upper Jaw */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">UPPER JAW</h3>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-gray-600">Healthy (≤3mm)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span className="text-gray-600">Warning (4-5mm)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="text-gray-600">Severe (≥6mm)</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Upper Right */}
              <div>
                <p className="text-sm font-medium text-gray-600 text-center mb-3">Right</p>
                <div className="space-y-2">
                  {getQuadrantTeeth('UR').map((tooth: any) => (
                    <div key={tooth.tooth_number} className={`border border-gray-200 rounded-lg p-3 transition-all ${editingTooth?.tooth_number === tooth.tooth_number ? 'ring-2 ring-blue-300 animate-pulse' : ''}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-gray-900">#{tooth.tooth_number}</span>
                        {tooth.mobility_grade > 0 && (
                          <span className={`text-xs font-semibold ${getMobilityColor(tooth.mobility_grade)}`}>
                            Mobility: {tooth.mobility_grade}
                          </span>
                        )}
                      </div>

                      {/* Pocket Depths */}
                      <div className="grid grid-cols-6 gap-1 mb-2">
                        {tooth.pocket_depths.map((depth: number, idx: number) => (
                          <div
                            key={idx}
                            className={`text-center py-1 rounded text-xs font-bold ${getDepthColor(depth)}`}
                          >
                            {depth}
                          </div>
                        ))}
                      </div>

                      {/* Bleeding Indicators */}
                      <div className="grid grid-cols-6 gap-1">
                        {tooth.bleeding_on_probing.map((bleeding: boolean, idx: number) => (
                          <div key={idx} className="text-center">
                            {bleeding && <Droplet className="w-3 h-3 text-red-500 mx-auto" />}
                          </div>
                        ))}
                      </div>

                      {/* Recession */}
                      {tooth.recession_mm.some((r: number) => r > 0) && (
                        <div className="mt-2 text-xs text-orange-600">
                          Recession: {tooth.recession_mm.filter((r: number) => r > 0).length} sites
                        </div>
                      )}

                      {/* Furcation */}
                      {tooth.furcation_involvement && tooth.furcation_involvement !== 'none' && (
                        <div className="mt-1 text-xs text-red-600 font-medium">
                          Furcation: Class {tooth.furcation_involvement.replace('class_', '')}
                        </div>
                      )}

                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={() => openMeasurementEditor(tooth)}
                          className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upper Left */}
              <div>
                <p className="text-sm font-medium text-gray-600 text-center mb-3">Left</p>
                <div className="space-y-2">
                  {getQuadrantTeeth('UL').map((tooth: any) => (
                    <div key={tooth.tooth_number} className={`border border-gray-200 rounded-lg p-3 transition-all ${editingTooth?.tooth_number === tooth.tooth_number ? 'ring-2 ring-blue-300 animate-pulse' : ''}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-gray-900">#{tooth.tooth_number}</span>
                        {tooth.mobility_grade > 0 && (
                          <span className={`text-xs font-semibold ${getMobilityColor(tooth.mobility_grade)}`}>
                            Mobility: {tooth.mobility_grade}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-6 gap-1 mb-2">
                        {tooth.pocket_depths.map((depth: number, idx: number) => (
                          <div
                            key={idx}
                            className={`text-center py-1 rounded text-xs font-bold ${getDepthColor(depth)}`}
                          >
                            {depth}
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-6 gap-1">
                        {tooth.bleeding_on_probing.map((bleeding: boolean, idx: number) => (
                          <div key={idx} className="text-center">
                            {bleeding && <Droplet className="w-3 h-3 text-red-500 mx-auto" />}
                          </div>
                        ))}
                      </div>

                      {tooth.recession_mm.some((r: number) => r > 0) && (
                        <div className="mt-2 text-xs text-orange-600">
                          Recession: {tooth.recession_mm.filter((r: number) => r > 0).length} sites
                        </div>
                      )}

                      {tooth.furcation_involvement && tooth.furcation_involvement !== 'none' && (
                        <div className="mt-1 text-xs text-red-600 font-medium">
                          Furcation: Class {tooth.furcation_involvement.replace('class_', '')}
                        </div>
                      )}

                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={() => openMeasurementEditor(tooth)}
                          className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Lower Jaw */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">LOWER JAW</h3>

            <div className="grid grid-cols-2 gap-6">
              {/* Lower Left */}
              <div>
                <p className="text-sm font-medium text-gray-600 text-center mb-3">Left</p>
                <div className="space-y-2">
                  {getQuadrantTeeth('LL').reverse().map((tooth: any) => (
                    <div key={tooth.tooth_number} className={`border border-gray-200 rounded-lg p-3 transition-all ${editingTooth?.tooth_number === tooth.tooth_number ? 'ring-2 ring-blue-300 animate-pulse' : ''}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-gray-900">#{tooth.tooth_number}</span>
                        {tooth.mobility_grade > 0 && (
                          <span className={`text-xs font-semibold ${getMobilityColor(tooth.mobility_grade)}`}>
                            Mobility: {tooth.mobility_grade}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-6 gap-1 mb-2">
                        {tooth.pocket_depths.map((depth: number, idx: number) => (
                          <div
                            key={idx}
                            className={`text-center py-1 rounded text-xs font-bold ${getDepthColor(depth)}`}
                          >
                            {depth}
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-6 gap-1">
                        {tooth.bleeding_on_probing.map((bleeding: boolean, idx: number) => (
                          <div key={idx} className="text-center">
                            {bleeding && <Droplet className="w-3 h-3 text-red-500 mx-auto" />}
                          </div>
                        ))}
                      </div>

                      {tooth.recession_mm.some((r: number) => r > 0) && (
                        <div className="mt-2 text-xs text-orange-600">
                          Recession: {tooth.recession_mm.filter((r: number) => r > 0).length} sites
                        </div>
                      )}

                      {tooth.furcation_involvement && tooth.furcation_involvement !== 'none' && (
                        <div className="mt-1 text-xs text-red-600 font-medium">
                          Furcation: Class {tooth.furcation_involvement.replace('class_', '')}
                        </div>
                      )}

                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={() => openMeasurementEditor(tooth)}
                          className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lower Right */}
              <div>
                <p className="text-sm font-medium text-gray-600 text-center mb-3">Right</p>
                <div className="space-y-2">
                  {getQuadrantTeeth('LR').reverse().map((tooth: any) => (
                    <div key={tooth.tooth_number} className={`border border-gray-200 rounded-lg p-3 transition-all ${editingTooth?.tooth_number === tooth.tooth_number ? 'ring-2 ring-blue-300 animate-pulse' : ''}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-gray-900">#{tooth.tooth_number}</span>
                        {tooth.mobility_grade > 0 && (
                          <span className={`text-xs font-semibold ${getMobilityColor(tooth.mobility_grade)}`}>
                            Mobility: {tooth.mobility_grade}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-6 gap-1 mb-2">
                        {tooth.pocket_depths.map((depth: number, idx: number) => (
                          <div
                            key={idx}
                            className={`text-center py-1 rounded text-xs font-bold ${getDepthColor(depth)}`}
                          >
                            {depth}
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-6 gap-1">
                        {tooth.bleeding_on_probing.map((bleeding: boolean, idx: number) => (
                          <div key={idx} className="text-center">
                            {bleeding && <Droplet className="w-3 h-3 text-red-500 mx-auto" />}
                          </div>
                        ))}
                      </div>

                      {tooth.recession_mm.some((r: number) => r > 0) && (
                        <div className="mt-2 text-xs text-orange-600">
                          Recession: {tooth.recession_mm.filter((r: number) => r > 0).length} sites
                        </div>
                      )}

                      {tooth.furcation_involvement && tooth.furcation_involvement !== 'none' && (
                        <div className="mt-1 text-xs text-red-600 font-medium">
                          Furcation: Class {tooth.furcation_involvement.replace('class_', '')}
                        </div>
                      )}

                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={() => openMeasurementEditor(tooth)}
                          className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Chart Legend</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-700 mb-1">Pocket Depths</p>
                <p className="text-xs text-gray-600">6 points per tooth (buccal & lingual)</p>
              </div>
              <div>
                <p className="font-medium text-gray-700 mb-1">Bleeding</p>
                <p className="text-xs text-gray-600">
                  <Droplet className="w-3 h-3 inline text-red-500" /> = Bleeding on probing
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-700 mb-1">Mobility</p>
                <p className="text-xs text-gray-600">Grade 0-3 (0=none, 3=severe)</p>
              </div>
              <div>
                <p className="font-medium text-gray-700 mb-1">Furcation</p>
                <p className="text-xs text-gray-600">Class I, II, or III involvement</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Trends View */
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Periodontal Health Trends</h3>

          {periodontalRecords.exams.length >= 2 ? (
            <div className="space-y-6">
              {/* Average Pocket Depth Trend */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                  Average Pocket Depth Over Time
                </h4>
                <div className="h-48 flex items-end space-x-2">
                  {periodontalRecords.exams.slice().reverse().map((exam: PeriodontalExam, idx: number) => {
                    const avgDepth = exam.tooth_measurements.reduce((sum: number, tooth: ToothMeasurement) => {
                      return sum + tooth.pocket_depths.reduce((a: number, b: number) => a + b, 0) / tooth.pocket_depths.length;
                    }, 0) / exam.tooth_measurements.length;

                    const height = (avgDepth / 8) * 100; // Max 8mm = 100%

                    return (
                      <div key={exam.exam_id} className="flex-1 flex flex-col items-center">
                        <div className="w-full bg-blue-500 rounded-t" style={{ height: `${height}%` }}>
                          <p className="text-xs text-white text-center pt-2">{avgDepth.toFixed(1)}mm</p>
                        </div>
                        <p className="text-xs text-gray-600 mt-2 text-center">
                          {new Date(exam.exam_date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bleeding Points Trend */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Droplet className="w-5 h-5 mr-2 text-red-600" />
                  Bleeding on Probing Trend
                </h4>
                <div className="h-48 flex items-end space-x-2">
                  {periodontalRecords.exams.slice().reverse().map((exam: PeriodontalExam) => {
                    const bleedingCount = exam.tooth_measurements.reduce((sum: number, tooth: ToothMeasurement) => {
                      return sum + tooth.bleeding_on_probing.filter((b: boolean) => b).length;
                    }, 0);
                    const totalPoints = exam.tooth_measurements.reduce((sum: number, tooth: ToothMeasurement) => {
                      return sum + tooth.bleeding_on_probing.length;
                    }, 0);
                    const percentage = (bleedingCount / totalPoints) * 100;
                    
                    return (
                      <div key={exam.exam_id} className="flex-1 flex flex-col items-center">
                        <div className="w-full bg-red-500 rounded-t" style={{ height: `${percentage}%` }}>
                          <p className="text-xs text-white text-center pt-2">{percentage.toFixed(0)}%</p>
                        </div>
                        <p className="text-xs text-gray-600 mt-2 text-center">
                          {new Date(exam.exam_date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Treatment Recommendations */}
              {latestExam?.treatment_recommendations && (
                <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-900 mb-3 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Treatment Recommendations
                  </h4>
                  <ul className="space-y-2">
                    {latestExam.treatment_recommendations.map((rec: string, idx: number) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-orange-600 mt-1">•</span>
                        <span className="text-sm text-gray-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Trends available after 2+ exams</p>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {lastUpdateMessage && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className="fixed right-4 top-4 z-[70]"
          >
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 shadow-lg">
              {lastUpdateMessage}
            </div>
          </motion.div>
        )}

        {showMeasurementEditor && editingTooth && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
            onClick={() => setShowMeasurementEditor(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-xl"
            >
              <h4 className="text-lg font-bold text-gray-900 mb-4">
                Edit Tooth #{editingTooth.tooth_number} Measurements
              </h4>
              <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
                This save updates periodontal depths, bleeding, recession, mobility, and furcation for this tooth in the selected exam.
              </div>
              <div className="space-y-4">
                <div className="rounded-xl border border-gray-200 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Tooth Surface Chart Editor</p>
                  <div className="space-y-3">
                    {[0, 3].map((start) => (
                      <div key={start} className="rounded-lg border border-gray-200 bg-gray-50 p-2">
                        <p className="text-xs font-semibold text-gray-700 mb-2">{sectionTitle(start)} Sites</p>
                        <div className="grid grid-cols-3 gap-2">
                          {[start, start + 1, start + 2].map((idx) => (
                            <div key={idx} className="rounded-md border border-gray-200 bg-white p-2">
                              <p className="text-xs font-semibold text-gray-500 mb-1">{siteLabel(idx)} site</p>
                              <div className="space-y-2">
                                <div>
                                  <p className="text-[11px] text-gray-500">Depth (mm)</p>
                                  <div className="mt-1 flex items-center gap-1">
                                    <button
                                      onClick={() => updatePocketDepth(idx, measurementForm.pocketDepths[idx] - 1)}
                                      className="h-6 w-6 rounded bg-gray-100 text-sm font-bold text-gray-700 hover:bg-gray-200"
                                    >
                                      -
                                    </button>
                                    <input
                                      type="number"
                                      min={1}
                                      max={12}
                                      value={measurementForm.pocketDepths[idx]}
                                      onChange={(e) => updatePocketDepth(idx, Number(e.target.value) || 1)}
                                      className="w-full rounded border border-gray-300 px-1 py-1 text-center text-sm"
                                    />
                                    <button
                                      onClick={() => updatePocketDepth(idx, measurementForm.pocketDepths[idx] + 1)}
                                      className="h-6 w-6 rounded bg-gray-100 text-sm font-bold text-gray-700 hover:bg-gray-200"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-[11px] text-gray-500">Recession (mm)</p>
                                  <input
                                    type="number"
                                    min={0}
                                    max={8}
                                    value={measurementForm.recession[idx]}
                                    onChange={(e) => updateRecession(idx, Number(e.target.value) || 0)}
                                    className="mt-1 w-full rounded border border-gray-300 px-1 py-1 text-center text-sm"
                                  />
                                </div>

                                <button
                                  onClick={() => toggleBleeding(idx)}
                                  className={`w-full rounded px-2 py-1 text-xs font-semibold transition-colors ${measurementForm.bleeding[idx] ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-emerald-100 text-emerald-700 border border-emerald-300'}`}
                                >
                                  {measurementForm.bleeding[idx] ? 'Bleeding: Yes' : 'Bleeding: No'}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Mobility grade</label>
                    <input
                      type="number"
                      min={0}
                      max={3}
                      value={measurementForm.mobilityGrade}
                      onChange={(e) => setMeasurementForm((prev) => ({ ...prev, mobilityGrade: clamp(Number(e.target.value) || 0, 0, 3) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Furcation</label>
                    <select
                      value={measurementForm.furcationInvolvement}
                      onChange={(e) => setMeasurementForm((prev) => ({ ...prev, furcationInvolvement: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="none">No furcation</option>
                      <option value="class_i">Class I</option>
                      <option value="class_ii">Class II</option>
                      <option value="class_iii">Class III</option>
                    </select>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                  Tip: Use + / - for quick probing depth updates, and tap Bleeding to toggle each site.
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-5">
                <button
                  onClick={() => setShowMeasurementEditor(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={saveMeasurementEditor}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        
        {showNewExamModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
            onClick={() => setShowNewExamModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-xl"
            >
              <h4 className="text-lg font-bold text-gray-900 mb-4">New Periodontal Exam</h4>
              <div className="space-y-3">
                <input
                  value={newExamForm.examiner_name}
                  onChange={e => setNewExamForm(prev => ({ ...prev, examiner_name: e.target.value }))}
                  placeholder="Examiner name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="date"
                  value={newExamForm.exam_date}
                  onChange={e => setNewExamForm(prev => ({ ...prev, exam_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  value={newExamForm.diagnosis}
                  onChange={e => setNewExamForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                  placeholder="Overall diagnosis"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <textarea
                  value={newExamForm.recommendations}
                  onChange={e => setNewExamForm(prev => ({ ...prev, recommendations: e.target.value }))}
                  placeholder="Recommendations (one per line)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg min-h-[100px]"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-5">
                <button
                  onClick={() => setShowNewExamModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateExam}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg"
                >
                  Save Exam
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
