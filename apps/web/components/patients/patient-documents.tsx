'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, FileText, Download, Trash2, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  documentsApi,
  computeSha256Hex,
  formatBytes,
  CATEGORY_LABELS,
  type DocumentRecord,
} from '@/lib/api/documents';

interface PatientDocumentsProps {
  patientId: string;
}

type UploadState = 'hashing' | 'requesting' | 'uploading' | 'confirming' | 'error';

interface PendingUpload {
  id: string;
  file: File;
  category: string;
  state: UploadState;
  progress: number;
  error?: string;
}

const CATEGORIES = Object.entries(CATEGORY_LABELS);

export function PatientDocuments({ patientId }: PatientDocumentsProps) {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploads, setUploads] = useState<PendingUpload[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('other');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const docs = await documentsApi.listByPatient(patientId);
      setDocuments(docs);
    } catch {
      // leave empty on error
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const uploadFile = async (file: File, category: string) => {
    const uploadId = crypto.randomUUID();

    setUploads((prev) => [
      ...prev,
      { id: uploadId, file, category, state: 'hashing', progress: 0 },
    ]);

    const update = (patch: Partial<PendingUpload>) =>
      setUploads((prev) =>
        prev.map((u) => (u.id === uploadId ? { ...u, ...patch } : u)),
      );

    try {
      const checksum = await computeSha256Hex(file);

      update({ state: 'requesting' });
      const { uploadUrl, documentId } = await documentsApi.getUploadUrl({
        patientId,
        category,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        checksumSha256: checksum,
      });

      update({ state: 'uploading', progress: 0 });
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            update({ progress: Math.round((e.loaded / e.total) * 100) });
          }
        };
        xhr.onload = () =>
          xhr.status >= 200 && xhr.status < 300
            ? resolve()
            : reject(new Error(`Upload failed: ${xhr.status}`));
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });

      update({ state: 'confirming', progress: 100 });
      await documentsApi.confirmUpload(documentId, checksum);

      // remove from in-progress list and refresh
      setUploads((prev) => prev.filter((u) => u.id !== uploadId));
      await fetchDocuments();
    } catch (err) {
      update({
        state: 'error',
        error: err instanceof Error ? err.message : 'Upload failed',
      });
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((f) => uploadFile(f, selectedCategory));
  };

  const handleDownload = async (doc: DocumentRecord) => {
    const { url } = await documentsApi.getDownloadUrl(doc.id);
    window.open(url, '_blank');
  };

  const handleDelete = async (doc: DocumentRecord) => {
    await documentsApi.delete(doc.id);
    setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
  };

  return (
    <div className="space-y-4">
      {/* Category selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-[#86868B]">Category:</span>
        {CATEGORIES.map(([value, label]) => (
          <button
            key={value}
            onClick={() => setSelectedCategory(value)}
            className={cn(
              'px-3 py-1 text-xs rounded-lg border transition-colors',
              selectedCategory === value
                ? 'bg-[#0A84FF] text-white border-[#0A84FF]'
                : 'border-[#E5E5E7] text-[#86868B] hover:border-[#0A84FF] hover:text-[#0A84FF]',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Drop zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-2 cursor-pointer transition-colors select-none',
          isDragging
            ? 'border-[#0A84FF] bg-[#0A84FF]/5'
            : 'border-[#E5E5E7] hover:border-[#0A84FF]/50',
        )}
      >
        <Upload className="w-6 h-6 text-[#86868B]" />
        <p className="text-sm text-[#1D1D1F] font-medium">
          Drop files here or click to upload
        </p>
        <p className="text-xs text-[#86868B]">PDF, Word, images · max 50 MB</p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* In-progress uploads */}
      {uploads.map((upload) => (
        <div key={upload.id} className="rounded-xl border border-[#E5E5E7] p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0">
              {upload.state !== 'error' && (
                <Loader2 className="w-4 h-4 text-[#0A84FF] animate-spin flex-shrink-0" />
              )}
              <span className="text-sm text-[#1D1D1F] truncate">{upload.file.name}</span>
            </div>
            <button
              onClick={() => setUploads((prev) => prev.filter((u) => u.id !== upload.id))}
              className="ml-2 flex-shrink-0"
            >
              <X className="w-4 h-4 text-[#86868B]" />
            </button>
          </div>
          {upload.state === 'error' ? (
            <p className="text-xs text-red-600">{upload.error}</p>
          ) : (
            <>
              <div className="h-1.5 bg-[#E5E5E7] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0A84FF] rounded-full transition-all duration-300"
                  style={{ width: `${upload.progress}%` }}
                />
              </div>
              <p className="text-xs text-[#86868B] mt-1">
                {upload.state === 'hashing' && 'Verifying file…'}
                {upload.state === 'requesting' && 'Preparing upload…'}
                {upload.state === 'uploading' && `Uploading… ${upload.progress}%`}
                {upload.state === 'confirming' && 'Finishing…'}
              </p>
            </>
          )}
        </div>
      ))}

      {/* Document list */}
      <div className="rounded-xl border border-[#E5E5E7] overflow-hidden">
        <div className="p-4 border-b border-[#E5E5E7] bg-[#FBFBFB]">
          <h3 className="text-xs uppercase font-medium text-[#86868B] tracking-wide">
            Uploaded Files{documents.length > 0 ? ` (${documents.length})` : ''}
          </h3>
        </div>

        {loading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-[#86868B]" />
          </div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#86868B]">
            No files uploaded yet
          </div>
        ) : (
          <div className="divide-y divide-[#E5E5E7]">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-4 flex items-center gap-3 hover:bg-[#FBFBFB] transition-colors"
              >
                <FileText className="w-8 h-8 text-[#0A84FF] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1D1D1F] truncate">
                    {doc.fileName}
                  </p>
                  <p className="text-xs text-[#86868B]">
                    {CATEGORY_LABELS[doc.category] ?? doc.category}
                    {doc.sizeBytes ? ` · ${formatBytes(doc.sizeBytes)}` : ''}
                    {' · '}
                    {new Date(doc.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleDownload(doc)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#F5F5F7] transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4 text-[#86868B]" />
                  </button>
                  <button
                    onClick={() => handleDelete(doc)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-500/10 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
