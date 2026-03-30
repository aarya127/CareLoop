import { Injectable } from '@nestjs/common';

@Injectable()
export class MessagingService {
  async getConversation(_patientId: string): Promise<any[]> {
    throw new Error('Not implemented');
  }

  async send(_dto: any): Promise<any> {
    throw new Error('Not implemented');
  }

  async scheduleReminder(_dto: any): Promise<any> {
    throw new Error('Not implemented');
  }
}
