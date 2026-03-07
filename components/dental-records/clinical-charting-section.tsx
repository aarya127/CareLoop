'use client';

/**
 * Clinical Charting Section
 * Interactive 32-tooth chart with Universal numbering system
 * Tooth condition tracking, surface charting, and treatment planning
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  XCircle,
  Crown,
  Zap,
  Plus,
  Search,
  Filter,
  Sparkles,
  FileText,
  DollarSign,
} from 'lucide-react';
import type { ClinicalChart, ToothRecord } from '@/lib/types/dental-record';

interface ClinicalChartingSectionProps {
  patientId: string;
  clinicalChart: ClinicalChart;
  onUpdate?: (updates: Partial<ClinicalChart>) => void;
}

// Tooth names for Universal numbering system (1-32)
const toothNames: Record<number, string> = {
  1: 'UR Third Molar', 2: 'UR Second Molar', 3: 'UR First Molar', 4: 'UR Second Premolar',
  5: 'UR First Premolar', 6: 'UR Canine', 7: 'UR Lateral Incisor', 8: 'UR Central Incisor',
  9: 'UL Central Incisor', 10: 'UL Lateral Incisor', 11: 'UL Canine', 12: 'UL First Premolar',
  13: 'UL Second Premolar', 14: 'UL First Molar', 15: 'UL Second Molar', 16: 'UL Third Molar',
  17: 'LL Third Molar', 18: 'LL Second Molar', 19: 'LL First Molar', 20: 'LL Second Premolar',
  21: 'LL First Premolar', 22: 'LL Canine', 23: 'LL Lateral Incisor', 24: 'LL Central Incisor',
  25: 'LR Central Incisor', 26: 'LR Lateral Incisor', 27: 'LR Canine', 28: 'LR First Premolar',
  29: 'LR Second Premolar', 30: 'LR First Molar', 31: 'LR Second Molar', 32: 'LR Third Molar',
};

export default function ClinicalChartingSection({
  patientId,
  clinicalChart,
  onUpdate,
}: ClinicalChartingSectionProps) {
  const [selectedTooth, setSelectedTooth] = useState<ToothRecord | null>(null);
  const [viewMode, setViewMode] = useState<'chart' | 'list'>('chart');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Tooth status colors and icons
  const statusConfig = {
    healthy: { color: 'bg-green-500', bgLight: 'bg-green-100', textColor: 'text-green-800', icon: CheckCircle2, label: 'Healthy' },
    decayed: { color: 'bg-red-500', bgLight: 'bg-red-100', textColor: 'text-red-800', icon: AlertCircle, label: 'Decayed' },
    filled: { color: 'bg-blue-500', bgLight: 'bg-blue-100', textColor: 'text-blue-800', icon: Circle, label: 'Filled' },
    crowned: { color: 'bg-yellow-500', bgLight: 'bg-yellow-100', textColor: 'text-yellow-800', icon: Crown, label: 'Crowned' },
    missing: { color: 'bg-gray-400', bgLight: 'bg-gray-100', textColor: 'text-gray-800', icon: XCircle, label: 'Missing' },
    implant: { color: 'bg-purple-500', bgLight: 'bg-purple-100', textColor: 'text-purple-800', icon: Zap, label: 'Implant' },
    bridge: { color: 'bg-indigo-500', bgLight: 'bg-indigo-100', textColor: 'text-indigo-800', icon: Circle, label: 'Bridge' },
    root_canal: { color: 'bg-orange-500', bgLight: 'bg-orange-100', textColor: 'text-orange-800', icon: Zap, label: 'Root Canal' },
  };

  // Urgency colors
  const urgencyColors = {
    routine: 'border-green-300 bg-green-50',
    soon: 'border-yellow-300 bg-yellow-50',
    urgent: 'border-orange-300 bg-orange-50',
    emergency: 'border-red-300 bg-red-50',
  };

  // Get teeth by quadrant
  const getQuadrantTeeth = (quadrant: 'UR' | 'UL' | 'LL' | 'LR') => {
    const ranges = {
      UR: [1, 2, 3, 4, 5, 6, 7, 8],
      UL: [9, 10, 11, 12, 13, 14, 15, 16],
      LL: [17, 18, 19, 20, 21, 22, 23, 24],
      LR: [25, 26, 27, 28, 29, 30, 31, 32],
    };
    return ranges[quadrant].map(num => {
      const found = clinicalChart.teeth.find(t => t.tooth_number === num);
      if (found) return found;
      
      return {
        tooth_number: num,
        status: 'healthy' as const,
        tooth_name: toothNames[num],
        color_code: '#10b981', // green-500 for healthy
      } as ToothRecord;
    });
  };

  // Filter teeth
  const filteredTeeth = filterStatus === 'all'
    ? clinicalChart.teeth
    : clinicalChart.teeth.filter(t => t.status === filterStatus);

  // Stats
  const stats = {
    healthy: clinicalChart.teeth.filter(t => t.status === 'healthy').length,
    decayed: clinicalChart.teeth.filter(t => t.status === 'decayed').length,
    filled: clinicalChart.teeth.filter(t => t.status === 'filled').length,
    missing: clinicalChart.teeth.filter(t => t.status === 'missing').length,
    needsTreatment: clinicalChart.teeth.filter(t => t.treatment_recommended).length,
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
              <p className="text-sm text-gray-600">Decayed</p>
              <p className="text-2xl font-bold text-red-600">{stats.decayed}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Filled</p>
              <p className="text-2xl font-bold text-blue-600">{stats.filled}</p>
            </div>
            <Circle className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Missing</p>
              <p className="text-2xl font-bold text-gray-600">{stats.missing}</p>
            </div>
            <XCircle className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Needs Treatment</p>
              <p className="text-2xl font-bold text-orange-600">{stats.needsTreatment}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* View Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('chart')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'chart'
                  ? 'bg-sky-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Chart View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-sky-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              List View
            </button>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">All Teeth</option>
            <option value="healthy">Healthy Only</option>
            <option value="decayed">Decayed Only</option>
            <option value="filled">Filled Only</option>
            <option value="crowned">Crowned Only</option>
            <option value="missing">Missing Only</option>
          </select>
        </div>
      </div>

      {viewMode === 'chart' ? (
        /* Interactive Tooth Chart */
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6 text-center">
            Universal Numbering System (1-32)
          </h3>

          <div className="space-y-8">
            {/* Upper Jaw */}
            <div>
              <p className="text-sm font-semibold text-gray-600 text-center mb-4">UPPER JAW</p>
              <div className="grid grid-cols-2 gap-8">
                {/* Upper Right */}
                <div>
                  <p className="text-xs text-gray-500 text-center mb-2">Right</p>
                  <div className="grid grid-cols-8 gap-1">
                    {getQuadrantTeeth('UR').map((tooth) => {
                      const config = statusConfig[tooth.status];
                      const Icon = config.icon;
                      return (
                        <motion.button
                          key={tooth.tooth_number}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedTooth(tooth)}
                          className={`aspect-square rounded-lg ${config.color} hover:opacity-80 transition-all relative group`}
                          title={`#${tooth.tooth_number}: ${tooth.tooth_name || toothNames[tooth.tooth_number]}`}
                        >
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                            <span className="text-xs font-bold">{tooth.tooth_number}</span>
                            <Icon className="w-4 h-4 mt-0.5" />
                          </div>
                          {tooth.treatment_recommended && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Upper Left */}
                <div>
                  <p className="text-xs text-gray-500 text-center mb-2">Left</p>
                  <div className="grid grid-cols-8 gap-1">
                    {getQuadrantTeeth('UL').map((tooth) => {
                      const config = statusConfig[tooth.status];
                      const Icon = config.icon;
                      return (
                        <motion.button
                          key={tooth.tooth_number}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedTooth(tooth)}
                          className={`aspect-square rounded-lg ${config.color} hover:opacity-80 transition-all relative group`}
                          title={`#${tooth.tooth_number}: ${tooth.tooth_name || toothNames[tooth.tooth_number]}`}
                        >
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                            <span className="text-xs font-bold">{tooth.tooth_number}</span>
                            <Icon className="w-4 h-4 mt-0.5" />
                          </div>
                          {tooth.treatment_recommended && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t-2 border-gray-300 my-4" />

            {/* Lower Jaw */}
            <div>
              <p className="text-sm font-semibold text-gray-600 text-center mb-4">LOWER JAW</p>
              <div className="grid grid-cols-2 gap-8">
                {/* Lower Left */}
                <div className="order-2 md:order-1">
                  <p className="text-xs text-gray-500 text-center mb-2">Left</p>
                  <div className="grid grid-cols-8 gap-1">
                    {getQuadrantTeeth('LL').reverse().map((tooth) => {
                      const config = statusConfig[tooth.status];
                      const Icon = config.icon;
                      return (
                        <motion.button
                          key={tooth.tooth_number}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedTooth(tooth)}
                          className={`aspect-square rounded-lg ${config.color} hover:opacity-80 transition-all relative group`}
                          title={`#${tooth.tooth_number}: ${tooth.tooth_name || toothNames[tooth.tooth_number]}`}
                        >
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                            <span className="text-xs font-bold">{tooth.tooth_number}</span>
                            <Icon className="w-4 h-4 mt-0.5" />
                          </div>
                          {tooth.treatment_recommended && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Lower Right */}
                <div className="order-1 md:order-2">
                  <p className="text-xs text-gray-500 text-center mb-2">Right</p>
                  <div className="grid grid-cols-8 gap-1">
                    {getQuadrantTeeth('LR').reverse().map((tooth) => {
                      const config = statusConfig[tooth.status];
                      const Icon = config.icon;
                      return (
                        <motion.button
                          key={tooth.tooth_number}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedTooth(tooth)}
                          className={`aspect-square rounded-lg ${config.color} hover:opacity-80 transition-all relative group`}
                          title={`#${tooth.tooth_number}: ${tooth.tooth_name || toothNames[tooth.tooth_number]}`}
                        >
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                            <span className="text-xs font-bold">{tooth.tooth_number}</span>
                            <Icon className="w-4 h-4 mt-0.5" />
                          </div>
                          {tooth.treatment_recommended && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-3">Legend:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(statusConfig).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <div key={key} className="flex items-center space-x-2">
                    <div className={`w-6 h-6 ${config.color} rounded flex items-center justify-center`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm text-gray-700">{config.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Tooth Status List</h3>
          <div className="space-y-3">
            {filteredTeeth.map((tooth) => {
              const config = statusConfig[tooth.status];
              const Icon = config.icon;
              return (
                <motion.div
                  key={tooth.tooth_number}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-4 rounded-lg border-2 ${tooth.treatment_recommended ? urgencyColors[tooth.urgency || 'routine'] : 'border-gray-200'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className={`w-12 h-12 ${config.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <div className="text-center text-white">
                          <p className="text-xs font-bold">{tooth.tooth_number}</p>
                          <Icon className="w-5 h-5 mx-auto" />
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {tooth.tooth_name || toothNames[tooth.tooth_number]}
                        </h4>
                        <p className={`text-sm font-medium mb-2 ${config.textColor}`}>
                          Status: {config.label}
                        </p>
                        
                        {tooth.surfaces_affected && tooth.surfaces_affected.length > 0 && (
                          <p className="text-sm text-gray-600 mb-1">
                            Surfaces: {tooth.surfaces_affected.join(', ')}
                          </p>
                        )}
                        
                        {tooth.treatment_recommended && (
                          <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded">
                            <p className="text-sm font-medium text-orange-900">
                              Recommended: {tooth.treatment_recommended}
                            </p>
                            {tooth.urgency && (
                              <p className="text-xs text-orange-700 mt-1">
                                Urgency: {tooth.urgency.toUpperCase()}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Treatment Plans */}
      {clinicalChart.treatment_plans && clinicalChart.treatment_plans.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Treatment Plans</h3>
                <p className="text-sm text-gray-500">{clinicalChart.treatment_plans.length} active plans</p>
              </div>
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
              <Plus className="w-4 h-4" />
              <span>New Plan</span>
            </button>
          </div>

          <div className="space-y-4">
            {clinicalChart.treatment_plans.map((plan: any, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg border border-purple-200 bg-gradient-to-br from-purple-50 to-white"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{plan.title || 'Treatment Plan'}</h4>
                    <p className="text-sm text-gray-600">{plan.description}</p>
                  </div>
                  {plan.total_cost && (
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Estimated Cost</p>
                      <p className="text-lg font-bold text-purple-600">${plan.total_cost.toFixed(2)}</p>
                    </div>
                  )}
                </div>
                
                {plan.procedures && (
                  <div className="space-y-2">
                    {plan.procedures.map((proc: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-sm p-2 bg-white rounded">
                        <span className="text-gray-700">{proc.name}</span>
                        {proc.cost && <span className="text-gray-600 font-medium">${proc.cost.toFixed(2)}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* AI Suggestions */}
      {clinicalChart.ai_suggestions && clinicalChart.ai_suggestions.length > 0 && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-200 p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <Sparkles className="w-6 h-6 text-indigo-600" />
            <h3 className="text-lg font-bold text-gray-900">AI Treatment Suggestions</h3>
          </div>

          <div className="space-y-3">
            {clinicalChart.ai_suggestions.map((suggestion: any, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-white rounded-lg border border-indigo-200"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 mb-1">{suggestion.suggestion}</p>
                    <p className="text-xs text-gray-600">{suggestion.reason}</p>
                    {suggestion.confidence && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span>Confidence</span>
                          <span>{suggestion.confidence}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full transition-all"
                            style={{ width: `${suggestion.confidence}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Tooth Detail Modal */}
      <AnimatePresence>
        {selectedTooth && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedTooth(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Tooth #{selectedTooth.tooth_number}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedTooth.tooth_name || toothNames[selectedTooth.tooth_number]}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTooth(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="space-y-4">
                <div className={`p-3 rounded-lg ${statusConfig[selectedTooth.status].bgLight}`}>
                  <p className="text-sm font-medium text-gray-700">Status</p>
                  <p className={`text-lg font-bold ${statusConfig[selectedTooth.status].textColor}`}>
                    {statusConfig[selectedTooth.status].label}
                  </p>
                </div>

                {selectedTooth.surfaces_affected && selectedTooth.surfaces_affected.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Affected Surfaces</p>
                    <div className="flex space-x-2">
                      {selectedTooth.surfaces_affected.map(surface => (
                        <span key={surface} className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                          {surface}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTooth.treatment_recommended && (
                  <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-1">Recommended Treatment</p>
                    <p className="text-base font-semibold text-orange-900">{selectedTooth.treatment_recommended}</p>
                    {selectedTooth.urgency && (
                      <p className="text-sm text-orange-700 mt-2">
                        Urgency: <span className="font-bold uppercase">{selectedTooth.urgency}</span>
                      </p>
                    )}
                  </div>
                )}

                <div className="flex space-x-3">
                  <button className="flex-1 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors">
                    Edit Details
                  </button>
                  <button className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                    Add Note
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
