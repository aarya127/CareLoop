import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminService {
  async getSystemStats(): Promise<any> {
    throw new Error('Not implemented');
  }

  async updateSettings(_dto: any): Promise<any> {
    throw new Error('Not implemented');
  }
}
