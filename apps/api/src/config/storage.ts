// Storage configuration (S3-compatible)
export const storageConfig = {
  bucket: process.env.STORAGE_BUCKET ?? 'careloop-documents',
  region: process.env.STORAGE_REGION ?? 'ca-central-1',
  endpoint: process.env.STORAGE_ENDPOINT, // optional: for MinIO / local dev
};
