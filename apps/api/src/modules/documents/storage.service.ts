import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { storageConfig } from '../../config/storage';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private client: S3Client;

  constructor() {
    this.client = new S3Client({
      region: storageConfig.region,
      ...(storageConfig.endpoint ? { endpoint: storageConfig.endpoint } : {}),
      ...(storageConfig.accessKeyId && storageConfig.secretAccessKey
        ? {
            credentials: {
              accessKeyId: storageConfig.accessKeyId,
              secretAccessKey: storageConfig.secretAccessKey,
            },
          }
        : {}),
      forcePathStyle: storageConfig.forcePathStyle,
    });
  }

  async onModuleInit(): Promise<void> {
    // Ensure the bucket exists (no-op in production where bucket is pre-created)
    if (storageConfig.endpoint) {
      await this.ensureBucketExists();
    }
  }

  private async ensureBucketExists(): Promise<void> {
    const bucket = storageConfig.bucket;
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: bucket }));
    } catch {
      try {
        await this.client.send(new CreateBucketCommand({ Bucket: bucket }));
        this.logger.log(`Created bucket: ${bucket}`);
      } catch (err) {
        this.logger.warn(`Could not create bucket "${bucket}": ${err}`);
      }
    }
  }

  /**
   * Generate a pre-signed PUT URL the client can use to upload directly.
   * TTL defaults to 15 minutes.
   */
  async getPresignedUploadUrl(
    key: string,
    contentType: string,
    ttlSeconds = storageConfig.signedUrlTtl,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: storageConfig.bucket,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.client, command, { expiresIn: ttlSeconds });
  }

  /**
   * Generate a pre-signed GET URL so the client can download/view a file.
   * TTL defaults to 15 minutes.
   */
  async getPresignedDownloadUrl(
    key: string,
    fileName: string,
    ttlSeconds = storageConfig.signedUrlTtl,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: storageConfig.bucket,
      Key: key,
      ResponseContentDisposition: `inline; filename="${encodeURIComponent(fileName)}"`,
    });
    return getSignedUrl(this.client, command, { expiresIn: ttlSeconds });
  }

  /**
   * Permanently remove an object from storage.
   */
  async deleteObject(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: storageConfig.bucket, Key: key }));
  }
}
