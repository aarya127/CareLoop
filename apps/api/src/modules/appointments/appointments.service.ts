import { Injectable } from '@nestjs/common';

@Injectable()
export class AppointmentsService {
  async findAll(_query: any): Promise<any[]> {
    throw new Error('Not implemented');
  }

  async getAvailability(_query: any): Promise<any> {
    throw new Error('Not implemented');
  }

  async findById(_id: string): Promise<any> {
    throw new Error('Not implemented');
  }

  async create(_dto: any): Promise<any> {
    throw new Error('Not implemented');
  }

  async update(_id: string, _dto: any): Promise<any> {
    throw new Error('Not implemented');
  }

  async remove(_id: string): Promise<void> {
    throw new Error('Not implemented');
  }
}
