import { Injectable } from '@nestjs/common';

@Injectable()
export class AnalyticsService {
  async getKpis(_query: any): Promise<any> {
    throw new Error('Not implemented');
  }

  async getRevenue(_query: any): Promise<any> {
    throw new Error('Not implemented');
  }

  async getPatientStats(_query: any): Promise<any> {
    throw new Error('Not implemented');
  }

  async getAppointmentStats(_query: any): Promise<any> {
    throw new Error('Not implemented');
  }
}
