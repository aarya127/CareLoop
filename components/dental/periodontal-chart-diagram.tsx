'use client';

import { motion } from 'framer-motion';
import { Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PeriodontalReading {
  toothNumber: number;
  pocketDepths: [number, number, number, number, number, number]; // Mesial-Buccal, Buccal, Distal-Buccal, Mesial-Lingual, Lingual, Distal-Lingual (in mm)
  gingivalIndex: [number, number, number, number]; // 0-3 scale for each quadrant
  bleedingPoints: [boolean, boolean, boolean, boolean, boolean, boolean]; // Corresponds to pocket depth measurements
  mobility?: number; // 0-3 scale
  furcation?: number; // 0-3 scale
  notes?: string;
}

interface PeriodontalChartDiagramProps {
  readings: PeriodontalReading[];
  className?: string;
  showLegend?: boolean;
  interactive?: boolean;
}

export default function PeriodontalChartDiagram({
  readings,
  className,
  showLegend = true,
  interactive = true,
}: PeriodontalChartDiagramProps) {
  
  // Get severity level based on pocket depth
  const getSeverityLevel = (depth: number): 'healthy' | 'mild' | 'moderate' | 'severe' => {
    if (depth <= 3) return 'healthy';
    if (depth <= 4) return 'mild';
    if (depth <= 6) return 'moderate';
    return 'severe';
  };

  // Get color for pocket depth
  const getDepthColor = (depth: number): string => {
    const severity = getSeverityLevel(depth);
    switch (severity) {
      case 'healthy':
        return '#34C759'; // Green
      case 'mild':
        return '#FFD60A'; // Yellow
      case 'moderate':
        return '#FF9500'; // Orange
      case 'severe':
        return '#FF3B30'; // Red
    }
  };

  // Universal tooth numbering system
  // Upper: 1-16 (right to left)
  // Lower: 17-32 (left to right)
  const upperTeeth = Array.from({ length: 16 }, (_, i) => i + 1);
  const lowerTeeth = Array.from({ length: 16 }, (_, i) => i + 17);

  const getToothReading = (toothNumber: number): PeriodontalReading | undefined => {
    return readings.find(r => r.toothNumber === toothNumber);
  };

  const renderTooth = (toothNumber: number, isUpper: boolean) => {
    const reading = getToothReading(toothNumber);
    
    if (!reading) {
      return (
        <div
          key={toothNumber}
          className="flex flex-col items-center gap-1 opacity-30"
        >
          <div className="text-[10px] text-gray-400 font-mono">{toothNumber}</div>
          <div className="w-8 h-12 rounded-sm bg-gray-100 border border-gray-200" />
          <div className="text-[10px] text-gray-400">-</div>
        </div>
      );
    }

    // Calculate average pocket depth
    const avgDepth = reading.pocketDepths.reduce((a, b) => a + b, 0) / reading.pocketDepths.length;
    const severity = getSeverityLevel(avgDepth);
    const hasAlerts = reading.mobility && reading.mobility > 0 || reading.furcation && reading.furcation > 0;
    const hasBleedingPoints = reading.bleedingPoints.some(bp => bp);

    // Tooth measurements
    // For upper teeth: [Distal-Buccal, Buccal, Mesial-Buccal] on top, [Distal-Lingual, Lingual, Mesial-Lingual] on bottom
    // For lower teeth: [Mesial-Buccal, Buccal, Distal-Buccal] on top, [Mesial-Lingual, Lingual, Distal-Lingual] on bottom
    const facialMeasurements = isUpper 
      ? [reading.pocketDepths[2], reading.pocketDepths[1], reading.pocketDepths[0]] // Distal to Mesial
      : [reading.pocketDepths[0], reading.pocketDepths[1], reading.pocketDepths[2]]; // Mesial to Distal
    
    const lingualMeasurements = isUpper
      ? [reading.pocketDepths[5], reading.pocketDepths[4], reading.pocketDepths[3]] // Distal to Mesial
      : [reading.pocketDepths[3], reading.pocketDepths[4], reading.pocketDepths[5]]; // Mesial to Distal

    const facialBleeding = isUpper
      ? [reading.bleedingPoints[2], reading.bleedingPoints[1], reading.bleedingPoints[0]]
      : [reading.bleedingPoints[0], reading.bleedingPoints[1], reading.bleedingPoints[2]];

    const lingualBleeding = isUpper
      ? [reading.bleedingPoints[5], reading.bleedingPoints[4], reading.bleedingPoints[3]]
      : [reading.bleedingPoints[3], reading.bleedingPoints[4], reading.bleedingPoints[5]];

    return (
      <motion.div
        key={toothNumber}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'flex flex-col items-center gap-1 relative',
          interactive && 'group cursor-pointer'
        )}
      >
        {/* Tooth Number */}
        <div className={cn(
          'text-[10px] font-mono font-semibold',
          severity === 'healthy' && 'text-gray-700',
          severity === 'mild' && 'text-yellow-700',
          severity === 'moderate' && 'text-orange-700',
          severity === 'severe' && 'text-red-700'
        )}>
          {toothNumber}
        </div>

        {/* Facial/Buccal Measurements */}
        <div className="flex gap-0.5 items-end justify-center w-full">
          {facialMeasurements.map((depth, idx) => (
            <div key={`facial-${idx}`} className="flex flex-col items-center">
              <div 
                className={cn(
                  'text-[9px] font-semibold font-mono px-0.5 rounded',
                  facialBleeding[idx] && 'bg-red-100 text-red-700'
                )}
                style={{ color: facialBleeding[idx] ? undefined : getDepthColor(depth) }}
              >
                {depth}
              </div>
              {facialBleeding[idx] && (
                <div className="w-1 h-1 rounded-full bg-red-500" />
              )}
            </div>
          ))}
        </div>

        {/* Tooth Visual */}
        <div className="relative">
          <div 
            className={cn(
              'w-8 h-12 rounded-sm border-2 transition-all',
              severity === 'healthy' && 'bg-green-50 border-green-300',
              severity === 'mild' && 'bg-yellow-50 border-yellow-300',
              severity === 'moderate' && 'bg-orange-50 border-orange-300',
              severity === 'severe' && 'bg-red-50 border-red-300',
              interactive && 'group-hover:scale-110 group-hover:shadow-lg'
            )}
          />
          {hasAlerts && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-2 h-2 text-white" />
            </div>
          )}
        </div>

        {/* Lingual/Palatal Measurements */}
        <div className="flex gap-0.5 items-start justify-center w-full">
          {lingualMeasurements.map((depth, idx) => (
            <div key={`lingual-${idx}`} className="flex flex-col items-center">
              {lingualBleeding[idx] && (
                <div className="w-1 h-1 rounded-full bg-red-500" />
              )}
              <div 
                className={cn(
                  'text-[9px] font-semibold font-mono px-0.5 rounded',
                  lingualBleeding[idx] && 'bg-red-100 text-red-700'
                )}
                style={{ color: lingualBleeding[idx] ? undefined : getDepthColor(depth) }}
              >
                {depth}
              </div>
            </div>
          ))}
        </div>

        {/* Average Depth */}
        <div className="text-[9px] text-gray-600 font-medium">
          {avgDepth.toFixed(1)}mm
        </div>

        {/* Tooltip on Hover (Interactive Mode) */}
        {interactive && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            whileHover={{ opacity: 1, y: 0, scale: 1 }}
            className="absolute bottom-full mb-2 z-10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity"
          >
            <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl min-w-[200px]">
              <div className="font-semibold mb-2">Tooth #{toothNumber}</div>
              <div className="space-y-1">
                <div className="flex justify-between gap-4">
                  <span className="text-gray-300">Avg Depth:</span>
                  <span className="font-semibold">{avgDepth.toFixed(1)} mm</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-300">Status:</span>
                  <span className={cn(
                    'font-semibold capitalize',
                    severity === 'healthy' && 'text-green-400',
                    severity === 'mild' && 'text-yellow-400',
                    severity === 'moderate' && 'text-orange-400',
                    severity === 'severe' && 'text-red-400'
                  )}>
                    {severity}
                  </span>
                </div>
                {hasBleedingPoints && (
                  <div className="flex items-center gap-2 text-red-400">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <span>Bleeding detected</span>
                  </div>
                )}
                {reading.mobility && reading.mobility > 0 && (
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-300">Mobility:</span>
                    <span className="font-semibold">Class {reading.mobility}</span>
                  </div>
                )}
                {reading.furcation && reading.furcation > 0 && (
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-300">Furcation:</span>
                    <span className="font-semibold">Class {reading.furcation}</span>
                  </div>
                )}
                {reading.notes && (
                  <div className="pt-2 mt-2 border-t border-gray-700 text-gray-300 text-[10px]">
                    {reading.notes}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    );
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Chart Title */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Periodontal Charting</h3>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Info className="w-4 h-4" />
          <span>Hover over teeth for details</span>
        </div>
      </div>

      {/* Upper Arch */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-sm font-semibold text-gray-700 mb-4 text-center">
          Upper Arch (Maxilla)
        </div>
        <div className="flex justify-center gap-1 overflow-x-auto pb-2">
          {upperTeeth.map(tooth => renderTooth(tooth, true))}
        </div>
      </div>

      {/* Lower Arch */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-sm font-semibold text-gray-700 mb-4 text-center">
          Lower Arch (Mandible)
        </div>
        <div className="flex justify-center gap-1 overflow-x-auto pb-2">
          {lowerTeeth.map(tooth => renderTooth(tooth, false))}
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pocket Depth Legend */}
            <div>
              <div className="text-sm font-semibold text-gray-900 mb-3">Pocket Depth (mm)</div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#34C759' }} />
                  <span className="text-sm text-gray-700">0-3mm: Healthy</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FFD60A' }} />
                  <span className="text-sm text-gray-700">4mm: Mild Gingivitis</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FF9500' }} />
                  <span className="text-sm text-gray-700">5-6mm: Moderate Periodontitis</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FF3B30' }} />
                  <span className="text-sm text-gray-700">7+mm: Severe Periodontitis</span>
                </div>
              </div>
            </div>

            {/* Indicator Legend */}
            <div>
              <div className="text-sm font-semibold text-gray-900 mb-3">Indicators</div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-sm text-gray-700">Bleeding on Probing (BOP)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-2 h-2 text-white" />
                  </div>
                  <span className="text-sm text-gray-700">Mobility or Furcation Issue</span>
                </div>
                <div className="text-xs text-gray-600 mt-3 pt-3 border-t border-gray-200">
                  <strong>Reading Format:</strong> Top values = Facial/Buccal side, Bottom values = Lingual/Palatal side
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Statistics */}
      {readings.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Teeth Charted</div>
            <div className="text-2xl font-bold text-gray-900">{readings.length}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Avg Depth</div>
            <div className="text-2xl font-bold text-gray-900">
              {(readings.reduce((sum, r) => sum + r.pocketDepths.reduce((a, b) => a + b, 0) / r.pocketDepths.length, 0) / readings.length).toFixed(1)}mm
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Bleeding Sites</div>
            <div className="text-2xl font-bold text-red-600">
              {readings.reduce((sum, r) => sum + r.bleedingPoints.filter(bp => bp).length, 0)}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Health Score</div>
            <div className="text-2xl font-bold text-green-600">
              {Math.round(readings.filter(r => r.pocketDepths.every(d => d <= 3)).length / readings.length * 100)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
