// Storage configuration (S3-compatible: AWS S3 or MinIO for local dev)
export const storageConfig = {
  bucket: process.env.STORAGE_BUCKET ?? 'careloop-documents',
  region: process.env.STORAGE_REGION ?? 'us-east-1',
  // Leave undefined in production (uses default AWS credential chain)
  endpoint: process.env.STORAGE_ENDPOINT,
  accessKeyId: process.env.STORAGE_ACCESS_KEY_ID,
  secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY,
  // Must be true for MinIO / path-style endpoints
  forcePathStyle: process.env.STORAGE_FORCE_PATH_STYLE === 'true',
  // Signed URL TTL in seconds
  signedUrlTtl: Number(process.env.STORAGE_SIGNED_URL_TTL ?? 900),
};

/**
 * MIME types allowed for upload. Executables and scripting formats are
 * explicitly excluded to prevent malicious file storage.
 */
export const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]);

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
