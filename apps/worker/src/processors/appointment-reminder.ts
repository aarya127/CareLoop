import type { Job } from 'bullmq';
import type { AppointmentReminderJobData } from '@careloop/types';

export async function appointmentReminderProcessor(
  job: Job<AppointmentReminderJobData>
): Promise<void> {
  const { appointmentId, patientPhone, reminderType } = job.data;
  job.log(
    `Sending ${reminderType} reminder for appointment ${appointmentId} to ${patientPhone}`
  );

  // TODO: integrate with Twilio SMS / voice reminder
  void patientPhone;

  job.log(`Reminder sent for appointment ${appointmentId}`);
}
