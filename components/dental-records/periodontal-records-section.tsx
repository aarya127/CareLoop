'use client';

/**
 * Periodontal Records Section
 * Comprehensive periodontal charting with pocket depths, bleeding,
 * recession, mobility, furcation, and trend analysis
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Droplet,
  Activity,
  Calendar,
  Plus,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
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

  // Get latest exam
  const latestExam = periodontalRecords.exams[0];

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

  // Health status colors
  const depthColors = {
    healthy: 'bg-green-500',
    warning: 'bg-yellow-500',
    severe: 'bg-red-500',
  };

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
            <button className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
              <Plus className="w-4 h-4" />
              <span>New Exam</span>
            </button>
          </div>
        </div>
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
                    <div key={tooth.tooth_number} className="border border-gray-200 rounded-lg p-3">
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
                    </div>
                  ))}
                </div>
              </div>

              {/* Upper Left */}
              <div>
                <p className="text-sm font-medium text-gray-600 text-center mb-3">Left</p>
                <div className="space-y-2">
                  {getQuadrantTeeth('UL').map((tooth: any) => (
                    <div key={tooth.tooth_number} className="border border-gray-200 rounded-lg p-3">
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
                    <div key={tooth.tooth_number} className="border border-gray-200 rounded-lg p-3">
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
                    </div>
                  ))}
                </div>
              </div>

              {/* Lower Right */}
              <div>
                <p className="text-sm font-medium text-gray-600 text-center mb-3">Right</p>
                <div className="space-y-2">
                  {getQuadrantTeeth('LR').reverse().map((tooth: any) => (
                    <div key={tooth.tooth_number} className="border border-gray-200 rounded-lg p-3">
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
    </div>
  );
}
