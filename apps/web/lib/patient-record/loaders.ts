import { documentsApi } from '../api/documents';
import {
  loadEmrMedicalSlices,
  loadEmrPerioExams,
  loadToothChartByNumber,
  mergeToothChart,
} from '../api/emr-mappers';
import { ApiError } from '../http/api-error';
import type {
  AdministrativeDocuments,
  ClinicalChart,
  MedicalHistory,
  PatientProfile,
  PeriodontalRecords,
  RadiographicRecord,
} from '../types/dental-record';
import {
  emptyAdminDocuments,
  emptyClinicalChart,
  emptyMedicalHistory,
  emptyPeriodontalRecords,
} from './empty-records';
import {
  classifyHttpStatus,
  failureFromError,
  readSectionResponse,
  readyState,
  type LoadFailure,
  type SectionResponse,
  type SectionState,
} from './load-state';
import { mergePersistedProfile, toPatientProfileFromApi, type ApiPatient } from './profile';

export type RecordSection =
  | 'profile'
  | 'clinicalChart'
  | 'periodontalRecords'
  | 'radiographicRecords'
  | 'adminDocuments';

export type PatientLoad =
  | { status: 'ready'; profile: PatientProfile; profileEditable: boolean }
  | { status: 'error'; reason: LoadFailure };

const opts: RequestInit = { credentials: 'include' };

async function getJson<T>(url: string): Promise<SectionResponse<T>> {
  try {
    return await readSectionResponse<T>(await fetch(url, opts));
  } catch {
    return { kind: 'error', reason: 'network' };
  }
}

const errorState = (reason: LoadFailure): SectionState<never> => ({ status: 'error', reason });

export function createRecordLoaders(apiBaseUrl: string, patientId: string) {
  const base = `${apiBaseUrl}/patients/${patientId}`;
  const section = <T>(name: RecordSection) => getJson<T>(`${base}/record-section/${name}`);

  async function put(url: string, payload: unknown): Promise<void> {
    const res = await fetch(url, {
      ...opts,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new ApiError(`Save failed (${res.status})`, res.status);
  }

  return {
    async loadPatient(): Promise<PatientLoad> {
      let res: Response;
      try {
        res = await fetch(base, opts);
      } catch {
        return { status: 'error', reason: 'network' };
      }
      const outcome = classifyHttpStatus(res.status);
      if (outcome !== 'ok') return { status: 'error', reason: outcome };
      const patient = (await res.json().catch(() => null)) as ApiPatient | null;
      if (!patient?.id) return { status: 'error', reason: 'not_found' };

      const saved = await section<Partial<PatientProfile>>('profile');
      return {
        status: 'ready',
        profile: mergePersistedProfile(
          toPatientProfileFromApi(patient),
          saved.kind === 'data' ? saved.data : null,
        ),
        // Saving over a profile section we failed to read could wipe saved email/address.
        profileEditable: saved.kind !== 'error',
      };
    },

    async loadHistory(): Promise<SectionState<MedicalHistory>> {
      const blob = await getJson<MedicalHistory>(`${base}/medical-history`);
      if (blob.kind === 'error') return errorState(blob.reason);
      try {
        const slices = await loadEmrMedicalSlices(patientId);
        const merged: MedicalHistory = {
          ...emptyMedicalHistory(patientId),
          ...(blob.kind === 'data' ? blob.data : {}),
          ...slices,
          patient_id: patientId,
        };
        const isEmpty =
          blob.kind === 'empty' &&
          !slices.allergies.length &&
          !slices.current_medications.length &&
          !slices.systemic_conditions.length;
        return readyState(merged, isEmpty);
      } catch (err) {
        return errorState(failureFromError(err));
      }
    },

    async loadChart(): Promise<SectionState<ClinicalChart>> {
      const saved = await section<ClinicalChart>('clinicalChart');
      if (saved.kind === 'error') return errorState(saved.reason);
      try {
        const emrTeeth = await loadToothChartByNumber(patientId);
        const chart: ClinicalChart = {
          ...emptyClinicalChart(patientId),
          ...(saved.kind === 'data' ? saved.data : {}),
        };
        return readyState(
          { ...chart, teeth: mergeToothChart(chart.teeth ?? [], emrTeeth) },
          saved.kind === 'empty' && emrTeeth.size === 0,
        );
      } catch (err) {
        return errorState(failureFromError(err));
      }
    },

    async loadPerio(): Promise<SectionState<PeriodontalRecords>> {
      const saved = await section<PeriodontalRecords>('periodontalRecords');
      if (saved.kind === 'error') return errorState(saved.reason);
      try {
        const exams = await loadEmrPerioExams(patientId);
        const records: PeriodontalRecords = {
          ...emptyPeriodontalRecords(patientId),
          ...(saved.kind === 'data' ? saved.data : {}),
        };
        return readyState(
          exams.length ? { ...records, exams } : records,
          saved.kind === 'empty' && exams.length === 0,
        );
      } catch (err) {
        return errorState(failureFromError(err));
      }
    },

    async loadAdminDocuments(): Promise<SectionState<AdministrativeDocuments>> {
      const saved = await section<AdministrativeDocuments>('adminDocuments');
      if (saved.kind === 'error') return errorState(saved.reason);
      return readyState(
        {
          ...emptyAdminDocuments(patientId),
          ...(saved.kind === 'data' ? saved.data : {}),
        },
        saved.kind === 'empty',
      );
    },

    /** Imaging lives in the Documents (S3) API; the legacy section list is used only when it has none. */
    async loadImaging(): Promise<SectionState<RadiographicRecord[]>> {
      const saved = await section<RadiographicRecord[]>('radiographicRecords');
      if (saved.kind === 'error') return errorState(saved.reason);
      const legacy = saved.kind === 'data' && Array.isArray(saved.data) ? saved.data : [];
      try {
        const docs = await documentsApi.listByPatient(patientId);
        const imaging = docs.filter(
          (d) => d.category === 'radiograph' || d.category === 'clinical_photo',
        );
        if (!imaging.length) return readyState(legacy, legacy.length === 0);
        const records = await Promise.all(
          imaging.map(async (d): Promise<RadiographicRecord> => {
            let url = '#';
            try {
              url = (await documentsApi.getDownloadUrl(d.id)).url;
            } catch {
              // URL resolution is per-file; the record itself still loaded.
            }
            return {
              id: d.id,
              type: d.category === 'clinical_photo' ? 'intraoral_photo' : 'periapical',
              file_url: url,
              thumbnail_url: url,
              date_taken: (d.uploadedAt ?? '').slice(0, 10),
              dentist_notes: d.fileName,
            };
          }),
        );
        return readyState(records, false);
      } catch (err) {
        return errorState(failureFromError(err));
      }
    },

    saveSection(name: RecordSection, payload: unknown): Promise<void> {
      return put(`${base}/record-section/${name}`, payload);
    },

    saveMedicalHistory(history: MedicalHistory): Promise<void> {
      return put(`${base}/medical-history`, history);
    },

    savePhone(phone: string): Promise<void> {
      return put(base, { phone: phone || null });
    },
  };
}

export type RecordLoaders = ReturnType<typeof createRecordLoaders>;
