import { google } from 'googleapis';
import { prisma } from '@/lib/db/prisma';
import { encrypt, decrypt } from '@/lib/crypto/crypto';
import { randomUUID } from 'crypto';

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
];

function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI!;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Missing Google OAuth env vars');
  }
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function createAuthUrl(state: string, readonly = false) {
  const oauth2Client = getOAuth2Client();
  const scopes = readonly ? ['https://www.googleapis.com/auth/calendar.readonly'] : GOOGLE_SCOPES;
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    state,
  });
  return url;
}

export async function exchangeCode({ code }: { code: string }) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens; // { access_token, refresh_token, expiry_date }
}

export async function upsertConnectionForUser(opts: {
  userId: string;
  calendarId: string; // default 'primary'
  tokens: { access_token?: string | null; refresh_token?: string | null; expiry_date?: number | null };
}) {
  const accessToken = encrypt(String(opts.tokens.access_token || ''));
  const refreshToken = encrypt(String(opts.tokens.refresh_token || ''));
  const tokenExpiry = new Date((opts.tokens.expiry_date || Date.now()) as number);

  // Fetch calendar timezone
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: opts.tokens.access_token || undefined,
    refresh_token: opts.tokens.refresh_token || undefined,
    expiry_date: opts.tokens.expiry_date || undefined,
  });
  const cal = google.calendar({ version: 'v3', auth: oauth2Client });
  const calMeta = await cal.calendars.get({ calendarId: opts.calendarId });
  const timeZone = calMeta.data.timeZone || 'America/Toronto';

  const rec = await prisma.googleCalendarConnection.upsert({
    where: { userId_provider_calendarId: { userId: opts.userId, provider: 'google', calendarId: opts.calendarId } },
    update: { accessToken, refreshToken, tokenExpiry, timeZone },
    create: {
      userId: opts.userId,
      calendarId: opts.calendarId,
      accessToken,
      refreshToken,
      tokenExpiry,
      timeZone,
    },
  });
  return rec;
}

export async function getOAuthClientForUser(userId: string, calendarId?: string) {
  const conn = await prisma.googleCalendarConnection.findFirst({
    where: { userId, provider: 'google', ...(calendarId ? { calendarId } : {}) },
  });
  if (!conn) return null;
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: decrypt(conn.accessToken) || undefined,
    refresh_token: decrypt(conn.refreshToken) || undefined,
    expiry_date: conn.tokenExpiry.getTime(),
  });
  // Auto refresh if needed handled by google library on request; we could force refresh here if expired.
  return { client: oauth2Client, connection: conn };
}
