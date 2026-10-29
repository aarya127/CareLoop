import type {
  AdministrativeDocuments,
  ClinicalChart,
  MedicalHistory,
  PeriodontalRecords,
  ToothMeasurement,
} from '../types/dental-record';

// Blank records for patients with nothing saved yet. They must contain no
// invented clinical facts — absent sections stay undefined so the UI can say
// "not recorded" instead of implying a value (e.g. "never smoked").

export function emptyMedicalHistory(patientId: string): MedicalHistory {
  return {
    patient_id: patientId,
    allergies: [],
    current_medications: [],
    systemic_conditions: [],
    past_surgeries: [],
    family_health_history: [],
  };
}

export function emptyClinicalChart(patientId: string): ClinicalChart {
  return { patient_id: patientId, last_updated: '', teeth: [], treatment_plans: [] };
}

export function emptyPeriodontalRecords(patientId: string): PeriodontalRecords {
  return { patient_id: patientId, exams: [], treatment_history: [] };
}

export function emptyAdminDocuments(patientId: string): AdministrativeDocuments {
  return { patient_id: patientId, documents: [] };
}

/** A 32-tooth, 6-site template for a first periodontal exam. 0 mm = not yet probed. */
export function blankPerioMeasurements(): ToothMeasurement[] {
  return Array.from({ length: 32 }, (_, i) => ({
    tooth_number: i + 1,
    pocket_depths: [0, 0, 0, 0, 0, 0],
    bleeding_on_probing: [false, false, false, false, false, false],
    recession_mm: [0, 0, 0, 0, 0, 0],
    mobility_grade: 0,
  }));
}
