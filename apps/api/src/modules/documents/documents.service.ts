import { Injectable } from '@nestjs/common';

@Injectable()
export class DocumentsService {
  async findByPatientId(_patientId: string, _query: any): Promise<any[]> {
    throw new Error('Not implemented');
  }

  async getUploadUrl(_dto: any): Promise<{ url: string; key: string }> {
    throw new Error('Not implemented');
  }

  async create(_dto: any): Promise<any> {
    throw new Error('Not implemented');
  }

  async remove(_id: string): Promise<void> {
    throw new Error('Not implemented');
  }
}
