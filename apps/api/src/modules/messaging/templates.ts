/**
 * Notification content templates. Pure functions that render a subject + plain
 * text + minimal HTML from structured data, so callers never hand-build message
 * bodies (which was fragile and inconsistent). Used by reminders and invites.
 */

export interface RenderedMessage {
  subject: string;
  text: string;
  html: string;
}

function htmlShell(heading: string, paragraphs: string[], cta?: { label: string; url: string }): string {
  const body = paragraphs.map((p) => `<p style="margin:0 0 12px;color:#334155;font-size:14px;line-height:1.6">${p}</p>`).join('');
  const button = cta
    ? `<p style="margin:20px 0"><a href="${cta.url}" style="background:#0f172a;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px;font-size:14px;display:inline-block">${cta.label}</a></p>`
    : '';
  return [
    '<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;padding:24px">',
    `<h2 style="margin:0 0 16px;color:#0f172a;font-size:18px">${heading}</h2>`,
    body,
    button,
    '<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0" />',
    '<p style="color:#94a3b8;font-size:12px;margin:0">Sent by CareLoop on behalf of your dental practice.</p>',
    '</div>',
  ].join('');
}

function formatWhen(startsAt: Date, timeZone?: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: timeZone || 'America/New_York',
    }).format(startsAt);
  } catch {
    return startsAt.toISOString();
  }
}

export function renderInvite(input: {
  practiceName: string;
  role: string;
  acceptUrl: string;
  inviterName?: string;
}): RenderedMessage {
  const inviter = input.inviterName ? `${input.inviterName} has invited you` : 'You have been invited';
  const subject = `Join ${input.practiceName} on CareLoop`;
  const text = `${inviter} to join ${input.practiceName} as ${input.role}.\n\nAccept your invitation: ${input.acceptUrl}\n\nThis link expires in 7 days.`;
  const html = htmlShell(
    `Join ${input.practiceName}`,
    [`${inviter} to join <strong>${input.practiceName}</strong> as <strong>${input.role}</strong>.`, 'This invitation link expires in 7 days.'],
    { label: 'Accept invitation', url: input.acceptUrl },
  );
  return { subject, text, html };
}

export function renderAppointmentReminder(input: {
  patientName?: string;
  practiceName: string;
  startsAt: Date;
  timeZone?: string;
}): RenderedMessage {
  const when = formatWhen(input.startsAt, input.timeZone);
  const hi = input.patientName ? `Hi ${input.patientName},` : 'Hello,';
  const subject = `Reminder: your appointment at ${input.practiceName}`;
  const text = `${hi} this is a reminder of your appointment at ${input.practiceName} on ${when}. Reply to reschedule.`;
  const html = htmlShell('Appointment reminder', [
    hi,
    `This is a reminder of your appointment at <strong>${input.practiceName}</strong> on <strong>${when}</strong>.`,
    'Reply to this message if you need to reschedule.',
  ]);
  return { subject, text, html };
}

export function renderRecall(input: { patientName?: string; practiceName: string }): RenderedMessage {
  const hi = input.patientName ? `Hi ${input.patientName},` : 'Hello,';
  const subject = `Time for your dental check-up at ${input.practiceName}`;
  const text = `${hi} it's been a while since your last visit to ${input.practiceName}. Contact us to book your next cleaning or check-up.`;
  const html = htmlShell('Time for a check-up', [
    hi,
    `It's been a while since your last visit to <strong>${input.practiceName}</strong>.`,
    'Contact us to book your next cleaning or check-up.',
  ]);
  return { subject, text, html };
}

export function renderPaymentDue(input: {
  patientName?: string;
  practiceName: string;
  amountDueCents?: number;
}): RenderedMessage {
  const hi = input.patientName ? `Hi ${input.patientName},` : 'Hello,';
  const amount =
    typeof input.amountDueCents === 'number'
      ? ` of $${(input.amountDueCents / 100).toFixed(2)}`
      : '';
  const subject = `Payment reminder from ${input.practiceName}`;
  const text = `${hi} you have an outstanding balance${amount} with ${input.practiceName}. Please contact us to settle your account.`;
  const html = htmlShell('Payment reminder', [
    hi,
    `You have an outstanding balance${amount} with <strong>${input.practiceName}</strong>.`,
    'Please contact us to settle your account.',
  ]);
  return { subject, text, html };
}

/** Route a reminder type to the right template. Falls back to a generic message. */
export function renderReminder(
  type: string,
  input: { patientName?: string; practiceName: string; startsAt?: Date; timeZone?: string; amountDueCents?: number },
): RenderedMessage {
  switch (type) {
    case 'appointment_reminder':
      return renderAppointmentReminder({
        patientName: input.patientName,
        practiceName: input.practiceName,
        startsAt: input.startsAt ?? new Date(),
        timeZone: input.timeZone,
      });
    case 'recall':
      return renderRecall(input);
    case 'payment_due':
      return renderPaymentDue(input);
    default: {
      const hi = input.patientName ? `Hi ${input.patientName},` : 'Hello,';
      return {
        subject: `A message from ${input.practiceName}`,
        text: `${hi} you have a new message from ${input.practiceName}.`,
        html: htmlShell('A message from your practice', [hi, `You have a new message from <strong>${input.practiceName}</strong>.`]),
      };
    }
  }
}
