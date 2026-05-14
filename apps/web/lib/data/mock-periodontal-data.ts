/**
 * Mock Periodontal Charting Data
 * Sample periodontal readings for patient dental records
 */

interface PeriodontalReading {
  toothNumber: number;
  pocketDepths: [number, number, number, number, number, number]; // Mesial-Buccal, Buccal, Distal-Buccal, Mesial-Lingual, Lingual, Distal-Lingual (in mm)
  gingivalIndex: [number, number, number, number]; // 0-3 scale for each quadrant
  bleedingPoints: [boolean, boolean, boolean, boolean, boolean, boolean]; // Corresponds to pocket depth measurements
  mobility?: number; // 0-3 scale
  furcation?: number; // 0-3 scale
  notes?: string;
}

// Healthy periodontal profile (for young, healthy patients)
export const healthyPeriodontalProfile: PeriodontalReading[] = [
  // Upper Right Quadrant (1-8)
  { toothNumber: 1, pocketDepths: [2, 2, 2, 2, 2, 2], gingivalIndex: [0, 0, 0, 0], bleedingPoints: [false, false, false, false, false, false] },
  { toothNumber: 2, pocketDepths: [2, 2, 2, 2, 2, 2], gingivalIndex: [0, 0, 0, 0], bleedingPoints: [false, false, false, false, false, false] },
  { toothNumber: 3, pocketDepths: [2, 2, 3, 2, 2, 2], gingivalIndex: [0, 0, 0, 0], bleedingPoints: [false, false, false, false, false, false] },
  { toothNumber: 4, pocketDepths: [2, 2, 2, 2, 2, 2], gingivalIndex: [0, 0, 0, 0], bleedingPoints: [false, false, false, false, false, false] },
  { toothNumber: 5, pocketDepths: [2, 2, 2, 2, 2, 2], gingivalIndex: [0, 0, 0, 0], bleedingPoints: [false, false, false, false, false, false] },
  { toothNumber: 6, pocketDepths: [3, 3, 2, 3, 3, 2], gingivalIndex: [0, 0, 0, 0], bleedingPoints: [false, false, false, false, false, false] },
  { toothNumber: 7, pocketDepths: [2, 2, 2, 2, 2, 2], gingivalIndex: [0, 0, 0, 0], bleedingPoints: [false, false, false, false, false, false] },
  { toothNumber: 8, pocketDepths: [2, 3, 2, 2, 3, 2], gingivalIndex: [0, 0, 0, 0], bleedingPoints: [false, false, false, false, false, false] },
  
  // Upper Left Quadrant (9-16)
  { toothNumber: 9, pocketDepths: [2, 3, 2, 2, 3, 2], gingivalIndex: [0, 0, 0, 0], bleedingPoints: [false, false, false, false, false, false] },
  { toothNumber: 10, pocketDepths: [2, 2, 2, 2, 2, 2], gingivalIndex: [0, 0, 0, 0], bleedingPoints: [false, false, false, false, false, false] },
  { toothNumber: 11, pocketDepths: [3, 3, 2, 3, 3, 2], gingivalIndex: [0, 0, 0, 0], bleedingPoints: [false, false, false, false, false, false] },
  { toothNumber: 12, pocketDepths: [2, 2, 2, 2, 2, 2], gingivalIndex: [0, 0, 0, 0], bleedingPoints: [false, false, false, false, false, false] },
  { toothNumber: 13, pocketDepths: [2, 2, 2, 2, 2, 2], gingivalIndex: [0, 0, 0, 0], bleedingPoints: [false, false, false, false, false, false] },
  { toothNumber: 14, pocketDepths: [2, 2, 3, 2, 2, 2], gingivalIndex: [0, 0, 0, 0], bleedingPoints: [false, false, false, false, false, false] },
  { toothNumber: 15, pocketDepths: [2, 2, 2, 2, 2, 2], gingivalIndex: [0, 0, 0, 0], bleedingPoints: [false, false, false, false, false, false] },
  { toothNumber: 16, pocketDepths: [2, 2, 2, 2, 2, 2], gingivalIndex: [0, 0, 0, 0], bleedingPoints: [false, false, false, false, false, false] },
  
  // Lower Left Quadrant (17-24)
  { toothNumber: 17, pocketDepths: [2, 2, 2, 2, 2, 2], gingivalIndex: [0, 0, 0, 0], bleedingPoints: [false, false, false, false, false, false] },
  { toothNumber: 18, pocketDepths: [2, 2, 2, 2, 2, 2], gingivalIndex: [0, 0, 0, 0], bleedingPoints: [false, false, false, false, false, false] },
  { toothNumber: 19, pocketDepths: [3, 2, 2, 3, 2, 2], gingivalIndex: [0, 0, 0, 0], bleedingPoints: [false, false, false, false, false, false] },
  { toothNumber: 20, pocketDepths: [2, 2, 2, 2, 2, 2], gingivalIndex: [0, 0, 0, 0], bleedingPoints: [false, false, false, false, false, false] },
  { toothNumber: 21, pocketDepths: [2, 2, 2, 2, 2, 2], gingivalIndex: [0, 0, 0, 0], bleedingPoints: [false, false, false, false, false, false] },
  { toothNumber: 22, pocketDepths: [3, 3, 2, 3, 3, 2], gingivalIndex: [0, 0, 0, 0], bleedingPoints: [false, false, false, false, false, false] },
  { toothNumber: 23, pocketDepths: [2, 2, 2, 2, 2, 2], gingivalIndex: [0, 0, 0, 0], bleedingPoints: [false, false, false, false, false, false] },
  { toothNumber: 24, pocketDepths: [2, 3, 2, 2, 3, 2], gingivalIndex: [0, 0, 0, 0], bleedingPoints: [false, false, false, false, false, false] },
  
  // Lower Right Quadrant (25-32)
  { toothNumber: 25, pocketDepths: [2, 3, 2, 2, 3, 2], gingivalIndex: [0, 0, 0, 0], bleedingPoints: [false, false, false, false, false, false] },
  { toothNumber: 26, pocketDepths: [2, 2, 2, 2, 2, 2], gingivalIndex: [0, 0, 0, 0], bleedingPoints: [false, false, false, false, false, false] },
  { toothNumber: 27, pocketDepths: [3, 3, 2, 3, 3, 2], gingivalIndex: [0, 0, 0, 0], bleedingPoints: [false, false, false, false, false, false] },
  { toothNumber: 28, pocketDepths: [2, 2, 2, 2, 2, 2], gingivalIndex: [0, 0, 0, 0], bleedingPoints: [false, false, false, false, false, false] },
  { toothNumber: 29, pocketDepths: [2, 2, 2, 2, 2, 2], gingivalIndex: [0, 0, 0, 0], bleedingPoints: [false, false, false, false, false, false] },
  { toothNumber: 30, pocketDepths: [3, 2, 2, 3, 2, 2], gingivalIndex: [0, 0, 0, 0], bleedingPoints: [false, false, false, false, false, false] },
  { toothNumber: 31, pocketDepths: [2, 2, 2, 2, 2, 2], gingivalIndex: [0, 0, 0, 0], bleedingPoints: [false, false, false, false, false, false] },
  { toothNumber: 32, pocketDepths: [2, 2, 2, 2, 2, 2], gingivalIndex: [0, 0, 0, 0], bleedingPoints: [false, false, false, false, false, false] },
];

// Mild gingivitis profile (some inflammation, bleeding on probing)
export const mildGingivitisProfile: PeriodontalReading[] = [
  // Upper Right Quadrant (1-8)
  { toothNumber: 1, pocketDepths: [3, 3, 3, 3, 3, 3], gingivalIndex: [1, 1, 1, 1], bleedingPoints: [false, true, false, false, true, false] },
  { toothNumber: 2, pocketDepths: [3, 4, 3, 3, 4, 3], gingivalIndex: [1, 1, 1, 1], bleedingPoints: [true, true, false, true, true, false] },
  { toothNumber: 3, pocketDepths: [3, 3, 4, 3, 3, 3], gingivalIndex: [1, 1, 1, 1], bleedingPoints: [false, false, true, false, false, true] },
  { toothNumber: 4, pocketDepths: [3, 3, 3, 3, 3, 3], gingivalIndex: [1, 1, 1, 1], bleedingPoints: [false, true, false, false, true, false] },
  { toothNumber: 5, pocketDepths: [3, 3, 3, 3, 3, 3], gingivalIndex: [1, 1, 1, 1], bleedingPoints: [true, false, false, true, false, false] },
  { toothNumber: 6, pocketDepths: [4, 4, 3, 4, 4, 3], gingivalIndex: [1, 1, 1, 1], bleedingPoints: [true, true, false, true, true, false] },
  { toothNumber: 7, pocketDepths: [3, 3, 3, 3, 3, 3], gingivalIndex: [1, 1, 1, 1], bleedingPoints: [false, true, false, false, true, false] },
  { toothNumber: 8, pocketDepths: [3, 4, 3, 3, 4, 3], gingivalIndex: [1, 1, 1, 1], bleedingPoints: [false, true, true, false, true, true] },
  
  // Upper Left Quadrant (9-16)
  { toothNumber: 9, pocketDepths: [3, 4, 3, 3, 4, 3], gingivalIndex: [1, 1, 1, 1], bleedingPoints: [false, true, true, false, true, true] },
  { toothNumber: 10, pocketDepths: [3, 3, 3, 3, 3, 3], gingivalIndex: [1, 1, 1, 1], bleedingPoints: [false, true, false, false, true, false] },
  { toothNumber: 11, pocketDepths: [4, 4, 3, 4, 4, 3], gingivalIndex: [1, 1, 1, 1], bleedingPoints: [true, true, false, true, true, false] },
  { toothNumber: 12, pocketDepths: [3, 3, 3, 3, 3, 3], gingivalIndex: [1, 1, 1, 1], bleedingPoints: [true, false, false, true, false, false] },
  { toothNumber: 13, pocketDepths: [3, 3, 3, 3, 3, 3], gingivalIndex: [1, 1, 1, 1], bleedingPoints: [false, true, false, false, true, false] },
  { toothNumber: 14, pocketDepths: [3, 3, 4, 3, 3, 3], gingivalIndex: [1, 1, 1, 1], bleedingPoints: [false, false, true, false, false, true] },
  { toothNumber: 15, pocketDepths: [3, 4, 3, 3, 4, 3], gingivalIndex: [1, 1, 1, 1], bleedingPoints: [true, true, false, true, true, false] },
  { toothNumber: 16, pocketDepths: [3, 3, 3, 3, 3, 3], gingivalIndex: [1, 1, 1, 1], bleedingPoints: [false, true, false, false, true, false] },
  
  // Lower Left Quadrant (17-24)
  { toothNumber: 17, pocketDepths: [3, 3, 3, 3, 3, 3], gingivalIndex: [1, 1, 1, 1], bleedingPoints: [false, true, false, false, true, false] },
  { toothNumber: 18, pocketDepths: [3, 4, 3, 3, 4, 3], gingivalIndex: [1, 1, 1, 1], bleedingPoints: [true, true, false, true, true, false] },
  { toothNumber: 19, pocketDepths: [4, 3, 3, 4, 3, 3], gingivalIndex: [1, 1, 1, 1], bleedingPoints: [true, false, false, true, false, false] },
  { toothNumber: 20, pocketDepths: [3, 3, 3, 3, 3, 3], gingivalIndex: [1, 1, 1, 1], bleedingPoints: [false, true, false, false, true, false] },
  { toothNumber: 21, pocketDepths: [3, 3, 3, 3, 3, 3], gingivalIndex: [1, 1, 1, 1], bleedingPoints: [true, false, false, true, false, false] },
  { toothNumber: 22, pocketDepths: [4, 4, 3, 4, 4, 3], gingivalIndex: [1, 1, 1, 1], bleedingPoints: [true, true, false, true, true, false] },
  { toothNumber: 23, pocketDepths: [3, 3, 3, 3, 3, 3], gingivalIndex: [1, 1, 1, 1], bleedingPoints: [false, true, false, false, true, false] },
  { toothNumber: 24, pocketDepths: [3, 4, 3, 3, 4, 3], gingivalIndex: [1, 1, 1, 1], bleedingPoints: [false, true, true, false, true, true] },
  
  // Lower Right Quadrant (25-32)
  { toothNumber: 25, pocketDepths: [3, 4, 3, 3, 4, 3], gingivalIndex: [1, 1, 1, 1], bleedingPoints: [false, true, true, false, true, true] },
  { toothNumber: 26, pocketDepths: [3, 3, 3, 3, 3, 3], gingivalIndex: [1, 1, 1, 1], bleedingPoints: [false, true, false, false, true, false] },
  { toothNumber: 27, pocketDepths: [4, 4, 3, 4, 4, 3], gingivalIndex: [1, 1, 1, 1], bleedingPoints: [true, true, false, true, true, false] },
  { toothNumber: 28, pocketDepths: [3, 3, 3, 3, 3, 3], gingivalIndex: [1, 1, 1, 1], bleedingPoints: [true, false, false, true, false, false] },
  { toothNumber: 29, pocketDepths: [3, 3, 3, 3, 3, 3], gingivalIndex: [1, 1, 1, 1], bleedingPoints: [false, true, false, false, true, false] },
  { toothNumber: 30, pocketDepths: [4, 3, 3, 4, 3, 3], gingivalIndex: [1, 1, 1, 1], bleedingPoints: [true, false, false, true, false, false] },
  { toothNumber: 31, pocketDepths: [3, 4, 3, 3, 4, 3], gingivalIndex: [1, 1, 1, 1], bleedingPoints: [true, true, false, true, true, false] },
  { toothNumber: 32, pocketDepths: [3, 3, 3, 3, 3, 3], gingivalIndex: [1, 1, 1, 1], bleedingPoints: [false, true, false, false, true, false] },
];

// Moderate periodontitis profile (bone loss, deeper pockets)
export const moderatePeriodonitisProfile: PeriodontalReading[] = [
  // Upper Right Quadrant (1-8)
  { toothNumber: 1, pocketDepths: [4, 5, 4, 4, 5, 4], gingivalIndex: [2, 2, 2, 2], bleedingPoints: [true, true, true, true, true, false], notes: 'Moderate inflammation' },
  { toothNumber: 2, pocketDepths: [5, 6, 5, 5, 6, 5], gingivalIndex: [2, 2, 2, 2], bleedingPoints: [true, true, true, true, true, true], notes: 'Bone loss evident' },
  { toothNumber: 3, pocketDepths: [4, 4, 5, 4, 4, 5], gingivalIndex: [2, 2, 2, 2], bleedingPoints: [true, false, true, true, false, true] },
  { toothNumber: 4, pocketDepths: [4, 5, 4, 4, 5, 4], gingivalIndex: [2, 2, 2, 2], bleedingPoints: [false, true, true, false, true, true] },
  { toothNumber: 5, pocketDepths: [5, 5, 4, 5, 5, 4], gingivalIndex: [2, 2, 2, 2], bleedingPoints: [true, true, true, true, true, false] },
  { toothNumber: 6, pocketDepths: [6, 6, 5, 6, 6, 5], gingivalIndex: [2, 2, 2, 2], bleedingPoints: [true, true, true, true, true, true], mobility: 1, furcation: 1, notes: 'Class I furcation involvement' },
  { toothNumber: 7, pocketDepths: [4, 5, 4, 4, 5, 4], gingivalIndex: [2, 2, 2, 2], bleedingPoints: [true, true, false, true, true, false] },
  { toothNumber: 8, pocketDepths: [5, 5, 5, 5, 5, 5], gingivalIndex: [2, 2, 2, 2], bleedingPoints: [true, true, true, true, true, true] },
  
  // Upper Left Quadrant (9-16)
  { toothNumber: 9, pocketDepths: [5, 5, 5, 5, 5, 5], gingivalIndex: [2, 2, 2, 2], bleedingPoints: [true, true, true, true, true, true] },
  { toothNumber: 10, pocketDepths: [4, 5, 4, 4, 5, 4], gingivalIndex: [2, 2, 2, 2], bleedingPoints: [true, true, false, true, true, false] },
  { toothNumber: 11, pocketDepths: [6, 6, 5, 6, 6, 5], gingivalIndex: [2, 2, 2, 2], bleedingPoints: [true, true, true, true, true, true], mobility: 1, furcation: 1, notes: 'Class I furcation involvement' },
  { toothNumber: 12, pocketDepths: [5, 5, 4, 5, 5, 4], gingivalIndex: [2, 2, 2, 2], bleedingPoints: [true, true, true, true, true, false] },
  { toothNumber: 13, pocketDepths: [4, 5, 4, 4, 5, 4], gingivalIndex: [2, 2, 2, 2], bleedingPoints: [false, true, true, false, true, true] },
  { toothNumber: 14, pocketDepths: [4, 4, 5, 4, 4, 5], gingivalIndex: [2, 2, 2, 2], bleedingPoints: [true, false, true, true, false, true] },
  { toothNumber: 15, pocketDepths: [5, 6, 5, 5, 6, 5], gingivalIndex: [2, 2, 2, 2], bleedingPoints: [true, true, true, true, true, true], notes: 'Bone loss evident' },
  { toothNumber: 16, pocketDepths: [4, 5, 4, 4, 5, 4], gingivalIndex: [2, 2, 2, 2], bleedingPoints: [true, true, true, true, true, false], notes: 'Moderate inflammation' },
  
  // Lower Left Quadrant (17-24)
  { toothNumber: 17, pocketDepths: [4, 5, 4, 4, 5, 4], gingivalIndex: [2, 2, 2, 2], bleedingPoints: [true, true, true, true, true, false] },
  { toothNumber: 18, pocketDepths: [5, 6, 5, 5, 6, 5], gingivalIndex: [2, 2, 2, 2], bleedingPoints: [true, true, true, true, true, true] },
  { toothNumber: 19, pocketDepths: [6, 5, 5, 6, 5, 5], gingivalIndex: [2, 2, 2, 2], bleedingPoints: [true, true, true, true, true, true], mobility: 1 },
  { toothNumber: 20, pocketDepths: [4, 5, 4, 4, 5, 4], gingivalIndex: [2, 2, 2, 2], bleedingPoints: [true, true, false, true, true, false] },
  { toothNumber: 21, pocketDepths: [5, 5, 4, 5, 5, 4], gingivalIndex: [2, 2, 2, 2], bleedingPoints: [true, true, true, true, true, false] },
  { toothNumber: 22, pocketDepths: [6, 6, 5, 6, 6, 5], gingivalIndex: [2, 2, 2, 2], bleedingPoints: [true, true, true, true, true, true], furcation: 1 },
  { toothNumber: 23, pocketDepths: [4, 5, 4, 4, 5, 4], gingivalIndex: [2, 2, 2, 2], bleedingPoints: [false, true, true, false, true, true] },
  { toothNumber: 24, pocketDepths: [5, 5, 5, 5, 5, 5], gingivalIndex: [2, 2, 2, 2], bleedingPoints: [true, true, true, true, true, true] },
  
  // Lower Right Quadrant (25-32)
  { toothNumber: 25, pocketDepths: [5, 5, 5, 5, 5, 5], gingivalIndex: [2, 2, 2, 2], bleedingPoints: [true, true, true, true, true, true] },
  { toothNumber: 26, pocketDepths: [4, 5, 4, 4, 5, 4], gingivalIndex: [2, 2, 2, 2], bleedingPoints: [false, true, true, false, true, true] },
  { toothNumber: 27, pocketDepths: [6, 6, 5, 6, 6, 5], gingivalIndex: [2, 2, 2, 2], bleedingPoints: [true, true, true, true, true, true], furcation: 1 },
  { toothNumber: 28, pocketDepths: [5, 5, 4, 5, 5, 4], gingivalIndex: [2, 2, 2, 2], bleedingPoints: [true, true, true, true, true, false] },
  { toothNumber: 29, pocketDepths: [4, 5, 4, 4, 5, 4], gingivalIndex: [2, 2, 2, 2], bleedingPoints: [true, true, false, true, true, false] },
  { toothNumber: 30, pocketDepths: [6, 5, 5, 6, 5, 5], gingivalIndex: [2, 2, 2, 2], bleedingPoints: [true, true, true, true, true, true], mobility: 1 },
  { toothNumber: 31, pocketDepths: [5, 6, 5, 5, 6, 5], gingivalIndex: [2, 2, 2, 2], bleedingPoints: [true, true, true, true, true, true] },
  { toothNumber: 32, pocketDepths: [4, 5, 4, 4, 5, 4], gingivalIndex: [2, 2, 2, 2], bleedingPoints: [true, true, true, true, true, false] },
];

// Severe periodontitis profile (advanced disease)
export const severePeriodonitisProfile: PeriodontalReading[] = [
  // Upper Right Quadrant (1-8) - some teeth missing
  { toothNumber: 2, pocketDepths: [7, 8, 7, 7, 8, 7], gingivalIndex: [3, 3, 3, 3], bleedingPoints: [true, true, true, true, true, true], mobility: 2, notes: 'Severe bone loss, consider extraction' },
  { toothNumber: 3, pocketDepths: [6, 7, 6, 6, 7, 6], gingivalIndex: [3, 3, 3, 3], bleedingPoints: [true, true, true, true, true, true], mobility: 1 },
  { toothNumber: 4, pocketDepths: [7, 7, 6, 7, 7, 6], gingivalIndex: [3, 3, 3, 3], bleedingPoints: [true, true, true, true, true, true], mobility: 2 },
  { toothNumber: 5, pocketDepths: [6, 6, 6, 6, 6, 6], gingivalIndex: [2, 2, 2, 2], bleedingPoints: [true, true, true, true, true, true] },
  { toothNumber: 6, pocketDepths: [8, 8, 7, 8, 8, 7], gingivalIndex: [3, 3, 3, 3], bleedingPoints: [true, true, true, true, true, true], mobility: 2, furcation: 2, notes: 'Class II furcation, severe mobility' },
  { toothNumber: 7, pocketDepths: [6, 7, 6, 6, 7, 6], gingivalIndex: [3, 3, 3, 3], bleedingPoints: [true, true, true, true, true, true], mobility: 1 },
  
  // Upper Left Quadrant (9-16) - some teeth missing
  { toothNumber: 10, pocketDepths: [6, 7, 6, 6, 7, 6], gingivalIndex: [3, 3, 3, 3], bleedingPoints: [true, true, true, true, true, true], mobility: 1 },
  { toothNumber: 11, pocketDepths: [8, 8, 7, 8, 8, 7], gingivalIndex: [3, 3, 3, 3], bleedingPoints: [true, true, true, true, true, true], mobility: 2, furcation: 2, notes: 'Class II furcation, severe mobility' },
  { toothNumber: 12, pocketDepths: [6, 6, 6, 6, 6, 6], gingivalIndex: [2, 2, 2, 2], bleedingPoints: [true, true, true, true, true, true] },
  { toothNumber: 13, pocketDepths: [7, 7, 6, 7, 7, 6], gingivalIndex: [3, 3, 3, 3], bleedingPoints: [true, true, true, true, true, true], mobility: 2 },
  { toothNumber: 14, pocketDepths: [6, 7, 6, 6, 7, 6], gingivalIndex: [3, 3, 3, 3], bleedingPoints: [true, true, true, true, true, true], mobility: 1 },
  { toothNumber: 15, pocketDepths: [7, 8, 7, 7, 8, 7], gingivalIndex: [3, 3, 3, 3], bleedingPoints: [true, true, true, true, true, true], mobility: 2, notes: 'Severe bone loss, consider extraction' },
  
  // Lower Left Quadrant (17-24)
  { toothNumber: 17, pocketDepths: [6, 7, 6, 6, 7, 6], gingivalIndex: [3, 3, 3, 3], bleedingPoints: [true, true, true, true, true, true], mobility: 1 },
  { toothNumber: 18, pocketDepths: [8, 8, 7, 8, 8, 7], gingivalIndex: [3, 3, 3, 3], bleedingPoints: [true, true, true, true, true, true], mobility: 2, furcation: 2 },
  { toothNumber: 19, pocketDepths: [7, 7, 6, 7, 7, 6], gingivalIndex: [3, 3, 3, 3], bleedingPoints: [true, true, true, true, true, true], mobility: 2 },
  { toothNumber: 20, pocketDepths: [6, 6, 6, 6, 6, 6], gingivalIndex: [2, 2, 2, 2], bleedingPoints: [true, true, true, true, true, true] },
  { toothNumber: 21, pocketDepths: [6, 7, 6, 6, 7, 6], gingivalIndex: [3, 3, 3, 3], bleedingPoints: [true, true, true, true, true, true], mobility: 1 },
  { toothNumber: 22, pocketDepths: [8, 8, 7, 8, 8, 7], gingivalIndex: [3, 3, 3, 3], bleedingPoints: [true, true, true, true, true, true], mobility: 2, furcation: 2 },
  { toothNumber: 23, pocketDepths: [7, 7, 6, 7, 7, 6], gingivalIndex: [3, 3, 3, 3], bleedingPoints: [true, true, true, true, true, true], mobility: 2 },
  { toothNumber: 24, pocketDepths: [6, 7, 6, 6, 7, 6], gingivalIndex: [3, 3, 3, 3], bleedingPoints: [true, true, true, true, true, true], mobility: 1 },
  
  // Lower Right Quadrant (25-32)
  { toothNumber: 25, pocketDepths: [6, 7, 6, 6, 7, 6], gingivalIndex: [3, 3, 3, 3], bleedingPoints: [true, true, true, true, true, true], mobility: 1 },
  { toothNumber: 26, pocketDepths: [7, 7, 6, 7, 7, 6], gingivalIndex: [3, 3, 3, 3], bleedingPoints: [true, true, true, true, true, true], mobility: 2 },
  { toothNumber: 27, pocketDepths: [8, 8, 7, 8, 8, 7], gingivalIndex: [3, 3, 3, 3], bleedingPoints: [true, true, true, true, true, true], mobility: 2, furcation: 2 },
  { toothNumber: 28, pocketDepths: [6, 7, 6, 6, 7, 6], gingivalIndex: [3, 3, 3, 3], bleedingPoints: [true, true, true, true, true, true], mobility: 1 },
  { toothNumber: 29, pocketDepths: [6, 6, 6, 6, 6, 6], gingivalIndex: [2, 2, 2, 2], bleedingPoints: [true, true, true, true, true, true] },
  { toothNumber: 30, pocketDepths: [7, 7, 6, 7, 7, 6], gingivalIndex: [3, 3, 3, 3], bleedingPoints: [true, true, true, true, true, true], mobility: 2 },
  { toothNumber: 31, pocketDepths: [6, 7, 6, 6, 7, 6], gingivalIndex: [3, 3, 3, 3], bleedingPoints: [true, true, true, true, true, true], mobility: 1 },
  { toothNumber: 32, pocketDepths: [7, 8, 7, 7, 8, 7], gingivalIndex: [3, 3, 3, 3], bleedingPoints: [true, true, true, true, true, true], mobility: 2, notes: 'Severe bone loss' },
];

// Export a function to get periodontal data by patient age/risk profile
export const getPeriodontalDataForPatient = (age: number, hasPeriodontalDisease: boolean = false): PeriodontalReading[] => {
  if (age < 30 && !hasPeriodontalDisease) {
    return healthyPeriodontalProfile;
  } else if (age < 45 || (hasPeriodontalDisease && age < 50)) {
    return mildGingivitisProfile;
  } else if (age < 60 || (hasPeriodontalDisease && age < 65)) {
    return moderatePeriodonitisProfile;
  } else {
    return severePeriodonitisProfile;
  }
};
