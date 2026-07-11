import { describe, it, expect } from 'vitest';
import {
  renderInvite,
  renderAppointmentReminder,
  renderPaymentDue,
  renderReminder,
} from './templates';

describe('notification templates', () => {
  it('renderInvite includes practice, role, and the accept link', () => {
    const msg = renderInvite({
      practiceName: 'Bright Smile',
      role: 'staff',
      acceptUrl: 'https://x/join/abc',
    });
    expect(msg.subject).toContain('Bright Smile');
    expect(msg.text).toContain('staff');
    expect(msg.text).toContain('https://x/join/abc');
    expect(msg.html).toContain('https://x/join/abc');
  });

  it('renderAppointmentReminder formats the time in the given timezone', () => {
    const msg = renderAppointmentReminder({
      practiceName: 'Downtown Dental',
      patientName: 'Alice',
      startsAt: new Date('2026-08-01T15:00:00Z'),
      timeZone: 'America/New_York',
    });
    // 15:00 UTC is 11:00 AM in America/New_York (EDT).
    expect(msg.text).toContain('11:00');
    expect(msg.text).toContain('Alice');
    expect(msg.text).toContain('Downtown Dental');
  });

  it('renderPaymentDue formats a cents amount as dollars', () => {
    const msg = renderPaymentDue({ practiceName: 'Dental Co', amountDueCents: 12345 });
    expect(msg.text).toContain('$123.45');
  });

  it('renderReminder routes by type and falls back for unknown types', () => {
    expect(renderReminder('recall', { practiceName: 'X' }).subject.toLowerCase()).toContain(
      'check-up',
    );
    expect(
      renderReminder('appointment_reminder', {
        practiceName: 'X',
        startsAt: new Date('2026-08-01T15:00:00Z'),
      }).subject.toLowerCase(),
    ).toContain('appointment');
    // Unknown type still produces a sane, non-empty message.
    const fallback = renderReminder('something_else', { practiceName: 'X' });
    expect(fallback.subject.length).toBeGreaterThan(0);
    expect(fallback.text.length).toBeGreaterThan(0);
  });
});
