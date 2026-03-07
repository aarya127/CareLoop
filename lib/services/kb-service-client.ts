/**
 * KB Service Client
 * Type-safe wrapper for patient data, insurance, clinical records
 */

import type {
  PatientSummary,
  InsuranceDetails,
  PeriodontalChartingData,
  DentalRecord,
  XRayImage,
  VisitRecord,
  DoctorNote,
  APIResponse,
  APIError,
  PaginatedResponse,
} from './api-types';
import { auditLog, trackUXClick, trackAPICall } from './audit-service';

// Configuration
const KB_SERVICE_BASE_URL = process.env.NEXT_PUBLIC_KB_SERVICE_URL || 'https://api.careloop.com/kb';
const DEFAULT_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // Start with 1 second

// Cache configuration
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // milliseconds
}

class KBServiceClient {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Make authenticated request with retry logic
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<APIResponse<T>> {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();

    try {
      // Get JWT token from localStorage
      const token = typeof window !== 'undefined' 
        ? localStorage.getItem('auth_token') 
        : null;

      if (!token) {
        throw new Error('No authentication token found');
      }

      const url = `${KB_SERVICE_BASE_URL}${endpoint}`;
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-request-id': requestId,
        ...options.headers,
      };

      const response = await fetch(url, {
        ...options,
        headers,
        signal: AbortSignal.timeout(DEFAULT_TIMEOUT),
      });

      const duration = Date.now() - startTime;

      // Track successful API call
      if (response.ok) {
        trackAPICall(
          endpoint,
          options.method || 'GET',
          true,
          undefined,
          requestId
        );
      }

      if (!response.ok) {
        const error: APIError = await response.json().catch(() => ({
          code: 'UNKNOWN_ERROR',
          message: `HTTP ${response.status}: ${response.statusText}`,
          request_id: requestId,
        }));

        // Retry on 5xx errors or network issues
        if (response.status >= 500 && retryCount < MAX_RETRIES) {
          const delay = RETRY_DELAY_MS * Math.pow(2, retryCount);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.request<T>(endpoint, options, retryCount + 1);
        }

        throw error;
      }

      const data: APIResponse<T> = await response.json();
      return data;

    } catch (error: any) {
      const duration = Date.now() - startTime;

      // Track API error
      trackAPICall(
        endpoint,
        options.method || 'GET',
        false,
        error.message,
        requestId
      );

      // Retry on network errors
      if (retryCount < MAX_RETRIES && error.name === 'AbortError') {
        const delay = RETRY_DELAY_MS * Math.pow(2, retryCount);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.request<T>(endpoint, options, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Get cached data or fetch from API
   */
  private async getCached<T>(
    cacheKey: string,
    fetcher: () => Promise<APIResponse<T>>,
    ttl = this.CACHE_TTL
  ): Promise<T> {
    const cached = this.cache.get(cacheKey);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < cached.ttl) {
      return cached.data;
    }

    const response = await fetcher();
    
    this.cache.set(cacheKey, {
      data: response.data,
      timestamp: now,
      ttl,
    });

    return response.data;
  }

  /**
   * Invalidate cache for a patient
   */
  invalidatePatientCache(patientId: string): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((_, key) => {
      if (key.includes(patientId)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Get patient summary with demographics and basic info
   */
  async getPatientSummary(patientId: string): Promise<PatientSummary> {
    const cacheKey = `patient_summary_${patientId}`;
    
    return this.getCached(cacheKey, async () => {
      auditLog({
        action: 'view_patient_profile',
        patient_id: patientId,
        source: 'kb_service_client',
        metadata: { endpoint: '/patients/{id}' },
      });

      return this.request<PatientSummary>(`/patients/${patientId}`);
    });
  }

  /**
   * Get insurance details with coverage information
   */
  async getInsuranceDetails(patientId: string): Promise<InsuranceDetails> {
    const cacheKey = `insurance_${patientId}`;
    
    return this.getCached(cacheKey, async () => {
      auditLog({
        action: 'view_insurance_details',
        patient_id: patientId,
        source: 'kb_service_client',
        metadata: { endpoint: '/patients/{id}/insurance' },
      });

      return this.request<InsuranceDetails>(`/patients/${patientId}/insurance`);
    });
  }

  /**
   * Get periodontal charting data for gap tests
   */
  async getPeriodontalData(patientId: string): Promise<PeriodontalChartingData> {
    const cacheKey = `periodontal_${patientId}`;
    
    return this.getCached(cacheKey, async () => {
      auditLog({
        action: 'view_periodontal_chart',
        patient_id: patientId,
        source: 'kb_service_client',
        metadata: { endpoint: '/patients/{id}/periodontal' },
      });

      return this.request<PeriodontalChartingData>(`/patients/${patientId}/periodontal`);
    });
  }

  /**
   * Get dental records and tooth status
   */
  async getDentalRecords(patientId: string): Promise<DentalRecord[]> {
    const cacheKey = `dental_records_${patientId}`;
    
    return this.getCached(cacheKey, async () => {
      auditLog({
        action: 'view_dental_records',
        patient_id: patientId,
        source: 'kb_service_client',
        metadata: { endpoint: '/patients/{id}/dental' },
      });

      return this.request<DentalRecord[]>(`/patients/${patientId}/dental`);
    });
  }

  /**
   * Get X-ray images with signed URLs
   */
  async getXRays(
    patientId: string,
    limit = 20,
    offset = 0
  ): Promise<PaginatedResponse<XRayImage>> {
    auditLog({
      action: 'view_xray',
      patient_id: patientId,
      source: 'kb_service_client',
      metadata: { endpoint: '/patients/{id}/xrays', limit, offset },
    });

    const response = await this.request<PaginatedResponse<XRayImage>>(
      `/patients/${patientId}/xrays?limit=${limit}&offset=${offset}`
    );

    return response.data;
  }

  /**
   * Get visit history with procedures and costs
   */
  async getVisitHistory(
    patientId: string,
    limit = 50,
    offset = 0
  ): Promise<PaginatedResponse<VisitRecord>> {
    const cacheKey = `visits_${patientId}_${limit}_${offset}`;
    
    return this.getCached(cacheKey, async () => {
      auditLog({
        action: 'view_patient_profile',
        patient_id: patientId,
        source: 'kb_service_client',
        metadata: { endpoint: '/patients/{id}/visits', limit, offset },
      });

      return this.request<PaginatedResponse<VisitRecord>>(
        `/patients/${patientId}/visits?limit=${limit}&offset=${offset}`
      );
    });
  }

  /**
   * Get doctor notes (reverse chronological)
   */
  async getDoctorNotes(
    patientId: string,
    limit = 20,
    offset = 0
  ): Promise<PaginatedResponse<DoctorNote>> {
    auditLog({
      action: 'view_dental_records',
      patient_id: patientId,
      source: 'kb_service_client',
      metadata: { endpoint: '/patients/{id}/notes', limit, offset },
    });

    const response = await this.request<PaginatedResponse<DoctorNote>>(
      `/patients/${patientId}/notes?limit=${limit}&offset=${offset}`
    );

    return response.data;
  }

  /**
   * Save a new doctor note with idempotency
   */
  async saveDoctorNote(
    patientId: string,
    note: Omit<DoctorNote, 'id' | 'created_at' | 'updated_at' | 'version'>
  ): Promise<DoctorNote> {
    const idempotencyKey = crypto.randomUUID();

    auditLog({
      action: 'edit_dental_notes',
      patient_id: patientId,
      source: 'kb_service_client',
      metadata: { 
        endpoint: '/patients/{id}/notes',
        idempotency_key: idempotencyKey,
        visibility: note.visibility,
      },
    });

    const response = await this.request<DoctorNote>(
      `/patients/${patientId}/notes`,
      {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(note),
      }
    );

    // Invalidate notes cache
    this.invalidatePatientCache(patientId);

    return response.data;
  }

  /**
   * Update an existing doctor note
   */
  async updateDoctorNote(
    patientId: string,
    noteId: string,
    updates: Partial<Pick<DoctorNote, 'text' | 'visibility'>>
  ): Promise<DoctorNote> {
    const idempotencyKey = crypto.randomUUID();

    auditLog({
      action: 'edit_dental_notes',
      patient_id: patientId,
      resource_type: 'doctor_note',
      resource_id: noteId,
      source: 'kb_service_client',
      metadata: { 
        endpoint: '/patients/{id}/notes/{noteId}',
        idempotency_key: idempotencyKey,
      },
    });

    const response = await this.request<DoctorNote>(
      `/patients/${patientId}/notes/${noteId}`,
      {
        method: 'PATCH',
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(updates),
      }
    );

    // Invalidate notes cache
    this.invalidatePatientCache(patientId);

    return response.data;
  }

  /**
   * Upload X-ray image
   */
  async uploadXRay(
    patientId: string,
    file: File,
    metadata: {
      tooth_number?: string;
      type: XRayImage['type'];
      notes?: string;
    }
  ): Promise<XRayImage> {
    const idempotencyKey = crypto.randomUUID();

    auditLog({
      action: 'upload_xray',
      patient_id: patientId,
      source: 'kb_service_client',
      metadata: { 
        endpoint: '/patients/{id}/xrays',
        idempotency_key: idempotencyKey,
        file_name: file.name,
        file_size: file.size,
        ...metadata,
      },
    });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify(metadata));

    const response = await this.request<XRayImage>(
      `/patients/${patientId}/xrays`,
      {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey,
          // Don't set Content-Type, let browser set it with boundary
        },
        body: formData,
      }
    );

    // Invalidate X-ray cache
    this.invalidatePatientCache(patientId);

    return response.data;
  }

  /**
   * Export patient data to PDF
   */
  async exportPatientData(
    patientId: string,
    sections: Array<'demographics' | 'insurance' | 'dental' | 'visits' | 'notes'>
  ): Promise<Blob> {
    auditLog({
      action: 'export_patient_data',
      patient_id: patientId,
      source: 'kb_service_client',
      metadata: { 
        endpoint: '/patients/{id}/export',
        sections,
        format: 'pdf',
      },
    });

    const token = typeof window !== 'undefined' 
      ? localStorage.getItem('auth_token') 
      : null;

    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(
      `${KB_SERVICE_BASE_URL}/patients/${patientId}/export?sections=${sections.join(',')}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/pdf',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    return response.blob();
  }
}

// Singleton instance
export const kbServiceClient = new KBServiceClient();

// Convenience functions
export async function getPatientSummary(patientId: string) {
  return kbServiceClient.getPatientSummary(patientId);
}

export async function getInsuranceDetails(patientId: string) {
  return kbServiceClient.getInsuranceDetails(patientId);
}

export async function getPeriodontalData(patientId: string) {
  return kbServiceClient.getPeriodontalData(patientId);
}

export async function getDentalRecords(patientId: string) {
  return kbServiceClient.getDentalRecords(patientId);
}

export async function getXRays(patientId: string, limit?: number, offset?: number) {
  return kbServiceClient.getXRays(patientId, limit, offset);
}

export async function getVisitHistory(patientId: string, limit?: number, offset?: number) {
  return kbServiceClient.getVisitHistory(patientId, limit, offset);
}

export async function getDoctorNotes(patientId: string, limit?: number, offset?: number) {
  return kbServiceClient.getDoctorNotes(patientId, limit, offset);
}

export async function saveDoctorNote(
  patientId: string,
  note: Omit<DoctorNote, 'id' | 'created_at' | 'updated_at' | 'version'>
) {
  return kbServiceClient.saveDoctorNote(patientId, note);
}

export async function updateDoctorNote(
  patientId: string,
  noteId: string,
  updates: Partial<Pick<DoctorNote, 'text' | 'visibility'>>
) {
  return kbServiceClient.updateDoctorNote(patientId, noteId, updates);
}

export async function uploadXRay(
  patientId: string,
  file: File,
  metadata: Parameters<typeof kbServiceClient.uploadXRay>[2]
) {
  return kbServiceClient.uploadXRay(patientId, file, metadata);
}

export async function exportPatientData(
  patientId: string,
  sections: Parameters<typeof kbServiceClient.exportPatientData>[1]
) {
  return kbServiceClient.exportPatientData(patientId, sections);
}

export async function invalidatePatientCache(patientId: string) {
  kbServiceClient.invalidatePatientCache(patientId);
}
