import { Injectable } from '@nestjs/common';

@Injectable()
export class BillingService {
  async listInvoices(_query: any): Promise<any[]> {
    throw new Error('Not implemented');
  }

  async getInvoice(_id: string): Promise<any> {
    throw new Error('Not implemented');
  }

  async createInvoice(_dto: any): Promise<any> {
    throw new Error('Not implemented');
  }

  async sendInvoice(_id: string): Promise<void> {
    throw new Error('Not implemented');
  }
}
