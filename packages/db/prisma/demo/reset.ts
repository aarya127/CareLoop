import type { Prisma } from '@prisma/client';
import { DEMO_PRACTICE_ID } from './build';

/**
 * Deletes every row that belongs to the demo practice, and nothing else.
 * The Practice and its User rows are kept (and updated by the seed) so audit
 * history stays attached to the same user ids. Audit logs are never deleted.
 */
export async function resetDemoPractice(tx: Prisma.TransactionClient, demoUserIds: string[]) {
  const where = { practiceId: DEMO_PRACTICE_ID };

  // Appointments go first: Appointment → Provider is ON DELETE RESTRICT.
  await tx.reminder.deleteMany({ where });
  await tx.appointment.deleteMany({ where });
  await tx.appointmentHold.deleteMany({ where });
  await tx.callTranscript.deleteMany({ where }); // segments + analytics cascade
  await tx.practiceKPI.deleteMany({ where });
  await tx.conversation.deleteMany({ where }); // participants + messages cascade
  await tx.claim.deleteMany({ where }); // lines + status events cascade
  await tx.paymentRecord.deleteMany({ where });
  await tx.invoice.deleteMany({ where });
  await tx.treatmentRecord.deleteMany({ where });
  await tx.treatmentPlan.deleteMany({ where }); // items cascade
  await tx.encounter.deleteMany({ where });
  await tx.allergy.deleteMany({ where });
  await tx.medication.deleteMany({ where });
  await tx.condition.deleteMany({ where });
  await tx.toothChartEntry.deleteMany({ where });
  await tx.periodontalExam.deleteMany({ where });
  await tx.document.deleteMany({ where });
  await tx.patientSensitiveNote.deleteMany({ where });
  await tx.intakeSubmission.deleteMany({ where });
  await tx.intakeDraft.deleteMany({ where });
  await tx.patientInvitation.deleteMany({ where });
  await tx.patientCredential.deleteMany({ where });
  await tx.invitation.deleteMany({ where });
  // Cascades insurance, medical history, record sections and portal sessions/tokens.
  await tx.patient.deleteMany({ where });
  await tx.availabilityBlock.deleteMany({ where });
  await tx.providerSchedule.deleteMany({ where });
  await tx.googleCalendarConnection.deleteMany({ where });
  await tx.provider.deleteMany({ where });
  await tx.room.deleteMany({ where });
  await tx.aIPromptVersion.deleteMany({ where });
  await tx.alertThreshold.deleteMany({ where });
  await tx.routingPolicy.deleteMany({ where });

  await tx.userRole.deleteMany({ where: { userId: { in: demoUserIds } } });
  await tx.passwordResetToken.deleteMany({ where: { userId: { in: demoUserIds } } });
}
