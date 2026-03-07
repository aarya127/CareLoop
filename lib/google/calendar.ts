import { google, calendar_v3 } from 'googleapis';
import { getOAuthClientForUser } from './auth';
import { prisma } from '@/lib/db/prisma';

export type NewAppointment = {
  id: string;
  userId: string;
  calendarId: string;
  title: string;
  notes?: string;
  start: string; // ISO with Z
  end: string;   // ISO with Z
  timeZone: string;
  attendees?: { email: string; displayName?: string }[];
  patientId?: string;
  procedureCode?: string;
  providerId?: string;
  roomId?: string;
  extended?: Record<string, any>;
};

function toGoogleEvent(appt: NewAppointment): calendar_v3.Schema$Event {
  return {
    summary: appt.title,
    description: appt.notes,
    start: { dateTime: appt.start, timeZone: appt.timeZone },
    end: { dateTime: appt.end, timeZone: appt.timeZone },
    attendees: appt.attendees,
    extendedProperties: {
      private: {
        appointmentId: appt.id,
        ...(appt.patientId ? { patientId: appt.patientId } : {}),
        ...(appt.procedureCode ? { procedureCode: appt.procedureCode } : {}),
        ...(appt.providerId ? { providerId: appt.providerId } : {}),
        ...(appt.roomId ? { roomId: appt.roomId } : {}),
        ...appt.extended,
      },
    },
  };
}

export async function listCalendars(userId: string) {
  const auth = await getOAuthClientForUser(userId);
  if (!auth) throw new Error('No Google connection for user');
  const cal = google.calendar({ version: 'v3', auth: auth.client });
  const res = await cal.calendarList.list();
  return res.data.items || [];
}

export async function listEvents(userId: string, calendarId: string, timeMin: string, timeMax: string) {
  const auth = await getOAuthClientForUser(userId, calendarId);
  if (!auth) throw new Error('No Google connection for user');
  const cal = google.calendar({ version: 'v3', auth: auth.client });
  const res = await cal.events.list({ calendarId, timeMin, timeMax, singleEvents: true, orderBy: 'startTime' });
  return res.data.items || [];
}

export async function insertEvent(userId: string, appt: NewAppointment) {
  const auth = await getOAuthClientForUser(userId, appt.calendarId);
  if (!auth) throw new Error('No Google connection for user');
  const cal = google.calendar({ version: 'v3', auth: auth.client });
  const reqBody = toGoogleEvent(appt);
  const res = await cal.events.insert({ calendarId: appt.calendarId, requestBody: reqBody, supportsAttachments: true });
  return res.data;
}

export async function updateEvent(userId: string, calendarId: string, eventId: string, appt: Partial<NewAppointment> & { timeZone: string }) {
  const auth = await getOAuthClientForUser(userId, calendarId);
  if (!auth) throw new Error('No Google connection for user');
  const cal = google.calendar({ version: 'v3', auth: auth.client });
  const patch: calendar_v3.Schema$Event = {};
  if (appt.title !== undefined) patch.summary = appt.title;
  if (appt.notes !== undefined) patch.description = appt.notes;
  if (appt.start) patch.start = { dateTime: appt.start, timeZone: appt.timeZone };
  if (appt.end) patch.end = { dateTime: appt.end, timeZone: appt.timeZone };
  if (appt.attendees) patch.attendees = appt.attendees;
  if (appt.extended || appt.patientId || appt.procedureCode || appt.providerId || appt.roomId) {
    patch.extendedProperties = {
      private: {
        ...(appt.extended || {}),
        ...(appt.patientId ? { patientId: appt.patientId } : {}),
        ...(appt.procedureCode ? { procedureCode: appt.procedureCode } : {}),
        ...(appt.providerId ? { providerId: appt.providerId } : {}),
        ...(appt.roomId ? { roomId: appt.roomId } : {}),
      },
    };
  }
  const res = await cal.events.patch({ calendarId, eventId, requestBody: patch });
  return res.data;
}

export async function deleteEvent(userId: string, calendarId: string, eventId: string) {
  const auth = await getOAuthClientForUser(userId, calendarId);
  if (!auth) throw new Error('No Google connection for user');
  const cal = google.calendar({ version: 'v3', auth: auth.client });
  await cal.events.delete({ calendarId, eventId });
}

export async function freebusy(userId: string, timeMin: string, timeMax: string, items: { id: string }[], timeZone: string) {
  const auth = await getOAuthClientForUser(userId);
  if (!auth) throw new Error('No Google connection for user');
  const cal = google.calendar({ version: 'v3', auth: auth.client });
  const res = await cal.freebusy.query({ requestBody: { timeMin, timeMax, items, timeZone } });
  return res.data;
}

export async function watchCalendar(userId: string, calendarId: string, channelId: string, webhookUrl: string) {
  const auth = await getOAuthClientForUser(userId, calendarId);
  if (!auth) throw new Error('No Google connection for user');
  const cal = google.calendar({ version: 'v3', auth: auth.client });
  const res = await cal.events.watch({
    calendarId,
    requestBody: {
      id: channelId,
      type: 'web_hook',
      address: webhookUrl,
    },
  });
  return res.data;
}

export async function stopChannel(resourceId: string, channelId: string) {
  const cal = google.calendar('v3');
  await cal.channels.stop({ requestBody: { id: channelId, resourceId } });
}
