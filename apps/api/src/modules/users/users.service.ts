import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  async findById(_id: string): Promise<any> {
    throw new Error('Not implemented');
  }

  async update(_id: string, _dto: any): Promise<any> {
    throw new Error('Not implemented');
  }
}
