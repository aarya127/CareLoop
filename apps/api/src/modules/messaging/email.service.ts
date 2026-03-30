import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  async send(_opts: { to: string; subject: string; html: string }): Promise<void> {
    throw new Error('Not implemented');
  }
}
