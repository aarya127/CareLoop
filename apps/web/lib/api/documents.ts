import { api } from '@/lib/api';

export interface DocumentRecord {
  id: string;
  patientId: string | null;
  category: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number | null;
  checksumSha256: string | null;
  status: string;
  uploadedAt: string;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  documentId: string;
  storageKey: string;
}

export const documentsApi = {
  listByPatient(patientId: string, practiceId = 'demo-practice'): Promise<DocumentRecord[]> {
    return api.get<DocumentRecord[]>(
      `/documents/patient/${patientId}?practiceId=${practiceId}`,
    );
  },

  getUploadUrl(payload: {
    patientId: string;
    category: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    checksumSha256?: string;
    practiceId?: string;
  }): Promise<UploadUrlResponse> {
    return api.post<UploadUrlResponse>('/documents/upload-url', {
      practiceId: payload.practiceId ?? 'demo-practice',
      ...payload,
    });
  },

  confirmUpload(documentId: string, checksumSha256?: string): Promise<DocumentRecord> {
    return api.post<DocumentRecord>(`/documents/${documentId}/confirm`, {
      checksumSha256,
    });
  },

  getDownloadUrl(documentId: string): Promise<{ url: string; fileName: string }> {
    return api.get<{ url: string; fileName: string }>(
      `/documents/${documentId}/download-url`,
    );
  },

  delete(documentId: string): Promise<void> {
    return api.delete<void>(`/documents/${documentId}`);
  },
};

// ── Client-side SHA-256 computation ────────────────────────────────────────

export async function computeSha256Hex(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function formatBytes(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export const CATEGORY_LABELS: Record<string, string> = {
  xray: 'X-Ray',
  consent: 'Consent Form',
  insurance_card: 'Insurance Card',
  lab_report: 'Lab Report',
  referral: 'Referral',
  other: 'Other',
};
