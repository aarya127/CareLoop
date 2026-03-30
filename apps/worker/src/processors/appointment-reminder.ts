import type { Job } from 'bullmq';
import type { AppointmentReminderJobData } from '@careloop/shared';

export async function appointmentReminderProcessor(
  job: Job<AppointmentReminderJobData>
): Promise<void> {
  const { appointmentId, patientId, reminderType } = job.data;
  job.log(
    `Sending ${reminderType} reminder for appointment ${appointmentId} to patient ${patientId}`
  );

  // TODO: integrate with Twilio SMS / email provider
  void patientId;

  job.log(`Reminder sent for appointment ${appointmentId}`);
}
