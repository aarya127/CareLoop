import { Injectable } from '@nestjs/common';

@Injectable()
export class RemindersService {
  async scheduleAppointmentReminder(_appointmentId: string): Promise<void> {
    throw new Error('Not implemented');
  }

  async cancelReminder(_reminderId: string): Promise<void> {
    throw new Error('Not implemented');
  }
}
