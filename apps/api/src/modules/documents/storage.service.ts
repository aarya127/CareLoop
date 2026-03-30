import { Injectable } from '@nestjs/common';
import { storageConfig } from '../../config/storage';

@Injectable()
export class StorageService {
  async getPresignedUploadUrl(_key: string, _contentType: string): Promise<string> {
    if (!storageConfig.endpoint) throw new Error('Storage not configured');
    throw new Error('Not implemented');
  }

  async deleteObject(_key: string): Promise<void> {
    throw new Error('Not implemented');
  }
}
