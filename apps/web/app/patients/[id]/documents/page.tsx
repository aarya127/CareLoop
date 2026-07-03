'use client';

import { use, useEffect, useRef, useState } from 'react';
import {
  documentsApi,
  computeSha256Hex,
  formatBytes,
  CATEGORY_LABELS,
  type DocumentRecord,
} from '@/lib/api/documents';
import { Button } from '@/components/ui/button';

// ── Helpers ─────────────────────────────────────────────────────────────────

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

const CATEGORIES = Object.entries(CATEGORY_LABELS);

function mimeIcon(mime: string): string {
  if (mime.startsWith('image/')) return '🖼';
  if (mime === 'application/pdf') return '📄';
  return '📁';
}

// ── Sub-components ───────────────────────────────────────────────────────────

function UploadStatus({ status }: { status: string }) {
  if (status === 'uploading') return <span className="text-amber-500 text-xs">Uploading…</span>;
  if (status === 'active') return <span className="text-green-600 text-xs">Available</span>;
  return <span className="text-muted-foreground text-xs">{status}</span>;
}

// ── Main page ────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ id: string }>;
}

export default function PatientDocumentsPage({ params }: Props) {
  const { id: patientId } = use(params);

  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadCategory, setUploadCategory] = useState('other');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function refresh() {
    setLoading(true);
    documentsApi
      .listByPatient(patientId)
      .then(setDocs)
      .catch(() => setError('Failed to load documents'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    refresh();
  }, [patientId]);

  // ── Upload flow ────────────────────────────────────────────────────────────

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ''; // reset so same file can be re-selected

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError(`File type "${file.type}" is not allowed.`);
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setUploadError('File exceeds the 50 MB limit.');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadProgress('Computing checksum…');

    try {
      const checksum = await computeSha256Hex(file);

      setUploadProgress('Requesting upload URL…');
      const { uploadUrl, documentId } = await documentsApi.getUploadUrl({
        patientId,
        category: uploadCategory,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        checksumSha256: checksum,
      });

      setUploadProgress('Uploading to storage…');
      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error('Storage PUT failed');

      setUploadProgress('Confirming upload…');
      await documentsApi.confirmUpload(documentId, checksum);

      setUploadProgress(null);
      refresh();
    } catch (err: any) {
      setUploadError(err?.message ?? 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  }

  // ── Download ───────────────────────────────────────────────────────────────

  async function handleDownload(doc: DocumentRecord) {
    try {
      const { url } = await documentsApi.getDownloadUrl(doc.id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      alert('Could not get download link. Please try again.');
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async function handleDelete(doc: DocumentRecord) {
    if (!confirm(`Delete "${doc.fileName}"? This cannot be undone.`)) return;
    setDeletingId(doc.id);
    try {
      await documentsApi.delete(doc.id);
      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
    } catch {
      alert('Delete failed. Please try again.');
    } finally {
      setDeletingId(null);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Documents</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Uploaded files for this patient
          </p>
        </div>

        {/* Upload controls */}
        <div className="flex items-center gap-3">
          <select
            value={uploadCategory}
            onChange={(e) => setUploadCategory(e.target.value)}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {CATEGORIES.map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>

          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? uploadProgress ?? 'Uploading…' : 'Upload File'}
          </Button>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_TYPES.join(',')}
            className="hidden"
            onChange={handleFileSelected}
          />
        </div>
      </div>

      {/* Upload error */}
      {uploadError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 text-destructive text-sm px-4 py-3 mb-4">
          {uploadError}
        </div>
      )}

      {/* Document list */}
      {loading ? (
        <p className="text-muted-foreground text-sm animate-pulse">Loading…</p>
      ) : error ? (
        <p className="text-destructive text-sm">{error}</p>
      ) : docs.length === 0 ? (
        <div className="border rounded-xl p-12 text-center text-muted-foreground">
          <p className="text-4xl mb-3">📂</p>
          <p className="font-medium">No documents yet</p>
          <p className="text-sm mt-1">Upload the first file using the button above.</p>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">File</th>
                <th className="text-left px-4 py-3 font-medium">Category</th>
                <th className="text-left px-4 py-3 font-medium">Size</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Uploaded</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {docs.map((doc) => (
                <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDownload(doc)}
                      className="flex items-center gap-2 text-left hover:text-primary transition-colors"
                    >
                      <span className="text-base">{mimeIcon(doc.mimeType)}</span>
                      <span className="font-medium truncate max-w-[200px]" title={doc.fileName}>
                        {doc.fileName}
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {CATEGORY_LABELS[doc.category] ?? doc.category}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatBytes(doc.sizeBytes)}
                  </td>
                  <td className="px-4 py-3">
                    <UploadStatus status={doc.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(doc.uploadedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownload(doc)}
                        title="Download / View"
                      >
                        ↓
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(doc)}
                        disabled={deletingId === doc.id}
                        title="Delete"
                      >
                        {deletingId === doc.id ? '…' : '✕'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
