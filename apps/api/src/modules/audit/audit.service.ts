import { Injectable } from '@nestjs/common';

@Injectable()
export class AuditService {
  async getLog(_query: any): Promise<any[]> {
    throw new Error('Not implemented');
  }

  async record(_entry: { userId: string; action: string; resource: string; resourceId?: string; meta?: object }): Promise<void> {
    throw new Error('Not implemented');
  }
}
