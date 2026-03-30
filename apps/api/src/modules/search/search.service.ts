import { Injectable } from '@nestjs/common';

@Injectable()
export class SearchService {
  async search(_params: { query: string; type?: string }): Promise<any[]> {
    throw new Error('Not implemented');
  }
}
