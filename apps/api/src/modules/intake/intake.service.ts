import { Injectable } from '@nestjs/common';

@Injectable()
export class IntakeService {
  async create(_dto: any): Promise<any> {
    throw new Error('Not implemented');
  }

  async findById(_id: string): Promise<any> {
    throw new Error('Not implemented');
  }
}
