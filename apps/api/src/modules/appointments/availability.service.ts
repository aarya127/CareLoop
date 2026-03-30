import { Injectable } from '@nestjs/common';

@Injectable()
export class AvailabilityService {
  async getSlots(_params: { providerId: string; date: string; duration: number }): Promise<any[]> {
    throw new Error('Not implemented');
  }
}
