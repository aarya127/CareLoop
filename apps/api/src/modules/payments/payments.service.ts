import { Injectable } from '@nestjs/common';

@Injectable()
export class PaymentsService {
  async createIntent(_dto: any): Promise<any> {
    throw new Error('Not implemented');
  }

  async confirm(_dto: any): Promise<any> {
    throw new Error('Not implemented');
  }

  async getHistory(_patientId: string): Promise<any[]> {
    throw new Error('Not implemented');
  }
}
