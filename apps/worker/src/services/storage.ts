import { DeleteObjectsCommand, S3Client } from '@aws-sdk/client-s3';

/**
 * Minimal S3 client for the worker — used by document-cleanup to remove objects
 * when their DB rows are hard-deleted. Mirrors the API's storage config env vars
 * (STORAGE_*). No-ops gracefully if the bucket is not configured.
 */
const bucket = process.env.STORAGE_BUCKET ?? 'careloop-documents';
const region = process.env.STORAGE_REGION ?? 'us-east-1';
const endpoint = process.env.STORAGE_ENDPOINT; // set for MinIO; undefined for AWS
const accessKeyId = process.env.STORAGE_ACCESS_KEY_ID;
const secretAccessKey = process.env.STORAGE_SECRET_ACCESS_KEY;
const forcePathStyle = process.env.STORAGE_FORCE_PATH_STYLE === 'true';

let client: S3Client | null = null;
function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      region,
      ...(endpoint ? { endpoint } : {}),
      ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
      forcePathStyle,
    });
  }
  return client;
}

/**
 * Delete a batch of objects by storage key. Returns the number requested.
 * Swallows errors (logs to console) so cleanup never fails the job — orphaned
 * objects are preferable to a stuck queue.
 */
export async function deleteStorageObjects(keys: string[]): Promise<number> {
  const valid = keys.filter(Boolean);
  if (valid.length === 0) return 0;
  try {
    // DeleteObjects handles up to 1000 keys per request.
    for (let i = 0; i < valid.length; i += 1000) {
      const batch = valid.slice(i, i + 1000);
      await getClient().send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: true },
        }),
      );
    }
    return valid.length;
  } catch (err) {
    console.error(`[document-cleanup] S3 delete failed for ${valid.length} objects:`, err);
    return 0;
  }
}
